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

  const firstRow = pageSize * (currentPage - 1) + 1;
  const lastRow = Math.min(firstRow + pageSize - 1, rowCount);
  const pluralNoun = `${noun}${rowCount > 1 ? "s" : ""}`;

  return (
    <div className="flex justify-end">
      <div className="w-full flex items-center justify-between gap-8">
        <span className="govuk-body">
          Showing {firstRow} - {lastRow} of {rowCount} {pluralNoun}
        </span>
        {totalPages > 1 && (
          <MemoryRouter>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              pathFunc={() => "#"}
            />
          </MemoryRouter>
        )}
      </div>
    </div>
  );
};