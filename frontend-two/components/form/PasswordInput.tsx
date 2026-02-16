import { ChangeEvent, useState } from "react";
import { ErrorInfo } from "@/types";

interface PasswordInputProps<T> {
  display: string;
  inputName: keyof T;
  widthClass?: string;
  value?: string;
  initialErrors?: ErrorInfo[];
  stateUpdater: (value: string, field: keyof T) => void;
  maxLength?: number;
  required?: boolean;
  autocomplete?: string;
}

export const PasswordInput = <T,>({
  display,
  inputName,
  widthClass,
  value,
  initialErrors,
  stateUpdater,
  maxLength,
  required = false,
  autocomplete,
}: PasswordInputProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);
  const error = initialErrors?.find((e) => e.id === inputName);
  const inputId = String(inputName);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    stateUpdater(event.target.value, inputName);
  };

  const handleMouseDown = () => {
    setShowPassword(true);
  };

  const handleMouseUp = () => {
    setShowPassword(false);
  };

  const handleMouseLeave = () => {
    setShowPassword(false);
  };

  return (
    <div
      className={
        error ? "govuk-form-group govuk-form-group--error" : "govuk-form-group"
      }
    >
      <label
        className={`govuk-label${required ? " password-input__label--required" : ""}`}
        htmlFor={inputId}
      >
        {display}
      </label>
      {error ? (
        <p id={`${inputId}-error`} className="govuk-error-message">
          <span className="govuk-visually-hidden">Error:</span> {error.errorMessage}
        </p>
      ) : null}
      <div className="govuk-input__wrapper">
        <input
          className={`govuk-input password-input__input ${widthClass ?? ""} ${error ? "govuk-input--error" : ""}`.trim()}
          id={inputId}
          name={inputId}
          type={showPassword ? "text" : "password"}
          value={value ?? ""}
          maxLength={maxLength}
          onChange={onChange}
          required={required}
          autoComplete={autocomplete}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        <div
          role="button"
          className="govuk-input__suffix password-input__suffix-button"
          aria-hidden="true"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          tabIndex={-1}
        >
          {showPassword ? "Hide" : "Show"}
        </div>
      </div>
    </div>
  );
};
