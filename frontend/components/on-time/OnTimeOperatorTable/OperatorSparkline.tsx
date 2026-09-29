import { useEffect, useMemo, useRef } from "react";
import type { TimeSeriesData } from "@/services/on-time/on-time.service";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themesMicrochart from "@amcharts/amcharts4/themes/microchart";

interface OperatorSparklineProps {
  data: TimeSeriesData[];
  width?: string | number;
  height?: number;
  title?: string;
  fromTimestamp?: string;
  toTimestamp?: string;
}

function buildChartData(data: TimeSeriesData[]) {
  return data
    .filter((point) => point.ts && point.onTimeRatio != null)
    .map((point) => ({
      ts: point.ts,
      onTimeRatio: Math.min(1, Math.max(0, point.onTimeRatio ?? 0)),
    }))
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

export const OperatorSparkline = ({
  data,
  width = "100%",
  height = 60,
  title = "On time stats for the selected duration",
  fromTimestamp,
  toTimestamp,
}: OperatorSparklineProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<am4charts.XYChart | null>(null);
  const chartData = useMemo(() => buildChartData(data), [data]);

  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

    am4core.unuseAllThemes();
    am4core.useTheme(am4themesMicrochart);

    const chart = am4core.create(chartContainerRef.current, am4charts.XYChart);
    chartRef.current = chart;
    chart.width = am4core.percent(100);
    chart.height = am4core.percent(100);
    chart.padding(2, 2, 2, 2);
    chart.margin(0, 0, 0, 0);
    chart.maskBullets = true;
    chart.dateFormatter.inputDateFormat = "yyyy-MM-ddTHH:mm:ss";

    const dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.startLocation = 0.5;
    dateAxis.endLocation = 0.5;

    if (fromTimestamp) {
      dateAxis.min = new Date(fromTimestamp).getTime();
    }

    if (toTimestamp) {
      dateAxis.max = new Date(toTimestamp).getTime();
    }

    const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.min = 0;
    valueAxis.max = 1;
    valueAxis.renderer.baseGrid.disabled = false;

    const series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.dateX = "ts";
    series.dataFields.valueY = "onTimeRatio";
    series.stroke = am4core.color("#6A3D9A");
    series.strokeWidth = 1;
    series.fillOpacity = 0.2;
    series.mainContainer.mask = undefined;
    series.connect = false;

    const bullet = series.bullets.push(new am4charts.Bullet());
    const circle = bullet.createChild(am4core.Circle);
    circle.fill = am4core.color("#6A3D9A");
    circle.width = 3;
    circle.height = 3;
    circle.strokeWidth = 0;
    chart.maskBullets = false;

    const gradient = new am4core.LinearGradient();
    gradient.addColor(am4core.color("#6A3D9A"));
    gradient.addColor(am4core.color("#ffffff"));
    gradient.rotation = 90;
    series.fill = gradient;

    chart.data = chartData;

    return () => {
      chart.dispose();
      chartRef.current = null;
    };
  }, [chartData, fromTimestamp, toTimestamp]);

  if (chartData.length === 0) {
    return <span className="govuk-body">-</span>;
  }

  return (
    <div
      ref={chartContainerRef}
      className="on-time-operator-sparkline"
      role="img"
      aria-label={title}
      style={{ width: "100%", maxWidth: width, height }}
    />
  );
};
