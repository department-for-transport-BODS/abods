import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  SortableTable,
  type SortableTableRow,
  type SortOrder,
} from "./SortableTable";

const DEFAULT_PAGE_SIZE = 10;

export interface SortedPaginatedTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

export interface SortedPaginatedTableProps<T> {
  columns: SortedPaginatedTableColumn[];
  data: T[];
  getRowValue: (row: T, column: string) => string | number;
  renderRow: (row: T) => SortableTableRow;
  title?: ReactNode;
  pageSize?: number;
  pinnedRows?: SortableTableRow[];
  emptyMessage?: string;
  initialSortKey?: string | null;
  initialSortOrder?: SortOrder;
}

export const SortedPaginatedTable = <T,>({
  columns,
  data,
  getRowValue,
  renderRow,
  title,
  pageSize = DEFAULT_PAGE_SIZE,
  pinnedRows,
  emptyMessage,
  initialSortKey = null,
  initialSortOrder = "none",
}: SortedPaginatedTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  useEffect(() => {
    setCurrentPage(0);
  }, [data]);

  const sortedData = useMemo(() => {
    if (!sortKey || sortOrder === "none") return data;
    return [...data].sort((a, b) => {
      const aVal = getRowValue(a, sortKey);
      const bVal = getRowValue(b, sortKey);
      const cmp =
        typeof aVal === "string" && typeof bVal === "string"
          ? aVal.localeCompare(bVal, undefined, {
              numeric: true,
              sensitivity: "base",
            })
          : aVal < bVal
            ? -1
            : aVal > bVal
              ? 1
              : 0;
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [data, getRowValue, sortKey, sortOrder]);

  const handleSort = (column: string, order: SortOrder) => {
    setSortKey(column);
    setSortOrder(order);
    setCurrentPage(0);
  };

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const pageData = sortedData.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  const head = columns.map((col) => ({
    key: col.key,
    label: col.label,
    sortable: col.sortable ?? false,
    sortOrder: sortKey === col.key ? sortOrder : undefined,
  }));

  const rows: SortableTableRow[] = [
    ...(pinnedRows ?? []),
    ...pageData.map(renderRow),
  ];

  const pagination =
    totalPages > 1
      ? {
          currentPage,
          totalPages,
          pageSize,
          rowCount: sortedData.length,
          onPageChange: setCurrentPage,
        }
      : undefined;

  return (
    <>
      <SortableTable
        head={head}
        rows={rows}
        onSort={handleSort}
        title={title}
        pagination={pagination}
      />
      {emptyMessage && data.length === 0 && (
        <div className="govuk-body govuk-!-margin-top-4 govuk-!-margin-bottom-4 text-center">
          {emptyMessage}
        </div>
      )}
    </>
  );
};
