import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Granularity, VehicleStatsType } from 'src/generated/graphql';
import { ChartService } from 'src/app/shared/components/amcharts/chart.service';

import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_frozen from '@amcharts/amcharts4/themes/frozen';
import { DateTime, Interval } from 'luxon';
import { VehicleStatsViewModel } from '../../types';
import { AlertType } from '../../alert-list/alert-list-view-model';
import { BaseChart } from 'src/app/shared/components/amcharts/base-chart';

@Component({
  selector: 'app-historic-vehicle-stats',
  templateUrl: './historic-vehicle-stats.component.html',
  styleUrls: ['./historic-vehicle-stats.component.scss'],
})
export class HistoricVehicleStatsComponent extends BaseChart implements OnChanges, AfterViewInit, OnDestroy {
  @Input() chartId?: string;
  @Input() dataSource?: VehicleStatsType[];
  @Input() date?: DateTime;

  @Input() alertsDataSource?: { timestamp: DateTime; type: AlertType; id: string }[];

  @Output() alertSelected = new EventEmitter<string>();

  timelineSeries?: am4charts.XYSeries;

  chartInterval?: Interval;

  constructor(protected chartService: ChartService) {
    super(am4themes_frozen, chartService);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.dataSource && changes.dataSource.currentValue?.length) {
      this.setData(changes.dataSource.currentValue);
      if (this.alertsDataSource) {
        this.setTimelineData(this.alertsDataSource);
      }
    }
    if (changes.alertsDataSource && changes.alertsDataSource.currentValue && this.timelineSeries) {
      this.setTimelineData(changes.alertsDataSource.currentValue);
    }
  }

  private setData(withData: VehicleStatsType[]) {
    if (!this.chart) {
      return;
    }

    const protoViewData = withData.map((stat) => {
      const dateTime = DateTime.fromISO(stat.timestamp, { zone: 'utc' });
      return {
        dateTime,
        timestamp: dateTime.toJSDate(),
        actual: stat.actual ?? 0,
        expected: stat.expected ?? 0,
      };
    });

    const minDateTime = this.date?.startOf('day').toUTC() ?? protoViewData[0].dateTime;
    const maxDateTime = this.date?.endOf('day').toUTC() ?? protoViewData[protoViewData.length - 1].dateTime;

    this.chartInterval = Interval.fromDateTimes(minDateTime, maxDateTime);

    const viewData: VehicleStatsViewModel[] = [];

    let i = 0;

    const outagePattern = this.createPattern();
    const expectedFill = this.chart.colors.getIndex(2);

    for (let ts = minDateTime; this.chartInterval.contains(ts); ts = ts.plus({ minute: 1 })) {
      const candidateStat = protoViewData[i];
      if (!candidateStat || !candidateStat.dateTime.equals(ts)) {
        viewData.push({
          dateTime: ts,
          timestamp: ts.toJSDate(),
          actual: 0,
          expected: 0,
        });
      } else {
        viewData.push({ ...candidateStat, expectedFill: candidateStat.actual === 0 ? outagePattern : expectedFill });
        i += 1;
      }
    }

    this.chart.data = viewData;
    this.screens.loadingScreen?.hide();
  }

  get bulletFills(): { [k in AlertType]: am4core.Color } {
    return {
      [AlertType.FeedAvailableEvent]: this.chartService.colorMap.green,
      [AlertType.FeedUnavailableEvent]: this.chartService.colorMap.red,
      [AlertType.VehicleCountDisparityEvent]: this.chartService.colorMap.orange,
    };
  }

  setTimelineData(data: { timestamp: DateTime; type: AlertType; id: string }[]) {
    if (!this.timelineSeries) {
      return;
    }

    this.timelineSeries.data = data
      // only plot events that are in the same time period as the main graph
      .filter(({ timestamp }) => this.chartInterval?.contains(timestamp) ?? true)
      .map(({ timestamp, type, id }) => ({
        timestamp: timestamp.toJSDate(),
        value: 0,
        fill: this.bulletFills[type],
        id,
      }));
  }

  ngAfterViewInit() {
    this.chartService.browserOnly(() => this.renderChart());
  }

  createDateAxis() {
    if (!this.chart) {
      return;
    }

    const dateAxis = this.chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.renderer.labels.template.fontSize = 13;
    dateAxis.renderer.labels.template.fill = this.chartService.colorMap.legendaryGrey;
    dateAxis.baseInterval = {
      timeUnit: Granularity.Minute,
      count: 1,
    };

    dateAxis.renderer.grid.template.disabled = true;
    dateAxis.renderer.cellStartLocation = 0;
    dateAxis.renderer.cellEndLocation = 1;

    dateAxis.groupData = true;
    dateAxis.groupCount = 100;
    dateAxis.groupIntervals.setAll([
      { timeUnit: 'minute', count: 1 },
      { timeUnit: 'minute', count: 10 },
    ]);

    if (dateAxis.tooltip) {
      dateAxis.tooltip.disabled = true;
    }
  }

  createValueAxis() {
    const valueAxis = new am4charts.ValueAxis();

    if (this.chart) {
      this.chart.yAxes.push(valueAxis);
      valueAxis.renderer.labels.template.fontSize = 13;
      valueAxis.renderer.labels.template.fill = this.chart.colors.getIndex(6);

      valueAxis.min = 0;

      if (valueAxis.tooltip) {
        valueAxis.tooltip.disabled = true;
      }
    }

    return valueAxis;
  }

  createTimelineAxis() {
    const timelineAxis = new am4charts.ValueAxis();

    if (this.chart) {
      this.chart.yAxes.push(timelineAxis);
    }

    timelineAxis.min = -0.1;
    timelineAxis.max = 0.1;

    timelineAxis.height = 30;
    timelineAxis.renderer.grid.template.strokeWidth = 3;
    timelineAxis.renderer.grid.template.strokeLinecap = 'round';

    if (timelineAxis.tooltip) {
      timelineAxis.tooltip.disabled = true;
    }

    timelineAxis.renderer.labels.template.disabled = true;

    timelineAxis.renderer.baseGrid.disabled = true;

    timelineAxis.marginTop = 12;

    return timelineAxis;
  }

  createActualSeries(axis: am4charts.Axis) {
    if (!this.chart) {
      return;
    }
    const series = this.chart.series.push(new am4charts.LineSeries());
    series.name = 'Vehicle journeys';
    series.dataFields.dateX = 'timestamp';
    series.dataFields.valueY = 'actual';
    series.rangeChangeEasing = am4core.ease.linear;
    series.groupFields.valueY = 'low';

    series.yAxis = axis;

    series.tooltipHTML = `
      <div style="margin-bottom: 5px;"><b>{dateX.formatDate('HH:mm')}</b></div>
      <div style="margin-bottom: 5px; display:flex">
        <span style="flex-grow:1">Vehicle journeys</span><span style="margin-left:5px;"><b>{valueY}</b></span>
      </div>
      <div style="margin-bottom: 5px; display: flex;">
        <span style="flex-grow:1">Expected vehicle journeys</span>
        <span style="float:right; margin-left:5px;"><b>{expected}</b></span>
      </div>`;
    if (series.tooltip) {
      series.tooltip.pointerOrientation = 'vertical';
      series.tooltip.getFillFromObject = false;
      series.tooltip.label.fill = this.chart.colors.getIndex(5);
      series.tooltip.label.padding(10, 10, 5, 10);
      series.tooltip.background.cornerRadius = 0;
      series.tooltip.background.filters.clear();
      series.tooltip.background.fillOpacity = 1;
      series.tooltip.background.fill = am4core.color('#fff');
      series.tooltip.background.stroke = this.chart.colors.getIndex(5);
    }
    series.stroke = this.chart.colors.getIndex(0);
    series.fill = this.chart.colors.getIndex(0);

    series.fillOpacity = 0.8;

    series.tensionX = 0.8;

    return series;
  }

  createExpectedSeries(axis: am4charts.Axis) {
    if (!this.chart) {
      return;
    }
    const series = this.chart.series.push(new am4charts.LineSeries());
    series.name = 'Expected vehicles';
    series.dataFields.dateX = 'timestamp';
    series.dataFields.valueY = 'expected';
    series.rangeChangeEasing = am4core.ease.linear;
    series.groupFields.valueY = 'low';

    series.yAxis = axis;

    series.stroke = this.chart.colors.getIndex(2);
    series.fill = this.chart.colors.getIndex(2);

    series.propertyFields.fill = 'expectedFill';

    series.fillOpacity = 1;

    series.tensionX = 0.8;

    return series;
  }

  createTimeLineSeries(axis: am4charts.Axis) {
    if (!this.chart) {
      return;
    }
    const series = this.chart.series.push(new am4charts.XYSeries());

    series.dataFields.dateX = 'timestamp';
    series.dataFields.valueY = 'value';

    series.yAxis = axis;

    const bullet = series.bullets.push(new am4charts.Bullet());

    bullet.clickable = true;
    bullet.propertyFields.id = 'id';
    bullet.events.on('hit', (ev) => this.alertSelected.emit(ev.target.id));
    bullet.cursorOverStyle = am4core.MouseCursorStyle.pointer;
    bullet.setStateOnChildren = true;

    bullet.zIndex = 10;

    const circle = bullet.createChild(am4core.Circle);
    circle.width = 12;
    circle.height = 12;

    const hover = circle.states.create('hover');
    hover.properties.width = 16;
    hover.properties.height = 16;

    circle.stroke = this.chartService.colorMap.lightGrey;
    circle.strokeWidth = 2;
    circle.propertyFields.fill = 'fill';

    return series;
  }

  createChart() {
    this.chart = am4core.create(this.chartId, am4charts.XYChart);
    this.chart.colors.list = this.chartService.chartColorList;
    this.chart.fontFamily = this.chartService.getFontFamily();
    this.chart.paddingRight = 20;
    this.chart.paddingLeft = 0;

    this.chart.leftAxesContainer.layout = 'vertical';

    this.createDateAxis();
    const valueAxis = this.createValueAxis();
    const timeLineAxis = this.createTimelineAxis();
    this.createExpectedSeries(valueAxis);
    this.createActualSeries(valueAxis);

    this.timelineSeries = this.createTimeLineSeries(timeLineAxis);

    if (this.dataSource?.length) {
      this.setData(this.dataSource);
    }

    if (this.alertsDataSource) {
      this.setTimelineData(this.alertsDataSource);
    }

    this.chart.cursor = new am4charts.XYCursor();
    this.chart.cursor.behavior = 'zoomX';
    this.chart.cursor.lineY.disabled = true;
    this.chart.cursor.lineX.stroke = this.chartService.colorMap.black;
    this.chart.cursor.lineX.strokeWidth = 2;
    this.chart.cursor.lineX.strokeOpacity = 1;

    this.chart.cursor.zIndex = 3;

    this.chart.maskBullets = false;
  }

  createPattern() {
    if (!this.chart) {
      return;
    }

    const pattern = new am4core.LinePattern();
    pattern.strokeWidth = 1;
    pattern.rotation = 135;
    pattern.stroke = this.chart.colors.getIndex(1);
    pattern.fill = this.chart.colors.getIndex(1);
    return pattern;
  }

  ngOnDestroy() {
    this.chartService.browserOnly(() => {
      if (this.chart) {
        this.chart.dispose();
      }
    });
  }
}
