import { AfterViewInit, Component, ElementRef, Input, OnDestroy } from '@angular/core';
import { combineLatest, ReplaySubject, Subject, of } from 'rxjs';
import { BaseChart } from 'src/app/shared/components/amcharts/base-chart';
import { OnTimeService, PerformanceParams, TimeSeriesData } from '../on-time.service';

import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import { ChartService } from 'src/app/shared/components/amcharts/chart.service';
import { map, switchMap, take } from 'rxjs/operators';
import { PerformanceCategories } from '../../dashboard/dashboard.types';
import { Granularity } from 'src/generated/graphql';
import { AsyncStatus, withStatus } from '../pending.model';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-on-time-time-series-chart',
  template: ``,
})
export class TimeSeriesChartComponent extends BaseChart implements AfterViewInit, OnDestroy {
  @Input()
  set params(value: PerformanceParams | null) {
    if (value) {
      this.params$.next(value);
    }
  }
  private params$ = new ReplaySubject<PerformanceParams>();
  status$ = new Subject<AsyncStatus>();

  dateAxis?: am4charts.DateAxis;
  onTimeSeries?: am4charts.LineSeries;

  legend = {
    [PerformanceCategories.OnTime]: {
      name: 'On-Time',
      hint: '',
      fill: this.chartService.colorMap.purple,
    },
    [PerformanceCategories.Late]: {
      name: 'Late',
      hint: '(> 5:59 minutes)',
      fill: this.chartService.colorMap.ochre,
    },
    [PerformanceCategories.Early]: {
      name: 'Early',
      hint: '(> 1 minute)',
      fill: this.chartService.colorMap.pink,
    },
  };

  constructor(private service: OnTimeService, private elementRef: ElementRef, chartService: ChartService) {
    super(am4themes_animated, chartService);
  }

  ngAfterViewInit(): void {
    this.chartService.browserOnly(() => this.renderChart());
    this.params$
      .pipe(
        map(({ filters, ...params }) => {
          const to = DateTime.fromISO(params.toTimestamp);
          const from = DateTime.fromISO(params.fromTimestamp);

          let granularity = Granularity.Day;
          if (Math.abs(to.diff(from, 'days').days) <= 5) {
            granularity = Granularity.Hour;
          }
          return {
            ...params,
            filters: { ...filters, granularity },
          };
        }),
        switchMap((params) => {
          const data$ = this.service.fetchOnTimeTimeSeriesData(params).pipe(take(1));
          return combineLatest([withStatus(() => data$, this.status$), of(params)]);
        })
      )
      .subscribe(
        ([
          data,
          {
            toTimestamp,
            fromTimestamp,
            filters: { granularity },
          },
        ]) => {
          if (this.dateAxis) {
            // Ensure that the axis covers the entire selected period
            this.dateAxis.min = DateTime.fromISO(fromTimestamp).toMillis();
            this.dateAxis.max = DateTime.fromISO(toTimestamp)
              .minus({ [granularity]: 1 })
              .toMillis();
          }

          if (this.onTimeSeries) {
            // Make sure the tooltip shows the time iff Hour granularity
            this.onTimeSeries.tooltipHTML = this.tooltipHtml(granularity);
          }

          if (data?.length === 1) {
            // If we only have one data point we need to push another hour to fix x-axis bug (ABOD-865)
            data.push(<TimeSeriesData>{
              ts: DateTime.fromISO(data[0].ts).plus({ hour: 1 }).toISO({ suppressMilliseconds: true }),
            });
          }

          this.chart.data = data ?? [];
        }
      );
    this.status$.subscribe((status) => (this.asyncStatus = status));
  }

  createChart(): void {
    this.chart = am4core.create(this.elementRef.nativeElement, am4charts.XYChart);

    this.chart.padding(10, 20, 0, 0);
    this.chart.margin(0, 0, 0, 0);
    this.chart.maskBullets = false;

    this.chart.dateFormatter.inputDateFormat = 'yyyy-MM-ddTHH:mm:ss';

    this.dateAxis = this.createDateAxis();
    this.createValueAxis();

    this.onTimeSeries = this.createSeries('onTimeRatio', this.chartService.colorMap.purple);
    this.createSeries('lateRatio', this.chartService.colorMap.ochre);
    this.createSeries('earlyRatio', this.chartService.colorMap.pink);

    this.createTooltip(this.onTimeSeries);
    this.createCursor(this.onTimeSeries);

    this.createLegend();
  }

  private createLegend() {
    const legend = (this.chart.legend = new am4charts.Legend());
    legend.position = 'bottom';
    legend.contentAlign = 'left';
    legend.itemContainers.template.togglable = false;
    legend.labels.template.text = `[bold]{name}[/] [${this.chartService.colorMap.legendaryGrey}]{hint}[/]`;
    legend.marginTop = 30;
    legend.marginBottom = 30;
    legend.itemContainers.template.paddingTop = 0;
    legend.itemContainers.template.paddingBottom = 0;
    legend.useDefaultMarker = false;
    legend.clickable = false;
    legend.itemContainers.template.cursorOverStyle = am4core.MouseCursorStyle.default;

    const marker = legend.markers.template.children.getIndex(0) as am4core.RoundedRectangle;

    // reduce the legend marker size
    if (marker) {
      marker.cornerRadius(0, 0, 0, 0);
      marker.height = 15;
      marker.width = 15;
      marker.marginTop = 3;
      marker.valign = 'top';
    }

    legend.data = Object.values(this.legend);
  }

