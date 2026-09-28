import { ChangeEvent } from "react";
import styles from "./text-input.module.scss";
import { ErrorInfo } from "@/types";
import { clsx } from "clsx";

interface TextInputProps<T> {
  display: string;
  inputName: keyof T;
  width?: 10 | 20;
  value?: string;
  initialErrors?: ErrorInfo[];
  stateUpdater: (value: string, field: keyof T) => void;
  maxLength?: number;
  isPassword?: boolean;
  required?: boolean;
  autocomplete?: string;
}

export const TextInput = <T,>({
  display,
  inputName,
  width,
  value,
  initialErrors,
  stateUpdater,
  maxLength,
  isPassword,
  required = false,
  autocomplete,
}: TextInputProps<T>) => {
  const error = initialErrors?.find((e) => e.id === inputName);
  const inputId = String(inputName);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    stateUpdater(event.target.value, inputName);
  };

  return (
    <div
      className={`govuk-form-group${error ? " govuk-form-group--error" : ""}`}
    >
      <label
        className={clsx("govuk-label", required && styles.labelRequired)}
        htmlFor={inputId}
      >
        {display}
      </label>
      {error ? (
        <p id={`${inputId}-error`} className="govuk-error-message">
          <span className="govuk-visually-hidden">Error:</span>{" "}
          {error.errorMessage}
        </p>
      ) : null}
      <input
        className={clsx(
          "govuk-input",
          width && `govuk-input--width-${width}`,
          error && "govuk-input--error",
        )}
        id={inputId}
        name={inputId}
        type={isPassword ? "password" : "text"}
        value={value ?? ""}
        maxLength={maxLength}
        onChange={onChange}
        required={required}
        autoComplete={autocomplete}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
    </div>
  );
};
