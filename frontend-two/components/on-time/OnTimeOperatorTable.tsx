import Link from "next/link";
import { Duration } from "luxon";
import { SortedPaginatedTable } from "@/components/table/SortedPaginatedTable";
import type { SortableTableRow } from "@/components/table/SortableTable";
import type { OperatorPerformance } from "@/services/on-time/on-time.service";

const columns = [
  { key: "nocCode", label: "NOC", sortable: false },
  { key: "name", label: "Operator", sortable: false },
  { key: "averageDelay", label: "Av. delay", sortable: true },
  { key: "onTimeRatio", label: "On-time %", sortable: true },
  { key: "lateRatio", label: "Late %", sortable: true },
  { key: "earlyRatio", label: "Early %", sortable: true },
  { key: "sparkline", label: "", sortable: false },
];

function formatDelay(delay: number | null | undefined): string {
  if (delay == null) return "-";
  const roundedDelay = Math.round(delay);
  return (
    (roundedDelay >= 0 ? "+" : "-") +
    Duration.fromObject({ seconds: Math.abs(roundedDelay) }).toFormat("mm:ss")
  );
}

function getRowValue(row: OperatorPerformance, column: string): string | number {
  switch (column) {
    case "nocCode":
      return row.nocCode ?? "";
    case "name":
      return row.name ?? "";
    case "averageDelay":
      return row.averageDelay ?? 0;
    case "onTimeRatio":
      return row.onTimeRatio ?? -1;
    case "lateRatio":
      return row.lateRatio ?? -1;
    case "earlyRatio":
      return row.earlyRatio ?? -1;
    default:
      return "";
  }
}

function renderRow(row: OperatorPerformance): SortableTableRow {
  return {
    key: row.nocCode ?? row.name ?? "",
    nocCode: row.nocCode ?? "-",
    name: row.nocCode ? (
      <Link href={`/on-time/${encodeURIComponent(row.nocCode)}`} className="govuk-link govuk-!-font-weight-bold">
        {row.name}
      </Link>
    ) : (
      row.name ?? "-"
    ),
    averageDelay: formatDelay(row.averageDelay),
    onTimeRatio:
      row.onTimeRatio != null ? `${(row.onTimeRatio * 100).toFixed(1)}%` : "-",
    lateRatio:
      row.lateRatio != null ? `${(row.lateRatio * 100).toFixed(1)}%` : "-",
    earlyRatio:
      row.earlyRatio != null ? `${(row.earlyRatio * 100).toFixed(1)}%` : "-",
  };
}

interface OnTimeOperatorTableProps {
  data: OperatorPerformance[];
}

export const OnTimeOperatorTable = ({ data }: OnTimeOperatorTableProps) => {
  const sortedData = [...data]
    .filter((op): op is OperatorPerformance & { nocCode: string } => Boolean(op.nocCode))
    .sort((a, b) => {
      const aName = (a.name ?? "").toLocaleLowerCase();
      const bName = (b.name ?? "").toLocaleLowerCase();
      return aName.localeCompare(bName);
    });

  return (
    <SortedPaginatedTable
      columns={columns}
      data={sortedData}
      getRowValue={getRowValue}
      renderRow={renderRow}
      initialSortKey="name"
      initialSortOrder="asc"
      paginationNoun="operator"
    />
  );
};