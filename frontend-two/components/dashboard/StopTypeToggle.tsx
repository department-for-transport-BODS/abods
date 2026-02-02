import { StopTypeOption } from "@/types/dashboard";

interface StopTypeToggleProps {
  stopType: StopTypeOption;
  onChange: (stopType: StopTypeOption) => void;
}

export const StopTypeToggle = ({ stopType, onChange }: StopTypeToggleProps) => (
  <fieldset className="segmented-toggle">
    <legend className="govuk-label govuk-visually-hidden">Stops</legend>
    <div className="segmented-toggle__controls">
      <div className="segmented-toggle-item">
        <input
          className="segmented-toggle-item__input"
          id="timing-points"
          name="stop-type"
          type="radio"
          checked={stopType === "TimingPoints"}
          onChange={() => onChange("TimingPoints")}
        />
        <label className="segmented-toggle-item__label" htmlFor="timing-points">
          Timing points
        </label>
      </div>
      <div className="segmented-toggle-item">
        <input
          className="segmented-toggle-item__input"
          id="all-stops"
          name="stop-type"
          type="radio"
          checked={stopType === "AllStops"}
          onChange={() => onChange("AllStops")}
        />
        <label className="segmented-toggle-item__label" htmlFor="all-stops">
          All stops
        </label>
      </div>
    </div>
  </fieldset>
);
