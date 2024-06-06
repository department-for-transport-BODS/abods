import { AfterViewInit, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Granularity, VehicleStatsType } from 'src/generated/graphql';
import { ChartService } from 'src/app/shared/components/amcharts/chart.service';
import { BaseChart } from 'src/app/shared/components/amcharts/base-chart';

import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_frozen from '@amcharts/amcharts4/themes/frozen';
import { DateTime, Interval } from 'luxon';
import { VehicleStatsViewModel } from '../../types';

@Component({
  selector: 'app-live-vehicle-stats',
  templateUrl: './live-vehicle-stats.component.html',
  styleUrls: ['./live-vehicle-stats.component.scss'],
})
export class LiveVehicleStatsComponent extends BaseChart implements AfterViewInit, OnDestroy, OnChanges {
  private chartData: VehicleStatsViewModel[] = [];
  private dateAxis?: am4charts.DateAxis;
  private patternedColumns: am4charts.DateAxisDataItem[] = [];

  @Input() nocCode?: string | null;
  @Input() chartId?: string;
  @Input() label?: string;
  @Input() dataSource?: (VehicleStatsType | null | undefined)[];
  @Input() granularity?: Granularity;
  @Input() interval?: Interval;

  constructor(chartService: ChartService) {
    super(am4themes_frozen, chartService);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.nocCode) {
      this.showLoadingScreen();
    }

    if (changes.dataSource) {
      const data = changes.dataSource.currentValue as VehicleStatsType[];
      this.chartData = data.map((stat) => {
        const dateTime = DateTime.fromISO(stat.timestamp, { zone: 'utc' });
        return {
          ...stat,
          dateTime,
          timestamp: dateTime.toJSDate(),
        };
      });

      if (this.chart) {
        this.chart.data = this.chartData;
        this.clearPatternedColumns();
        this.createPatternedColumns();
        this.hideSpinner();
      }
    }

