import { useEffect, useRef } from "react";
import { DateTime } from "luxon";
import { VehicleStat } from "@/types/feed-monitoring";

import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_microchart from "@amcharts/amcharts4/themes/microchart";

function buildChartData(stats: VehicleStat[]) {
  const parsed = stats.map((s) => ({
    dateTime: DateTime.fromISO(s.timestamp, { zone: "utc" }),
    timestamp: DateTime.fromISO(s.timestamp, { zone: "utc" }).toJSDate(),
    actual: s.actual ?? 0,
  }));

  parsed.sort((a, b) => (a.dateTime < b.dateTime ? -1 : 1));

  if (parsed.length === 0) return [];

  const min = parsed[0].dateTime;
  const max = parsed[parsed.length - 1].dateTime;
  const filled: { timestamp: Date; actual: number }[] = [];

  let i = 0;
  for (let ts = min; ts <= max; ts = ts.plus({ hours: 1 })) {
    const candidate = parsed[i];
    if (candidate && candidate.dateTime.equals(ts)) {
      filled.push({ timestamp: candidate.timestamp, actual: candidate.actual });
      i++;
    } else {
      filled.push({ timestamp: ts.toJSDate(), actual: 0 });
    }
  }

  return filled;
}

export const VehicleSparkline = ({ data }: { data: VehicleStat[] }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<am4charts.XYChart | null>(null);

  const idRef = useRef(`vehicle-sparkline-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!chartRef.current) return;

    am4core.useTheme(am4themes_microchart);

    const chart = am4core.create(idRef.current, am4charts.XYChart);
    chartInstance.current = chart;

    chart.width = am4core.percent(100);
    chart.height = am4core.percent(100);
    chart.background.fill = am4core.color("#f8f8f8");
    chart.padding(0, 0, 0, 0);

    const dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.startLocation = 0.5;
    dateAxis.endLocation = 0.5;
    dateAxis.baseInterval = { timeUnit: "hour", count: 1 };

    chart.yAxes.push(new am4charts.ValueAxis());

    const series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.dateX = "timestamp";
    series.dataFields.valueY = "actual";
    series.stroke = am4core.color("#5694ca");
    series.fill = am4core.color("#5694ca");
    series.fillOpacity = 1;
    series.tensionX = 0.8;
    series.name = "Actual";

    chart.data = buildChartData(data);

    return () => {
      chart.dispose();
      chartInstance.current = null;
    };
  }, [data]);

  const hasData = data.some((s) => (s.actual ?? 0) > 0);

  if (!hasData) {
    return <span className="govuk-body">-</span>;
  }

  return (
    <div
      id={idRef.current}
      ref={chartRef}
      style={{ minWidth:200, height: 40 }}
      title="Last 24 hours vehicle counts"
    />
  );
};
