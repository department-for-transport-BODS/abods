import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import { XYChart } from '@amcharts/amcharts4/charts';
import * as am4core from '@amcharts/amcharts4/core';
import { chartColors, loadingSpinner, messageScreen } from '../../shared/components/amcharts/chart.service';
import { PerformanceParams } from '../on-time.service';
import { ReplaySubject } from 'rxjs';
import { finalize, map, switchMap, tap } from 'rxjs/operators';
import { HeadwayParams, HeadwayService, HeadwayTimeSeries } from '../headway.service';
import { DateTime, Interval } from 'luxon';
import { Granularity } from '../../../generated/graphql';

const tooltipHtml = (
  dateFormat = 'd MMMM yyyy'
) => `<header class="amcharts__tooltip-heading">{dateX.formatDate('${dateFormat}')}</header>
    <div class="amcharts__tooltip-table">
      <span style='grid-column: span 2;'>Average waiting time</span>
      <span>Expected</span>
      <span class="amcharts__tooltip-value">{scheduled.formatDuration('m:ss')}</span>
      <span>Actual</span>
      <span class="amcharts__tooltip-value">{actual.formatDuration('m:ss')}</span>
      <span>Excess</span>
      <span class="amcharts__tooltip-value">{excessSign}{excess.formatDuration('m:ssa')}</span>
    </div>`;

@Component({
  selector: 'app-excess-wait-time-chart',
  template: `<am4-xy-chart class="chart" [data]="data"></am4-xy-chart>`,
  styles: [':host { flex-direction: column; justify-content: space-evenly; } .chart { width: 100%; flex-grow: 1; }'],
})
export class ExcessWaitTimeChartComponent implements OnInit, AfterViewInit {
  @ViewChild(XYChart) chart!: XYChart;

  data?: HeadwayTimeSeries[];
  private xAxis?: am4charts.DateAxis;
  private dateRange?: Interval;
  private loadingScreen?: am4core.Container;
  private noDataScreen?: am4core.Container;
  private actualSeries?: am4charts.LineSeries;

  @Input()
  set params(value: PerformanceParams | null) {
    if (value) {
      this.params$.next(value);
    }
  }
  private params$ = new ReplaySubject<PerformanceParams>();

  constructor(private headwayService: HeadwayService) {}

  ngOnInit() {
    this.params$
      .pipe(
        tap(() => this.loadingScreen?.show()),
        map((params) => this.granularParams(params)),
        switchMap((params) =>
          this.headwayService.fetchTimeSeries(params).pipe(
            map((data) => ({ data, params })),
            finalize(() => this.loadingScreen?.hide())
          )
        )
      )
      .subscribe(({ data, params }) => {
        this.data = data.map((headway) => ({ ...headway, excessSign: headway.excess >= 0 ? '+' : '-' }));
        if (this.xAxis) {
          const granularity: Granularity = params.filters?.granularity ?? Granularity.Day;
          this.dateRange = Interval.fromDateTimes(
            DateTime.fromISO(params.fromTimestamp),
            DateTime.fromISO(params.toTimestamp).minus({ [granularity]: 1 })
          );
          this.xAxis.min = this.dateRange.start.toMillis();
          this.xAxis.max = this.dateRange.end.toMillis();
          if (this.actualSeries) {
            this.actualSeries.tooltipHTML = tooltipHtml(
              granularity === Granularity.Hour ? 'HH:mm d MMM yyyy' : 'd MMMM yyyy'
            );
          }
        }
        if (this.data?.length === 1) {
          // If we only have one data point we need to push another hour to fix x-axis bug (ABOD-865)
          this.data.push(<HeadwayTimeSeries>{
            ts: DateTime.fromISO(data[0].ts).plus({ hour: 1 }).toISO({ suppressMilliseconds: true }),
          });
        }
      });
  }

