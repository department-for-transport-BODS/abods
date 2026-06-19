import { memo, useEffect, useLayoutEffect, useRef } from "react";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themesAnimated from "@amcharts/amcharts4/themes/animated";
import { DelayFrequencyType } from "@/src/generated/graphql";

interface DelayFrequencyChartProps {
  data: DelayFrequencyType[];
}

type PerformanceCategory = "onTime" | "late" | "early";

const LEGEND_GREY = "#626A6E";
const BLACK = "#000000";

const legend = {
  onTime: {
    name: "On-Time",
    hint: "",
    fill: am4core.color("#4c2c92"),
  },
  late: {
    name: "Late",
    hint: "(> 5:59 minutes)",
    fill: am4core.color("#e5c700"),
  },
  early: {
    name: "Early",
    hint: "(> 1 minute)",
    fill: am4core.color("#d53880"),
  },
} as const;

const heuristic = (time: number): PerformanceCategory => {
  if (time < -1) {
    return "early";
  }
  if (time < 6) {
    return "onTime";
  }
  return "late";
};

const fallbackTooltipHTML = `
  <div>{bucket} minutes</div>
  <div><strong>{frequency} stops</strong></div>
`;

const createTooltipHTML = (datum: DelayFrequencyType): string => {
  const minuteLabel =
    datum.bucket === 1 || datum.bucket === -1 ? "minute" : "minutes";
  const stopLabel = datum.frequency === 1 ? "stop" : "stops";
  const sign = datum.bucket > 0 ? "+" : "";

  return `
    <div>${sign}{bucket} ${minuteLabel}</div>
    <div><strong>{frequency} ${stopLabel}</strong></div>
  `;
};

const DelayFrequencyChart = ({ data }: DelayFrequencyChartProps) => {
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

    const categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.renderer.grid.template.disabled = true;
    categoryAxis.title.text = "Performance against schedule";
    categoryAxis.dataFields.category = "bucket";
    categoryAxis.renderer.minGridDistance = 30;
    categoryAxis.renderer.labels.template.fontSize = 13;
    categoryAxis.renderer.labels.template.fill = am4core.color(LEGEND_GREY);
    categoryAxis.numberFormatter = new am4core.NumberFormatter();
    categoryAxis.numberFormatter.numberFormat = "'+'###|###|#";
    categoryAxis.cursorTooltipEnabled = false;

    const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = "Number of stops";
    valueAxis.renderer.minGridDistance = 30;
    valueAxis.renderer.labels.template.fontSize = 13;
    valueAxis.renderer.labels.template.fill = am4core.color(LEGEND_GREY);
    valueAxis.renderer.line.strokeOpacity = 0.15;
    valueAxis.cursorTooltipEnabled = false;

    const series = chart.series.push(new am4charts.ColumnSeries());
    series.dataFields.valueY = "frequency";
    series.dataFields.categoryX = "bucket";
    series.columns.template.adapter.add("fill", (fill, target) => {
      const bucketValue = Number(
        (target.dataItem as am4charts.ColumnSeriesDataItem).categoryX,
      );
      return legend[heuristic(bucketValue)].fill;
    });
    series.strokeWidth = 0;

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

    chartLegend.data = Object.values(legend);

    const cursor = (chart.cursor = new am4charts.XYCursor());
    cursor.behavior = "none";
    cursor.lineY.disabled = true;
    cursor.lineX.stroke = am4core.color(BLACK);
    cursor.lineX.strokeWidth = 2;
    cursor.lineX.strokeOpacity = 1;
    cursor.snapToSeries = [series];

    if (series.tooltip) {
      series.tooltip.pointerOrientation = "vertical";
      series.tooltip.animationDuration = 150;
      series.tooltip.getFillFromObject = false;
      series.tooltip.stroke = am4core.color(BLACK);
      series.tooltip.label.fill = am4core.color(BLACK);
      series.tooltip.label.padding(10, 10, 5, 10);
      series.tooltip.background.cornerRadius = 0;
      series.tooltip.background.fillOpacity = 1;
      series.tooltip.background.filters.clear();
      series.tooltip.background.fill = am4core.color("#fff");
      series.tooltip.background.stroke = am4core.color(BLACK);

      series.adapter.add("tooltipHTML", (value, target) => {
        const datum = target.tooltipDataItem?.dataContext as
          | DelayFrequencyType
          | undefined;
        return datum ? createTooltipHTML(datum) : fallbackTooltipHTML;
      });
    }

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
      data-testid="delay-frequency-chart"
      ref={chartContainerRef}
      style={{ minHeight: "400px", width: "100%" }}
    />
  );
};

export default memo(DelayFrequencyChart);
