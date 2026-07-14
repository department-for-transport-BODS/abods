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
  label: ReactNode;
  sortable?: boolean;
  ariaLabel?: string;
  alignment?: "left" | "right" | "center";
  cellClassName?: string;
  headerClassName?: string;
}

export interface SortedPaginatedTableProps<T> {
  columns: SortedPaginatedTableColumn[];
  data: T[];
  getRowValue: (row: T, column: string) => string | number;
  renderRow: (row: T) => SortableTableRow;
  enablePagination?: boolean;
  onDisplayedDataChange?: (rows: T[]) => void;
  onPageDataChange?: (rows: T[]) => void;
  footerAction?: ReactNode;
  title?: ReactNode;
  pageSize?: number;
  pinnedRows?: SortableTableRow[];
  emptyMessage?: string;
  initialSortKey?: string | null;
  initialSortOrder?: SortOrder;
  paginationResetKey?: string | number | boolean;
  paginationNoun?: string;
  paginationAlignment?: "left" | "right";
  onSortChange?: (key: string | null, order: SortOrder) => void;
  colWidths?: Partial<Record<string, string>>;
}

export const SortedPaginatedTable = <T,>({
  columns,
  data,
  getRowValue,
  renderRow,
  enablePagination = true,
  onDisplayedDataChange,
  onPageDataChange,
  footerAction,
  title,
  pageSize = DEFAULT_PAGE_SIZE,
  pinnedRows,
  emptyMessage,
  initialSortKey = null,
  initialSortOrder = "none",
  paginationResetKey,
  paginationNoun = "row",
  paginationAlignment = "right",
  onSortChange,
  colWidths,
}: SortedPaginatedTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  useEffect(() => {
    setCurrentPage(0);
  }, [data, paginationResetKey]);

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
    onSortChange?.(column, order);
  };

  const totalPages = enablePagination
    ? Math.ceil(sortedData.length / pageSize)
    : 1;
  const pageData = useMemo(
    () =>
      enablePagination
        ? sortedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
        : sortedData,
    [sortedData, currentPage, pageSize, enablePagination],
  );

  useEffect(() => {
    onDisplayedDataChange?.(sortedData);
  }, [onDisplayedDataChange, sortedData]);

  useEffect(() => {
    onPageDataChange?.(pageData);
  }, [onPageDataChange, pageData]);

  const head = columns.map((col) => ({
    key: col.key,
    label: col.label,
    sortable: col.sortable ?? false,
    sortOrder: sortKey === col.key ? sortOrder : undefined,
    ariaLabel: col.ariaLabel,
    alignment: col.alignment,
    cellClassName: col.cellClassName,
    headerClassName: col.headerClassName,
  }));

  const rows: SortableTableRow[] = [
    ...(pinnedRows ?? []),
    ...pageData.map(renderRow),
  ];

  const pagination =
    enablePagination
      ? {
          currentPage,
          totalPages,
          pageSize,
          rowCount: sortedData.length,
          onPageChange: setCurrentPage,
          noun: paginationNoun ?? "row",
          alignment: paginationAlignment,
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
        paginationAlignment={paginationAlignment}
        colWidths={colWidths}
        footerAction={footerAction}
      />
      {emptyMessage && data.length === 0 && (
        <div className="govuk-body govuk-!-margin-top-4 govuk-!-margin-bottom-4 text-center">
          {emptyMessage}
        </div>
      )}
    </>
  );
};
