export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type DayKey = (typeof DAYS)[number];

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
        {DAYS.map((day) => {
          const inputId = `${idPrefix}-${day}`;

          return (
            <label className="day-select__item" htmlFor={inputId} key={day}>
              <input
                className="day-select__input"
                id={inputId}
                type="checkbox"
                checked={selectedDays[day]}
                onChange={(event) => onDayChange(day, event.target.checked)}
              />
              <span className="day-select__label">{day}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
