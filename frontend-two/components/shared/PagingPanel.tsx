const MINIMUM_PAGES = 8;
const STICKY_THRESHOLD = 4;
const PAGES_STICKY = 5;
const PAGES_MIDDLE = 3;

interface PagingPanelProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  rowCount: number;
  noun?: string;
  onPageChange: (page: number) => void;
}

function getPageNumbers(current: number, total: number) {
  const stickToStart = total <= MINIMUM_PAGES || current < STICKY_THRESHOLD;
  const stickToEnd =
    total <= MINIMUM_PAGES || total - current - 1 < STICKY_THRESHOLD;

  const offset = stickToStart
    ? 0
    : stickToEnd
      ? total - STICKY_THRESHOLD - 1
      : current - Math.floor(PAGES_MIDDLE / 2);

  const numPages =
    total <= MINIMUM_PAGES
      ? total
      : Math.min(
          total,
          stickToStart || stickToEnd ? PAGES_STICKY : PAGES_MIDDLE,
        );

  const pages = Array(numPages)
    .fill(0)
    .map((_, i) => i + offset);

  return { pages, stickToStart, stickToEnd };
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
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;
  const pluralNoun = `${noun}${rowCount > 1 ? "s" : ""}`;

  const { pages, stickToStart, stickToEnd } = getPageNumbers(
    currentPage,
    totalPages,
  );

  return (
    <div className="paging-panel flex justify-end">
      <div className="w-full flex items-center justify-between">
        <span className="govuk-body paging-panel__count">
          Showing {firstRow} - {lastRow} of {rowCount} {pluralNoun}
        </span>
        <div className="govuk-body paging-panel__controls">
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            {!isFirstPage && (
              <button
                className="button-link paging-panel__prev"
                aria-label="Previous page"
                onClick={() => onPageChange(currentPage - 1)}
              >
                « Prev
              </button>
            )}
            {!stickToStart && (
              <>
                <button
                  className="button-link paging-panel__button"
                  onClick={() => onPageChange(0)}
                >
                  1
                </button>
                <span className="paging-panel__ellipsis">&hellip;</span>
              </>
            )}
            {pages.map((page) =>
              page === currentPage ? (
                <span key={page} className="paging-panel__current">
                  {page + 1}
                </span>
              ) : (
                <button
                  key={page}
                  className="button-link paging-panel__button"
                  onClick={() => onPageChange(page)}
                >
                  {page + 1}
                </button>
              ),
            )}
            {!stickToEnd && (
              <>
                <span className="paging-panel__ellipsis">&hellip;</span>
                <button
                  className="button-link paging-panel__button"
                  onClick={() => onPageChange(totalPages - 1)}
                >
                  {totalPages}
                </button>
              </>
            )}
            {!isLastPage && (
              <button
                className="button-link paging-panel__next"
                aria-label="Next page"
                onClick={() => onPageChange(currentPage + 1)}
              >
                Next »
              </button>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
