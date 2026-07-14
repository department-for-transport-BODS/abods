interface PagingPanelProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  rowCount: number;
  noun?: string;
  alignment?: "left" | "right";
  onPageChange: (page: number) => void;
}

const MINIMUM_PAGES = 8;
const STICKY_THRESHOLD = 4;
const PAGES_STICKY = 5;
const PAGES_MIDDLE = 3;

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "...")[] {
  // currentPage is 1-based
  if (totalPages <= MINIMUM_PAGES) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const current0 = currentPage - 1;
  const stickToStart = current0 < STICKY_THRESHOLD;
  const stickToEnd = totalPages - current0 - 1 < STICKY_THRESHOLD;

  const numPages = stickToStart || stickToEnd ? PAGES_STICKY : PAGES_MIDDLE;
  const offset = stickToStart
    ? 0
    : stickToEnd
      ? totalPages - STICKY_THRESHOLD - 1
      : current0 - Math.floor(PAGES_MIDDLE / 2);

  const windowPages = Array.from(
    { length: numPages },
    (_, i) => offset + i + 1,
  );

  const result: (number | "...")[] = [];
  if (!stickToStart) {
    result.push(1);
    result.push("...");
  }
  result.push(...windowPages);
  if (!stickToEnd) {
    result.push("...");
    result.push(totalPages);
  }
  return result;
}

export const PagingPanel = ({
  currentPage,
  totalPages,
  pageSize,
  rowCount,
  noun = "row",
  alignment = "right",
  onPageChange,
}: PagingPanelProps) => {
  if (totalPages === 0 || rowCount === 0) return null;

  const firstRow = pageSize * currentPage + 1;
  const lastRow = Math.min(firstRow + pageSize - 1, rowCount);
  const pluralNoun = `${noun}${rowCount > 1 ? "s" : ""}`;
  const pages = getPageNumbers(currentPage + 1, totalPages);

  return (
    <div
      className={`paging-panel flex w-full items-baseline gap-6 ${alignment === "left" ? "justify-start" : "justify-end"}`}
    >
      <span className="govuk-body govuk-!-margin-bottom-0">
        Showing {firstRow} - {lastRow} of {rowCount} {pluralNoun}
      </span>
      {totalPages > 1 && (
        <nav className="flex items-baseline gap-[10px] govuk-body govuk-!-margin-bottom-0">
          {currentPage > 0 && (
            <a
              href="#"
              className="govuk-link govuk-!-margin-bottom-0"
              style={{ textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                onPageChange(currentPage - 1);
              }}
            >
              « Prev
            </a>
          )}
          {pages.map((page, i) =>
            page === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="govuk-body govuk-!-margin-bottom-0"
              >
                ...
              </span>
            ) : page === currentPage + 1 ? (
              <strong key={page} className="govuk-body govuk-!-margin-bottom-0">
                {page}
              </strong>
            ) : (
              <a
                key={page}
                href="#"
                className="govuk-link govuk-!-margin-bottom-0"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(page - 1);
                }}
              >
                {page}
              </a>
            ),
          )}
          {currentPage < totalPages - 1 && (
            <a
              href="#"
              className="govuk-link govuk-!-margin-bottom-0"
              style={{ textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                onPageChange(currentPage + 1);
              }}

            >
              Next »
            </a>
          )}
        </nav>
      )}
    </div>
  );
};
