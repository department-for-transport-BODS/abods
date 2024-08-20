import { AfterViewInit, Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import {
  AxisRenderer,
  Bullet,
  CategoryAxis,
  ColumnSeries,
  DateAxis,
  DurationAxis,
  ValueAxis,
  XYChart,
  XYCursor,
} from '@amcharts/amcharts4/charts';
import { CorridorChart, XAxisLabelPosition } from '../corridor-chart/CorridorChart';
import { CorridorStatsViewParams } from '../../corridors.service';
import { chartColors } from '../../../shared/components/amcharts/chart.service';
import { ICorridorJourneyTimeStats, Maybe } from '../../../../generated/graphql';
import { Color, ITimeInterval, percent, Rectangle, TimeUnit } from '@amcharts/amcharts4/core';
import { BaseChartOptions } from '../corridor-chart/BaseChartOption';

export type YAxisMinValueType = 'yAxisMinValue';
export type YAxisMaxValueType = 'yAxisMaxValue';
export type YAxisMeanValueType = 'yAxisMeanValue';
export type YAxisPercentile25Type = 'percentile25';
export type YAxisPercentile75Type = 'percentile75';
export type XAxisType = 'category' | 'date';
export type YAxisType = 'value' | 'time';
export type BoxPlotChartDataItem = {
  yAxisMinValue?: number;
  yAxisMaxValue?: number;
  yAxisMeanValue?: Maybe<number>;
  category?: any;
  binLabel?: any;
  isoDayOfWeek?: any;
};

@Component({
  selector: 'app-box-plot-chart',
  template: `<am4-xy-chart class="chart" [data]="data" theme="frozen"></am4-xy-chart>`,
  styles: [
    `
      .chart {
        height: 440px;
      }
    `,
  ],
})
export class BoxPlotChartComponent
  implements CorridorChart<(ICorridorJourneyTimeStats & BoxPlotChartDataItem)[]>, OnChanges, AfterViewInit {
  @Input() data?: (ICorridorJourneyTimeStats & BoxPlotChartDataItem)[];
  @Input() loading?: boolean;
  @Input() noData = false;
  @Input() xAxisTitle?: string;
  @Input() yAxisTitle?: string;
  @Input() xAxisLabelPosition?: XAxisLabelPosition;
  @Input() xAxisType!: XAxisType;
  @Input() yAxisType!: YAxisType;
  @Input() params?: CorridorStatsViewParams;
  @Input() xAxisCenterd = false;
  @Input() whiskerFillColor!: Color;
  @Input() boxFillColor!: Color;
  @Input() hideOutliers = false;
  @ViewChild(XYChart) chart!: XYChart;

  xAxis!: CategoryAxis<AxisRenderer> | DateAxis<AxisRenderer>;
  yAxis!: ValueAxis<AxisRenderer>;

  private yAxis2!: ValueAxis<AxisRenderer>;
  private whiskerSeries!: ColumnSeries;
  private boxSeries!: ColumnSeries;
  private meanSeries!: ColumnSeries;
  private baseChartOptions = new BaseChartOptions<BoxPlotChartDataItem[]>()
    .builder()
    .xAxisTitle()
    .yAxisTitle()
    .disableXAxisTooltip()
    .disableYAxisTooltip()
    .loadingScreen()
    .noDataScreen()
    .paddingRight()
    .xAxisLabelFormat()
    .yAxisLabelFormat()
    .xAxisProperties()
    .yAxisProperties()
    .xAxisLabelPosition()
    .zoomOutButtonDisbled()
    .build();

  private readonly yAxisMinValueType: YAxisMinValueType = 'yAxisMinValue';
  private readonly yAxisMaxValueType: YAxisMaxValueType = 'yAxisMaxValue';
  private readonly yAxisMeanValueType: YAxisMeanValueType = 'yAxisMeanValue';
  private readonly percentile25: YAxisPercentile25Type = 'percentile25';
  private readonly percentile75: YAxisPercentile75Type = 'percentile75';

  ngOnChanges(changes: SimpleChanges): void {
    // Change detection for base chart options
    this.baseChartOptions.onChanges(changes, this);

    if (changes.params && this.xAxis) {
      this.setParams(changes.params.currentValue);
    }
    if (changes.whiskerFillColor && this.whiskerSeries) {
      this.whiskerSeries.fill = changes.whiskerFillColor.currentValue;
    }
    if (changes.whiskerFillColor && this.meanSeries) {
      this.meanSeries.fill = changes.whiskerFillColor.currentValue;
    }
    if (changes.boxFillColor && this.boxSeries) {
      this.boxSeries.fill = changes.boxFillColor.currentValue;
    }
    if (changes.yAxisType && this.whiskerSeries && this.yAxis) {
      this.switchYAxis(changes.yAxisType.currentValue);
      this.boxSeries.columns.template.tooltipHTML = this.tooltipHtml();
    }
    if (this.chart) {
      this.toggleWhiskers();
    }
  }

  ngAfterViewInit(): void {
    // Set axes
    this.setXAxis(this.xAxisType);
    this.setYAxes();
    // Init base chart options
    this.baseChartOptions.afterViewInit(this);

    if (this.xAxisCenterd) {
      this.xAxis.width = percent(45);
      this.xAxis.align = 'center';
      this.xAxis.renderer.line.strokeOpacity = 0;
      const dummyAxis = this.chart.xAxes.push(new ValueAxis());
      dummyAxis.renderer.inside = true;
      dummyAxis.renderer.line.strokeOpacity = 0.15;
    }

    this.chart.dateFormatter.inputDateFormat = 'yyyy-MM-ddTHH:mm:ss';
    this.chart.durationFormatter.durationFormat = 'm:ss';

    this.xAxis.renderer.grid.template.location = 0.5;

    if (this.params) {
      this.setParams(this.params);
    }

    this.yAxis.renderer.grid.template.disabled = true;

    this.createBoxPlotSeries();
    this.toggleWhiskers();

    // Copy label properties etc from first axis
    this.yAxis2.copyFrom(this.yAxis);
    this.switchYAxis(this.yAxisType);
  }

  private setXAxis(xAxisType: XAxisType) {
    if (xAxisType === 'category') {
      this.xAxis = this.chart.xAxes.push(new CategoryAxis());
      this.xAxis.dataFields.category = 'category';
    } else {
      this.xAxis = this.chart.xAxes.push(new DateAxis());
    }
  }

  private setYAxes() {
    this.yAxis = this.chart.yAxes.push(new DurationAxis());
    this.yAxis2 = this.chart.yAxes.push(new ValueAxis());
  }

  private switchYAxis(yAxisType: YAxisType) {
    // We have to hide and show axes as cannot remove and replace with different AxisRenderer type
    if (yAxisType === 'time') {
      this.yAxis2.hide();
      this.whiskerSeries.yAxis = this.yAxis;
      this.boxSeries.yAxis = this.yAxis;
      this.meanSeries.yAxis = this.yAxis;
      this.yAxis.renderer.dx = 30;
      this.yAxis.title.dx = 10;
      this.yAxis.show();
    } else if (yAxisType === 'value') {
      this.yAxis.hide();
      this.yAxis2.title.text = this.yAxisTitle ? this.yAxisTitle : '';
      this.whiskerSeries.yAxis = this.yAxis2;
      this.boxSeries.yAxis = this.yAxis2;
      this.meanSeries.yAxis = this.yAxis2;
      this.yAxis2.renderer.dx = -30;
      this.yAxis2.title.dx = -50;
      this.yAxis2.show();
    }
  }

  private setParams(params: CorridorStatsViewParams) {
    const xAxis = this.xAxis as DateAxis;

    xAxis.min = params.from.toMillis();
    xAxis.max = params.to.minus({ [params.granularity]: 1 }).toMillis();

    xAxis.baseInterval = {
      timeUnit: params.granularity as TimeUnit,
      count: 1,
    };
    const gridIntervals: ITimeInterval[] =
      params.granularity === 'hour'
        ? [
            { timeUnit: 'hour', count: 1 },
            { timeUnit: 'hour', count: 3 },
            { timeUnit: 'hour', count: 6 },
          ]
        : [
            { timeUnit: 'day', count: 1 },
            { timeUnit: 'day', count: 2 },
            { timeUnit: 'day', count: 7 },
          ];
    xAxis.gridIntervals.setAll(gridIntervals);

    if (this.boxSeries) {
      this.boxSeries.columns.template.tooltipHTML = this.tooltipHtml();
    }
    this.xAxis = xAxis;
  }

  private createBoxPlotSeries() {
    const type = this.xAxisType === 'category' ? 'categoryX' : 'dateX';
    const dataField = this.xAxisType === 'category' ? 'category' : 'ts';

    const whiskerSeries = this.chart.series.push(new ColumnSeries());
    whiskerSeries.dataFields[type] = dataField;
    whiskerSeries.dataFields.valueY = this.yAxisMaxValueType;
    whiskerSeries.dataFields.openValueY = this.yAxisMinValueType;
    whiskerSeries.clustered = false;
    whiskerSeries.columns.template.width = 2;
    whiskerSeries.strokeWidth = 0;
    whiskerSeries.fill = this.whiskerFillColor;
    // TODO generalise reader title
    whiskerSeries.columns.template.readerTitle = `{${type}} Min transit time: {openValueY}, Max transit time: {valueY}`;

    const makeLine = (bullet: Bullet) => {
      const rect = bullet.createChild(Rectangle);
      rect.width = 10;
      rect.height = 2;
      rect.horizontalCenter = 'middle';
      rect.verticalCenter = 'middle';
      rect.strokeWidth = 0;
      return rect;
    };

    const maxBullet = whiskerSeries.bullets.push(new Bullet());
    maxBullet.locationY = 1;
    makeLine(maxBullet);

    const minBullet = whiskerSeries.bullets.push(new Bullet());
    minBullet.locationY = 0;
    makeLine(minBullet);

    this.boxSeries = this.chart.series.push(new ColumnSeries());
    this.boxSeries.dataFields[type] = dataField;
    this.boxSeries.dataFields.valueY = this.percentile75;
    this.boxSeries.dataFields.openValueY = this.percentile25;
    this.boxSeries.clustered = false;
    this.boxSeries.columns.template.width = 10;
    this.boxSeries.strokeWidth = 0;
    this.boxSeries.fill = this.boxFillColor;
    // TODO generalise reader title
    this.boxSeries.columns.template.readerTitle = `{${type}} 1st quartile transit time: {openValueY}, 3rd quartile transit time: {valueY}`;

    this.meanSeries = this.chart.series.push(new ColumnSeries());
    this.meanSeries.dataFields[type] = dataField;
    this.meanSeries.dataFields.valueY = this.yAxisMeanValueType;
    this.meanSeries.clustered = false;
    this.meanSeries.fillOpacity = 0;
    this.meanSeries.strokeWidth = 0;
    this.meanSeries.fill = this.whiskerFillColor;
    // TODO generalise reader title
    this.meanSeries.columns.template.readerTitle = `{${type}} Mean transit time: {valueY}`;

    const meanBullet = this.meanSeries.bullets.push(new Bullet());
    meanBullet.fillOpacity = 1;
    makeLine(meanBullet);

    const cursor = new XYCursor();
    cursor.behavior = 'none';
    cursor.lineY.disabled = true;
    cursor.lineX.disabled = true;
    this.chart.cursor = cursor;

    this.boxSeries.columns.template.tooltipHTML = this.tooltipHtml();

    if (this.boxSeries.tooltip) {
      this.boxSeries.tooltip.pointerOrientation = 'vertical';
      this.boxSeries.tooltip.getFillFromObject = false;
      this.boxSeries.tooltip.label.fill = chartColors.black;
      this.boxSeries.tooltip.label.padding(10, 10, 5, 10);
      this.boxSeries.tooltip.background.cornerRadius = 0;
      this.boxSeries.tooltip.background.filters.clear();
      this.boxSeries.tooltip.background.fillOpacity = 1;
      this.boxSeries.tooltip.background.fill = chartColors.white;
      this.boxSeries.tooltip.background.stroke = chartColors.black;
    }

    this.whiskerSeries = whiskerSeries;
  }

  private tooltipHtml() {
    let headingFormat: string;
    if (this.xAxisType === 'date') {
      let dateFormat = 'EEE, MMM dd';
      if (this.params?.granularity === 'hour') {
        dateFormat = `HH:mm ${dateFormat}`;
      }
      headingFormat = `dateX.formatDate('${dateFormat}')`;
    } else {
      headingFormat = 'binLabel';
    }

    return `
      <header class="amcharts__tooltip-heading">{${headingFormat}}</header>
      <div class="amcharts__tooltip-table">
        <span>Mean</span>
        <span class="amcharts__tooltip-value">${
          this.yAxisType === 'time' ? '{yAxisMeanValue.formatDuration("m:ss")}' : '{yAxisMeanValue}mph'
        }</span>
        <span>Minimum</span>
        <span class="amcharts__tooltip-value">${
          this.yAxisType === 'time' ? '{minTransitTime.formatDuration("m:ss")}' : '{minTransitTime}mph'
        }</span>
        <span>Maximum</span>
        <span class="amcharts__tooltip-value">${
          this.yAxisType === 'time' ? '{maxTransitTime.formatDuration("m:ss")}' : '{maxTransitTime}mph'
        }</span>
        <span>25th - 75th percentile</span>
        <span class="amcharts__tooltip-value">${
          this.yAxisType === 'time'
            ? '{percentile25.formatDuration("m:ss")} - {percentile75.formatDuration("m:ss")}'
            : '{percentile25} - {percentile75}mph'
        }</span>
      </div>`;
  }

  private toggleWhiskers() {
    this.data?.forEach((item) => {
      item.yAxisMaxValue = this.hideOutliers ? undefined : item.maxTransitTime;
      item.yAxisMinValue = this.hideOutliers ? undefined : item.minTransitTime;
    });
    this.chart.validateData();
  }
}
