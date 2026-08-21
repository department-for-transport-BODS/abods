import { Duration } from "luxon";
import { formatPercentage, getRatio } from "../maths";

export { formatPercentage };

export type OnTimeDisplayMode = "percentage" | "count" | "time";

export interface MetricRow {
  onTime?: number | null;
  late?: number | null;
  early?: number | null;
  onTimeRatio?: number | null;
  lateRatio?: number | null;
  earlyRatio?: number | null;
  onTimeInSeconds?: number | null;
  lateInSeconds?: number | null;
  earlyInSeconds?: number | null;
  actualDepartures?: number | null;
}

interface AggregableRow extends MetricRow {
  scheduledDepartures?: number | null;
  total?: number | null;
  averageDelay?: number | null;
  countDelayed?: number | null;
}

export interface AggregatedTotals {
  scheduledDepartures: number;
  actualDepartures: number;
  onTime: number;
  late: number;
  early: number;
  total: number;
  completedRatio: number;
  onTimeRatio: number;
  lateRatio: number;
  earlyRatio: number;
  averageDelay: number | null;
  countDelayed: number | null;
  onTimeInSeconds: number | null;
  lateInSeconds: number | null;
  earlyInSeconds: number | null;
}

export function aggregatePerformanceTotals(
  data: AggregableRow[],
): AggregatedTotals | null {
  if (data.length === 0) return null;

  let scheduledDepartures = 0;
  let actualDepartures = 0;
  let onTime = 0;
  let late = 0;
  let early = 0;
  let total = 0;
  let onTimeRatioSum = 0;
  let lateRatioSum = 0;
  let earlyRatioSum = 0;
  let countDelayed = 0;
  let weightedDelayTotal = 0;
  let hasDelayData = false;
  let onTimeInSecondsTotal = 0;
  let onTimeInSecondsCount = 0;
  let lateInSecondsTotal = 0;
  let lateInSecondsCount = 0;
  let earlyInSecondsTotal = 0;
  let earlyInSecondsCount = 0;

  for (const row of data) {
    scheduledDepartures += row.scheduledDepartures ?? 0;
    actualDepartures += row.actualDepartures ?? 0;
    onTime += row.onTime ?? 0;
    late += row.late ?? 0;
    early += row.early ?? 0;
    total += row.total ?? 0;
    onTimeRatioSum += row.onTimeRatio ?? 0;
    lateRatioSum += row.lateRatio ?? 0;
    earlyRatioSum += row.earlyRatio ?? 0;

    if (row.averageDelay != null || row.countDelayed != null) {
      hasDelayData = true;
      countDelayed += row.countDelayed ?? 0;
      weightedDelayTotal += (row.averageDelay ?? 0) * (row.countDelayed ?? 0);
    }

    if (row.onTimeInSeconds != null) {
      onTimeInSecondsTotal += row.onTimeInSeconds;
      onTimeInSecondsCount += 1;
    }
    if (row.lateInSeconds != null) {
      lateInSecondsTotal += row.lateInSeconds;
      lateInSecondsCount += 1;
    }
    if (row.earlyInSeconds != null) {
      earlyInSecondsTotal += row.earlyInSeconds;
      earlyInSecondsCount += 1;
    }
  }

  const totalRatio = onTimeRatioSum + lateRatioSum + earlyRatioSum;

  return {
    scheduledDepartures,
    actualDepartures,
    onTime,
    late,
    early,
    total,
    completedRatio:
      scheduledDepartures > 0 ? actualDepartures / scheduledDepartures : 0,
    onTimeRatio: totalRatio > 0 ? onTimeRatioSum / totalRatio : 0,
    lateRatio: totalRatio > 0 ? lateRatioSum / totalRatio : 0,
    earlyRatio: totalRatio > 0 ? earlyRatioSum / totalRatio : 0,
    averageDelay:
      hasDelayData && countDelayed > 0
        ? weightedDelayTotal / countDelayed
        : null,
    countDelayed: hasDelayData ? countDelayed : null,
    onTimeInSeconds:
      onTimeInSecondsCount > 0
        ? onTimeInSecondsTotal / onTimeInSecondsCount
        : null,
    lateInSeconds:
      lateInSecondsCount > 0 ? lateInSecondsTotal / lateInSecondsCount : null,
    earlyInSeconds:
      earlyInSecondsCount > 0
        ? earlyInSecondsTotal / earlyInSecondsCount
        : null,
  };
}

