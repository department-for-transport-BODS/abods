import dynamic from "next/dynamic";
import { ReactNode } from "react";
import { PagingPanel } from "@/components/shared/PagingPanel";

const KainosSortableTable = dynamic(
  () => import("kainossoftwareltd-govuk-react-kainos").then((mod) => mod.SortableTable),
  { ssr: false },
);

export type SortOrder = "asc" | "desc" | "none";

export interface SortableTableHeadCell {
  key: string;
  label: string;
  sortable: boolean;
  sortOrder?: SortOrder;
}

export interface SortableTableRow {
  key: string;
  [key: string]: ReactNode;
}

export interface SortableTablePagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  rowCount: number;
  noun?: string;
  onPageChange: (page: number) => void;
}

export interface SortableTableProps {
  head: SortableTableHeadCell[];
  rows: SortableTableRow[];
  onSort: (column: string, order: SortOrder) => void;
  title?: ReactNode;
  pagination?: SortableTablePagination;
}

export const SortableTable = ({
  head,
  rows,
  onSort,
  title,
  pagination,
}: SortableTableProps) => (
  <>
    {title ? <h2 className="govuk-heading-m">{title}</h2> : null}
    <KainosSortableTable head={head as any} rows={rows as any[]} onSort={onSort} />
    {pagination ? (
      <div className="flex justify-end">
        <div className="w-1/2">
          <PagingPanel
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            rowCount={pagination.rowCount}
            noun={pagination.noun ?? "row"}
            onPageChange={pagination.onPageChange}
          />
        </div>
      </div>
    ) : null}
  </>
);
