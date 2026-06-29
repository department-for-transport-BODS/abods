import { Duration } from "luxon";
import { SortedPaginatedTable } from "@/components/table/SortedPaginatedTable";
import type { SortableTableRow } from "@/components/table/SortableTable";
import type { StopPerformance } from "@/services/on-time/on-time.service";

export type StopDisplayMode = "percentage" | "count" | "time";

const columns = [
  { key: "stopId", label: "NAPTAN", sortable: false },
  { key: "timingPoint", label: "Timing point", sortable: false },
  { key: "stopName", label: "Name", sortable: false },
  { key: "direction", label: "Direction", sortable: true },
  { key: "scheduledDepartures", label: "Scheduled departures", sortable: true },
  { key: "actualDepartures", label: "Recorded departures", sortable: true },
  { key: "averageScheduled", label: "Av. Scheduled Travel Time", sortable: true },
  { key: "averageActual", label: "Av. Actual Travel Time", sortable: true },
  { key: "averageDelay", label: "Av. delay", sortable: true },
  { key: "onTimeRatio", label: "On time", sortable: true },
  { key: "lateRatio", label: "Late", sortable: true },
  { key: "earlyRatio", label: "Early", sortable: true },
];

const formatPercentage = (ratio: number | null | undefined): string => {
  if (ratio == null) return "-";
  return `${(ratio * 100).toFixed(1)}%`;
};

const formatTime = (
  seconds: number | null | undefined,
  withoutSign = false,
): string => {
  if (seconds == null) return "-";

  const rounded = Math.round(seconds);
  const prefix = withoutSign ? "" : rounded >= 0 ? "+" : "-";

  return (
    prefix +
    Duration.fromObject({ seconds: Math.abs(rounded) }).toFormat("mm:ss")
  );
};

function formatDirection(direction: string | null | undefined): string {
  if (!direction) return "-";

  const value = direction.toLowerCase();
  if (value === "inbound") return "Inbound";
  if (value === "outbound") return "Outbound";
  if (value === "clockwise") return "Clockwise";
  if (value === "anticlockwise") return "Anticlockwise";
  return "-";
}

function getRecordedDeparturesRatio(row: StopPerformance): number {
  return (
    row.completedRatio ??
    ((row.actualDepartures ?? 0) / (row.scheduledDepartures ?? 0) || 0)
  );
}

function formatMetricValue(
  row: StopPerformance,
  metric: "onTime" | "late" | "early",
  displayMode: StopDisplayMode,
): string {
  const hasActualDepartures = (row.actualDepartures ?? 0) > 0;
  if (!hasActualDepartures) return "-";

  switch (displayMode) {
    case "count":
      return (row[metric] ?? 0).toLocaleString();
    case "time": {
      const secondsKey = `${metric}InSeconds` as const;
      return formatTime(row[secondsKey]);
    }
    case "percentage":
    default: {
      const ratioKey = `${metric}Ratio` as const;
      return formatPercentage(row[ratioKey]);
    }
  }
}

function getMetricSortValue(
  row: StopPerformance,
  metric: "onTime" | "late" | "early",
  displayMode: StopDisplayMode,
): number {
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

function getRowValue(
  row: StopPerformance,
  column: string,
  displayMode: StopDisplayMode,
): string | number {
  switch (column) {
    case "stopId":
      return row.stopId ?? "";
    case "timingPoint":
      return row.timingPoint ? 1 : 0;
    case "stopName":
      return row.stopInfo?.stopName ?? "";
    case "direction":
      return formatDirection(row.direction);
    case "scheduledDepartures":
      return row.scheduledDepartures ?? 0;
    case "actualDepartures":
      return displayMode === "percentage"
        ? getRecordedDeparturesRatio(row)
        : (row.actualDepartures ?? 0);
    case "averageScheduled":
      return row.averageScheduled ?? Number.NEGATIVE_INFINITY;
    case "averageActual":
      return row.averageActual ?? Number.NEGATIVE_INFINITY;
    case "averageDelay":
      return row.averageDelay ?? Number.NEGATIVE_INFINITY;
    case "onTimeRatio":
      return getMetricSortValue(row, "onTime", displayMode);
    case "lateRatio":
      return getMetricSortValue(row, "late", displayMode);
    case "earlyRatio":
      return getMetricSortValue(row, "early", displayMode);
    default:
      return "";
  }
}

// TODO: Add functionaility to reveal stop location on hover
// TODO: Display timing point data with icons
// TODO: Add summary row
// TODO: Add export button
function renderRow(
  row: StopPerformance,
  displayMode: StopDisplayMode,
): SortableTableRow {
  return {
    key: `${row.stopId ?? ""}-${row.direction ?? "all"}`,
    stopId: row.stopId ?? "-",
    timingPoint: row.timingPoint ? "Yes" : "-",
    stopName: row.stopInfo?.stopName ?? "-",
    direction: formatDirection(row.direction),
    scheduledDepartures: (row.scheduledDepartures ?? 0).toLocaleString(),
    actualDepartures:
      displayMode === "percentage"
        ? formatPercentage(getRecordedDeparturesRatio(row))
        : (row.actualDepartures ?? 0).toLocaleString(),
    averageScheduled: formatTime(row.averageScheduled),
    averageActual: formatTime(row.averageActual),
    averageDelay: formatTime(row.averageDelay, true),
    onTimeRatio: formatMetricValue(row, "onTime", displayMode),
    lateRatio: formatMetricValue(row, "late", displayMode),
    earlyRatio: formatMetricValue(row, "early", displayMode),
  };
}

interface OnTimeStopsTableProps {
  data: StopPerformance[];
  displayMode?: StopDisplayMode;
}

export const OnTimeStopsTable = ({
  data,
  displayMode = "percentage",
}: OnTimeStopsTableProps) => {
  const getValue = (row: StopPerformance, column: string) =>
    getRowValue(row, column, displayMode);
  const renderValue = (row: StopPerformance) => renderRow(row, displayMode);

  return (
    <div className="on-time-stops-table-container">
      <SortedPaginatedTable
        columns={columns}
        data={data}
        getRowValue={getValue}
        renderRow={renderValue}
        initialSortKey="stopId"
        initialSortOrder="asc"
        paginationNoun="stop"
        emptyMessage="No stop performance data available"
      />
    </div>
  );
};
