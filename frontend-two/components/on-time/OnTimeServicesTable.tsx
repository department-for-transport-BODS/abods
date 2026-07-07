import Link from "next/link";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { CsvExportButton } from "@/components/shared/CsvExportButton";
import { SortedPaginatedTable } from "@/components/table/SortedPaginatedTable";
import type { SortableTableRow } from "@/components/table/SortableTable";
import { FrequentServicePerformance } from "@/services/on-time/performance.service";
import { FrequentIcon } from "../icons/FrequentIcon";
import {
  type OnTimeDisplayMode,
  formatPercentage,
  formatDuration,
  formatDirection,
  formatMetricValue,
  getMetricSortValue,
  aggregatePerformanceTotals,
} from "@/utils/on-time-table-format";

const ALL_COLUMNS = [
  {
    key: "frequent",
    label: (
      <>
        <FrequentIcon />
        <span className="govuk-visually-hidden">Frequent service</span>
      </>
    ),
    sortable: true,
  },
  { key: "service", label: "Service", sortable: false },
  { key: "direction", label: "Direction", sortable: true },
  { key: "scheduledDepartures", label: "Scheduled departures", sortable: true },
  { key: "recordedDepartures", label: "Recorded departures", sortable: true },
  { key: "averageDelay", label: "Av. delay", sortable: true },
  { key: "onTime", label: "On time", sortable: true },
  { key: "late", label: "Late", sortable: true },
  { key: "early", label: "Early", sortable: true },
];

const SERVICE_TABLE_COLUMN_WIDTHS = {
  frequent: "6%",
  service: "18%",
  direction: "14%",
  scheduledDepartures: "12%",
  recordedDepartures: "12%",
  averageDelay: "10%",
  onTime: "10%",
  late: "9%",
  early: "9%",
};

export const SERVICE_TABLE_COLUMN_KEYS = ALL_COLUMNS.map((c) => c.key);
export const SERVICE_TABLE_COLUMN_LABELS: Record<string, ReactNode> = {
  ...Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, c.label])),
  frequent: <FrequentIcon />,
};
export const SERVICE_TABLE_ALWAYS_VISIBLE_KEYS = ["service"];

const SERVICE_EXPORT_HEADER_LABELS: Record<string, string> = {
  frequent: "Frequent",
  service: "Service",
  direction: "Direction",
  scheduledDepartures: "Scheduled departures",
  recordedDepartures: "Recorded departures",
  averageDelay: "Av. delay",
  onTime: "On time",
  late: "Late",
  early: "Early",
};

function formatDelay(delay: number | null | undefined): string {
  if (delay == null) return "-";
  const roundedDelay = Math.round(delay);
  return (
    (roundedDelay >= 0 ? "+" : "-") +
    Duration.fromObject({ seconds: Math.abs(roundedDelay) }).toFormat("mm:ss")
  );
}

function formatPercentage(ratio: number | null | undefined): string {
  if (ratio == null) return "-";
  const percentage = Math.round(ratio * 1000) / 10;
  return `${Number.isInteger(percentage) ? percentage.toFixed(0) : percentage.toFixed(1)}%`;
}

function formatSeconds(value: number | null | undefined): string {
  if (value == null) return "-";

  const rounded = Math.round(value);
  return (
    (rounded >= 0 ? "+" : "-") +
    Duration.fromObject({ seconds: Math.abs(rounded) }).toFormat("mm:ss")
  );
}

function formatMetricValue(
  row: FrequentServicePerformance,
  metric: "onTime" | "late" | "early",
  displayMode: ServiceDisplayMode,
): string {
  const hasActualDepartures = (row.actualDepartures ?? 0) > 0;
  if (!hasActualDepartures) return "-";

  switch (displayMode) {
    case "count":
      return (row[metric] ?? 0).toLocaleString();
    case "time": {
      const secondsKey = `${metric}InSeconds` as const;
      return formatSeconds(row[secondsKey]);
    }
    case "percentage":
    default: {
      const ratioKey = `${metric}Ratio` as const;
      return formatPercentage(row[ratioKey]);
    }
  }
}

function getMetricSortValue(
  row: FrequentServicePerformance,
  metric: "onTime" | "late" | "early",
  displayMode: ServiceDisplayMode,
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
    case "percentage":
    default: {
      const ratioKey = `${metric}Ratio` as const;
      return row[ratioKey] ?? Number.NEGATIVE_INFINITY;
    }
  }
}

function formatDirection(direction: string | null | undefined): string {
  if (!direction) return "-";
  else if (direction.toLowerCase() === "inbound") return "Inbound";
  else if (direction.toLowerCase() === "outbound") return "Outbound";
  return "-";
}

