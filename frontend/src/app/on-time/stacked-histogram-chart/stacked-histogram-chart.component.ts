import { AfterViewInit, Component, ElementRef, Input, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { BaseChart } from 'src/app/shared/components/amcharts/base-chart';

import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import { ChartService } from 'src/app/shared/components/amcharts/chart.service';
import { PerformanceCategories } from '../../dashboard/dashboard.types';
import { AsyncStatus } from '../pending.model';
import { takeUntil } from 'rxjs/operators';

const TOOLTIP_HTML = `<header class="amcharts__tooltip-heading">{tooltipLabel}</header>
    <div class="amcharts__tooltip-table">
      <span class="amcharts__tooltip-legend-prefix amcharts__tooltip-legend-prefix--on-time">On-time</span>
      <span class="amcharts__tooltip-value">{onTimeRatio.formatNumber('#.00%')}</span>
      <span class="amcharts__tooltip-legend-prefix amcharts__tooltip-legend-prefix--late">Late</span>
      <span class="amcharts__tooltip-value">{lateRatio.formatNumber('#.00%')}</span>
      <span class="amcharts__tooltip-legend-prefix amcharts__tooltip-legend-prefix--early">Early</span>
      <span class="amcharts__tooltip-value">{earlyRatio.formatNumber('#.00%')}</span>
    </div>`;

@Component({
  selector: 'app-stacked-histogram-chart',
  template: '',
  styles: [':host { display: block; min-height: 100%; width: 100%;}'],
})
export class StackedHistogramChartComponent extends BaseChart implements AfterViewInit, OnDestroy {
  destroy$ = new Subject<void>();
  data$ = new Subject<unknown[]>();

  @Input() category?: string;
  @Input() centerAxis = false;

  @Input()
  set data(value: unknown[] | null) {
    if (value) {
      this.data$.next(value);
    }
  }

  @Input()
  set status$(obs: Observable<AsyncStatus>) {
    obs.pipe(takeUntil(this.destroy$)).subscribe((status) => (this.asyncStatus = status));
  }

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
  heuristic = (time: number): PerformanceCategories => {
    if (time < -1) {
      return PerformanceCategories.Early;
    } else if (time < 6) {
      return PerformanceCategories.OnTime;
    } else {
      return PerformanceCategories.Late;
    }
  };

  constructor(chartService: ChartService, private elementRef: ElementRef) {
    super(am4themes_animated, chartService);
  }

  ngAfterViewInit(): void {
    if (!this.category) {
      throw new Error('Must specify a category');
    }
    this.chartService.browserOnly(() => this.renderChart());
    this.data$.subscribe((data) => (this.chart.data = data));
  }

  createChart(): void {
    this.chart = am4core.create(this.elementRef.nativeElement, am4charts.XYChart);

    this.chart.padding(10, 10, 0, 0);
    this.chart.margin(0, 0, 0, 0);

    const categoryAxis = this.chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.renderer.grid.template.disabled = true;
    categoryAxis.dataFields.category = this.category;
    categoryAxis.renderer.minGridDistance = 30;

    if (this.centerAxis) {
      categoryAxis.width = am4core.percent(45);
      categoryAxis.align = 'center';
    }

    const label = categoryAxis.renderer.labels.template;
    label.fontSize = 13;
    label.maxWidth = 35;
    label.padding(10, 0, 0, 0);
    label.fill = this.chartService.colorMap.legendaryGrey;

    if (categoryAxis.tooltip) {
      categoryAxis.tooltip.disabled = true;
    }

    categoryAxis.events.on('sizechanged', (ev) => {
      const axis = ev.target;
      const cellWidth = axis.pixelWidth / (axis.endIndex - axis.startIndex);
      if (cellWidth < axis.renderer.labels.template.maxWidth) {
        axis.renderer.labels.template.rotation = -45;
        axis.renderer.labels.template.horizontalCenter = 'right';
        axis.renderer.labels.template.verticalCenter = 'middle';
      } else {
        axis.renderer.labels.template.rotation = 0;
        axis.renderer.labels.template.horizontalCenter = 'middle';
        axis.renderer.labels.template.verticalCenter = 'top';
      }
    });

    const valueAxis = this.chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.max = 1;
    valueAxis.renderer.minGridDistance = 30;
    valueAxis.renderer.labels.template.fontSize = 13;
    valueAxis.renderer.grid.template.adapter.add('disabled', (disabled, target) => {
      return (target.dataItem as am4charts.ValueAxisDataItem)?.value === 1 || disabled;
    });
    valueAxis.renderer.labels.template.fill = this.chartService.colorMap.legendaryGrey;
    valueAxis.renderer.line.strokeOpacity = 0.15;
    valueAxis.numberFormatter = new am4core.NumberFormatter();
    valueAxis.numberFormatter.numberFormat = '#%';
    if (valueAxis.tooltip) {
      valueAxis.tooltip.disabled = true;
    }

    for (const [category, { fill }] of Object.entries(this.legend)) {
      const series = this.chart.series.push(new am4charts.ColumnSeries());
      series.dataFields.valueY = `${category}Ratio`;
      series.dataFields.categoryX = this.category;
      series.columns.template.fill = fill;
      series.columns.template.width = am4core.percent(55);
      series.strokeWidth = 0;
      series.stacked = true;

      series.tooltipHTML = TOOLTIP_HTML;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const tooltip = series.tooltip!;

      tooltip.animationDuration = 150;
      tooltip.pointerOrientation = 'vertical';
      tooltip.getFillFromObject = false;
      tooltip.stroke = this.chartService.colorMap.black;
      tooltip.label.fill = this.chartService.colorMap.black;

      tooltip.label.padding(10, 10, 5, 10);
      tooltip.background.cornerRadius = 0;
      tooltip.background.fillOpacity = 1;
      tooltip.background.filters.clear();
      tooltip.background.fill = am4core.color('#fff');
      tooltip.background.stroke = this.chartService.colorMap.black;
    }

    const noDataPattern = new am4core.LinePattern();
    noDataPattern.strokeWidth = 1;
    noDataPattern.rotation = 135;
    noDataPattern.stroke = this.chart.colors.getIndex(1);
    noDataPattern.fill = this.chart.colors.getIndex(1);

    const noDataSeries = this.chart.series.push(new am4charts.ColumnSeries());
    noDataSeries.dataFields.valueY = 'noData';
    noDataSeries.dataFields.categoryX = this.category;
    noDataSeries.columns.template.fill = noDataPattern;
    noDataSeries.columns.template.width = am4core.percent(55);
    noDataSeries.strokeWidth = 0;
    noDataSeries.stacked = true;

    const cursor = (this.chart.cursor = new am4charts.XYCursor());
    cursor.maxTooltipDistance = -1;
    cursor.lineX.disabled = true;
    cursor.lineY.disabled = true;
    cursor.behavior = 'none';

    const legend = (this.chart.legend = new am4charts.Legend());
    legend.position = 'bottom';
    legend.contentAlign = 'left';
    legend.itemContainers.template.togglable = false;
    legend.labels.template.text = `[bold]{name}[/] [${this.chartService.colorMap.legendaryGrey}]{hint}[/]`;
    legend.labels.template.fontSize = 16;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chartService.browserOnly(() => {
      this.chart?.dispose();
    });
  }
}