    this.applyInterval();
  }

  ngAfterViewInit() {
    this.chartService.browserOnly(() => this.renderChart());
  }

  clearPatternedColumns() {
    this.patternedColumns.forEach((column) => {
      column.axisFill.fillOpacity = 0;
    });
    this.patternedColumns = [];
  }

  createPatternedColumns() {
    this.patternedColumns = this.chartData
      .filter(({ actual }) => actual === 0)
      .map(({ dateTime }) => this.createPatternedColumn(dateTime));
  }

  createPatternedColumn(dateTime: DateTime) {
    if (!this.dateAxis) {
      throw new Error('Chart not initialized'); // This should never happen
    }
    const unit = this.granularity === Granularity.Minute ? 'minutes' : 'hours';

    const column = this.dateAxis.axisRanges.create();
    column.date = dateTime.plus({ [unit]: 0.1 }).toJSDate();
    column.endDate = dateTime.plus({ [unit]: 0.9 }).toJSDate();
    column.grid.disabled = true;
    column.axisFill.fillOpacity = 0.5;

    // The two lines here don't seem to work, so dates have been adjusted
    // above instead.
    column.locations.date = 0.1;
    column.locations.endDate = 0.9;

    column.axisFill.fill = this.createPattern();

    return column;
  }

  createDateAxis() {
    if (!this.chart) {
      return;
    }
    const dateAxis = (this.dateAxis = this.chart.xAxes.push(new am4charts.DateAxis()));
    dateAxis.renderer.labels.template.fontSize = 13;
    dateAxis.renderer.labels.template.fill = this.chartService.colorMap.legendaryGrey;
    dateAxis.baseInterval = {
      timeUnit: this.granularity as am4core.TimeUnit,
      count: 1,
    };
    dateAxis.gridIntervals.setAll([
      { timeUnit: this.granularity as am4core.TimeUnit, count: 2 },
      { timeUnit: this.granularity as am4core.TimeUnit, count: 3 },
      { timeUnit: this.granularity as am4core.TimeUnit, count: 5 },
    ]);
    dateAxis.renderer.grid.template.disabled = true;
    if (dateAxis.tooltip) {
      dateAxis.tooltip.disabled = true;
    }
    this.applyInterval();
  }

  applyInterval() {
    // Interval ought to be set by the time the chart is initialized, but we can't guarantee that.
    if (this.interval?.isValid && this.dateAxis) {
      this.dateAxis.min = this.interval.start.toMillis();
      this.dateAxis.max = this.interval.end.toMillis();
    }
  }

  createValueAxis() {
    if (!this.chart) {
      return;
    }
    const valueAxis = this.chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.renderer.labels.template.fontSize = 13;
    valueAxis.min = 0;
    valueAxis.renderer.labels.template.fill = this.chart.colors.getIndex(6);
    if (valueAxis.tooltip) {
      valueAxis.tooltip.disabled = true;
    }
  }

  getTooltipText(type: string) {
    return type + ': [bold]{valueY}';
  }

  createActualSeries() {
    if (!this.chart) {
      return;
    }
    const series = this.chart.series.push(new am4charts.ColumnSeries());
    series.name = 'Vehicle journeys';
    series.dataFields.dateX = 'timestamp';
    series.dataFields.valueY = 'actual';
    series.clustered = false;
    series.fill = this.chart.colors.getIndex(0);
    series.strokeWidth = 0;
    series.defaultState.transitionDuration = 100;
    series.tooltipHTML = `
      <div style="margin-bottom: 5px;"><b>{timestamp.formatDate('HH:mm')}</b></div>
      <div style="margin-bottom: 5px; display:flex">
        <span style="flex-grow:1">Vehicle journeys</span><span style="margin-left:5px;"><b>{actual}</b></span>
      </div>
      <div style="margin-bottom: 5px; display: flex;">
        <span style="flex-grow:1">Expected vehicle journeys</span>
        <span style="float:right; margin-left:5px;"><b>{expected}</b></span>
      </div>`;
    if (series.tooltip) {
      series.tooltip.pointerOrientation = 'vertical';
      series.tooltip.getFillFromObject = false;
      series.tooltip.stroke = this.chart.colors.getIndex(5);
      series.tooltip.label.fill = this.chart.colors.getIndex(5);
      series.tooltip.label.padding(10, 10, 5, 10);
      series.tooltip.background.cornerRadius = 0;
      series.tooltip.background.fillOpacity = 1;
      series.tooltip.background.filters.clear();
      series.tooltip.background.fill = am4core.color('#fff');
      series.tooltip.background.stroke = this.chart.colors.getIndex(5);
    }

    return series;
  }

  createExpectedSeries() {
    if (!this.chart) {
      return;
    }
    const series = this.chart.series.push(new am4charts.StepLineSeries());
    series.name = 'Expected vehicles';
    if (series.dataFields) {
      series.dataFields.dateX = 'timestamp';
      series.dataFields.valueY = 'expected';
    }
    series.defaultState.transitionDuration = 100;
    series.strokeLinecap = 'round';
    series.noRisers = true;
    series.strokeWidth = 2;
    series.stroke = this.chart.colors.getIndex(2);
    series.startLocation = 0.1;
    series.endLocation = 0.9;
  }

  createChart() {
    this.chart = am4core.create(this.chartId, am4charts.XYChart);

    this.chart.colors.list = this.chartService.chartColorList;
    this.chart.fontFamily = this.chartService.getFontFamily();
    this.chart.paddingRight = 20;
    this.chart.paddingLeft = 0;
    this.chart.defaultState.transitionDuration = 0;

    this.createDateAxis();
    this.createValueAxis();

    this.createExpectedSeries();
    this.createActualSeries();

    this.chart.data = this.chartData;
    this.createPatternedColumns();

    this.chart.cursor = new am4charts.XYCursor();
    this.chart.cursor.behavior = 'none';
    this.chart.cursor.lineY.disabled = true;
    this.chart.cursor.lineX.stroke = this.chart.colors.getIndex(5);
    this.chart.cursor.lineX.strokeWidth = 2;
    this.chart.cursor.lineX.strokeOpacity = 1;
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

  hideSpinner() {
    if (this.screens.loadingScreen) {
      this.screens.loadingScreen.hide(0);
    }
  }
}