interface AverageTravelTimeRow {
  averageScheduled?: number | null;
  averageActual?: number | null;
}

export function aggregateAverageTravelTimes(rows: AverageTravelTimeRow[]): {
  averageScheduled: number | null;
  averageActual: number | null;
} {
  let averageScheduledTotal = 0;
  let hasAverageScheduled = false;
  let averageActualTotal = 0;
  let hasAverageActual = false;

  for (const row of rows) {
    if (row.averageScheduled != null) {
      averageScheduledTotal += row.averageScheduled;
      hasAverageScheduled = true;
    }
    if (row.averageActual != null) {
      averageActualTotal += row.averageActual;
      hasAverageActual = true;
    }
  }

  return {
    averageScheduled: hasAverageScheduled
      ? averageScheduledTotal / rows.length
      : null,
    averageActual: hasAverageActual ? averageActualTotal / rows.length : null,
  };
}

export const DISPLAY_MODE_OPTIONS = [
  { value: "percentage", label: "Percentage" },
  { value: "count", label: "Count" },
  { value: "time", label: "Time" },
] as const;

export function normaliseDirection(
  direction: string | null | undefined,
): string {
  const value = (direction ?? "").toLowerCase();
  if (value === "clockwise") return "outbound";
  if (value === "anticlockwise") return "inbound";
  return value;
}

/**
 * Formats a duration in seconds as mm:ss.
 * @param seconds - the value in seconds (may be negative)
 * @param withSign - when true (default) prepends + or - to the result
 */
export function formatDuration(
  seconds: number | null | undefined,
  withSign = true,
): string {
  if (seconds == null) return "-";
  const rounded = Math.round(seconds);
  const prefix = withSign ? (rounded >= 0 ? "+" : "-") : "";
  return (
    prefix +
    Duration.fromObject({ seconds: Math.abs(rounded) }).toFormat("mm:ss")
  );
}

/**
 * Formats a direction string. Handles inbound/outbound/clockwise/anticlockwise.
 */
export function formatDirection(direction: string | null | undefined): string {
  if (!direction) return "-";
  const value = direction.toLowerCase();
  if (value === "inbound") return "Inbound";
  if (value === "outbound") return "Outbound";
  if (value === "clockwise") return "Clockwise";
  if (value === "anticlockwise") return "Anticlockwise";
  return "-";
}

export function formatMetricValue(
  row: MetricRow,
  metric: "onTime" | "late" | "early",
  displayMode: OnTimeDisplayMode,
): string {
  const hasActualDepartures = (row.actualDepartures ?? 0) > 0;
  if (!hasActualDepartures) return "-";

  switch (displayMode) {
    case "count":
      return (row[metric] ?? 0).toLocaleString();
    case "time": {
      const secondsKey = `${metric}InSeconds` as const;
      return formatDuration(row[secondsKey]);
    }
    case "percentage": {
      const ratioKey = `${metric}Ratio` as const;
      return formatPercentage(row[ratioKey]);
    }
    default: {
      const _exhaustive: never = displayMode;
      return _exhaustive;
    }
  }
}

export function getMetricSortValue(
  row: MetricRow,
  metric: "onTime" | "late" | "early",
  displayMode: OnTimeDisplayMode,
): string | number {
  const hasActualDepartures = (row.actualDepartures ?? 0) > 0;
  if (!hasActualDepartures) return Number.NEGATIVE_INFINITY;

  switch (displayMode) {
    case "count":
      return row[metric] ?? Number.NEGATIVE_INFINITY;
    case "time": {
      const secondsKey = `${metric}InSeconds` as const;
      return row[secondsKey] ?? Number.NEGATIVE_INFINITY;
    }
    case "percentage": {
      const ratioKey = `${metric}Ratio` as const;
      return row[ratioKey] ?? Number.NEGATIVE_INFINITY;
    }
    default: {
      const _exhaustive: never = displayMode;
      return _exhaustive;
    }
  }
}

export const formatExportPercentage = formatPercentage;

export function formatAverageSecondsForExport(
  value: number | null | undefined,
): string {
  if (value == null) return "";
  return value.toFixed(0);
}

export function getRecordedDeparturesExportRatio(row: {
  actualDepartures?: number | null;
  scheduledDepartures?: number | null;
}): number {
  return getRatio(row.actualDepartures, row.scheduledDepartures);
}
