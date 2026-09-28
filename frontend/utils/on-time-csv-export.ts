import type { MetricRow } from "@/utils/on-time/on-time-table-format";
import { formatExportPercentage } from "@/utils/on-time/on-time-table-format";

export interface CsvExportColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

type MetricLabel = "On time" | "Late" | "Early";
type MetricCountKey = "onTime" | "late" | "early";
type MetricRatioKey = "onTimeRatio" | "lateRatio" | "earlyRatio";
type MetricSecondsKey = "onTimeInSeconds" | "lateInSeconds" | "earlyInSeconds";

export function buildMetricCsvColumns<T extends MetricRow>(
  label: MetricLabel,
  countKey: MetricCountKey,
  ratioKey: MetricRatioKey,
  secondsKey: MetricSecondsKey,
): CsvExportColumn<T>[] {
  return [
    {
      header: label,
      value: (row) =>
        (row.actualDepartures ?? 0) > 0 ? row[countKey] ?? "" : "",
    },
    {
      header: `${label} (percentage)`,
      value: (row) =>
        (row.actualDepartures ?? 0) > 0
          ? formatExportPercentage(row[ratioKey])
          : "-",
    },
    {
      header: `${label} (seconds)`,
      value: (row) =>
        (row.actualDepartures ?? 0) > 0 && row[secondsKey] != null
          ? row[secondsKey]
          : "",
    },
  ];
}

export function buildCsvRows<T>(
  exportColumns: CsvExportColumn<T>[],
  displayedRows: T[],
  totalsRow: T | null,
): (string | number)[][] {
  const rows = displayedRows.map((row) =>
    exportColumns.map((column) => column.value(row)),
  );

  if (!totalsRow) {
    return rows;
  }

  return [exportColumns.map((column) => column.value(totalsRow)), ...rows];
}
