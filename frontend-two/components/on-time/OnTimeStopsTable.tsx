import { useCallback, useMemo, useState } from "react";
import { CsvExportButton } from "@/components/shared/CsvExportButton";
import { SortedPaginatedTable } from "@/components/table/SortedPaginatedTable";
import { Tooltip } from "@/components/shared/Tooltip";
import { TimingIcon } from "@/components/icons/TimingIcon";
import type { SortableTableRow } from "@/components/table/SortableTable";
import type { StopPerformance } from "@/services/on-time/on-time.service";
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
  { key: "stopId", label: "NAPTAN", sortable: false },
  {
    key: "timingPoint",
    label: (
      <>
        <TimingIcon />
        <span className="govuk-visually-hidden">Timing point</span>
      </>
    ),
    sortable: false,
  },
  { key: "stopName", label: "Name", sortable: false },
  { key: "direction", label: "Direction", sortable: true },
  { key: "scheduledDepartures", label: "Scheduled departures", sortable: true },
  { key: "actualDepartures", label: "Recorded departures", sortable: true },
  {
    key: "averageScheduled",
    label: "Av. Scheduled Travel Time",
    sortable: true,
  },
  { key: "averageActual", label: "Av. Actual Travel Time", sortable: true },
  { key: "averageDelay", label: "Av. delay", sortable: true },
  { key: "onTimeRatio", label: "On time", sortable: true },
  { key: "lateRatio", label: "Late", sortable: true },
  { key: "earlyRatio", label: "Early", sortable: true },
];

export const STOPS_TABLE_COLUMN_KEYS = ALL_COLUMNS.map((c) => c.key);
export const STOPS_TABLE_COLUMN_LABELS: Record<string, React.ReactNode> =
  Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, c.label]));
export const STOPS_TABLE_ALWAYS_VISIBLE_KEYS = ["stopId"];

const STOPS_EXPORT_HEADER_LABELS: Record<string, string> = {
  stopId: "NAPTAN",
  timingPoint: "Timing point",
  stopName: "Name",
  direction: "Direction",
  scheduledDepartures: "Scheduled departures",
  actualDepartures: "Recorded departures",
  averageScheduled: "Average scheduled travel time",
  averageActual: "Average actual travel time",
  averageDelay: "Average delay",
  onTimeRatio: "On time",
  lateRatio: "Late",
  earlyRatio: "Early",
};

function getRecordedDeparturesRatio(row: StopPerformance): number {
  return (
    row.completedRatio ??
    ((row.actualDepartures ?? 0) / (row.scheduledDepartures ?? 0) || 0)
  );
}

function getStopLocationTooltip(row: StopPerformance): string | undefined {
  const localityName = row.stopInfo?.stopLocality?.localityName;
  const localityAreaName = row.stopInfo?.stopLocality?.localityAreaName;

  if (localityName && localityAreaName) {
    return `${localityName}, ${localityAreaName}`;
  }

  return localityName ?? localityAreaName ?? undefined;
}

function calculateTotals(data: StopPerformance[]): StopPerformance | null {
  const totals = aggregatePerformanceTotals(data);
  if (!totals) return null;

  let averageScheduledTotal = 0;
  let hasAverageScheduled = false;
  let averageActualTotal = 0;
  let hasAverageActual = false;

  for (const row of data) {
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
    ...data[0],
    ...totals,
    direction: null,
    averageScheduled: hasAverageScheduled
      ? averageScheduledTotal / data.length
      : null,
    averageActual: hasAverageActual ? averageActualTotal / data.length : null,
  };
}

