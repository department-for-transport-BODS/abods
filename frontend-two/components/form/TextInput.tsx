import { ChangeEvent } from "react";
import { ErrorInfo } from "@/types";

interface TextInputProps<T> {
  display: string;
  inputName: keyof T;
  widthClass?: string;
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
  widthClass,
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
      className={
        error ? "govuk-form-group govuk-form-group--error" : "govuk-form-group"
      }
    >
      <label
        className={`govuk-label${required ? " text-input__label--required" : ""}`}
        htmlFor={inputId}
      >
        {display}
      </label>
      {error ? (
        <p id={`${inputId}-error`} className="govuk-error-message">
          <span className="govuk-visually-hidden">Error:</span> {error.errorMessage}
        </p>
      ) : null}
      <input
        className={`govuk-input ${widthClass ?? ""} ${error ? "govuk-input--error" : ""}`.trim()}
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
