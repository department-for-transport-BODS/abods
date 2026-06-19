import dynamic from "next/dynamic";
import { MemoryRouter } from "react-router-dom";

const Pagination = dynamic(
  () =>
    import("kainossoftwareltd-govuk-react-kainos").then(
      (mod) => mod.Pagination,
    ),
  { ssr: false },
);

interface PagingPanelProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  rowCount: number;
  noun?: string;
  onPageChange: (page: number) => void;
}

export const PagingPanel = ({
  currentPage,
  totalPages,
  pageSize,
  rowCount,
  noun = "row",
  onPageChange,
}: PagingPanelProps) => {
  if (totalPages === 0 || rowCount === 0) return null;

  const firstRow = pageSize * currentPage + 1;
  const lastRow = Math.min(firstRow + pageSize - 1, rowCount);
  const pluralNoun = `${noun}${rowCount > 1 ? "s" : ""}`;
  const paginationCurrentPage = currentPage + 1;

  return (
    <div className="flex justify-end">
      <div className="w-full flex items-center justify-between gap-8">
        <span className="govuk-body">
          Showing {firstRow} - {lastRow} of {rowCount} {pluralNoun}
        </span>
        {totalPages > 1 && (
          <MemoryRouter>
            <Pagination
              currentPage={paginationCurrentPage}
              totalPages={totalPages}
              onPageChange={(page) => onPageChange(Math.max(0, page - 1))}
              pathFunc={() => "#"}
            />
          </MemoryRouter>
        )}
      </div>
    </div>
  );
};
