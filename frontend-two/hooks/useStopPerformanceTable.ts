import { useMemo, useState } from "react";
import { StopPerformanceRow } from "@/types/stop-analysis";

export type DisplayMode = "percentage" | "count" | "time";

export const DISPLAY_MODE_OPTIONS: { value: DisplayMode; label: string }[] = [
  { value: "percentage", label: "Percentage" },
  { value: "count", label: "Count" },
  { value: "time", label: "Time" },
];

export const formatPercent = (value: number | undefined | null): string => {
  if (value == null || isNaN(value) || !isFinite(value)) return "-";
  return `${(value * 100).toFixed(1)}%`;
};

export const formatSeconds = (
  value: number | undefined | null,
  signed = false,
): string => {
  if (value == null || isNaN(value)) return "-";
  const mins = Math.floor(Math.abs(value) / 60);
  const secs = Math.round(Math.abs(value) % 60);
  const sign = signed ? (value < 0 ? "-" : "+") : value < 0 ? "-" : "";
  return `${sign}${mins}:${secs.toString().padStart(2, "0")}`;
};

export const formatMetricValue = (
  row: StopPerformanceRow,
  metric: "onTime" | "early" | "late",
  displayMode: DisplayMode,
): string => {
  switch (displayMode) {
    case "count":
      return String(row[metric]);
    case "time": {
      const secondsKey = `${metric}InSeconds` as const;
      return formatSeconds(row[secondsKey]);
    }
    case "percentage":
    default: {
      const ratioKey = `${metric}Ratio` as const;
      return formatPercent(row[ratioKey]);
    }
  }
};

export const getMetricSortValue = (
  row: StopPerformanceRow,
  metric: "onTime" | "early" | "late",
  displayMode: DisplayMode,
): string | number => {
  switch (displayMode) {
    case "count":
      return row[metric];
    case "time": {
      const secondsKey = `${metric}InSeconds` as const;
      return row[secondsKey] ?? Number.NEGATIVE_INFINITY;
    }
    case "percentage":
    default: {
      const ratioKey = `${metric}Ratio` as const;
      return row[ratioKey] ?? Number.NEGATIVE_INFINITY;
    }
  }
};

export interface StopPerformanceTotals {
  scheduledDepartures: number;
  actualDepartures: string;
  averageScheduled: string;
  averageActual: string;
  averageDelay: string;
  onTime: string;
  early: string;
  late: string;
}

/**
 * Owns display-mode state (percentage / count / time) and computes the
 * totals row from filtered data. Designed for reuse across any stop-performance
 * table; the consuming component shapes the returned `totals` into its own row type.
 */
export function useStopPerformanceTable(
  filteredData: StopPerformanceRow[],
  showTotals: boolean,
): {
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  totals: StopPerformanceTotals | null;
} {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("percentage");

  const totals = useMemo<StopPerformanceTotals | null>(() => {
    if (!showTotals || !filteredData.length) return null;

    const totalScheduled = filteredData.reduce(
      (sum, r) => sum + r.scheduledDepartures,
      0,
    );
    const totalActual = filteredData.reduce(
      (sum, r) => sum + r.actualDepartures,
      0,
    );
    const totalOnTime = filteredData.reduce((sum, r) => sum + r.onTime, 0);
    const totalEarly = filteredData.reduce((sum, r) => sum + r.early, 0);
    const totalLate = filteredData.reduce((sum, r) => sum + r.late, 0);
    const completedRatio =
      totalScheduled > 0 ? totalActual / totalScheduled : null;

    const avgDelayWeighted = filteredData.reduce(
      (sum, r) =>
        r.averageDelay != null
          ? sum + r.averageDelay * r.actualDepartures
          : sum,
      0,
    );
    const avgDelay = totalActual > 0 ? avgDelayWeighted / totalActual : null;

    const rowsWithScheduled = filteredData.filter(
      (r) => r.averageScheduled != null,
    );
    const avgScheduled = rowsWithScheduled.length
      ? rowsWithScheduled.reduce(
          (sum, r) => sum + (r.averageScheduled ?? 0),
          0,
        ) / rowsWithScheduled.length
      : null;

    const rowsWithActual = filteredData.filter((r) => r.averageActual != null);
    const avgActual = rowsWithActual.length
      ? rowsWithActual.reduce((sum, r) => sum + (r.averageActual ?? 0), 0) /
        rowsWithActual.length
      : null;

    let onTime: string;
    let early: string;
    let late: string;

    switch (displayMode) {
      case "count":
        onTime = String(totalOnTime);
        early = String(totalEarly);
        late = String(totalLate);
        break;
      case "time": {
        const onTimeSecs = filteredData.reduce(
          (sum, r) => sum + (r.onTimeInSeconds ?? 0) * r.onTime,
          0,
        );
        const earlySecs = filteredData.reduce(
          (sum, r) => sum + (r.earlyInSeconds ?? 0) * r.early,
          0,
        );
        const lateSecs = filteredData.reduce(
          (sum, r) => sum + (r.lateInSeconds ?? 0) * r.late,
          0,
        );
        onTime =
          totalOnTime > 0 ? formatSeconds(onTimeSecs / totalOnTime) : "-";
        early = totalEarly > 0 ? formatSeconds(earlySecs / totalEarly) : "-";
        late = totalLate > 0 ? formatSeconds(lateSecs / totalLate) : "-";
        break;
      }
      case "percentage":
      default:
        onTime =
          totalActual > 0 ? formatPercent(totalOnTime / totalActual) : "-";
        early = totalActual > 0 ? formatPercent(totalEarly / totalActual) : "-";
        late = totalActual > 0 ? formatPercent(totalLate / totalActual) : "-";
    }

    return {
      scheduledDepartures: totalScheduled,
      actualDepartures:
        displayMode === "percentage"
          ? formatPercent(completedRatio)
          : String(totalActual),
      averageScheduled:
        avgScheduled != null ? formatSeconds(avgScheduled, true) : "-",
      averageActual: avgActual != null ? formatSeconds(avgActual, true) : "-",
      averageDelay: avgDelay != null ? formatSeconds(avgDelay) : "-",
      onTime,
      early,
      late,
    };
  }, [filteredData, displayMode, showTotals]);

  return { displayMode, setDisplayMode, totals };
}
