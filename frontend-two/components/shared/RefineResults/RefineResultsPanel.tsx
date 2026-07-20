import { useEffect, useId, useRef } from "react";
import {
  RefineResultsAdminAreaOption,
  RefineResultsFilterValues,
} from "./RefineResultsFilters";
import { RefineResultsFilters } from "./RefineResultsFilters";

interface RefineResultsPanelProps {
  isOpen: boolean;
  isLoading: boolean;
  showPerformanceFilters?: boolean;
  showAdminAreaFilter?: boolean;
  adminAreaOptions?: RefineResultsAdminAreaOption[];
  initialValues?: Partial<RefineResultsFilterValues>;
  onApply?: (values: RefineResultsFilterValues) => void;
  onCancel?: () => void;
  onReset?: (values: RefineResultsFilterValues) => void;
}

export const RefineResultsPanel = ({
  isOpen,
  isLoading,
  showPerformanceFilters = true,
  showAdminAreaFilter = false,
  adminAreaOptions,
  initialValues,
  onApply,
  onCancel,
  onReset,
}: RefineResultsPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const getFocusableElements = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    const focusFrame = requestAnimationFrame(() => {
      getFocusableElements()[0]?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="refine-results-panel-drawer">
      <div
        ref={panelRef}
        id="refine-results-panel"
        className="refine-results-panel"
        role="dialog"
        aria-labelledby={titleId}
      >
        <div className="refine-results-panel__header">
          <h2 id={titleId} className="govuk-heading-l">
            Refine results
          </h2>
          <button
            type="button"
            className="refine-results-panel__close button-link govuk-link"
            onClick={onCancel}
          >
            Close
          </button>
        </div>

        <RefineResultsFilters
          isLoading={isLoading}
          showPerformanceFilters={showPerformanceFilters}
          showAdminAreaFilter={showAdminAreaFilter}
          adminAreaOptions={adminAreaOptions}
          initialValues={initialValues}
          onApply={onApply}
          onCancel={onCancel}
          onReset={onReset}
        />
      </div>
    </div>
  );
};
