import { useEffect, useRef } from "react";
import { BoxPlotChartDataItem, CorridorTimeStats } from "@/types/corridors";
import { CorridorTransitTimeStatsType } from "src/generated/graphql";

export type XAxisType = "date" | "category";
export type YAxisType = "time" | "value";

interface ChartDataItem {
  ts?: string | null;
  category?: string | null;
  binLabel?: string | null;
  yAxisMinValue?: number | null;
  yAxisMaxValue?: number | null;
  yAxisMeanValue?: number | null;
  percentile25?: number | null;
  percentile75?: number | null;
  minTransitTime?: number;
  maxTransitTime?: number;
}

interface Props {
  data: (CorridorTimeStats & BoxPlotChartDataItem)[];
  xAxisType: XAxisType;
  xAxisTitle: string;
  yAxisType: YAxisType;
  yAxisTitle: string;
  hideOutliers: boolean;
  whiskerColor: string;
  boxColor: string;
}

const isTransitTimeStat = (
  s: CorridorTimeStats & BoxPlotChartDataItem,
): s is CorridorTransitTimeStatsType & BoxPlotChartDataItem => {
  return "ts" in s && typeof s.ts !== "undefined" && s.ts !== null;
};

const buildChartData = (
  stats: (CorridorTimeStats & BoxPlotChartDataItem)[],
  hideOutliers: boolean,
): ChartDataItem[] =>
  stats.map((stat) => ({
    ts: isTransitTimeStat(stat) ? stat.ts : null,
    category: stat.category,
    binLabel: stat.binLabel,
    yAxisMinValue: hideOutliers ? null : stat.minTransitTime,
    yAxisMaxValue: hideOutliers ? null : stat.maxTransitTime,
    yAxisMeanValue: stat.avgTransitTime,
    percentile25: stat.percentile25,
    percentile75: stat.percentile75,
    minTransitTime: stat.minTransitTime,
    maxTransitTime: stat.maxTransitTime,
  }));

