import { AfterViewInit, Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { AxisRenderer, CategoryAxis, ColumnSeries, ValueAxis, XYChart, XYCursor } from '@amcharts/amcharts4/charts';
import { CorridorChart, XAxisLabelPosition } from '../corridor-chart/CorridorChart';
import { chartColors } from '../../../shared/components/amcharts/chart.service';
import { CorridorHistogramType } from '../../../../generated/graphql';
import { Color } from '@amcharts/amcharts4/core';
import { BaseChartOptions } from '../corridor-chart/BaseChartOption';

export type XAxisDataCategory = 'xAxisCategory';
export type HistogramChartDataItem = CorridorHistogramType & {
  xAxisCategory: string;
  xAxisLabel: string;
};

@Component({
  selector: 'app-histogram-chart',
  template: `<am4-xy-chart class="chart" [data]="data" theme="frozen"></am4-xy-chart>`,
  styles: [
    `
      .chart {
        height: 440px;
      }
    `,
  ],
})
export class HistogramChartComponent implements CorridorChart<HistogramChartDataItem[]>, OnChanges, AfterViewInit {
  @Input() data?: HistogramChartDataItem[];
  @Input() loading?: boolean;
  @Input() noData = false;
  @Input() xAxisTitle?: string;
  @Input() yAxisTitle?: string;
  @Input() xAxisLabelPosition?: XAxisLabelPosition;
  @Input() chartFillcolor!: Color;
  @ViewChild(XYChart) chart!: XYChart;

  xAxis!: CategoryAxis<AxisRenderer>;
  yAxis!: ValueAxis<AxisRenderer>;

  private readonly xAxisDataCategory: XAxisDataCategory = 'xAxisCategory';
  private columnSeries!: ColumnSeries;
  private baseChartOptions = new BaseChartOptions<HistogramChartDataItem[]>()
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

  ngOnChanges(changes: SimpleChanges): void {
    // Change detection for base chart options
    this.baseChartOptions.onChanges(changes, this);
    if (changes.chartFillcolor && this.columnSeries) {
      this.columnSeries.fill = changes.chartFillcolor.currentValue;
      this.columnSeries.stroke = changes.chartFillcolor.currentValue;
    }
  }

  ngAfterViewInit() {
    // Set Axes
    this.xAxis = this.chart.xAxes.push(new CategoryAxis());
    this.yAxis = this.chart.yAxes.push(new ValueAxis());
    // Init base chart options
    this.baseChartOptions.afterViewInit(this);

    this.xAxis.renderer.grid.template.disabled = true;
    this.xAxis.renderer.cellStartLocation = 0.2;
    this.xAxis.renderer.cellEndLocation = 0.8;
    this.xAxis.renderer.line.strokeOpacity = 0;
    this.xAxis.dataFields.category = this.xAxisDataCategory;

    this.yAxis.renderer.line.strokeOpacity = 0.15;
    this.yAxis.renderer.minGridDistance = 30;
    this.yAxis.renderer.minLabelPosition = 0.05;
    this.yAxis.maxPrecision = 0;

    this.columnSeries = this.chart.series.push(new ColumnSeries());
    this.columnSeries.dataFields.categoryX = this.xAxisDataCategory;
    this.columnSeries.dataFields.valueY = 'freq';
    this.columnSeries.fill = this.chartFillcolor;
    this.columnSeries.stroke = this.chartFillcolor;

    const cursor = new XYCursor();
    cursor.behavior = 'none';
    cursor.lineY.disabled = true;
    cursor.lineX.disabled = true;
    cursor.snapToSeries = this.columnSeries;
    this.chart.cursor = cursor;

    this.columnSeries.columns.template.tooltipHTML = `<div style="margin-bottom: 5px;">{xAxisLabel}</div>
    <div style="margin-bottom: 5px;"><b>{freq} journeys</b></div>`;

    if (this.columnSeries.tooltip) {
      this.columnSeries.tooltip.pointerOrientation = 'vertical';
      this.columnSeries.tooltip.getFillFromObject = false;
      this.columnSeries.tooltip.label.fill = chartColors.black;
      this.columnSeries.tooltip.label.padding(10, 10, 5, 10);
      this.columnSeries.tooltip.background.cornerRadius = 0;

      this.columnSeries.tooltip.background.filters.clear();
      this.columnSeries.tooltip.background.fillOpacity = 1;
      this.columnSeries.tooltip.background.fill = chartColors.white;
      this.columnSeries.tooltip.background.stroke = chartColors.black;
    }
  }
}
