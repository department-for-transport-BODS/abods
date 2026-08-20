import styles from "./on-time-stops-table.module.scss";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { CsvExportButton } from "@/components/shared/CsvExportButton";
import { SortedPaginatedTable } from "@/components/table/SortedPaginatedTable";
import { Tooltip } from "@/components/shared/Tooltip";
import { TimingIcon } from "@/components/icons/TimingIcon";
import type { SortableTableRow } from "@/components/table/SortableTable";
import type { StopPerformance } from "@/services/on-time/on-time.service";
import {
  buildCsvRows,
  buildMetricCsvColumns,
  type CsvExportColumn,
} from "@/utils/on-time-csv-export";
import {
  type OnTimeDisplayMode,
  formatPercentage,
  formatDuration,
  formatDirection,
  formatMetricValue,
  getMetricSortValue,
  aggregatePerformanceTotals,
  aggregateAverageTravelTimes,
  formatExportPercentage,
  formatAverageSecondsForExport,
  getRecordedDeparturesExportRatio,
} from "@/utils/on-time/on-time-table-format";
import { getRatio } from "@/utils/maths";

type StopsTableColumnKey =
  | "stopId"
  | "timingPoint"
  | "stopName"
  | "direction"
  | "scheduledDepartures"
  | "actualDepartures"
  | "averageScheduled"
  | "averageActual"
  | "averageDelay"
  | "onTimeRatio"
  | "lateRatio"
  | "earlyRatio";

interface StopsTableColumnDefinition {
  key: StopsTableColumnKey;
  label: ReactNode;
  modalLabel?: string;
  alwaysVisible?: boolean;
  sortable?: boolean;
  cellClassName?: string;
  csvColumns: CsvExportColumn<StopPerformance>[];
}

const STOPS_TABLE_COLUMN_OPTIONS: StopsTableColumnDefinition[] = [
  {
    key: "stopId",
    label: "NAPTAN",
    modalLabel: "NAPTAN",
    alwaysVisible: true,
    sortable: false,
    cellClassName: styles.naptanCell,
    csvColumns: [
      {
        header: "NAPTAN",
        value: (row) => row.stopId ?? "",
      },
    ],
  },
  {
    key: "timingPoint",
    label: (
      <>
        <span className={styles.timingIcon}>
          <TimingIcon />
          <span className="govuk-visually-hidden">Timing point</span>
        </span>
      </>
    ),
    modalLabel: "Timing point",
    sortable: false,
    cellClassName: styles.timingCell,
    csvColumns: [
      {
        header: "Timing point",
        value: (row) => (row.stopId ? String(row.timingPoint) : ""),
      },
    ],
  },
  {
    key: "stopName",
    label: "Name",
    modalLabel: "Name",
    sortable: false,
    cellClassName: styles.nameCell,
    csvColumns: [
      {
        header: "Name",
        value: (row) => row.stopInfo?.stopName ?? "",
      },
    ],
  },
  {
    key: "direction",
    label: "Direction",
    modalLabel: "Direction",
    sortable: true,
    cellClassName: styles.directionCell,
    csvColumns: [
      {
        header: "Direction",
        value: (row) => formatDirection(row.direction),
      },
    ],
  },
  {
    key: "scheduledDepartures",
    label: "Scheduled departures",
    modalLabel: "Scheduled departures",
    sortable: true,
    csvColumns: [
      {
        header: "Scheduled departures",
        value: (row) => row.scheduledDepartures ?? 0,
      },
    ],
  },
  {
    key: "actualDepartures",
    label: "Recorded departures",
    modalLabel: "Recorded departures",
    sortable: true,
    csvColumns: [
      {
        header: "Recorded departures",
        value: (row) => row.actualDepartures ?? 0,
      },
      {
        header: "Recorded departures (percentage)",
        value: (row) =>
          formatExportPercentage(getRecordedDeparturesExportRatio(row)),
      },
    ],
  },
  {
    key: "averageScheduled",
    label: "Av. Scheduled Travel Time",
    modalLabel: "Average scheduled",
    sortable: true,
    csvColumns: [
      {
        header: "Av. Scheduled Travel Time (seconds)",
        value: (row) => formatAverageSecondsForExport(row.averageScheduled),
      },
    ],
  },
  {
    key: "averageActual",
    label: "Av. Actual Travel Time",
    modalLabel: "Average actual",
    sortable: true,
    csvColumns: [
      {
        header: "Av. Actual Travel Time (seconds)",
        value: (row) => formatAverageSecondsForExport(row.averageActual),
      },
    ],
  },
  {
    key: "averageDelay",
    label: "Av. delay",
    modalLabel: "Average delay",
    sortable: true,
    csvColumns: [
      {
        header: "Av. delay (seconds)",
        value: (row) => formatAverageSecondsForExport(row.averageDelay),
      },
    ],
  },
  {
    key: "onTimeRatio",
    label: "On time",
    modalLabel: "On time",
    sortable: true,
    csvColumns: buildMetricCsvColumns(
      "On time",
      "onTime",
      "onTimeRatio",
      "onTimeInSeconds",
    ),
  },
  {
    key: "lateRatio",
    label: "Late",
    modalLabel: "Late",
    sortable: true,
    csvColumns: buildMetricCsvColumns(
      "Late",
      "late",
      "lateRatio",
      "lateInSeconds",
    ),
  },
  {
    key: "earlyRatio",
    label: "Early",
    modalLabel: "Early",
    sortable: true,
    csvColumns: buildMetricCsvColumns(
      "Early",
      "early",
      "earlyRatio",
      "earlyInSeconds",
    ),
  },
];

