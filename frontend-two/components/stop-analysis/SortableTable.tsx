import { useEffect, useState } from "react";

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
  NONE = "none",
}

export interface SortableTableHeadCell<RowType> {
  key: string;
  label: string;
  sortable: boolean;
  sortOrder?: SortOrder;
  render?: (row: RowType) => React.ReactNode;
}

export interface SortableTableRow {
  key: string;
  [key: string]: string | number;
}

export interface SortableTableProps<RowType extends SortableTableRow> {
  head: Array<SortableTableHeadCell<RowType>>;
  rows: RowType[];
  onSort?: (key: string, order: SortOrder) => void;
}

const SortableTable = <RowType extends SortableTableRow,>({
  head,
  rows,
  onSort,
}: SortableTableProps<RowType>): React.JSX.Element => {
  const [sortState, setSortState] = useState<{ key: string; order: SortOrder } | null>(null);

  const ascIcon = (
    <svg
      width="22"
      height="22"
      focusable="false"
      aria-hidden="true"
      role="img"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6.5625 15.5L11 6.63125L15.4375 15.5H6.5625Z" fill="currentColor" />
    </svg>
  );

  const descIcon = (
    <svg
      width="22"
      height="22"
      focusable="false"
      aria-hidden="true"
      role="img"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15.4375 7L11 15.8687L6.5625 7L15.4375 7Z" fill="currentColor" />
    </svg>
  );

  const unsortedIcon = (
    <svg
      width="22"
      height="22"
      focusable="false"
      aria-hidden="true"
      role="img"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8.1875 9.5L10.9609 3.95703L13.7344 9.5H8.1875Z" fill="currentColor" />
      <path d="M13.7344 12.0781L10.9609 17.6211L8.1875 12.0781H13.7344Z" fill="currentColor" />
    </svg>
  );

  const handleSort = (key: string) => {
    setSortState((prevState) => {
      const newOrder = !prevState || prevState.key !== key || prevState.order === SortOrder.DESC
        ? SortOrder.ASC
        : SortOrder.DESC;

      onSort?.(key, newOrder);

      return { key, order: newOrder };
    });
  };

  const getSortIcon = (key: string): React.ReactNode => {
    if (!sortState || sortState.key !== key) {
      return unsortedIcon;
    }
    return sortState.order === SortOrder.ASC ? ascIcon : descIcon;
  };

  const getAriaSort = (key: string): 'none' | 'ascending' | 'descending' => {
    if (!sortState || sortState.key !== key) {
      return 'none';
    }
    return sortState.order === SortOrder.ASC ? 'ascending' : 'descending';
  };

  useEffect(() => {
    const initialSortColumn = head.find((column) => column.sortable && column.sortOrder);
    if (initialSortColumn) {
      setSortState({ key: initialSortColumn.key, order: initialSortColumn.sortOrder! });
    }
  }, [head]);

  return (
    <table className="govuk-table kns-table">
      <thead className="govuk-table__head">
        <tr className="govuk-table__row">
          {head.map((item) => (
            <th
              key={item.label}
              className="govuk-table__header"
              {...(item?.sortable && {
                'aria-sort': getAriaSort(item.key),
              })}
            >
              {item.sortable ? (
                <button
                  type="button"
                  className="sortable-header"
                  onClick={() => handleSort(item.key)}
                  aria-label={`Sort by ${item.label} ${getAriaSort(item.key)}`}
                  data-testid={`sortable-header-${item.label}`}
                >
                  {item.label}
                  {getSortIcon(item.key)}
                </button>
              ) : (
                item.label
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="govuk-table__body">
        {rows.map((row) => (
          <tr key={row.key} className="govuk-table__row">
            {head.map((column) => (
              <td key={column.key} className="govuk-table__cell" data-label={column.label}>
                {column.render ? column.render(row) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SortableTable;