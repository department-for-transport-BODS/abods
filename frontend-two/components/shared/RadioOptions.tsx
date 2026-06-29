interface RadioOption<T extends string = string> {
  value: T;
  label: string;
}

interface RadioOptionsProps<T extends string = string> {
  name: string;
  options: readonly RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  legend?: string;
  hideLegend?: boolean;
  inline?: boolean;
  small?: boolean;
  className?: string;
}

export const RadioOptions = <T extends string>({
  name,
  options,
  value,
  onChange,
  legend,
  hideLegend = true,
  inline = true,
  small = true,
  className,
}: RadioOptionsProps<T>) => {
  const radiosClasses = ["govuk-radios"];

  if (inline) radiosClasses.push("govuk-radios--inline");
  if (small) radiosClasses.push("govuk-radios--small");

  return (
    <fieldset className={`govuk-fieldset${className ? ` ${className}` : ""}`}>
      {legend ? (
        <legend
          className={`govuk-fieldset__legend${hideLegend ? " govuk-visually-hidden" : ""}`}
        >
          {legend}
        </legend>
      ) : null}
      <div className={radiosClasses.join(" ")}>
        {options.map((option) => {
          const id = `${name}-${option.value}`;

          return (
            <div key={option.value} className="govuk-radios__item">
              <input
                className="govuk-radios__input"
                id={id}
                name={name}
                type="radio"
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
              />
              <label className="govuk-label govuk-radios__label" htmlFor={id}>
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
};
