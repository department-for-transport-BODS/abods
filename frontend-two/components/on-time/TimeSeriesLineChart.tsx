import { memo, useEffect, useLayoutEffect, useRef } from "react";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themesAnimated from "@amcharts/amcharts4/themes/animated";
import { DateTime } from "luxon";
import { TimeSeriesData } from "@/services/on-time/on-time.service";
import { Granularity } from "@/src/generated/graphql";

const LEGEND_GREY = "#626A6E";
const BLACK = "#000000";
const WHITE = "#ffffff";

const SERIES_CONFIG = [
  { field: "onTimeRatio", name: "On-Time", hint: "", color: "#4c2c92" },
  {
    field: "lateRatio",
    name: "Late",
    hint: "(> 5:59 minutes)",
    color: "#e5c700",
  },
  {
    field: "earlyRatio",
    name: "Early",
    hint: "(> 1 minute)",
    color: "#d53880",
  },
] as const;

interface TimeSeriesLineChartProps {
  data: TimeSeriesData[];
  fromTimestamp: string;
  toTimestamp: string;
  granularity?: Granularity;
}

const buildTooltipHtml = (granularity: Granularity) => {
  const dateFormat =
    granularity === Granularity.Hour ? "HH:mm EEE, MMM dd" : "EEE, MMM dd";
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
};

