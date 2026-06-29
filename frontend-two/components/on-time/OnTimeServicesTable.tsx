import Link from "next/link";
import { Duration } from "luxon";
import { SortedPaginatedTable } from "@/components/table/SortedPaginatedTable";
import type { SortableTableRow } from "@/components/table/SortableTable";
import { FrequentServicePerformance } from "@/services/on-time/performance.service";

// TODO: Add summary row
// TODO: Add frequent service column

export type ServiceDisplayMode = "percentage" | "count" | "time";

const columns = [
  { key: "service", label: "Service", sortable: false },
  { key: "direction", label: "Direction", sortable: true },
  { key: "scheduledDepartures", label: "Scheduled departures", sortable: true },
  { key: "recordedDepartures", label: "Recorded departures", sortable: true },
  { key: "averageDelay", label: "Av. delay", sortable: true },
  { key: "onTime", label: "On time", sortable: true },
  { key: "late", label: "Late", sortable: true },
  { key: "early", label: "Early", sortable: true },
];

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
  return `${(ratio * 100).toFixed(1)}%`;
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

function getRowValue(
  row: FrequentServicePerformance,
  column: string,
  displayMode: ServiceDisplayMode,
): string | number {
  switch (column) {
    case "service":
      return row.lineInfo?.serviceName ?? "";
    case "direction":
      return formatDirection(row.direction);
    case "scheduledDepartures":
      return row.scheduledDepartures ?? 0;
    case "recordedDepartures":
      return displayMode === "percentage"
        ? (row.completedRatio ??
            ((row.actualDepartures ?? 0) / (row.scheduledDepartures ?? 0) || 0))
        : (row.actualDepartures ?? 0);
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

function createRenderRow(nocCode: string, displayMode: ServiceDisplayMode) {
  return (row: FrequentServicePerformance): SortableTableRow => {
    const completedRatio =
      row.completedRatio ??
      ((row.actualDepartures ?? 0) / (row.scheduledDepartures ?? 0) || 0);

    return {
      key: `${row.lineInfo?.serviceId}-${row.direction}`,
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
      averageDelay: formatDelay(row.averageDelay),
      onTime: formatMetricValue(row, "onTime", displayMode),
      late: formatMetricValue(row, "late", displayMode),
      early: formatMetricValue(row, "early", displayMode),
    };
  };
}

interface OnTimeServicesTableProps {
  data: FrequentServicePerformance[];
  nocCode: string;
  displayMode: ServiceDisplayMode;
}

export const OnTimeServicesTable = ({
  data,
  nocCode,
  displayMode,
}: OnTimeServicesTableProps) => {
  const renderRow = createRenderRow(nocCode, displayMode);
  const getValue = (row: FrequentServicePerformance, column: string) =>
    getRowValue(row, column, displayMode);
  
  return (
    <SortedPaginatedTable
      columns={columns}
      data={data}
      getRowValue={getValue}
      renderRow={renderRow}
      initialSortKey="service"
      initialSortOrder="asc"
      paginationNoun="service"
      emptyMessage="No service performance data available"
    />
  );
  // TODO: Add export button
};