  ngAfterViewInit() {
    this.chart.padding(10, 20, 0, 0);
    this.chart.margin(0, 0, 0, 0);
    this.chart.maskBullets = false;

    this.chart.dateFormatter.inputDateFormat = 'yyyy-MM-ddTHH:mm:ss';

    const xAxis = (this.xAxis = this.chart.xAxes.push(new am4charts.DateAxis()));
    xAxis.renderer.minGridDistance = 50;
    xAxis.renderer.grid.template.disabled = true;
    xAxis.renderer.grid.template.location = 0.5;
    xAxis.startLocation = 0.5;
    xAxis.endLocation = 0.5;

    const label = xAxis.renderer.labels.template;
    label.fontSize = 13;
    label.wrap = true;
    label.maxWidth = 43;
    label.padding(10, 0, 0, 0);
    label.textAlign = 'middle';
    // So they don't get moved when we go to hour granularity
    label.location = 0.5;
    label.fill = chartColors.legendaryGrey;
    xAxis.gridIntervals.setAll([
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
    ]);

    if (xAxis.tooltip) {
      xAxis.tooltip.disabled = true;
    }

    if (this.dateRange) {
      this.xAxis.min = this.dateRange.start.toMillis();
      this.xAxis.max = this.dateRange.end.toMillis();
    }

    const yAxis = this.chart.yAxes.push(new am4charts.DurationAxis());

    yAxis.maxZoomFactor = 1;
    yAxis.zoomable = false;

    yAxis.baseUnit = 'minute';
    yAxis.title.text = 'Waiting time';
    yAxis.renderer.minGridDistance = 40;
    yAxis.renderer.labels.template.fontSize = 13;
    yAxis.renderer.labels.template.fill = chartColors.legendaryGrey;
    xAxis.renderer.baseGrid.disabled = false;
    if (yAxis.tooltip) {
      yAxis.tooltip.disabled = true;
    }

    const actualSeries = (this.actualSeries = this.createSeries('actual', chartColors.turquoise));
    const expectedSeries = this.createSeries('scheduled', chartColors.darkBlue);
    expectedSeries.dataFields.openValueY = 'actual';
    expectedSeries.fill = chartColors.turquoise;
    expectedSeries.fillOpacity = 0.4;

    actualSeries.tooltipHTML = tooltipHtml();
    const tooltip = actualSeries.tooltip;
    if (tooltip) {
      tooltip.pointerOrientation = 'vertical';
      tooltip.animationDuration = 150;
      tooltip.getFillFromObject = false;
      tooltip.stroke = chartColors.black;
      tooltip.label.fill = chartColors.black;
      tooltip.label.padding(10, 10, 5, 10);
      tooltip.background.cornerRadius = 0;
      tooltip.background.fillOpacity = 1;
      tooltip.background.filters.clear();
      tooltip.background.fill = chartColors.white;
      tooltip.background.stroke = chartColors.black;
    }

    const cursor = (this.chart.cursor = new am4charts.XYCursor());
    cursor.behavior = 'none';
    cursor.lineY.disabled = true;
    cursor.lineX.stroke = chartColors.black;
    cursor.lineX.strokeWidth = 2;
    cursor.lineX.strokeOpacity = 1;
    cursor.snapToSeries = [actualSeries];

    this.loadingScreen = this.chart?.tooltipContainer?.createChild(am4core.Container);
    if (this.loadingScreen) {
      loadingSpinner(this.loadingScreen);
      this.loadingScreen?.hide(0);
    }

    this.noDataScreen = this.chart?.tooltipContainer?.createChild(am4core.Container);
    if (this.noDataScreen) {
      messageScreen(this.noDataScreen, 'warn', 'No data');
      this.noDataScreen?.hide(0);
    }
  }

  createSeries(dataField: string, color: am4core.Color) {
    const series = this.chart.series.push(new am4charts.LineSeries());
    series.dataFields.valueY = dataField;
    series.dataFields.dateX = 'ts';
    series.stroke = color;
    series.strokeWidth = 2;
    series.mainContainer.mask = undefined;
    series.connect = false;

    const bullet = series.bullets.push(new am4charts.Bullet());
    const circle = bullet.createChild(am4core.Circle);
    circle.fill = chartColors.white;
    circle.stroke = color;
    circle.strokeWidth = 1;
    circle.width = 5;
    circle.height = 5;

    return series;
  }

  // TODO factor something out here, as its used in various forms in many places
  granularParams(params: HeadwayParams): HeadwayParams {
    const fromDate = DateTime.fromISO(params.fromTimestamp);
    const toDate = DateTime.fromISO(params.toTimestamp);

    const granularity = Math.abs(toDate.diff(fromDate, 'days').days) <= 5 ? Granularity.Hour : Granularity.Day;

    return {
      ...params,
      filters: { ...params.filters, granularity },
    };
  }
}
