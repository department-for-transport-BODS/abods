import { memo, useEffect, useLayoutEffect, useRef } from "react";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themesAnimated from "@amcharts/amcharts4/themes/animated";

export interface HistogramDataPoint {
  onTimeRatio: number | null;
  lateRatio: number | null;
  earlyRatio: number | null;
  noData?: number;
}

interface StackedHistogramChartProps {
  data: HistogramDataPoint[];
  category: string;
  centerAxis?: boolean;
}

const TOOLTIP_HTML = `<header class="amcharts__tooltip-heading">{tooltipLabel}</header>
    <div class="amcharts__tooltip-table">
      <span class="amcharts__tooltip-legend-prefix amcharts__tooltip-legend-prefix--on-time">On-time</span>
      <span class="amcharts__tooltip-value">{onTimeRatio.formatNumber('#.00%')}</span>
      <span class="amcharts__tooltip-legend-prefix amcharts__tooltip-legend-prefix--late">Late</span>
      <span class="amcharts__tooltip-value">{lateRatio.formatNumber('#.00%')}</span>
      <span class="amcharts__tooltip-legend-prefix amcharts__tooltip-legend-prefix--early">Early</span>
      <span class="amcharts__tooltip-value">{earlyRatio.formatNumber('#.00%')}</span>
    </div>`;

const LEGEND_GREY = "#626A6E";
const BLACK = "#000000";

const seriesConfig = [
  { field: "onTimeRatio", name: "On-Time", hint: "", fill: "#4c2c92" },
  {
    field: "lateRatio",
    name: "Late",
    hint: "(> 5:59 minutes)",
    fill: "#e5c700",
  },
  { field: "earlyRatio", name: "Early", hint: "(> 1 minute)", fill: "#d53880" },
] as const;

