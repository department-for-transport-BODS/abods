export const DAYS = [
  { key: "Mon", displayValue: "Mon" },
  { key: "Tue", displayValue: "Tue" },
  { key: "Wed", displayValue: "Wed" },
  { key: "Thu", displayValue: "Thur" },
  { key: "Fri", displayValue: "Fri" },
  { key: "Sat", displayValue: "Sat" },
  { key: "Sun", displayValue: "Sun" },
] as const;
// That exists purely because of Thursday

export type DayKey = (typeof DAYS)[number]["key"];

interface DaySelectProps {
  selectedDays: Record<DayKey, boolean>;
  onDayChange: (day: DayKey, checked: boolean) => void;
  legend?: string;
  idPrefix?: string;
}

export const DaySelect = ({
  selectedDays,
  onDayChange,
  legend = "Day of the week",
  idPrefix = "day",
}: DaySelectProps) => {
  return (
    <fieldset className="govuk-fieldset">
      <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
        {legend}
      </legend>
      <div className="day-select__checkboxes">
        {DAYS.map(({ key, displayValue }) => {
          const inputId = `${idPrefix}-${key}`;

          return (
            <label className="day-select__item" htmlFor={inputId} key={key}>
              <input
                className="day-select__input"
                id={inputId}
                type="checkbox"
                checked={selectedDays[key]}
                onChange={(event) => onDayChange(key, event.target.checked)}
              />
              <span className="day-select__label">{displayValue}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
