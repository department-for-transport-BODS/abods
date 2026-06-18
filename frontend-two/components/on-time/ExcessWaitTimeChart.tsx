import { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themesAnimated from "@amcharts/amcharts4/themes/animated";
import { DateTime, Interval } from "luxon";
import { Granularity, HeadwayTimeSeriesType } from "@/src/generated/graphql";

interface ExcessWaitTimeChartProps {
  data: HeadwayTimeSeriesType[];
  fromTimestamp: string;
  toTimestamp: string;
}

type ChartPoint = HeadwayTimeSeriesType & {
  excessSign: string;
};

const LEGEND_GREY = "#626A6E";
const BLACK = "#000000";
const WHITE = "#ffffff";
const TURQUOISE = "#28A197";
const DARK_BLUE = "#004D8C";

const tooltipHtml = (dateFormat = "d MMMM yyyy") =>
  `<header class="amcharts__tooltip-heading">{dateX.formatDate('${dateFormat}')}</header>
    <div class="amcharts__tooltip-table">
      <span style='grid-column: span 2;'>Average waiting time</span>
      <span>Expected</span>
      <span class="amcharts__tooltip-value">{scheduled.formatDuration('m:ss')}</span>
      <span>Actual</span>
      <span class="amcharts__tooltip-value">{actual.formatDuration('m:ss')}</span>
      <span>Excess</span>
      <span class="amcharts__tooltip-value">{excessSign}{excess.formatDuration('m:ssa')}</span>
    </div>`;

const granularUnit = (
  granularity: Granularity,
): "hour" | "day" | "minute" | "month" => {
  switch (granularity) {
    case Granularity.Hour:
      return "hour";
    case Granularity.Minute:
      return "minute";
    case Granularity.Month:
      return "month";
    case Granularity.Day:
    default:
      return "day";
  }
};

const withExcessSign = (points: HeadwayTimeSeriesType[]): ChartPoint[] =>
  points.map((point) => ({
    ...point,
    excessSign:
      point.excess === null || point.excess === undefined
        ? "NA"
        : point.excess >= 0
          ? "+"
          : "-",
  }));

const addSinglePointPadding = (
  points: ChartPoint[],
  granularity: Granularity,
): ChartPoint[] => {
  if (points.length !== 1) {
    return points;
  }

  const first = points[0];
  const ts = DateTime.fromISO(first.ts);
  const padded = ts
    .plus({ [granularUnit(granularity)]: 1 })
    .toISO({ suppressMilliseconds: true });

  if (!padded) {
    return points;
  }

  return [...points, { ts: padded, excessSign: "NA" } as ChartPoint];
};

const createSeries = (
  chart: am4charts.XYChart,
  dataField: "actual" | "scheduled",
  color: string,
) => {
  const series = chart.series.push(new am4charts.LineSeries());
  series.dataFields.valueY = dataField;
  series.dataFields.dateX = "ts";
  series.stroke = am4core.color(color);
  series.strokeWidth = 2;
  series.mainContainer.mask = undefined;
  series.connect = false;

  const bullet = series.bullets.push(new am4charts.Bullet());
  const circle = bullet.createChild(am4core.Circle);
  circle.fill = am4core.color(WHITE);
  circle.stroke = am4core.color(color);
  circle.strokeWidth = 1;
  circle.width = 5;
  circle.height = 5;

  return series;
};

const getGranularity = (
  fromTimestamp: string,
  toTimestamp: string,
): Granularity => {
  const fromDate = DateTime.fromISO(fromTimestamp);
  const toDate = DateTime.fromISO(toTimestamp);
  const dayDiff = Math.abs(toDate.diff(fromDate, "days").days);
  return dayDiff <= 5 ? Granularity.Hour : Granularity.Day;
};

const ExcessWaitTimeChart = ({
  data,
  fromTimestamp,
  toTimestamp,
}: ExcessWaitTimeChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<am4charts.XYChart | null>(null);
  const actualSeriesRef = useRef<am4charts.LineSeries | null>(null);
  const xAxisRef = useRef<am4charts.DateAxis | null>(null);

  const granularity = useMemo(
    () => getGranularity(fromTimestamp, toTimestamp),
    [fromTimestamp, toTimestamp],
  );

  const chartData = useMemo(
    () => addSinglePointPadding(withExcessSign(data), granularity),
    [data, granularity],
  );

  useLayoutEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    am4core.unuseAllThemes();
    am4core.useTheme(am4themesAnimated);

    const chart = am4core.create(chartContainerRef.current, am4charts.XYChart);
    chartRef.current = chart;

    chart.padding(10, 20, 0, 0);
    chart.margin(0, 0, 0, 0);
    chart.maskBullets = false;
    chart.dateFormatter.inputDateFormat = "yyyy-MM-ddTHH:mm:ss";

    const xAxis = chart.xAxes.push(new am4charts.DateAxis());
    xAxisRef.current = xAxis;
    xAxis.renderer.minGridDistance = 50;
    xAxis.renderer.grid.template.disabled = true;
    xAxis.renderer.grid.template.location = 0.5;
    xAxis.startLocation = 0.5;
    xAxis.endLocation = 0.5;

    const xLabel = xAxis.renderer.labels.template;
    xLabel.fontSize = 13;
    xLabel.wrap = true;
    xLabel.maxWidth = 43;
    xLabel.padding(10, 0, 0, 0);
    xLabel.textAlign = "middle";
    xLabel.location = 0.5;
    xLabel.fill = am4core.color(LEGEND_GREY);

    xAxis.gridIntervals.setAll([
      { timeUnit: "hour", count: 1 },
      { timeUnit: "hour", count: 3 },
      { timeUnit: "hour", count: 12 },
      { timeUnit: "day", count: 1 },
      { timeUnit: "day", count: 2 },
      { timeUnit: "day", count: 7 },
    ]);

    if (xAxis.tooltip) {
      xAxis.tooltip.disabled = true;
    }

    const yAxis = chart.yAxes.push(new am4charts.DurationAxis());
    yAxis.maxZoomFactor = 1;
    yAxis.zoomable = false;
    yAxis.baseUnit = "minute";
    yAxis.title.text = "Waiting time";
    yAxis.renderer.minGridDistance = 40;
    yAxis.renderer.labels.template.fontSize = 13;
    yAxis.renderer.labels.template.fill = am4core.color(LEGEND_GREY);
    xAxis.renderer.baseGrid.disabled = false;

    if (yAxis.tooltip) {
      yAxis.tooltip.disabled = true;
    }

    const actualSeries = createSeries(chart, "actual", TURQUOISE);
    actualSeriesRef.current = actualSeries;

    const expectedSeries = createSeries(chart, "scheduled", DARK_BLUE);
    expectedSeries.dataFields.openValueY = "actual";
    expectedSeries.fill = am4core.color(TURQUOISE);
    expectedSeries.fillOpacity = 0.4;

    actualSeries.tooltipHTML = tooltipHtml();
    if (actualSeries.tooltip) {
      const tooltip = actualSeries.tooltip;
      tooltip.pointerOrientation = "vertical";
      tooltip.animationDuration = 150;
      tooltip.getFillFromObject = false;
      tooltip.stroke = am4core.color(BLACK);
      tooltip.label.fill = am4core.color(BLACK);
      tooltip.label.padding(10, 10, 5, 10);
      tooltip.background.cornerRadius = 0;
      tooltip.background.fillOpacity = 1;
      tooltip.background.filters.clear();
      tooltip.background.fill = am4core.color(WHITE);
      tooltip.background.stroke = am4core.color(BLACK);
    }

    const cursor = (chart.cursor = new am4charts.XYCursor());
    cursor.behavior = "none";
    cursor.lineY.disabled = true;
    cursor.lineX.stroke = am4core.color(BLACK);
    cursor.lineX.strokeWidth = 2;
    cursor.lineX.strokeOpacity = 1;
    cursor.snapToSeries = [actualSeries];

    chart.data = chartData;

    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
      actualSeriesRef.current = null;
      xAxisRef.current = null;
    };
    // Data updates handled in effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!chartRef.current || !xAxisRef.current) {
      return;
    }

    const dateRange = Interval.fromDateTimes(
      DateTime.fromISO(fromTimestamp),
      DateTime.fromISO(toTimestamp).minus({ [granularUnit(granularity)]: 1 }),
    );

    if (!dateRange.start || !dateRange.end) {
      return;
    }

    xAxisRef.current.min = dateRange.start.toMillis();
    xAxisRef.current.max = dateRange.end.toMillis();

    if (actualSeriesRef.current) {
      actualSeriesRef.current.tooltipHTML = tooltipHtml(
        granularity === Granularity.Hour ? "HH:mm d MMM yyyy" : "d MMMM yyyy",
      );
    }

    chartRef.current.data = chartData;
    chartRef.current.invalidateRawData();
  }, [chartData, fromTimestamp, granularity, toTimestamp]);

  return (
    <div
      ref={chartContainerRef}
      style={{ minHeight: "420px", width: "100%" }}
    />
  );
};

export default memo(ExcessWaitTimeChart);
