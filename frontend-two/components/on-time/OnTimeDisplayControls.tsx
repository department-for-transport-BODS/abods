import type { ReactNode } from "react";
import { MultiselectDropdown } from "@/components/shared/MultiselectDropdown";
import { RadioOptions } from "@/components/shared/RadioOptions";
import {
  type OnTimeDisplayMode,
  DISPLAY_MODE_OPTIONS,
} from "@/utils/on-time/on-time-table-format";

interface OnTimeDisplayControlsProps {
  selectedDirections: string[];
  onDirectionsChange: (directions: string[]) => void;
  selectedDisplayMode: OnTimeDisplayMode;
  onDisplayModeChange: (mode: OnTimeDisplayMode) => void;
  onOpenDisplayOptions: () => void;
  /** Optional content shown before directions (e.g. service search). */
  beforeDirections?: ReactNode;
  /**
   * When true, wrap beforeDirections + directions in `__inputs`
   * (operator page layout).
   */
  groupInputs?: boolean;
  className?: string;
}

export const OnTimeDisplayControls = ({
  selectedDirections,
  onDirectionsChange,
  selectedDisplayMode,
  onDisplayModeChange,
  onOpenDisplayOptions,
  beforeDirections,
  groupInputs = false,
  className = "on-time-service-filters govuk-!-margin-top-6",
}: OnTimeDisplayControlsProps) => {
  const directionsControl = (
    <div className="on-time-service-filters__directions">
      <MultiselectDropdown
        label="Directions"
        options={["Inbound", "Outbound"]}
        selected={selectedDirections}
        onChange={onDirectionsChange}
        placeholderText=""
      />
    </div>
  );

  return (
    <div className={className}>
      {groupInputs ? (
        <div className="on-time-service-filters__inputs">
          {beforeDirections}
          {directionsControl}
        </div>
      ) : (
        <>
          {beforeDirections}
          {directionsControl}
        </>
      )}
      <div className="on-time-service-filters__display-options">
        <p className="on-time-service-display-options-button">
          <button
            type="button"
            className="govuk-link"
            onClick={onOpenDisplayOptions}
          >
            Display options
          </button>
        </p>
        <div className="on-time-service-filters__radios">
          <RadioOptions
            name="on-time-display-mode"
            legend="Show service performance values as"
            options={DISPLAY_MODE_OPTIONS}
            value={selectedDisplayMode}
            onChange={onDisplayModeChange}
          />
        </div>
      </div>
    </div>
  );
};
