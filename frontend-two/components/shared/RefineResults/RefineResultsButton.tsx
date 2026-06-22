import { useState } from "react";
import { RefineResultsPanel } from "@/components/shared/RefineResults/RefineResultsPanel";
import { RefineResultsFilterValues } from "@/components/shared/RefineResults/RefineResultsFilters";
import RefineIcon from "@/assets/icons/refine.svg";

interface RefineResultsButtonProps {
  isLoading: boolean;
  showPerformanceFilters?: boolean;
  initialValues: Partial<RefineResultsFilterValues>;
  onApply: (values: RefineResultsFilterValues) => void;
  onReset: () => void;
  buttonClassName?: string;
}

export const RefineResultsButton = ({
  isLoading,
  showPerformanceFilters = true,
  initialValues,
  onApply,
  onReset,
  buttonClassName,
}: RefineResultsButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={
          buttonClassName ?? "on-time-refine-results-button govuk-link"
        }
        onClick={() => setIsOpen(true)}
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
        initialValues={initialValues}
        onApply={(values) => {
          onApply(values);
          setIsOpen(false);
        }}
        onReset={onReset}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
};
