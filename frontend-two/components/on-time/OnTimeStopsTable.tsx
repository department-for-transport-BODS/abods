import { Duration } from "luxon";
import { useMemo, useState } from "react";
import { CsvExportButton } from "@/components/shared/CsvExportButton";
import { SortedPaginatedTable } from "@/components/table/SortedPaginatedTable";
import { Tooltip } from "@/components/shared/SummaryStat/Tooltip";
import { TimingIcon } from "@/components/stop-analysis/TimingIcon";
import type { SortableTableRow } from "@/components/table/SortableTable";
import type { StopPerformance } from "@/services/on-time/on-time.service";

export type StopDisplayMode = "percentage" | "count" | "time";

const columns = [
  { key: "stopId", label: "NAPTAN", sortable: false },
  { key: "timingPoint", label: <TimingIcon />, sortable: false },
  { key: "stopName", label: "Name", sortable: false },
  { key: "direction", label: "Direction", sortable: true },
  { key: "scheduledDepartures", label: "Scheduled departures", sortable: true },
  { key: "actualDepartures", label: "Recorded departures", sortable: true },
  { key: "averageScheduled", label: "Average scheduled travel time", sortable: true },
  { key: "averageActual", label: "Average actual travel time", sortable: true },
  { key: "averageDelay", label: "Average delay", sortable: true },
  { key: "onTimeRatio", label: "On time", sortable: true },
  { key: "lateRatio", label: "Late", sortable: true },
  { key: "earlyRatio", label: "Early", sortable: true },
];

export const STOPS_TABLE_COLUMN_KEYS = columns.map((c) => c.key);
export const STOPS_TABLE_COLUMN_LABELS: Record<string, React.ReactNode> = Object.fromEntries(
  columns.map((c) => [c.key, c.label]),
);
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

function getStopLocationTooltip(
  row: StopPerformance,
): string | undefined {
  const localityName = row.stopInfo?.stopLocality?.localityName;
  const localityAreaName = row.stopInfo?.stopLocality?.localityAreaName;

  if (localityName && localityAreaName) {
    return `${localityName}, ${localityAreaName}`;
  }

  return localityName ?? localityAreaName ?? undefined;
}

function calculateTotals(data: StopPerformance[]): StopPerformance | null {
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
  let hasOnTimeInSeconds = false;
  let lateInSecondsTotal = 0;
  let hasLateInSeconds = false;
  let earlyInSecondsTotal = 0;
  let hasEarlyInSeconds = false;
  let averageScheduledTotal = 0;
  let hasAverageScheduled = false;
  let averageActualTotal = 0;
  let hasAverageActual = false;

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
      hasOnTimeInSeconds = true;
    }
    if (row.lateInSeconds != null) {
      lateInSecondsTotal += row.lateInSeconds;
      hasLateInSeconds = true;
    }
    if (row.earlyInSeconds != null) {
      earlyInSecondsTotal += row.earlyInSeconds;
      hasEarlyInSeconds = true;
    }
    if (row.averageScheduled != null) {
      averageScheduledTotal += row.averageScheduled;
      hasAverageScheduled = true;
    }
    if (row.averageActual != null) {
      averageActualTotal += row.averageActual;
      hasAverageActual = true;
    }
  }

  const totalRatio = onTimeRatioSum + lateRatioSum + earlyRatioSum;

  return {
    ...data[0],
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
      hasOnTimeInSeconds
        ? onTimeInSecondsTotal / data.length
        : null,
    lateInSeconds:
      hasLateInSeconds ? lateInSecondsTotal / data.length : null,
    earlyInSeconds:
      hasEarlyInSeconds ? earlyInSecondsTotal / data.length : null,
    averageScheduled:
      hasAverageScheduled
        ? averageScheduledTotal / data.length
        : null,
    averageActual:
      hasAverageActual ? averageActualTotal / data.length : null,
  };
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

function renderRow(
  row: StopPerformance,
  displayMode: StopDisplayMode,
): SortableTableRow {
  return {
    key: `${row.stopId ?? ""}-${row.direction ?? "all"}`,
    stopId: row.stopId ?? "-",
    timingPoint: row.timingPoint ? (
      <div style={{ minWidth: "20px", display: "inline-flex" }}>
        <TimingIcon />
        <span className="govuk-visually-hidden">Timing point</span>
      </div>
    ) : "-",
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
        ? columns.filter((c) => visibleColumns.includes(c.key))
        : columns,
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
      scheduledDepartures: <strong>{(totals.scheduledDepartures ?? 0).toLocaleString()}</strong>,
      actualDepartures: (
        <strong>
          {displayMode === "percentage"
            ? formatPercentage(getRecordedDeparturesRatio(totals))
            : (totals.actualDepartures ?? 0).toLocaleString()}
        </strong>
      ),
      averageScheduled: <strong>{formatTime(totals.averageScheduled)}</strong>,
      averageActual: <strong>{formatTime(totals.averageActual)}</strong>,
      averageDelay: <strong>{formatTime(totals.averageDelay, true)}</strong>,
      onTimeRatio: <strong>{formatMetricValue(totals, "onTime", displayMode)}</strong>,
      lateRatio: <strong>{formatMetricValue(totals, "late", displayMode)}</strong>,
      earlyRatio: <strong>{formatMetricValue(totals, "early", displayMode)}</strong>,
    };
  }, [data, displayMode]);

  const getValue = (row: StopPerformance, column: string) =>
    getRowValue(row, column, displayMode);
  const renderValue = (row: StopPerformance) => renderRow(row, displayMode);

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
      averageScheduled: formatTime(row.averageScheduled),
      averageActual: formatTime(row.averageActual),
      averageDelay: formatTime(row.averageDelay, true),
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
        />
      </div>
      < div className="govuk-!-margin-top-4">
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
