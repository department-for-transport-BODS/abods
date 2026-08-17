import styles from "./segmented-toggle.module.scss";
import { clsx } from "clsx";

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
  className?: string;
}

export const SegmentedToggle = <T extends string>({
  legend,
  hideLegend,
  name,
  value,
  onChange,
  options,
  className,
}: SegmentedToggleProps<T>) => (
  <fieldset className={clsx(styles.segmentedToggle, className)}>
    <legend
      className={`govuk-label${hideLegend ? " govuk-visually-hidden" : ""}`}
    >
      {legend}
    </legend>
    <div className={styles.controls}>
      {options.map((option) => (
        <div key={option.value} className={styles.item}>
          <input
            className={clsx(styles.input, "govuk-visually-hidden")}
            type="radio"
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <label className={styles.label} htmlFor={`${name}-${option.value}`}>
            {option.label}
          </label>
        </div>
      ))}
    </div>
  </fieldset>
);
