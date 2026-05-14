import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themesAnimated from "@amcharts/amcharts4/themes/animated";
import { PerformanceCategories, PunctualityOverview } from "@/types/dashboard";

interface PerformanceChartProps {
  data: PunctualityOverview;
  chartId?: string;
}

const orderedCategories: PerformanceCategories[] = ["OnTime", "Late", "Early"];

const legendLabels: Record<PerformanceCategories, string> = {
  OnTime: "On-Time",
  Late: "Late",
  Early: "Early",
};

const legendHints: Record<PerformanceCategories, string> = {
  OnTime: "",
  Late: "(> 5:59 minutes)",
  Early: "(> 1 minute)",
};

const categoryColours: Record<PerformanceCategories, string> = {
  OnTime: "#4c2c92", // purple
  Late: "#f4c300", // ochre
  Early: "#e0007b", // pink
};

const legendTextColor = "#505a5f";

type ChartDatum = { category: PerformanceCategories; value: string };

const toChartData = (source: PunctualityOverview): ChartDatum[] => {
  const total = (source.early ?? 0) + (source.onTime ?? 0) + (source.late ?? 0);
  return orderedCategories.map((category) => {
    const raw =
      source[
        category === "OnTime"
          ? "onTime"
          : (category.toLowerCase() as "late" | "early")
      ] ?? 0;
    const value = total > 0 ? ((raw / total) * 100).toFixed(1) : "0";
    return { category, value };
  });
};

const createCategoryAxis = (chart: any) => {
  const categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
  categoryAxis.dataFields.category = "category";
  categoryAxis.renderer.grid.template.disabled = true;
  categoryAxis.renderer.labels.template.disabled = true;
};

const createValueAxis = (chart: any) => {
  const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
  valueAxis.renderer.labels.template.fontSize = 13;
  valueAxis.min = 0;
  valueAxis.max = 100;
  valueAxis.paddingBottom = 30;
  valueAxis.renderer.minGridDistance = 30;
  valueAxis.renderer.grid.template.adapter.add(
    "disabled",
    (disabled: boolean, target: any) =>
      target.dataItem?.value === 100 || disabled,
  );
  valueAxis.renderer.labels.template.fill = am4core.color(legendTextColor);
  valueAxis.renderer.labels.template.adapter.add(
    "text",
    (text: string) => `${text}%`,
  );
  valueAxis.renderer.minLabelPosition = 0.01; // removes 0% label
  valueAxis.renderer.maxLabelPosition = 0.99; // removes 100% label
};

const createSeries = (chart: any) => {
  const series = chart.series.push(new am4charts.ColumnSeries());
  series.dataFields.valueY = "value";
  series.dataFields.categoryX = "category";
  series.columns.template.adapter.add("fill", (fill: any, target: any) => {
    const category = target.dataItem?.categoryX as PerformanceCategories;
    return category ? am4core.color(categoryColours[category]) : fill;
  });
  series.strokeWidth = 0;

  const label = series.bullets.push(new am4charts.LabelBullet());
  label.locationY = 1;
  label.dy = 20;
  label.label.text = "{value}%";
  label.label.hideOversized = false;
  label.label.fontWeight = "bold";
  label.label.fontSize = 19;
  chart.maskBullets = false;

  series.columns.template.adapter.add(
    "readerDescription",
    (value: string, target: any) => {
      const category = target.dataItem?.categoryX as PerformanceCategories;
      return category
        ? `${legendLabels[category]} bar value is {value}%`
        : "Bar value is {value}%";
    },
  );
};

const createLegend = (chart: any) => {
  const legend = (chart.legend = new am4charts.Legend());
  legend.position = "right";
  legend.itemContainers.template.togglable = false;
  legend.labels.template.adapter.add("text", (label: string, target: any) => {
    const category = target.dataItem?.dataContext
      ?.name as PerformanceCategories;
    return category
      ? `[bold]${legendLabels[category]}[/] [${legendTextColor}]${legendHints[category]}[/]`
      : label;
  });
  legend.marginLeft = 40;
  legend.itemContainers.template.paddingTop = 0;
  legend.itemContainers.template.paddingBottom = 6;
  legend.useDefaultMarker = false;
  legend.clickable = false;
  legend.itemContainers.template.cursorOverStyle =
    am4core.MouseCursorStyle.default;

  const marker = legend.markers.template.children.getIndex(0) as any;
  if (marker) {
    marker.cornerRadius(0, 0, 0, 0);
    marker.height = 15;
    marker.width = 15;
    marker.valign = "middle";
  }

  legend.data = orderedCategories.map((category) => ({
    name: category,
    fill: am4core.color(categoryColours[category]),
  }));
};

const PerformanceChart = ({ data, chartId }: PerformanceChartProps) => {
  const reactId = useId();
  const resolvedChartId =
    chartId ?? `performance-chart-${reactId.replace(/[:]/g, "")}`;
  const chartRef = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const chartData = useMemo(() => toChartData(data), [data]);

  // Initialize/dispose chart around component lifecycle.
  useLayoutEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    let rafId: number | null = null;

    try {
      if (!chartContainerRef.current) {
        return;
      }

      // amCharts themes are global, so reset before applying.
      am4core.unuseAllThemes();
      am4core.useTheme(am4themesAnimated);

      const chart = am4core.create(
        chartContainerRef.current,
        am4charts.XYChart,
      );
      chartRef.current = chart;
      chart.padding(0, 0, 0, 0);
      chart.margin(0, 0, 0, 0);

      createCategoryAxis(chart);
      createValueAxis(chart);
      createSeries(chart);
      createLegend(chart);

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          if (rafId !== null) {
            window.cancelAnimationFrame(rafId);
          }
          rafId = window.requestAnimationFrame(() => {
            chart.reinit();
            rafId = null;
          });
        });
        resizeObserver.observe(chartContainerRef.current);
      }

      chart.data = chartData;
      chart.reinit();
      setLoadFailed(false);
    } catch {
      console.error("Failed to render chart");
      setLoadFailed(true);
    }

    return () => {
      resizeObserver?.disconnect();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      chartRef.current?.dispose();
      chartRef.current = null;
    };
    // Data updates are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedChartId]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data = chartData;
      chartRef.current.invalidateRawData();
    }
  }, [chartData]);

  if (loadFailed) {
    return (
      <div className="performance-chart app-performance-chart performance-chart--fallback">
        <div className="performance-chart__fallback-bars" aria-hidden="true">
          {chartData.map((item) => (
            <div
              key={item.category}
              className="performance-chart__fallback-bar"
            >
              <span className="performance-chart__fallback-value">
                {item.value}%
              </span>
              <div
                className={`performance-chart__fallback-fill performance-chart__fallback-fill--${item.category.toLowerCase()}`}
                style={{ height: `${item.value}%` }}
              />
            </div>
          ))}
        </div>
        <div className="performance-chart__fallback-legend">
          {orderedCategories.map((category) => (
            <div
              key={category}
              className="performance-chart__fallback-legend-item"
            >
              <span
                className={`performance-chart__fallback-swatch performance-chart__fallback-swatch--${category.toLowerCase()}`}
              />
              <span>
                <strong>{legendLabels[category]}</strong>{" "}
                {legendHints[category]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="performance-chart app-performance-chart"
      id={resolvedChartId}
      ref={chartContainerRef}
    />
  );
};

export default PerformanceChart;
