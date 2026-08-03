import styles from "./on-time-display-controls.module.scss";

import type { ReactNode } from "react";
import { MultiselectCheckbox } from "@/components/shared/MultiselectCheckbox/MultiselectCheckbox";
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
  className = `${styles.container} govuk-!-margin-top-6`,
}: OnTimeDisplayControlsProps) => {
  const directionsControl = (
    <div className={styles.directionsContainer}>
      <MultiselectCheckbox
        id="on-time-directions"
        label="Directions"
        options={[
          { label: "Inbound", value: "Inbound" },
          { label: "Outbound", value: "Outbound" },
        ]}
        selectedValues={selectedDirections}
        onChange={onDirectionsChange}
        placeholder=""
      />
    </div>
  );

  return (
    <div className={className}>
      {groupInputs ? (
        <div className={styles.inputsContainer}>
          {beforeDirections}
          {directionsControl}
        </div>
      ) : (
        <>
          {beforeDirections}
          {directionsControl}
        </>
      )}
      <div className={styles.displayOptionsContainer}>
        <p className={styles.displayOptionsButton}>
          <button
            type="button"
            className="govuk-link"
            onClick={onOpenDisplayOptions}
          >
            Display options
          </button>
        </p>
        <div className={styles.radiosContainer}>
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
