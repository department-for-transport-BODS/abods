import { useEffect, useId, useMemo, useRef, useState } from "react";
import { PerformanceCategories, PunctualityOverview } from "@/types/dashboard";

interface PerformanceChartProps {
  data: PunctualityOverview;
  chartId?: string;
}

const labels: Record<PerformanceCategories, string> = {
  OnTime: "On-Time",
  Late: "Late",
  Early: "Early",
};

const hints: Record<PerformanceCategories, string> = {
  OnTime: "",
  Late: "(> 5:59 minutes)",
  Early: "(> 1 minute)",
};

const categories: PerformanceCategories[] = ["OnTime", "Late", "Early"];

const categoryColours: Record<PerformanceCategories, string> = {
  OnTime: "#4c2c92",
  Late: "#f4c300",
  Early: "#e0007b",
};

export const PerformanceChart = ({ data, chartId }: PerformanceChartProps) => {
  const reactId = useId();
  const resolvedChartId =
    chartId ?? `performance-chart-${reactId.replace(/[:]/g, "")}`;
  const chartRef = useRef<any>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const total = (data.onTime ?? 0) + (data.late ?? 0) + (data.early ?? 0);

  const chartData = useMemo(
    () =>
      categories.map((category) => {
        const value =
          data[
            category === "OnTime"
              ? "onTime"
              : (category.toLowerCase() as "late" | "early")
          ] ?? 0;
        const pct =
          total > 0
            ? Number((((value as number) / total) * 100).toFixed(1))
            : 0;
        return { category, value: pct };
      }),
    [data, total],
  );

  const chartDataRef = useRef(chartData);
  chartDataRef.current = chartData;

  useEffect(() => {
    let disposed = false;

    const renderChart = async () => {
      if (typeof window === "undefined") return;

      try {
        const am4coreModule = await import("@amcharts/amcharts4/core");
        const am4chartsModule = await import("@amcharts/amcharts4/charts");
        const am4themesAnimatedModule = await import(
          "@amcharts/amcharts4/themes/animated"
        );

        if (disposed) return;

        const am4core: any = am4coreModule;
        const am4charts: any = am4chartsModule;
        const am4themesAnimated: any = am4themesAnimatedModule.default;

        am4core.useTheme(am4themesAnimated);

        const chart = am4core.create(resolvedChartId, am4charts.XYChart);
        chartRef.current = chart;
        chart.padding(0, 0, 0, 0);
        chart.margin(0, 0, 0, 0);

        const categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
        categoryAxis.dataFields.category = "category";
        categoryAxis.renderer.grid.template.disabled = true;
        categoryAxis.renderer.labels.template.disabled = true;

        const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
        valueAxis.renderer.labels.template.fontSize = 13;
        valueAxis.min = 0;
        valueAxis.max = 100;
        valueAxis.paddingBottom = 30;
        valueAxis.renderer.minGridDistance = 30;
        valueAxis.renderer.grid.template.adapter.add(
          "disabled",
          (disabled: boolean, target: any) =>
            (target.dataItem as any)?.value === 100 || disabled,
        );
        valueAxis.renderer.labels.template.fill = am4core.color("#505a5f");
        valueAxis.renderer.labels.template.adapter.add(
          "text",
          (text: string) => `${text}%`,
        );
        valueAxis.renderer.minLabelPosition = 0.01;
        valueAxis.renderer.maxLabelPosition = 0.99;

        const series = chart.series.push(new am4charts.ColumnSeries());
        series.dataFields.valueY = "value";
        series.dataFields.categoryX = "category";
        series.columns.template.adapter.add(
          "fill",
          (fill: any, target: any) => {
            const category = (target.dataItem as any)
              ?.categoryX as PerformanceCategories;
            return category ? am4core.color(categoryColours[category]) : fill;
          },
        );
        series.strokeWidth = 0;

        const label = series.bullets.push(new am4charts.LabelBullet());
        label.locationY = 1;
        label.dy = 20;
        label.label.text = "{valueY}%";
        label.label.hideOversized = false;
        label.label.fontWeight = "bold";
        label.label.fontSize = 19;
        chart.maskBullets = false;

        series.columns.template.adapter.add(
          "readerDescription",
          (value: string, target: any) => {
            const category = (target.dataItem as any)
              ?.categoryX as PerformanceCategories;
            return category
              ? `${labels[category]} bar value is {valueY}%`
              : value;
          },
        );

        const legend = (chart.legend = new am4charts.Legend());
        legend.position = "right";
        legend.valign = "middle";
        legend.marginLeft = 40;
        legend.itemContainers.template.togglable = false;
        legend.itemContainers.template.paddingTop = 0;
        legend.itemContainers.template.paddingBottom = 6;
        legend.useDefaultMarker = false;
        legend.clickable = false;
        legend.itemContainers.template.cursorOverStyle =
          am4core.MouseCursorStyle.default;
        legend.labels.template.adapter.add(
          "text",
          (text: string, target: any) => {
            const category = target.dataItem?.dataContext
              ?.name as PerformanceCategories;
            if (!category) return text;
            return `[bold]${labels[category]}[/] [#505a5f]${hints[category]}[/]`;
          },
        );

        const marker = legend.markers.template.children.getIndex(0) as any;
        if (marker) {
          marker.cornerRadius(0, 0, 0, 0);
          marker.height = 15;
          marker.width = 15;
          marker.valign = "middle";
        }

        legend.data = categories.map((category) => ({
          name: category,
          fill: am4core.color(categoryColours[category]),
        }));

        chart.data = chartDataRef.current;
        setLoadFailed(false);
      } catch {
        console.error("Failed to load charting library");
        setLoadFailed(true);
      }
    };

    renderChart();

    return () => {
      disposed = true;
      if (chartRef.current) {
        chartRef.current.dispose();
        chartRef.current = null;
      }
    };
  }, [resolvedChartId]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data = chartData;
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
                {item.value.toFixed(1)}%
              </span>
              <div
                className={`performance-chart__fallback-fill performance-chart__fallback-fill--${item.category.toLowerCase()}`}
                style={{ height: `${item.value}%` }}
              />
            </div>
          ))}
        </div>
        <div className="performance-chart__fallback-legend">
          {categories.map((category) => (
            <div
              key={category}
              className="performance-chart__fallback-legend-item"
            >
              <span
                className={`performance-chart__fallback-swatch performance-chart__fallback-swatch--${category.toLowerCase()}`}
              />
              <span>
                <strong>{labels[category]}</strong> {hints[category]}
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
    />
  );
};
