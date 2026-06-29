import React, { ReactNode } from "react";
import { PagingPanel } from "@/components/shared/PagingPanel";

export type SortOrder = "asc" | "desc" | "none";

export interface SortableTableHeadCell {
  key: string;
  label: ReactNode;
  sortable: boolean;
  sortOrder?: SortOrder;
  ariaLabel?: string;
  alignment?: "left" | "right" | "center";
  cellClassName?: string;
  headerClassName?: string;
}

export interface SortableTableRow {
  key: string;
  [key: string]: ReactNode;
  rowClassName?: string;
}

export interface SortableTablePagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  rowCount: number;
  noun?: string;
  alignment?: "left" | "right";
  onPageChange: (page: number) => void;
}

export interface SortableTableProps {
  head: SortableTableHeadCell[];
  rows: SortableTableRow[];
  onSort: (column: string, order: SortOrder) => void;
  title?: ReactNode;
  pagination?: SortableTablePagination;
  paginationAlignment?: "left" | "right";
  colWidths?: Partial<Record<string, string>>;
}

const ascIcon = (
  <span
    aria-hidden="true"
    className="sortable-table-sort-icon sortable-table-sort-icon--asc"
  />
);
const descIcon = (
  <span
    aria-hidden="true"
    className="sortable-table-sort-icon sortable-table-sort-icon--desc"
  />
);
const unsortedIcon = (
  <span
    aria-hidden="true"
    className="sortable-table-sort-icon sortable-table-sort-icon--none"
  />
);

const getAlignmentClassName = (alignment?: "left" | "right" | "center") =>
  alignment ? `sortable-table__align--${alignment}` : "";

export const SortableTable = ({
  head,
  rows,
  onSort,
  title,
  pagination,
  paginationAlignment = "right",
  colWidths,
}: SortableTableProps): React.JSX.Element => {
  const handleSort = (key: string) => {
    const current = head.find((c) => c.key === key)?.sortOrder ?? "none";
    const newOrder: SortOrder =
      current === "none" ? "asc" : current === "asc" ? "desc" : "none";
    onSort(key, newOrder);
  };

  const getSortIcon = (cell: SortableTableHeadCell): React.ReactNode => {
    if (!cell.sortOrder || cell.sortOrder === "none") return unsortedIcon;
    return cell.sortOrder === "asc" ? ascIcon : descIcon;
  };

  const getAriaSort = (
    cell: SortableTableHeadCell,
  ): "none" | "ascending" | "descending" => {
    if (!cell.sortOrder || cell.sortOrder === "none") return "none";
    return cell.sortOrder === "asc" ? "ascending" : "descending";
  };

  return (
    <>
      {title ? <h2 className="govuk-heading-m">{title}</h2> : null}
      <table
        className="govuk-table sortable-table"
        style={{ tableLayout: colWidths ? "fixed" : undefined, width: "100%" }}
      >
        {colWidths && (
          <colgroup>
            {head.map((col) => (
              <col
                key={col.key}
                style={
                  colWidths[col.key] ? { width: colWidths[col.key] } : undefined
                }
              />
            ))}
          </colgroup>
        )}
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            {head.map((item) => (
              <th
                key={item.key}
                className={`govuk-table__header ${getAlignmentClassName(item.alignment)} ${item.headerClassName ?? ""}`.trim()}
                {...(item?.sortable && { "aria-sort": getAriaSort(item) })}
              >
                {item.sortable ? (
                  <button
                    type="button"
                    className={`sortable-header ${getAlignmentClassName(item.alignment)} ${item.headerClassName ?? ""}`.trim()}
                    onClick={() => handleSort(item.key)}
                    aria-label={`Sort by ${item.ariaLabel ?? (typeof item.label === "string" ? item.label : item.key)} ${getAriaSort(item)}`}
                    data-testid={`sortable-header-${item.key}`}
                  >
                    <span className="sortable-header__label">{item.label}</span>
                    {getSortIcon(item)}
                  </button>
                ) : (
                  <span className="sortable-header__label">{item.label}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {rows.map((row) => (
            <tr
              key={row.key}
              className={`govuk-table__row ${row.rowClassName ?? ""}`.trim()}
            >
              {head.map((column) => (
                <td
                  key={column.key}
                  className={`govuk-table__cell ${getAlignmentClassName(column.alignment)} ${column.cellClassName ?? ""}`.trim()}
                  data-label={typeof column.label === "string" ? column.label : (column.ariaLabel ?? column.key)}
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pagination ? (
        <div>
          <PagingPanel
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            rowCount={pagination.rowCount}
            noun={pagination.noun ?? "row"}
            alignment={pagination.alignment ?? paginationAlignment}
            onPageChange={pagination.onPageChange}
          />
        </div>
      ) : null}
    </>
  );
};