function calculateTotals(
  data: FrequentServicePerformance[],
): FrequentServicePerformance | null {
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
    ...data[0],
    lineId: "",
    lineInfo: {
      ...data[0].lineInfo,
      serviceId: "",
      serviceNumber: "",
      serviceName: "",
    },
    direction: null,
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

function getRowValue(
  row: FrequentServicePerformance,
  column: string,
  displayMode: OnTimeDisplayMode,
): string | number {
  switch (column) {
    case "frequent":
      return row.frequent ? 1 : 0;
    case "service": {
      const serviceNumber = row.lineInfo?.serviceNumber ?? "";
      const serviceName = row.lineInfo?.serviceName ?? "";
      return `${serviceNumber}: ${serviceName}`;
    }
    case "direction":
      return formatDirection(row.direction);
    case "scheduledDepartures":
      return row.scheduledDepartures ?? 0;
    case "recordedDepartures":
      return displayMode === "percentage"
        ? row.completedRatio ??
            ((row.actualDepartures ?? 0) / (row.scheduledDepartures ?? 0) || 0)
        : row.actualDepartures ?? 0;
    case "averageDelay":
      return row.averageDelay ?? 0;
    case "onTime":
      return getMetricSortValue(row, "onTime", displayMode);
    case "late":
      return getMetricSortValue(row, "late", displayMode);
    case "early":
      return getMetricSortValue(row, "early", displayMode);
    default:
      return "";
  }
}

function createRenderRow(nocCode: string, displayMode: OnTimeDisplayMode) {
  return (row: FrequentServicePerformance): SortableTableRow => {
    const completedRatio =
      row.completedRatio ??
      ((row.actualDepartures ?? 0) / (row.scheduledDepartures ?? 0) || 0);

    return {
      key: `${row.lineInfo?.serviceId}-${row.direction}`,
      frequent: row.frequent ? (
        <>
          <FrequentIcon />
          <span className="govuk-visually-hidden">Frequent service</span>
        </>
      ) : (
        ""
      ),
      service: (
        <Link
          href={`/on-time/${encodeURIComponent(nocCode)}/${encodeURIComponent(row.lineId ?? "")}`}
          className="govuk-link"
        >
          {row.lineInfo?.serviceNumber}: {row.lineInfo?.serviceName}
        </Link>
      ),
      direction: formatDirection(row.direction),
      scheduledDepartures: row.scheduledDepartures ?? 0,
      recordedDepartures:
        displayMode === "percentage"
          ? formatPercentage(completedRatio)
          : (row.actualDepartures ?? 0).toLocaleString(),
      averageDelay: formatDuration(row.averageDelay),
      onTime: formatMetricValue(row, "onTime", displayMode),
      late: formatMetricValue(row, "late", displayMode),
      early: formatMetricValue(row, "early", displayMode),
    };
  };
}

interface OnTimeServicesTableProps {
  data: FrequentServicePerformance[];
  nocCode: string;
  displayMode: OnTimeDisplayMode;
  visibleColumns?: string[];
}

export const OnTimeServicesTable = ({
  data,
  nocCode,
  displayMode,
  visibleColumns,
}: OnTimeServicesTableProps) => {
  const [displayedRows, setDisplayedRows] = useState<
    FrequentServicePerformance[]
  >([]);

  const filteredColumns = useMemo(
    () =>
      visibleColumns
        ? ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key))
        : ALL_COLUMNS,
    [visibleColumns],
  );
  const totalsRow = useMemo<SortableTableRow | null>(() => {
    const totals = aggregatePerformanceTotals(data);
    if (!totals) return null;

    return {
      key: "__totals__",
      frequent: "",
      service: "",
      direction: "-",
      scheduledDepartures: (
        <strong>{totals.scheduledDepartures.toLocaleString()}</strong>
      ),
      recordedDepartures: (
        <strong>
          {displayMode === "percentage"
            ? formatPercentage(totals.completedRatio)
            : totals.actualDepartures.toLocaleString()}
        </strong>
      ),
      averageDelay: <strong>{formatDuration(totals.averageDelay)}</strong>,
      onTime: (
        <strong>{formatMetricValue(totals, "onTime", displayMode)}</strong>
      ),
      late: <strong>{formatMetricValue(totals, "late", displayMode)}</strong>,
      early: <strong>{formatMetricValue(totals, "early", displayMode)}</strong>,
    };
  }, [data, displayMode]);

  const renderRow = useMemo(
    () => createRenderRow(nocCode, displayMode),
    [nocCode, displayMode],
  );
  const getValue = useCallback(
    (row: FrequentServicePerformance, column: string) =>
      getRowValue(row, column, displayMode),
    [displayMode],
  );

  const csvHeaders = filteredColumns.map(
    (column) => SERVICE_EXPORT_HEADER_LABELS[column.key] ?? column.key,
  );
  const csvRows = displayedRows.map((row) => {
    const completedRatio =
      row.completedRatio ??
      ((row.actualDepartures ?? 0) / (row.scheduledDepartures ?? 0) || 0);

    const valuesByColumn: Record<string, string | number> = {
      frequent: row.frequent ? "Yes" : "No",
      service:
        `${row.lineInfo?.serviceNumber ?? ""}: ${row.lineInfo?.serviceName ?? ""}`.trim(),
      direction: formatDirection(row.direction),
      scheduledDepartures: row.scheduledDepartures ?? 0,
      recordedDepartures:
        displayMode === "percentage"
          ? formatPercentage(completedRatio)
          : row.actualDepartures ?? 0,
      averageDelay: formatDuration(row.averageDelay),
      onTime: formatMetricValue(row, "onTime", displayMode),
      late: formatMetricValue(row, "late", displayMode),
      early: formatMetricValue(row, "early", displayMode),
    };

    return filteredColumns.map((column) => valuesByColumn[column.key] ?? "");
  });

  return (
    <div className="on-time-services-table">
      <SortedPaginatedTable
        columns={filteredColumns}
        data={data}
        getRowValue={getValue}
        renderRow={renderRow}
        pinnedRows={totalsRow ? [totalsRow] : undefined}
        initialSortKey="service"
        initialSortOrder="asc"
        paginationNoun="service"
        emptyMessage="No service performance data available"
        onDisplayedDataChange={setDisplayedRows}
        colWidths={SERVICE_TABLE_COLUMN_WIDTHS}
        footerAction={
          <CsvExportButton
            filename={`on-time-services-${nocCode}`}
            headers={csvHeaders}
            rows={csvRows}
            buttonText="Export data"
          />
        }
      />
    </div>
  );
};