const TimeSeriesLineChart = ({
  data,
  fromTimestamp,
  toTimestamp,
  granularity = Granularity.Day,
}: TimeSeriesLineChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<am4charts.XYChart | null>(null);
  const dateAxisRef = useRef<am4charts.DateAxis | null>(null);
  const onTimeSeriesRef = useRef<am4charts.LineSeries | null>(null);
  const granularityRef = useRef(granularity);

  useLayoutEffect(() => {
    if (!chartContainerRef.current) return;

    am4core.unuseAllThemes();
    am4core.useTheme(am4themesAnimated);

    const chart = am4core.create(chartContainerRef.current, am4charts.XYChart);
    chartRef.current = chart;

    chart.padding(10, 20, 0, 0);
    chart.margin(0, 0, 0, 0);
    chart.maskBullets = false;
    chart.dateFormatter.inputDateFormat = "yyyy-MM-ddTHH:mm:ss";

    // Date (x) axis
    const dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    dateAxisRef.current = dateAxis;
    dateAxis.renderer.minGridDistance = 40;
    dateAxis.renderer.grid.template.location = 0.5;
    dateAxis.startLocation = 0.5;
    dateAxis.endLocation = 0.5;

    const xLabel = dateAxis.renderer.labels.template;
    xLabel.fontSize = 13;
    xLabel.wrap = true;
    xLabel.maxWidth = 43;
    xLabel.padding(10, 0, 0, 0);
    xLabel.textAlign = "middle";
    xLabel.location = 0.5;
    xLabel.fill = am4core.color(LEGEND_GREY);

    dateAxis.gridIntervals.setAll([
      { timeUnit: "hour", count: 1 },
      { timeUnit: "hour", count: 3 },
      { timeUnit: "hour", count: 12 },
      { timeUnit: "day", count: 1 },
      { timeUnit: "day", count: 2 },
      { timeUnit: "day", count: 7 },
      { timeUnit: "month", count: 1 },
    ]);

    if (dateAxis.tooltip) {
      dateAxis.tooltip.disabled = true;
    }

    // Value (y) axis
    const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.renderer.grid.template.disabled = true;
    valueAxis.title.disabled = true;
    valueAxis.renderer.minGridDistance = 40;
    valueAxis.renderer.labels.template.fontSize = 13;
    valueAxis.renderer.labels.template.fill = am4core.color(LEGEND_GREY);
    valueAxis.numberFormatter = new am4core.NumberFormatter();
    valueAxis.numberFormatter.numberFormat = "#%";
    valueAxis.min = 0;
    valueAxis.max = 1;
    if (valueAxis.tooltip) {
      valueAxis.tooltip.disabled = true;
    }

    // Line series
    let firstSeries: am4charts.LineSeries | null = null;
    for (const { field, color } of SERIES_CONFIG) {
      const series = chart.series.push(new am4charts.LineSeries());
      series.dataFields.valueY = field;
      series.dataFields.dateX = "ts";
      series.stroke = am4core.color(color);
      series.strokeWidth = 2;
      // Prevent line from being clipped (https://github.com/amcharts/amcharts4/issues/2893)
      series.mainContainer.mask = undefined;
      series.connect = false;

      const bullet = series.bullets.push(new am4charts.Bullet());
      const circle = bullet.createChild(am4core.Circle);
      circle.fill = am4core.color(WHITE);
      circle.stroke = am4core.color(color);
      circle.strokeWidth = 1;
      circle.width = 5;
      circle.height = 5;

      if (!firstSeries) {
        firstSeries = series;
      }
    }

    // Tooltip on the onTime series
    if (firstSeries) {
      onTimeSeriesRef.current = firstSeries;
      firstSeries.tooltipHTML = buildTooltipHtml(granularity);
      if (firstSeries.tooltip) {
        firstSeries.tooltip.pointerOrientation = "vertical";
        firstSeries.tooltip.animationDuration = 150;
        firstSeries.tooltip.getFillFromObject = false;
        firstSeries.tooltip.stroke = am4core.color(BLACK);
        firstSeries.tooltip.label.fill = am4core.color(BLACK);
        firstSeries.tooltip.label.padding(10, 10, 5, 10);
        firstSeries.tooltip.background.cornerRadius = 0;
        firstSeries.tooltip.background.fillOpacity = 1;
        firstSeries.tooltip.background.filters.clear();
        firstSeries.tooltip.background.fill = am4core.color(WHITE);
        firstSeries.tooltip.background.stroke = am4core.color(BLACK);
      }

      // Cursor
      const cursor = (chart.cursor = new am4charts.XYCursor());
      cursor.behavior = "none";
      cursor.lineY.disabled = true;
      cursor.lineX.stroke = am4core.color(BLACK);
      cursor.lineX.strokeWidth = 2;
      cursor.lineX.strokeOpacity = 1;
      cursor.snapToSeries = [firstSeries];
    }

    // Legend
    const legend = (chart.legend = new am4charts.Legend());
    legend.position = "bottom";
    legend.contentAlign = "left";
    legend.itemContainers.template.togglable = false;
    legend.labels.template.text = `[bold]{name}[/] [${LEGEND_GREY}]{hint}[/]`;
    legend.labels.template.fontSize = 16;
    legend.marginTop = 30;
    legend.marginBottom = 30;
    legend.itemContainers.template.paddingTop = 0;
    legend.itemContainers.template.paddingBottom = 0;
    legend.useDefaultMarker = false;
    legend.clickable = false;
    legend.itemContainers.template.cursorOverStyle =
      am4core.MouseCursorStyle.default;

    const marker = legend.markers.template.children.getIndex(
      0,
    ) as am4core.RoundedRectangle;
    if (marker) {
      marker.cornerRadius(0, 0, 0, 0);
      marker.height = 15;
      marker.width = 15;
      marker.marginTop = 3;
      marker.valign = "top";
    }

    legend.data = SERIES_CONFIG.map(({ name, hint, color }) => ({
      name,
      hint,
      fill: am4core.color(color),
    }));

    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
      dateAxisRef.current = null;
      onTimeSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update data + axis bounds when props change
  useEffect(() => {
    const chart = chartRef.current;
    const dateAxis = dateAxisRef.current;
    const onTimeSeries = onTimeSeriesRef.current;
    if (!chart || !dateAxis || !onTimeSeries) return;

    const currentGranularity = granularity;
    granularityRef.current = currentGranularity;

    if (dateAxis) {
      dateAxis.min = DateTime.fromISO(fromTimestamp).toMillis();
      dateAxis.max = DateTime.fromISO(toTimestamp)
        .minus({ [currentGranularity]: 1 })
        .toMillis();
    }

    if (onTimeSeries) {
      onTimeSeries.tooltipHTML = buildTooltipHtml(currentGranularity);
    }

    // Fix for single data point (ABOD-865)
    let chartData = [...data];
    if (chartData.length === 1) {
      chartData = [
        ...chartData,
        {
          ...chartData[0],
          ts: DateTime.fromISO(chartData[0].ts)
            .plus({ hour: 1 })
            .toISO({ suppressMilliseconds: true }) as string,
        },
      ];
    }

    chart.data = chartData;
    chart.invalidateRawData();
  }, [data, fromTimestamp, toTimestamp, granularity]);

  return (
    <div
      data-testid="time-series-line-chart"
      ref={chartContainerRef}
      style={{ minHeight: "400px", width: "100%" }}
    />
  );
};

export default memo(TimeSeriesLineChart);
