import { MatchType, StopTypeOption } from "@/types/stop-analysis";

interface MatchTypeToggleProps {
  matchType: MatchType;
  onChange: (matchType: MatchType) => void;
}

export const MatchTypeToggle = ({
  matchType,
  onChange,
}: MatchTypeToggleProps) => (
  <fieldset className="segmented-toggle app-match-type-segmented-toggle">
    <legend className="govuk-label govuk-visually-hidden">
      Show performance using data from
    </legend>
    <div className="segmented-toggle__controls">
      <div className="segmented-toggle-item">
        <input
          className="segmented-toggle-item__input"
          id="match-estimated"
          name="match-type"
          type="radio"
          checked={matchType === MatchType.Estimated}
          onChange={() => onChange(MatchType.Estimated)}
        />
        <label
          className="segmented-toggle-item__label"
          htmlFor="match-estimated"
        >
          Estimated
        </label>
      </div>
      <div className="segmented-toggle-item">
        <input
          className="segmented-toggle-item__input"
          id="match-evidenced"
          name="match-type"
          type="radio"
          checked={matchType === MatchType.Evidenced}
          onChange={() => onChange(MatchType.Evidenced)}
        />
        <label
          className="segmented-toggle-item__label"
          htmlFor="match-evidenced"
        >
          Evidenced
        </label>
      </div>
    </div>
  </fieldset>
);

interface StopTypeToggleProps {
  stopType: StopTypeOption;
  onChange: (stopType: StopTypeOption) => void;
}

export const StopTypeToggle = ({ stopType, onChange }: StopTypeToggleProps) => (
  <fieldset className="segmented-toggle app-stop-type-segmented-toggle">
    <legend className="govuk-label govuk-visually-hidden">
      Filter by stop type
    </legend>
    <div className="segmented-toggle__controls">
      <div className="segmented-toggle-item">
        <input
          className="segmented-toggle-item__input"
          id="sa-all-stops"
          name="sa-stop-type"
          type="radio"
          checked={stopType === "AllStops"}
          onChange={() => onChange("AllStops")}
        />
        <label className="segmented-toggle-item__label" htmlFor="sa-all-stops">
          All stops
        </label>
      </div>
      <div className="segmented-toggle-item">
        <input
          className="segmented-toggle-item__input"
          id="sa-timing-points"
          name="sa-stop-type"
          type="radio"
          checked={stopType === "TimingPoints"}
          onChange={() => onChange("TimingPoints")}
        />
        <label
          className="segmented-toggle-item__label"
          htmlFor="sa-timing-points"
        >
          Timing points
        </label>
      </div>
    </div>
  </fieldset>
);
