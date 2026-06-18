import { RefineResultsFilterValues } from "./RefineResultsFilters";
import { RefineResultsFilters } from "./RefineResultsFilters";

interface RefineResultsPanelProps {
  isOpen: boolean;
  isLoading: boolean;
  showDelay?: boolean;
  showAdminAreas?: boolean;
  adminAreaOptions?: string[];
  initialValues?: Partial<RefineResultsFilterValues>;
  onApply?: (values: RefineResultsFilterValues) => void;
  onCancel?: () => void;
  onReset?: (values: RefineResultsFilterValues) => void;
}

export const RefineResultsPanel = ({
  isOpen,
  isLoading,
  showDelay = true,
  initialValues,
  onApply,
  onCancel,
  onReset,
}: RefineResultsPanelProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="refine-results-panel-drawer">
      {/* Prevent users from clicking outside the panel without selecting an option and closing the panel. This is original frontend behaviour. */}
      <button type="button" className="refine-results-panel-drawer__backdrop" />
      <div className="refine-results-panel">
        <div className="refine-results-panel__header">
          <h2 className="govuk-heading-l govuk-!-margin-bottom-0">Refine results</h2>
          <button type="button" className="refine-results-panel__close" onClick={onCancel}>
            <a href="#" className="govuk-link">Close</a>
          </button>
        </div>

        <RefineResultsFilters
          isLoading={isLoading}
          showDelay={showDelay}
          initialValues={initialValues}
          onApply={onApply}
          onCancel={onCancel}
          onReset={onReset}
        />
      </div>
    </div>
  );
};