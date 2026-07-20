import { useCallback, useState } from "react";
import { RefineResultsPanel } from "@/components/shared/RefineResults/RefineResultsPanel";
import {
  RefineResultsAdminAreaOption,
  RefineResultsFilterValues,
} from "@/components/shared/RefineResults/RefineResultsFilters";
import RefineIcon from "@/assets/icons/refine.svg";

interface RefineResultsButtonProps {
  isLoading: boolean;
  showPerformanceFilters?: boolean;
  showAdminAreaFilter?: boolean;
  adminAreaOptions?: RefineResultsAdminAreaOption[];
  initialValues: Partial<RefineResultsFilterValues>;
  onApply: (values: RefineResultsFilterValues) => void;
  onReset: () => void;
  buttonClassName?: string;
}

export const RefineResultsButton = ({
  isLoading,
  showPerformanceFilters = true,
  showAdminAreaFilter = false,
  adminAreaOptions,
  initialValues,
  onApply,
  onReset,
  buttonClassName,
}: RefineResultsButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const closePanel = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <button
        type="button"
        className={[
          "on-time-refine-results-button",
          buttonClassName ?? "button-link govuk-link",
        ].join(" ")}
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="refine-results-panel"
      >
        <RefineIcon
          className="on-time-refine-results-button__icon"
          aria-hidden="true"
          focusable="false"
          style={{ flexShrink: 0 }}
        />
        <span className="govuk-link--no-visited-state">Refine results</span>
      </button>
      <RefineResultsPanel
        isOpen={isOpen}
        isLoading={isLoading}
        showPerformanceFilters={showPerformanceFilters}
        showAdminAreaFilter={showAdminAreaFilter}
        adminAreaOptions={adminAreaOptions}
        initialValues={initialValues}
        onApply={onApply}
        onReset={onReset}
        onCancel={closePanel}
      />
    </>
  );
};