const StackedHistogramChart = ({
  data,
  category,
  centerAxis = false,
}: StackedHistogramChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<am4charts.XYChart | null>(null);

  useLayoutEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    am4core.unuseAllThemes();
    am4core.useTheme(am4themesAnimated);

    const chart = am4core.create(chartContainerRef.current, am4charts.XYChart);
    chartRef.current = chart;

    chart.padding(10, 10, 0, 0);
    chart.margin(0, 0, 0, 0);

    // X axis
    const categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.renderer.grid.template.disabled = true;
    categoryAxis.dataFields.category = category;
    categoryAxis.renderer.minGridDistance = 30;

    if (centerAxis) {
      categoryAxis.width = am4core.percent(45);
      categoryAxis.align = "center";
    }

    const xLabel = categoryAxis.renderer.labels.template;
    xLabel.fontSize = 13;
    xLabel.maxWidth = 35;
    xLabel.padding(10, 0, 0, 0);
    xLabel.fill = am4core.color(LEGEND_GREY);

    if (categoryAxis.tooltip) {
      categoryAxis.tooltip.disabled = true;
    }

    categoryAxis.events.on("sizechanged", (ev) => {
      const axis = ev.target;
      const cellWidth = axis.pixelWidth / (axis.endIndex - axis.startIndex);
      if (cellWidth < axis.renderer.labels.template.maxWidth) {
        axis.renderer.labels.template.rotation = -45;
        axis.renderer.labels.template.horizontalCenter = "right";
        axis.renderer.labels.template.verticalCenter = "middle";
      } else {
        axis.renderer.labels.template.rotation = 0;
        axis.renderer.labels.template.horizontalCenter = "middle";
        axis.renderer.labels.template.verticalCenter = "top";
      }
    });

    // Y axis
    const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.max = 1;
    valueAxis.renderer.minGridDistance = 30;
    valueAxis.renderer.labels.template.fontSize = 13;
    valueAxis.renderer.grid.template.adapter.add(
      "disabled",
      (disabled: boolean, target: any) =>
        (target.dataItem as am4charts.ValueAxisDataItem)?.value === 1 ||
        disabled,
    );
    valueAxis.renderer.labels.template.fill = am4core.color(LEGEND_GREY);
    valueAxis.renderer.line.strokeOpacity = 0.15;
    valueAxis.numberFormatter = new am4core.NumberFormatter();
    valueAxis.numberFormatter.numberFormat = "#%";
    if (valueAxis.tooltip) {
      valueAxis.tooltip.disabled = true;
    }

    // Stacked series: onTime, late, early
    for (const { field, fill } of seriesConfig) {
      const series = chart.series.push(new am4charts.ColumnSeries());
      series.dataFields.valueY = field;
      series.dataFields.categoryX = category;
      series.columns.template.fill = am4core.color(fill);
      series.columns.template.width = am4core.percent(55);
      series.strokeWidth = 0;
      series.stacked = true;

      series.tooltipHTML = TOOLTIP_HTML;
      const tooltip = series.tooltip!;
      tooltip.animationDuration = 150;
      tooltip.pointerOrientation = "vertical";
      tooltip.getFillFromObject = false;
      tooltip.stroke = am4core.color(BLACK);
      tooltip.label.fill = am4core.color(BLACK);
      tooltip.label.padding(10, 10, 5, 10);
      tooltip.background.cornerRadius = 0;
      tooltip.background.fillOpacity = 1;
      tooltip.background.filters.clear();
      tooltip.background.fill = am4core.color("#fff");
      tooltip.background.stroke = am4core.color(BLACK);
    }

    // No-data hatched series
    const noDataPattern = new am4core.LinePattern();
    noDataPattern.strokeWidth = 1;
    noDataPattern.rotation = 135;
    noDataPattern.stroke = chart.colors.getIndex(1);
    noDataPattern.fill = chart.colors.getIndex(1);

    const noDataSeries = chart.series.push(new am4charts.ColumnSeries());
    noDataSeries.dataFields.valueY = "noData";
    noDataSeries.dataFields.categoryX = category;
    noDataSeries.columns.template.fill = noDataPattern;
    noDataSeries.columns.template.width = am4core.percent(55);
    noDataSeries.strokeWidth = 0;
    noDataSeries.stacked = true;

    // Cursor
    const cursor = (chart.cursor = new am4charts.XYCursor());
    cursor.maxTooltipDistance = -1;
    cursor.lineX.disabled = true;
    cursor.lineY.disabled = true;
    cursor.behavior = "none";

    // Legend
    const chartLegend = (chart.legend = new am4charts.Legend());
    chartLegend.position = "bottom";
    chartLegend.contentAlign = "left";
    chartLegend.itemContainers.template.togglable = false;
    chartLegend.labels.template.text = `[bold]{name}[/] [${LEGEND_GREY}]{hint}[/]`;
    chartLegend.labels.template.fontSize = 16;
    chartLegend.marginTop = 30;
    chartLegend.marginBottom = 30;
    chartLegend.itemContainers.template.paddingTop = 0;
    chartLegend.itemContainers.template.paddingBottom = 0;
    chartLegend.useDefaultMarker = false;
    chartLegend.clickable = false;
    chartLegend.itemContainers.template.cursorOverStyle =
      am4core.MouseCursorStyle.default;

    const marker = chartLegend.markers.template.children.getIndex(
      0,
    ) as am4core.RoundedRectangle;
    if (marker) {
      marker.cornerRadius(0, 0, 0, 0);
      marker.height = 15;
      marker.width = 15;
      marker.marginTop = 3;
      marker.valign = "top";
    }

    chartLegend.data = seriesConfig.map(({ name, hint, fill }) => ({
      name,
      hint,
      fill: am4core.color(fill),
    }));

    chart.data = data;

    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
    // Data updates handled by effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data = data;
      chartRef.current.invalidateRawData();
    }
  }, [data]);

  return (
    <div
      ref={chartContainerRef}
      style={{ minHeight: "400px", width: "100%" }}
    />
  );
};

export default memo(StackedHistogramChart);
