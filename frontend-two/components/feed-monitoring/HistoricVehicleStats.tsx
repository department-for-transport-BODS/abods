import { useEffect, useRef } from "react";
import { DateTime } from "luxon";
import { VehicleStat } from "@/types/feed-monitoring";

import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_frozen from "@amcharts/amcharts4/themes/frozen";

import { COLOURS } from "@/utils/chartColours";

interface ChartDataPoint {
  dateTime: DateTime;
  timestamp: Date;
  actual: number;
  expected: number;
  expectedFill?: any;
}

function buildChartData(stats: VehicleStat[]): ChartDataPoint[] {
  if (!stats.length) return [];

  const protoData = stats.map((s) => {
    const dateTime = DateTime.fromISO(s.timestamp, { zone: "utc" });
    return {
      dateTime,
      timestamp: dateTime.toJSDate(),
      actual: s.actual ?? 0,
      expected: s.expected ?? 0,
    };
  });

  const minDateTime = protoData[0].dateTime;
  const maxDateTime = protoData[protoData.length - 1].dateTime.plus({
    minutes: 1,
  });

  const filled: ChartDataPoint[] = [];
  let i = 0;

  for (let ts = minDateTime; ts < maxDateTime; ts = ts.plus({ minute: 1 })) {
    const candidate = protoData[i];
    if (!candidate?.dateTime.equals(ts)) {
      filled.push({
        dateTime: ts,
        timestamp: ts.toJSDate(),
        actual: 0,
        expected: 0,
      });
    } else {
      filled.push(candidate);
      i += 1;
    }
  }

  return filled;
}

interface HistoricVehicleStatsProps {
  data: VehicleStat[];
  date: DateTime;
}

const HistoricVehicleStats = ({ data, date }: HistoricVehicleStatsProps) => {
  const idRef = useRef(`historic-vehicle-stats`);
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

    dateAxis.baseInterval = { timeUnit: "second", count: 1 };
    dateAxis.groupData = true;
    dateAxis.renderer.grid.template.disabled = true;
    dateAxis.renderer.cellStartLocation = 0;
    dateAxis.renderer.cellEndLocation = 1;
    if (dateAxis.tooltip) dateAxis.tooltip.disabled = true;

    // Value axis (Y)
    const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.renderer.labels.template.fontSize = 13;
    valueAxis.renderer.labels.template.fill = am4core.color(
      COLOURS.legendaryGrey,
    );
    valueAxis.min = 0;
    if (valueAxis.tooltip) valueAxis.tooltip.disabled = true;

    // Expected vehicles (continuous line with per-point fill/pattern)
    const expectedSeries = chart.series.push(new am4charts.LineSeries());
    expectedSeries.name = "Expected vehicles";
    expectedSeries.dataFields.dateX = "timestamp";
    expectedSeries.dataFields.valueY = "expected";
    expectedSeries.yAxis = valueAxis;
    expectedSeries.stroke = am4core.color(COLOURS.darkBlue);
    expectedSeries.strokeWidth = 2;
    expectedSeries.fillOpacity = 1;
    expectedSeries.tensionX = 0.8;
    expectedSeries.rangeChangeEasing = am4core.ease.linear;
    expectedSeries.groupFields.valueY = "open";
    expectedSeries.defaultState.transitionDuration = 100;
    expectedSeries.propertyFields.fill = "expectedFill";

    // Actual vehicle journeys
    const actualSeries = chart.series.push(new am4charts.LineSeries());
    actualSeries.name = "Vehicle journeys";
    actualSeries.dataFields.dateX = "timestamp";
    actualSeries.dataFields.valueY = "actual";
    actualSeries.dataFields.customValue = "expected";
    actualSeries.yAxis = valueAxis;
    actualSeries.stroke = am4core.color(COLOURS.lightBlue);
    actualSeries.fill = am4core.color(COLOURS.lightBlue);
    actualSeries.strokeWidth = 2;
    actualSeries.fillOpacity = 0.8;
    actualSeries.tensionX = 0.8;
    actualSeries.rangeChangeEasing = am4core.ease.linear;
    actualSeries.groupFields.valueY = "open";
    actualSeries.groupFields.customValue = "open";
    actualSeries.defaultState.transitionDuration = 100;

    actualSeries.tooltipHTML = `
      <div style="margin-bottom:5px"><b>{dateX.open.formatDate('HH:mm')}</b></div>
      <div style="margin-bottom:5px;display:flex">
        <span style="flex-grow:1">Vehicle journeys</span>
        <span style="margin-left:5px"><b>{valueY.open}</b></span>
      </div>
      <div style="margin-bottom:5px;display:flex">
        <span style="flex-grow:1">Expected vehicle journeys</span>
        <span style="float:right;margin-left:5px"><b>{customValue.open}</b></span>
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

    // Cursor
    chart.cursor = new am4charts.XYCursor();
    chart.cursor.behavior = "zoomX";
    chart.cursor.lineY.disabled = true;
    chart.cursor.lineX.stroke = am4core.color(COLOURS.black);
    chart.cursor.lineX.strokeWidth = 2;
    chart.cursor.lineX.strokeOpacity = 1;
    chart.cursor.zIndex = 3;

    chart.maskBullets = false;

    // Data
    // Data: set expectedFill per point (pattern for outage, color for normal)
    const chartData = buildChartData(data);
    chartData.forEach((point) => {
      if (point.actual === 0 && point.expected > 0) {
        const pattern = new am4core.LinePattern();
        pattern.strokeWidth = 1;
        pattern.rotation = 135;
        pattern.stroke = am4core.color(COLOURS.blue);
        pattern.fill = am4core.color(COLOURS.blue);
        point.expectedFill = pattern;
      } else {
        point.expectedFill = am4core.color(COLOURS.darkBlue);
      }
    });
    chart.data = chartData;

    return () => {
      chart.dispose();
      chartInstance.current = null;
    };
  }, [data, date]);

  return (
    <div>
      <p className="govuk-caption-m" style={{ marginBottom: "8px" }}>
        Vehicle journeys
      </p>
      <div id={idRef.current} style={{ width: "100%", height: "300px" }} />
    </div>
  );
};

export default HistoricVehicleStats;