const STOP_NUMERIC_COLUMN_KEYS = new Set<StopsTableColumnKey>([
  "scheduledDepartures",
  "actualDepartures",
  "averageScheduled",
  "averageActual",
  "averageDelay",
  "onTimeRatio",
  "lateRatio",
  "earlyRatio",
]);

const STOP_TABLE_COLUMN_WIDTHS = {
  stopId: "150px",
  timingPoint: "50px",
  stopName: "200px",
  direction: "90px",
  scheduledDepartures: "110px",
  actualDepartures: "100px",
  averageScheduled: "110px",
  averageActual: "110px",
  averageDelay: "90px",
  onTimeRatio: "90px",
  lateRatio: "90px",
  earlyRatio: "80px",
};

// The first eleven columns fit within the laptop table viewport; Early is the
// final overflow column, matching the Angular stop-grid proportions.
const STOP_TABLE_COLUMN_MIN_WIDTHS = {
  stopId: 150,
  timingPoint: 50,
  stopName: 200,
  direction: 90,
  scheduledDepartures: 110,
  actualDepartures: 100,
  averageScheduled: 110,
  averageActual: 110,
  averageDelay: 90,
  onTimeRatio: 90,
  lateRatio: 90,
  earlyRatio: 80,
};

export const STOPS_TABLE_COLUMN_KEYS = STOPS_TABLE_COLUMN_OPTIONS.map(
  (column) => column.key,
);
export const STOPS_TABLE_COLUMN_LABELS: Record<string, ReactNode> =
  Object.fromEntries(
    STOPS_TABLE_COLUMN_OPTIONS.map((column) => [
      column.key,
      column.modalLabel ??
        (typeof column.label === "string" ? column.label : column.key),
    ]),
  );
export const STOPS_TABLE_ALWAYS_VISIBLE_KEYS =
  STOPS_TABLE_COLUMN_OPTIONS.filter((column) => column.alwaysVisible).map(
    (column) => column.key,
  );

const STOPS_EXPORT_COLUMNS = STOPS_TABLE_COLUMN_OPTIONS.flatMap(
  (column) => column.csvColumns,
);

function getRecordedDeparturesRatio(row: StopPerformance): number {
  return (
    row.completedRatio ??
    getRatio(row.actualDepartures, row.scheduledDepartures)
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

  const travelTimes = aggregateAverageTravelTimes(data);

  return {
    ...data[0],
    ...totals,
    direction: null,
    averageScheduled: travelTimes.averageScheduled,
    averageActual: travelTimes.averageActual,
  };
}

function buildCsvExportTotalsRow(
  data: StopPerformance[],
): StopPerformance | null {
  const totals = calculateTotals(data);
  if (!totals) return null;

  return {
    ...totals,
    stopId: "",
    stopInfo: totals.stopInfo
      ? { ...totals.stopInfo, stopName: "Total:" }
      : ({
          stopId: "",
          stopName: "Total:",
        } as StopPerformance["stopInfo"]),
  };
}

function getRowValue(
  row: StopPerformance,
  column: StopsTableColumnKey,
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
    default: {
      const _exhaustive: never = column;
      return _exhaustive;
    }
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
      <span className={styles.timingIcon}>
        <TimingIcon />
        <span className="govuk-visually-hidden">Timing point</span>
      </span>
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
  csvFilename: string;
  visibleColumns?: string[];
}

export const OnTimeStopsTable = ({
  data,
  displayMode = "percentage",
  csvFilename,
  visibleColumns,
}: OnTimeStopsTableProps) => {
  const [displayedRows, setDisplayedRows] = useState<StopPerformance[]>([]);

  const filteredColumns = useMemo(
    () =>
      STOPS_TABLE_COLUMN_OPTIONS.filter((column) =>
        visibleColumns ? visibleColumns.includes(column.key) : true,
      ).map((column) => ({
        key: column.key,
        label: column.label,
        sortable: column.sortable ?? false,
        ariaLabel:
          column.modalLabel ??
          (typeof column.label === "string" ? column.label : column.key),
        alignment: STOP_NUMERIC_COLUMN_KEYS.has(column.key)
          ? ("right" as const)
          : undefined,
        cellClassName: column.cellClassName,
      })),
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
      getRowValue(row, column as StopsTableColumnKey, displayMode),
    [displayMode],
  );
  const renderValue = useCallback(
    (row: StopPerformance) => renderRow(row, displayMode),
    [displayMode],
  );

  const csvHeaders = STOPS_EXPORT_COLUMNS.map((column) => column.header);
  const csvExportTotalsRow = useMemo(
    () => buildCsvExportTotalsRow(data),
    [data],
  );
  const csvRows = useMemo(
    () => buildCsvRows(STOPS_EXPORT_COLUMNS, displayedRows, csvExportTotalsRow),
    [csvExportTotalsRow, displayedRows],
  );

  return (
    <div className={styles.container}>
      <SortedPaginatedTable
        columns={filteredColumns}
        data={data}
        getRowValue={getValue}
        renderRow={renderValue}
        pinnedRows={totalsRow ? [totalsRow] : undefined}
        paginationNoun="stop"
        emptyMessage="No stop performance data available"
        onDisplayedDataChange={setDisplayedRows}
        enablePagination={false}
        colWidths={STOP_TABLE_COLUMN_WIDTHS}
        colMinWidths={STOP_TABLE_COLUMN_MIN_WIDTHS}
        footerAction={
          <CsvExportButton
            filename={csvFilename}
            headers={csvHeaders}
            rows={csvRows}
            buttonText="Export data"
          />
        }
        fontSize="govuk-!-font-size-16"
      />
    </div>
  );
};