export const CorridorBoxPlotChart = ({
  data,
  xAxisType,
  xAxisTitle,
  yAxisType,
  yAxisTitle,
  hideOutliers,
  whiskerColor,
  boxColor,
}: Props) => {
  const chartDivRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartDivRef.current) return;
    let disposed = false;

    (async () => {
      const am4core = await import("@amcharts/amcharts4/core");
      const am4charts = await import("@amcharts/amcharts4/charts");
      if (disposed || !chartDivRef.current) return;

      const chart = am4core.create(chartDivRef.current, am4charts.XYChart);
      chartRef.current = chart;

      chart.durationFormatter.durationFormat = "m:ss";
      chart.dateFormatter.inputDateFormat = "yyyy-MM-ddTHH:mm:ss";
      chart.background.fill = am4core.color("#f3f2f1");
      chart.background.fillOpacity = 1;
      chart.paddingRight = 20;

      // X-axis
      let xAxis: any;
      if (xAxisType === "date") {
        xAxis = chart.xAxes.push(new am4charts.DateAxis());
        xAxis.renderer.grid.template.location = 0.5;
        xAxis.baseInterval = { timeUnit: "day", count: 1 };
        xAxis.gridIntervals.setAll([
          { timeUnit: "day", count: 1 },
          { timeUnit: "day", count: 2 },
          { timeUnit: "day", count: 7 },
        ]);
      } else {
        xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
        xAxis.dataFields.category = "category";
        xAxis.renderer.grid.template.location = 0.5;
      }
      xAxis.title.text = xAxisTitle;

      // Y-axis
      let yAxis: any;
      if (yAxisType === "time") {
        yAxis = chart.yAxes.push(new am4charts.DurationAxis());
        yAxis.renderer.dx = 30;
        yAxis.title.dx = 10;
      } else {
        yAxis = chart.yAxes.push(new am4charts.ValueAxis());
      }
      yAxis.title.text = yAxisTitle;
      yAxis.renderer.grid.template.disabled = true;

      const wColor = am4core.color(whiskerColor);
      const bColor = am4core.color(boxColor);

      const makeLine = (bullet: any) => {
        const rect = bullet.createChild(am4core.Rectangle);
        rect.width = 10;
        rect.height = 2;
        rect.horizontalCenter = "middle";
        rect.verticalCenter = "middle";
        rect.strokeWidth = 0;
        return rect;
      };

      // Whisker series (min → max)
      const whiskerSeries = chart.series.push(new am4charts.ColumnSeries());
      if (xAxisType === "date") {
        whiskerSeries.dataFields.dateX = "ts";
      } else {
        whiskerSeries.dataFields.categoryX = "category";
      }
      whiskerSeries.dataFields.valueY = "yAxisMaxValue";
      whiskerSeries.dataFields.openValueY = "yAxisMinValue";
      whiskerSeries.clustered = false;
      whiskerSeries.columns.template.width = 2;
      whiskerSeries.strokeWidth = 0;
      whiskerSeries.fill = wColor;

      const maxBullet = whiskerSeries.bullets.push(new am4charts.Bullet());
      maxBullet.locationY = 1;
      makeLine(maxBullet);
      const minBullet = whiskerSeries.bullets.push(new am4charts.Bullet());
      minBullet.locationY = 0;
      makeLine(minBullet);

      // Box series (p25 → p75)
      const boxSeries = chart.series.push(new am4charts.ColumnSeries());
      if (xAxisType === "date") {
        boxSeries.dataFields.dateX = "ts";
      } else {
        boxSeries.dataFields.categoryX = "category";
      }
      boxSeries.dataFields.valueY = "percentile75";
      boxSeries.dataFields.openValueY = "percentile25";
      boxSeries.clustered = false;
      boxSeries.columns.template.width = 10;
      boxSeries.strokeWidth = 0;
      boxSeries.fill = bColor;

      // Mean series
      const meanSeries = chart.series.push(new am4charts.ColumnSeries());
      if (xAxisType === "date") {
        meanSeries.dataFields.dateX = "ts";
      } else {
        meanSeries.dataFields.categoryX = "category";
      }
      meanSeries.dataFields.valueY = "yAxisMeanValue";
      meanSeries.clustered = false;
      meanSeries.fillOpacity = 0;
      meanSeries.strokeWidth = 0;
      meanSeries.fill = wColor;
      const meanBullet = meanSeries.bullets.push(new am4charts.Bullet());
      meanBullet.fillOpacity = 1;
      makeLine(meanBullet);

      // Cursor
      const cursor = new am4charts.XYCursor();
      cursor.behavior = "none";
      cursor.lineY.disabled = true;
      cursor.lineX.disabled = true;
      chart.cursor = cursor;

      // Tooltip
      const isTimeFmt = yAxisType === "time";
      const headingFmt =
        xAxisType === "date" ? "dateX.formatDate('EEE, MMM dd')" : "binLabel";
      boxSeries.columns.template.tooltipHTML = `
        <header class="amcharts__tooltip-heading">{${headingFmt}}</header>
        <div class="amcharts__tooltip-table">
          <span>Mean</span>
          <span class="amcharts__tooltip-value">${
            isTimeFmt
              ? '{yAxisMeanValue.formatDuration("m:ss")}'
              : "{yAxisMeanValue}mph"
          }</span>
          <span>Minimum</span>
          <span class="amcharts__tooltip-value">${
            isTimeFmt
              ? '{minTransitTime.formatDuration("m:ss")}'
              : "{minTransitTime}mph"
          }</span>
          <span>Maximum</span>
          <span class="amcharts__tooltip-value">${
            isTimeFmt
              ? '{maxTransitTime.formatDuration("m:ss")}'
              : "{maxTransitTime}mph"
          }</span>
          <span>25th &ndash; 75th percentile</span>
          <span class="amcharts__tooltip-value">${
            isTimeFmt
              ? '{percentile25.formatDuration("m:ss")} &ndash; {percentile75.formatDuration("m:ss")}'
              : "{percentile25} &ndash; {percentile75}mph"
          }</span>
        </div>`;

      if (boxSeries.tooltip) {
        boxSeries.tooltip.pointerOrientation = "vertical";
        boxSeries.tooltip.getFillFromObject = false;
        boxSeries.tooltip.label.fill = am4core.color("#0b0c0c");
        boxSeries.tooltip.label.padding(10, 10, 5, 10);
        boxSeries.tooltip.background.cornerRadius = 0;
        boxSeries.tooltip.background.filters.clear();
        boxSeries.tooltip.background.fillOpacity = 1;
        boxSeries.tooltip.background.fill = am4core.color("#ffffff");
        boxSeries.tooltip.background.stroke = am4core.color("#0b0c0c");
      }

      chart.data = buildChartData(data, hideOutliers);
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

  // Update data when props change without recreating the chart
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.data = buildChartData(data, hideOutliers);
    chartRef.current.validateData();
  }, [data, hideOutliers]);

  return (
    <div
      ref={chartDivRef}
      style={{ width: "100%", height: 440 }}
      aria-label={`${yAxisTitle} chart`}
    />
  );
};