  private createValueAxis() {
    const valueAxis = this.chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.renderer.grid.template.disabled = true;
    valueAxis.title.disabled = true;
    valueAxis.renderer.minGridDistance = 40;
    valueAxis.renderer.labels.template.fontSize = 13;
    valueAxis.renderer.labels.template.fill = this.chartService.colorMap.legendaryGrey;
    valueAxis.numberFormatter = new am4core.NumberFormatter();
    valueAxis.numberFormatter.numberFormat = '#%';
    valueAxis.min = 0;
    valueAxis.max = 1;
    if (valueAxis.tooltip) {
      valueAxis.tooltip.disabled = true;
    }
  }

  private createDateAxis() {
    const dateAxis = this.chart.xAxes.push(new am4charts.DateAxis());

    dateAxis.renderer.minGridDistance = 40;
    dateAxis.renderer.grid.template.location = 0.5;
    dateAxis.startLocation = 0.5;
    dateAxis.endLocation = 0.5;

    const label = dateAxis.renderer.labels.template;

    label.fontSize = 13;
    label.wrap = true;
    label.maxWidth = 43;
    label.padding(10, 0, 0, 0);
    label.textAlign = 'middle';
    // So they don't get moved when we go to hour granularity
    label.location = 0.5;
    label.fill = this.chartService.colorMap.legendaryGrey;
    dateAxis.gridIntervals.setAll([
      {
        timeUnit: 'hour',
        count: 1,
      },
      {
        timeUnit: 'hour',
        count: 3,
      },
      {
        timeUnit: 'hour',
        count: 12,
      },
      {
        timeUnit: 'day',
        count: 1,
      },
      {
        timeUnit: 'day',
        count: 2,
      },
      {
        timeUnit: 'day',
        count: 7,
      },
      {
        timeUnit: 'month',
        count: 1,
      },
    ]);

    if (dateAxis.tooltip) {
      dateAxis.tooltip.disabled = true;
    }
    return dateAxis;
  }

  private createCursor(onTimeSeries: am4charts.LineSeries) {
    this.chart.cursor = new am4charts.XYCursor();
    this.chart.cursor.behavior = 'none';
    this.chart.cursor.lineY.disabled = true;
    this.chart.cursor.lineX.stroke = this.chartService.colorMap.black;
    this.chart.cursor.lineX.strokeWidth = 2;
    this.chart.cursor.lineX.strokeOpacity = 1;
    this.chart.cursor.snapToSeries = [onTimeSeries];
  }

  private tooltipHtml(granularity: Granularity = Granularity.Day) {
    let dateFormat = 'EEE, MMM dd';
    if (granularity === Granularity.Hour) {
      dateFormat = 'HH:mm ' + dateFormat;
    }
    return `
    <header class="amcharts__tooltip-heading">{ts.formatDate('${dateFormat}')}</header>
    <div class="amcharts__tooltip-table">
      <span class="amcharts__tooltip-legend-prefix amcharts__tooltip-legend-prefix--on-time">On-time</span>
      <span class="amcharts__tooltip-value">{onTimeRatio.formatNumber('#.00%')}</span>
      <span class="amcharts__tooltip-legend-prefix amcharts__tooltip-legend-prefix--late">Late</span>
      <span class="amcharts__tooltip-value">{lateRatio.formatNumber('#.00%')}</span>
      <span class="amcharts__tooltip-legend-prefix amcharts__tooltip-legend-prefix--early">Early</span>
      <span class="amcharts__tooltip-value">{earlyRatio.formatNumber('#.00%')}</span>
    </div>`;
  }

  private createTooltip(onTimeSeries: am4charts.LineSeries) {
    onTimeSeries.tooltipHTML = this.tooltipHtml();
    if (onTimeSeries.tooltip) {
      onTimeSeries.tooltip.pointerOrientation = 'vertical';
      onTimeSeries.tooltip.animationDuration = 150;
      onTimeSeries.tooltip.getFillFromObject = false;
      onTimeSeries.tooltip.stroke = this.chartService.colorMap.black;
      onTimeSeries.tooltip.label.fill = this.chartService.colorMap.black;
      onTimeSeries.tooltip.label.padding(10, 10, 5, 10);
      onTimeSeries.tooltip.background.cornerRadius = 0;
      onTimeSeries.tooltip.background.fillOpacity = 1;
      onTimeSeries.tooltip.background.filters.clear();
      onTimeSeries.tooltip.background.fill = am4core.color('#fff');
      onTimeSeries.tooltip.background.stroke = this.chartService.colorMap.black;
    }
  }

  private createSeries(dataField: string, color: am4core.Color) {
    const series = this.chart.series.push(new am4charts.LineSeries());
    series.dataFields.valueY = dataField;
    series.dataFields.dateX = 'ts';
    series.stroke = color;
    series.strokeWidth = 2;
    // DRA-922 prevent line from being clipped. see https://github.com/amcharts/amcharts4/issues/2893
    series.mainContainer.mask = undefined;
    const bullet = series.bullets.push(new am4charts.Bullet());
    const circle = bullet.createChild(am4core.Circle);
    circle.fill = this.chartService.colorMap.white;
    circle.stroke = color;
    circle.strokeWidth = 1;
    circle.width = 5;
    circle.height = 5;

    series.connect = false;

    return series;
  }

  ngOnDestroy(): void {
    this.params$.complete();
    this.status$.complete();
    this.chartService.browserOnly(() => {
      this.chart?.dispose();
    });
  }
}
