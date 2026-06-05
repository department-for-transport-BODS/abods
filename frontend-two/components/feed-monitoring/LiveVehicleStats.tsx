import { useEffect, useRef } from "react";
import { DateTime } from "luxon";
import { VehicleStatFragment } from "../../src/generated/graphql";

import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_frozen from "@amcharts/amcharts4/themes/frozen";

import { COLOURS } from "@/utils/chartColours";

type Granularity = "hour" | "minute";

interface ChartDataPoint {
  timestamp: Date;
  dateTime: DateTime;
  actual: number;
  expected: number;
}

function buildChartData(stats: VehicleStatFragment[]): ChartDataPoint[] {
  return stats.map((s) => {
    const dateTime = DateTime.fromISO(s.timestamp, { zone: "utc" });
    return {
      dateTime,
      timestamp: dateTime.toJSDate(),
      actual: s.actual ?? 0,
      expected: s.expected ?? 0,
    };
  });
}

interface LiveVehicleStatsProps {
  data: VehicleStatFragment[];
  granularity: Granularity;
  label: string;
  xAxisMin?: Date | number;
  xAxisMax?: Date | number;
}

const LiveVehicleStats = ({
  data,
  granularity,
  label,
  xAxisMin,
  xAxisMax,
}: LiveVehicleStatsProps) => {
  const idRef = useRef(
    `live-vehicle-stats-${Math.random().toString(36).slice(2)}`,
  );
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    am4core.useTheme(am4themes_frozen);

    const chart = am4core.create(idRef.current, am4charts.XYChart);
    chartInstance.current = chart;

    chart.paddingRight = 20;
    chart.paddingLeft = 0;
    chart.defaultState.transitionDuration = 0;

    // Date axis (X)
    const dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.renderer.labels.template.fontSize = 13;
    dateAxis.renderer.labels.template.fill = am4core.color(
      COLOURS.legendaryGrey,
    );
    dateAxis.baseInterval = { timeUnit: granularity, count: 1 };
    dateAxis.gridIntervals.setAll([
      { timeUnit: granularity, count: 2 },
      { timeUnit: granularity, count: 3 },
      { timeUnit: granularity, count: 5 },
    ]);
    dateAxis.renderer.grid.template.disabled = true;
    if (dateAxis.tooltip) dateAxis.tooltip.disabled = true;

    if (xAxisMin)
      dateAxis.min =
        typeof xAxisMin === "number" ? xAxisMin : xAxisMin.getTime();
    if (xAxisMax)
      dateAxis.max =
        typeof xAxisMax === "number" ? xAxisMax : xAxisMax.getTime();

    // Value axis (Y)
    const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.renderer.labels.template.fontSize = 13;
    valueAxis.min = 0;
    valueAxis.renderer.labels.template.fill = am4core.color(
      COLOURS.legendaryGrey,
    );
    if (valueAxis.tooltip) valueAxis.tooltip.disabled = true;

    // Expected vehicles step-line
    const expectedSeries = chart.series.push(new am4charts.StepLineSeries());
    expectedSeries.name = "Expected vehicles";
    expectedSeries.dataFields.dateX = "timestamp";
    expectedSeries.dataFields.valueY = "expected";
    expectedSeries.defaultState.transitionDuration = 100;
    expectedSeries.strokeLinecap = "round";
    expectedSeries.noRisers = true;
    expectedSeries.strokeWidth = 2;
    expectedSeries.stroke = am4core.color(COLOURS.darkBlue);
    expectedSeries.startLocation = 0.1;
    expectedSeries.endLocation = 0.9;

    // Actual vehicle-journeys bar chart
    const actualSeries = chart.series.push(new am4charts.ColumnSeries());
    actualSeries.name = "Vehicle journeys";
    actualSeries.dataFields.dateX = "timestamp";
    actualSeries.dataFields.valueY = "actual";
    actualSeries.clustered = false;
    actualSeries.fill = am4core.color(COLOURS.lightBlue);
    actualSeries.stroke = am4core.color(COLOURS.lightBlue);
    actualSeries.strokeWidth = 0;
    actualSeries.defaultState.transitionDuration = 100;
    actualSeries.tooltipHTML = `
      <div style="margin-bottom:5px"><b>{timestamp.formatDate('HH:mm')}</b></div>
      <div style="margin-bottom:5px;display:flex">
        <span style="flex-grow:1">Vehicle journeys</span>
        <span style="margin-left:5px"><b>{actual}</b></span>
      </div>
      <div style="margin-bottom:5px;display:flex">
        <span style="flex-grow:1">Expected vehicle journeys</span>
        <span style="float:right;margin-left:5px"><b>{expected}</b></span>
      </div>`;

    if (actualSeries.tooltip) {
      actualSeries.tooltip.pointerOrientation = "vertical";
      actualSeries.tooltip.getFillFromObject = false;
      actualSeries.tooltip.stroke = am4core.color(COLOURS.black);
      actualSeries.tooltip.label.fill = am4core.color(COLOURS.black);
      actualSeries.tooltip.label.padding(10, 10, 5, 10);
      actualSeries.tooltip.background.cornerRadius = 0;
      actualSeries.tooltip.background.fillOpacity = 1;
      actualSeries.tooltip.background.filters.clear();
      actualSeries.tooltip.background.fill = am4core.color("#fff");
      actualSeries.tooltip.background.stroke = am4core.color(COLOURS.black);
    }

    // Cursor line
    chart.cursor = new am4charts.XYCursor();
    chart.cursor.behavior = "none";
    chart.cursor.lineY.disabled = true;
    chart.cursor.lineX.stroke = am4core.color(COLOURS.black);
    chart.cursor.lineX.strokeWidth = 2;
    chart.cursor.lineX.strokeOpacity = 1;

    // Data and hatched-column overlays
    const chartData = buildChartData(data);
    chart.data = chartData;

    const unit = granularity === "minute" ? "minutes" : "hours";
    chartData
      .filter(({ actual }) => actual === 0)
      .forEach(({ dateTime }) => {
        const range = dateAxis.axisRanges.create();
        range.date = dateTime.plus({ [unit]: 0.1 }).toJSDate();
        range.endDate = dateTime.plus({ [unit]: 0.9 }).toJSDate();
        range.grid.disabled = true;
        range.axisFill.fillOpacity = 0.5;

        const pattern = new am4core.LinePattern();
        pattern.strokeWidth = 1;
        pattern.rotation = 135;
        pattern.stroke = am4core.color(COLOURS.blue);
        pattern.fill = am4core.color(COLOURS.blue);
        range.axisFill.fill = pattern;
      });

    return () => {
      chart.dispose();
      chartInstance.current = null;
    };
  }, [data, granularity]);

  return (
    <div>
      <h3 className="govuk-body" style={{ marginBottom: "8px" }}>
        {label}
      </h3>
      <div id={idRef.current} style={{ width: "100%", height: "250px" }} />
    </div>
  );
};

export default LiveVehicleStats;
