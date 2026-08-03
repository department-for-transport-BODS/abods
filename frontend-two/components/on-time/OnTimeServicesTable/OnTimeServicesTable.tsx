import styles from "./on-time-services-table.module.scss";

import Link from "next/link";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { CsvExportButton } from "@/components/shared/CsvExportButton";
import { SortedPaginatedTable } from "@/components/table/SortedPaginatedTable";
import type { SortableTableRow } from "@/components/table/SortableTable";
import { Tooltip } from "@/components/shared/Tooltip";
import { FrequentServicePerformance } from "@/services/on-time/performance.service";
import { FrequentIcon } from "../../icons/FrequentIcon/FrequentIcon";
import {
  buildCsvRows,
  buildMetricCsvColumns,
  type CsvExportColumn,
} from "@/utils/on-time-csv-export";
import {
  type OnTimeDisplayMode,
  formatDuration,
  formatDirection,
  formatMetricValue,
  getMetricSortValue,
  aggregatePerformanceTotals,
  formatExportPercentage,
  formatAverageSecondsForExport,
  getRecordedDeparturesExportRatio,
} from "@/utils/on-time/on-time-table-format";
import { formatPercentage, getRatio } from "@/utils/maths";

type ServiceTableColumnKey =
  | "frequent"
  | "service"
  | "direction"
  | "scheduledDepartures"
  | "recordedDepartures"
  | "averageDelay"
  | "onTime"
  | "late"
  | "early";

interface ServiceTableColumnDefinition {
  key: ServiceTableColumnKey;
  label: ReactNode;
  modalLabel?: string;
  alwaysVisible?: boolean;
  sortable?: boolean;
  csvColumns: CsvExportColumn<FrequentServicePerformance>[];
}

const ALL_COLUMNS: ServiceTableColumnDefinition[] = [
  {
    key: "frequent",
    label: (
      <Tooltip as="span" message="Service has periods of frequent running.">
        <FrequentIcon />
        <span className="govuk-visually-hidden">Frequent service</span>
      </Tooltip>
    ),
    modalLabel: "Frequent service",
    sortable: true,
    csvColumns: [
      {
        header: "Frequent service",
        value: (row) => (row.frequent ? "TRUE" : ""),
      },
    ],
  },
  {
    key: "service",
    label: "Service",
    modalLabel: "Service",
    alwaysVisible: true,
    sortable: false,
    csvColumns: [
      {
        header: "Service",
        value: (row) =>
          `${row.lineInfo?.serviceNumber ?? ""}: ${row.lineInfo?.serviceName ?? ""}`.trim(),
      },
    ],
  },
  {
    key: "direction",
    label: "Direction",
    modalLabel: "Direction",
    sortable: true,
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
    key: "recordedDepartures",
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
    key: "onTime",
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
    key: "late",
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
    key: "early",
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

const SERVICE_TABLE_COLUMN_WIDTHS = {
  frequent: "4%",
  service: "40%",
  direction: "9%",
  scheduledDepartures: "12%",
  recordedDepartures: "10%",
  averageDelay: "7%",
  onTime: "6%",
  late: "6%",
  early: "6%",
};

export const SERVICE_TABLE_COLUMN_KEYS = ALL_COLUMNS.map(
  (column) => column.key,
);
export const SERVICE_TABLE_COLUMN_LABELS: Record<string, ReactNode> =
  Object.fromEntries(
    ALL_COLUMNS.map((column) => [
      column.key,
      column.modalLabel ??
        (typeof column.label === "string" ? column.label : column.key),
    ]),
  );
export const SERVICE_TABLE_ALWAYS_VISIBLE_KEYS = ALL_COLUMNS.filter(
  (column) => column.alwaysVisible,
).map((column) => column.key);

const SERVICE_EXPORT_COLUMNS = ALL_COLUMNS.flatMap(
  (column) => column.csvColumns,
);

function buildCsvExportTotalsRow(
  data: FrequentServicePerformance[],
): FrequentServicePerformance | null {
  const totals = aggregatePerformanceTotals(data);
  if (!totals || data.length === 0) return null;

  return {
    ...data[0],
    ...totals,
    frequent: false,
    lineInfo: {
      ...data[0].lineInfo,
      serviceNumber: "Total",
      serviceName: "",
    },
    direction: null,
  };
}

function getRowValue(
  row: FrequentServicePerformance,
  column: ServiceTableColumnKey,
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
            getRatio(row.actualDepartures, row.scheduledDepartures)
        : row.actualDepartures ?? 0;
    case "averageDelay":
      return row.averageDelay ?? 0;
    case "onTime":
      return getMetricSortValue(row, "onTime", displayMode);
    case "late":
      return getMetricSortValue(row, "late", displayMode);
    case "early":
      return getMetricSortValue(row, "early", displayMode);
    default: {
      const _exhaustive: never = column;
      return _exhaustive;
    }
  }
}

function createRenderRow(nocCode: string, displayMode: OnTimeDisplayMode) {
  return (row: FrequentServicePerformance): SortableTableRow => {
    const completedRatio =
      row.completedRatio ??
      getRatio(row.actualDepartures, row.scheduledDepartures);

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
          style={{ textDecoration: "none" }}
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
  csvFilename: string;
  visibleColumns?: string[];
}

export const OnTimeServicesTable = ({
  data,
  nocCode,
  displayMode,
  csvFilename,
  visibleColumns,
}: OnTimeServicesTableProps) => {
  const [displayedRows, setDisplayedRows] = useState<
    FrequentServicePerformance[]
  >([]);

  const filteredColumns = useMemo(
    () =>
      ALL_COLUMNS.filter((column) =>
        visibleColumns ? visibleColumns.includes(column.key) : true,
      ).map((column) => ({
        key: column.key,
        label: column.label,
        sortable: column.sortable ?? false,
        ariaLabel:
          column.modalLabel ??
          (typeof column.label === "string" ? column.label : column.key),
      })),
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
      getRowValue(row, column as ServiceTableColumnKey, displayMode),
    [displayMode],
  );

  const csvHeaders = SERVICE_EXPORT_COLUMNS.map((column) => column.header);
  const csvExportTotalsRow = useMemo(
    () => buildCsvExportTotalsRow(data),
    [data],
  );
  const csvRows = useMemo(
    () =>
      buildCsvRows(SERVICE_EXPORT_COLUMNS, displayedRows, csvExportTotalsRow),
    [csvExportTotalsRow, displayedRows],
  );

  return (
    <div className={styles.container}>
      <SortedPaginatedTable
        columns={filteredColumns}
        data={data}
        getRowValue={getValue}
        renderRow={renderRow}
        pinnedRows={totalsRow ? [totalsRow] : undefined}
        initialSortKey="service"
        initialSortOrder="asc"
        paginationNoun="service"
        emptyMessage="No service data found"
        onDisplayedDataChange={setDisplayedRows}
        colWidths={SERVICE_TABLE_COLUMN_WIDTHS}
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