function getRowValue(
  row: StopPerformance,
  column: string,
  displayMode: OnTimeDisplayMode,
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
        : row.actualDepartures ?? 0;
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

function renderRow(
  row: StopPerformance,
  displayMode: OnTimeDisplayMode,
): SortableTableRow {
  return {
    key: `${row.stopId ?? ""}-${row.direction ?? "all"}`,
    stopId: row.stopId ?? "-",
    timingPoint: row.timingPoint ? (
      <div style={{ minWidth: "20px", display: "inline-flex" }}>
        <TimingIcon />
        <span className="govuk-visually-hidden">Timing point</span>
      </div>
    ) : (
      "-"
    ),
    stopName: (() => {
      const stopName = row.stopInfo?.stopName ?? "-";
      const tooltipMessage = getStopLocationTooltip(row);

      if (!tooltipMessage) {
        return stopName;
      }

      return <Tooltip message={tooltipMessage}>{stopName}</Tooltip>;
    })(),
    direction: formatDirection(row.direction),
    scheduledDepartures: (row.scheduledDepartures ?? 0).toLocaleString(),
    actualDepartures:
      displayMode === "percentage"
        ? formatPercentage(getRecordedDeparturesRatio(row))
        : (row.actualDepartures ?? 0).toLocaleString(),
    averageScheduled: formatDuration(row.averageScheduled),
    averageActual: formatDuration(row.averageActual),
    averageDelay: formatDuration(row.averageDelay, false),
    onTimeRatio: formatMetricValue(row, "onTime", displayMode),
    lateRatio: formatMetricValue(row, "late", displayMode),
    earlyRatio: formatMetricValue(row, "early", displayMode),
  };
}

interface OnTimeStopsTableProps {
  data: StopPerformance[];
  displayMode?: OnTimeDisplayMode;
  visibleColumns?: string[];
}

export const OnTimeStopsTable = ({
  data,
  displayMode = "percentage",
  visibleColumns,
}: OnTimeStopsTableProps) => {
  const [displayedRows, setDisplayedRows] = useState<StopPerformance[]>([]);

  const filteredColumns = useMemo(
    () =>
      visibleColumns
        ? ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key))
        : ALL_COLUMNS,
    [visibleColumns],
  );
  const totalsRow = useMemo<SortableTableRow | null>(() => {
    const totals = calculateTotals(data);
    if (!totals) return null;

    return {
      key: "__totals__",
      stopId: "",
      timingPoint: "",
      stopName: "",
      direction: "-",
      scheduledDepartures: (
        <strong>{(totals.scheduledDepartures ?? 0).toLocaleString()}</strong>
      ),
      actualDepartures: (
        <strong>
          {displayMode === "percentage"
            ? formatPercentage(getRecordedDeparturesRatio(totals))
            : (totals.actualDepartures ?? 0).toLocaleString()}
        </strong>
      ),
      averageScheduled: (
        <strong>{formatDuration(totals.averageScheduled)}</strong>
      ),
      averageActual: <strong>{formatDuration(totals.averageActual)}</strong>,
      averageDelay: (
        <strong>{formatDuration(totals.averageDelay, false)}</strong>
      ),
      onTimeRatio: (
        <strong>{formatMetricValue(totals, "onTime", displayMode)}</strong>
      ),
      lateRatio: (
        <strong>{formatMetricValue(totals, "late", displayMode)}</strong>
      ),
      earlyRatio: (
        <strong>{formatMetricValue(totals, "early", displayMode)}</strong>
      ),
    };
  }, [data, displayMode]);

  const getValue = useCallback(
    (row: StopPerformance, column: string) =>
      getRowValue(row, column, displayMode),
    [displayMode],
  );
  const renderValue = useCallback(
    (row: StopPerformance) => renderRow(row, displayMode),
    [displayMode],
  );

  const csvHeaders = filteredColumns.map(
    (column) => STOPS_EXPORT_HEADER_LABELS[column.key] ?? column.key,
  );
  const csvRows = displayedRows.map((row) => {
    const valuesByColumn: Record<string, string | number> = {
      stopId: row.stopId ?? "-",
      timingPoint: row.timingPoint ? "Yes" : "No",
      stopName: row.stopInfo?.stopName ?? "-",
      direction: formatDirection(row.direction),
      scheduledDepartures: row.scheduledDepartures ?? 0,
      actualDepartures:
        displayMode === "percentage"
          ? formatPercentage(getRecordedDeparturesRatio(row))
          : row.actualDepartures ?? 0,
      averageScheduled: formatDuration(row.averageScheduled),
      averageActual: formatDuration(row.averageActual),
      averageDelay: formatDuration(row.averageDelay, false),
      onTimeRatio: formatMetricValue(row, "onTime", displayMode),
      lateRatio: formatMetricValue(row, "late", displayMode),
      earlyRatio: formatMetricValue(row, "early", displayMode),
    };

    return filteredColumns.map((column) => valuesByColumn[column.key] ?? "");
  });

  return (
    <>
      <div className="on-time-stops-table-container">
        <SortedPaginatedTable
          columns={filteredColumns}
          data={data}
          getRowValue={getValue}
          renderRow={renderValue}
          pinnedRows={totalsRow ? [totalsRow] : undefined}
          initialSortKey="stopId"
          initialSortOrder="asc"
          paginationNoun="stop"
          emptyMessage="No stop performance data available"
          onDisplayedDataChange={setDisplayedRows}
          enablePagination={false}
        />
      </div>
      <div className="govuk-!-margin-top-4">
        <CsvExportButton
          filename="on-time-stops"
          headers={csvHeaders}
          rows={csvRows}
          buttonText="Export data"
        />
      </div>
    </>
  );
};
