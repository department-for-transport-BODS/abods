import React, { useEffect, useRef } from "react";
import { HistogramChartDataItem } from "../../../types/corridors";

const COLUMN_FILL = "#6f72af"; // govuk light purple

interface Props {
  data: HistogramChartDataItem[];
}

export const CorridorHistogramChart = ({ data }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    (async () => {
      const am4core = await import("@amcharts/amcharts4/core");
      const am4charts = await import("@amcharts/amcharts4/charts");

      if (disposed || !containerRef.current) return;

      const chart = am4core.create(containerRef.current, am4charts.XYChart);
      chartRef.current = chart;

      chart.background.fill = am4core.color("#f3f2f1");
      chart.background.fillOpacity = 1;
      chart.paddingRight = 30;

      // X axis — category
      const xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      xAxis.dataFields.category = "xAxisCategory";
      xAxis.renderer.grid.template.disabled = true;
      xAxis.renderer.line.strokeOpacity = 0;
      xAxis.renderer.cellStartLocation = 0.2;
      xAxis.renderer.cellEndLocation = 0.8;
      xAxis.title.text = "Journey time";
      xAxis.title.fontSize = 14;

      // Y axis — value (integer)
      const yAxis = chart.yAxes.push(new am4charts.ValueAxis());
      yAxis.renderer.line.strokeOpacity = 0.15;
      yAxis.renderer.minGridDistance = 30;
      yAxis.renderer.minLabelPosition = 0.05;
      yAxis.maxPrecision = 0;
      yAxis.title.text = "Number of journeys";
      yAxis.title.fontSize = 14;

      // Column series
      const series = chart.series.push(new am4charts.ColumnSeries());
      series.dataFields.categoryX = "xAxisCategory";
      series.dataFields.valueY = "freq";
      series.fill = am4core.color(COLUMN_FILL);
      series.stroke = am4core.color(COLUMN_FILL);

      series.tooltipHTML = `<div style="margin-bottom:5px;">{xAxisLabel}</div><div style="margin-bottom:5px;"><b>{freq} journeys</b></div>`;
      if (series.tooltip) {
        series.tooltip.pointerOrientation = "vertical";
        series.tooltip.getFillFromObject = false;
        series.tooltip.label.fill = am4core.color("#0b0c0c");
        series.tooltip.label.padding(10, 10, 5, 10);
        series.tooltip.background.cornerRadius = 0;
        series.tooltip.background.filters.clear();
        series.tooltip.background.fillOpacity = 1;
        series.tooltip.background.fill = am4core.color("#ffffff");
        series.tooltip.background.stroke = am4core.color("#0b0c0c");
      }

      // Cursor
      const cursor = new am4charts.XYCursor();
      cursor.behavior = "none";
      cursor.lineY.disabled = true;
      cursor.lineX.disabled = true;
      cursor.snapToSeries = series;
      chart.cursor = cursor;

      chart.data = buildChartData(data);
    })();

    return () => {
      disposed = true;
      if (chartRef.current) {
        chartRef.current.dispose();
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.data = buildChartData(data);
    chartRef.current.validateData();
  }, [data]);

  return <div ref={containerRef} style={{ width: "100%", height: 440 }} />;
};

function buildChartData(data: HistogramChartDataItem[]) {
  return data.map((item) => ({
    xAxisCategory: item.xAxisCategory ?? String(item.bin ?? ""),
    xAxisLabel: item.xAxisLabel ?? String(item.bin ?? ""),
    freq: item.freq ?? 0,
  }));
}
