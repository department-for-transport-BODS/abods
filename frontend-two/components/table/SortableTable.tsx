import { clsx } from "clsx";
import styles from "./sortable-table.module.scss";
import React, { ReactNode } from "react";
import { PagingPanel } from "@/components/table/PagingPanel";

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
  footerAction?: ReactNode;
  fontSize?: string;
}

const ascIcon = (
  <span
    aria-hidden="true"
    className={clsx(styles["sortable-table-sort-icon"], styles["sortable-table-sort-icon--asc"])}
  />
);
const descIcon = (
  <span
    aria-hidden="true"
    className={clsx(styles["sortable-table-sort-icon"], styles["sortable-table-sort-icon--desc"])}
  />
);
const unsortedIcon = (
  <span
    aria-hidden="true"
    className={clsx(styles["sortable-table-sort-icon"], styles["sortable-table-sort-icon--none"])}
  />
);

const getAlignmentClassName = (alignment?: "left" | "right" | "center") =>
  alignment ? styles[`sortable-table__align--${alignment}`] : undefined;

const renderHeaderLabel = (label: ReactNode): ReactNode => {
  if (typeof label !== "string") {
    return label;
  }

  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return label;
  }

  return words.map((word, index) => (
    <span
      key={`${word}-${index}`}
      className={styles["sortable-header__label-word"]}
    >
      {word}
    </span>
  ));
};

export const SortableTable = ({
  head,
  rows,
  onSort,
  title,
  pagination,
  paginationAlignment = "right",
  colWidths,
  footerAction,
  fontSize,
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
        className={clsx(
          "govuk-table",
          styles["sortable-table"],
          colWidths && styles["sortable-table--fixed"],
        )}
        style={{ width: "100%" }}
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
                className={clsx(
                  "govuk-table__header",
                  getAlignmentClassName(item.alignment),
                  item.headerClassName,
                )}
                style={
                  colWidths?.[item.key]
                    ? { width: colWidths[item.key] }
                    : undefined
                }
                {...(item?.sortable && { "aria-sort": getAriaSort(item) })}
              >
                <div className={styles["sortable-table__clip"]}>
                  {item.sortable ? (
                    <button
                      type="button"
                      className={clsx(
                        styles["sortable-header"],
                        getAlignmentClassName(item.alignment),
                        item.headerClassName,
                      )}
                      onClick={() => handleSort(item.key)}
                      aria-label={`Sort by ${item.ariaLabel ?? (typeof item.label === "string" ? item.label : item.key)} ${getAriaSort(item)}`}
                      data-testid={`sortable-header-${item.key}`}
                    >
                      <span className={styles["sortable-header__label"]}>
                        {renderHeaderLabel(item.label)}
                      </span>
                      {getSortIcon(item)}
                    </button>
                  ) : (
                    <span className={styles["sortable-header__label"]}>
                      {renderHeaderLabel(item.label)}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {rows.map((row) => (
            <tr
              key={row.key}
              className={clsx("govuk-table__row", row.rowClassName)}
            >
              {head.map((column) => (
                <td
                  key={column.key}
                  className={clsx(
                    "govuk-table__cell",
                    getAlignmentClassName(column.alignment),
                    column.cellClassName,
                    fontSize,
                  )}
                  style={
                    colWidths?.[column.key]
                      ? { width: colWidths[column.key] }
                      : undefined
                  }
                  data-label={
                    typeof column.label === "string"
                      ? column.label
                      : column.ariaLabel ?? column.key
                  }
                >
                  <div className={styles["sortable-table__clip"]}>
                    {row[column.key]}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pagination || footerAction ? (
        <div className={styles["sortable-table__footer-row"]}>
          <div>{footerAction ?? null}</div>
          <div>
            {pagination ? (
              <PagingPanel
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                rowCount={pagination.rowCount}
                noun={pagination.noun ?? "row"}
                alignment={pagination.alignment ?? paginationAlignment}
                onPageChange={pagination.onPageChange}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
};
