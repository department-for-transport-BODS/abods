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
  { key: "averageDelay", label: "Average delay", sortable: true },
  { key: "onTime", label: "On time", sortable: true },
  { key: "late", label: "Late", sortable: true },
  { key: "early", label: "Early", sortable: true },
];

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
  averageDelay: "Average delay",
  onTime: "On time",
  late: "Late",
  early: "Early",
};

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
    <div>
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
