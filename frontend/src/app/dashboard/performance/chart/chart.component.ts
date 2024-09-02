import { Component, AfterViewInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartService } from 'src/app/shared/components/amcharts/chart.service';
import { BaseChart } from 'src/app/shared/components/amcharts/base-chart';

import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import { PerformanceCategories } from '../../dashboard.types';

@Component({
  selector: 'app-performance-chart',
  template: `<div class="performance-chart" [id]="chartId"></div>`,
  styles: ['.performance-chart { min-height: 300px }'],
})
export class PerformanceChartComponent extends BaseChart implements AfterViewInit, OnDestroy, OnChanges {
  @Input() nocCode?: string | null;
  @Input() sourceData: { [key in PerformanceCategories]: number } | null = null;

  chartData?: { category: PerformanceCategories; value: string }[];

  private legendLabels: { [key in PerformanceCategories]: string } = {
    [PerformanceCategories.OnTime]: 'On-Time',
    [PerformanceCategories.Late]: 'Late',
    [PerformanceCategories.Early]: 'Early',
  };

  private legendHints: { [key in PerformanceCategories]: string } = {
    [PerformanceCategories.OnTime]: '',
    [PerformanceCategories.Late]: '(> 5:59 minutes)',
    [PerformanceCategories.Early]: '(> 1 minute)',
  };

  categoryColours: { [key in PerformanceCategories]: am4core.Color } = {
    [PerformanceCategories.OnTime]: this.chartService.colorMap.purple,
    [PerformanceCategories.Late]: this.chartService.colorMap.ochre,
    [PerformanceCategories.Early]: this.chartService.colorMap.pink,
  };

  columnOrdering = [PerformanceCategories.OnTime, PerformanceCategories.Late, PerformanceCategories.Early];

  @Input() chartId?: string;
  constructor(chartService: ChartService) {
    super(am4themes_animated, chartService);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.nocCode) {
      this.showLoadingScreen();
    }

    if (changes.sourceData && this.chart) {
      this.chartData = this.transformData(changes.sourceData.currentValue);
      this.chart.data = this.chartData;
      this.hideSpinner();
    }
  }

  transformData(source?: { [key in PerformanceCategories]: number }) {
    const total = (source?.early ?? 0) + (source?.onTime ?? 0) + (source?.late ?? 0);
    return this.columnOrdering.map((category) => {
      let value = '0';
      if (total > 0) {
        value = (((source?.[category] ?? 0) / total) * 100).toFixed(1);
      }
      return { category, value };
    });
  }

  ngAfterViewInit() {
    this.chartService.browserOnly(() => this.renderChart());
  }

  ngOnDestroy() {
    this.chartService.browserOnly(() => {
      if (this.chart) {
        this.chart.dispose();
      }
    });
  }

  createCategoryAxis() {
    if (!this.chart) {
      return;
    }
    const categoryAxis = this.chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = 'category';
    categoryAxis.renderer.grid.template.disabled = true;
    categoryAxis.renderer.labels.template.disabled = true;
  }

  createValueAxis() {
    if (!this.chart) {
      return;
    }
    const valueAxis = this.chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.renderer.labels.template.fontSize = 13;
    valueAxis.min = 0;
    valueAxis.max = 100;
    valueAxis.paddingBottom = 30;
    valueAxis.renderer.minGridDistance = 30;
    valueAxis.renderer.grid.template.adapter.add('disabled', (disabled, target) => {
      return (target.dataItem as am4charts.ValueAxisDataItem)?.value === 100 || disabled;
    });
    valueAxis.renderer.labels.template.fill = this.chartService.colorMap.legendaryGrey;
    valueAxis.renderer.labels.template.adapter.add('text', (text) => {
      return text + '%';
    });
    valueAxis.renderer.minLabelPosition = 0.01; // removes 0% label
    valueAxis.renderer.maxLabelPosition = 0.99; // removes 100% label
  }

  createSeries() {
    if (!this.chart) {
      return;
    }
    const series = this.chart.series.push(new am4charts.ColumnSeries());
    series.dataFields.valueY = 'value';
    series.dataFields.categoryX = 'category';
    series.columns.template.adapter.add('fill', (fill, target) => {
      const category = (target.dataItem as am4charts.ColumnSeriesDataItem).categoryX as PerformanceCategories;
      if (category) {
        return this.categoryColours[category];
      }
      return fill;
    });
    series.strokeWidth = 0;

    const label = series.bullets.push(new am4charts.LabelBullet());
    label.locationY = 1;
    label.dy = 20;
    label.label.text = '{value}%';
    label.label.hideOversized = false;
    label.label.fontWeight = 'bold';
    label.label.fontSize = 19;
    this.chart.maskBullets = false;

    // Add screen reader description to bar elements
    series.columns.template.adapter.add('readerDescription', (value, target) => {
      const category = (target.dataItem as am4charts.ColumnSeriesDataItem).categoryX as PerformanceCategories;
      if (category) {
        return `${this.legendLabels[category]} bar value is {value}%`;
      }
      return 'Bar value is {value}%';
    });

    return series;
  }

  createLegend() {
    if (!this.chart) {
      return;
    }
    const legend = (this.chart.legend = new am4charts.Legend());
    legend.position = 'right';
    legend.itemContainers.template.togglable = false;
    legend.labels.template.adapter.add('text', (label, target) => {
      const category = (target.dataItem as am4charts.LegendDataItem).dataContext?.name as PerformanceCategories;
      if (category) {
        return `[bold]${this.legendLabels[category]}[/] [${this.chartService.colorMap.legendaryGrey}]${this.legendHints[category]}[/]`;
      }
      return label;
    });
    legend.marginLeft = 40;
    legend.itemContainers.template.paddingTop = 0;
    legend.itemContainers.template.paddingBottom = 6;
    legend.useDefaultMarker = false;
    legend.clickable = false;
    legend.itemContainers.template.cursorOverStyle = am4core.MouseCursorStyle.default;
    const marker = legend.markers.template.children.getIndex(0) as am4core.RoundedRectangle;

    // reduce the legend marker size
    if (marker) {
      marker.cornerRadius(0, 0, 0, 0);
      marker.height = 15;
      marker.width = 15;
      marker.valign = 'middle';
    }

    legend.data = this.columnOrdering.map((category) => ({
      name: category,
      fill: this.categoryColours[category],
    }));

    return legend;
  }

  createChart() {
    this.chart = am4core.create(this.chartId, am4charts.XYChart);

    this.chart.padding(0, 0, 0, 0);
    this.chart.margin(0, 0, 0, 0);
    this.createCategoryAxis();
    this.createValueAxis();
    this.createSeries();
    this.createLegend();

    if (this.sourceData) {
      this.chartData = this.transformData(this.sourceData);
    }

    if (this.chartData) {
      this.chart.data = this.chartData;
    }
  }

  hideSpinner() {
    if (this.screens.loadingScreen) {
      this.screens.loadingScreen?.hide(0);
    }
  }
}
