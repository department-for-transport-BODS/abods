interface SegmentedToggleOption<T extends string = string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string = string> {
  legend: string;
  hideLegend?: boolean;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentedToggleOption<T>[];
}

export const SegmentedToggle = <T extends string,>({
  legend,
  hideLegend,
  name,
  value,
  onChange,
  options,
}: SegmentedToggleProps<T>) => (
  <fieldset className="segmented-toggle">
    <legend
      className={`govuk-label${hideLegend ? " govuk-visually-hidden" : ""}`}
    >
      {legend}
    </legend>
    <div className="segmented-toggle__controls">
      {options.map((option) => (
        <div key={option.value} className="segmented-toggle-item">
          <input
            className="govuk-visually-hidden segmented-toggle-item__input"
            type="radio"
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <label
            className="segmented-toggle-item__label"
            htmlFor={`${name}-${option.value}`}
          >
            {option.label}
          </label>
        </div>
      ))}
    </div>
  </fieldset>
);
