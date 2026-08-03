import { FormEvent, useState } from "react";
import { useOtpThresholdDefaults } from "@/components/on-time/OtpThreshold/useOtpThresholdDefaults";
import {
  OTP_THRESHOLD_MAX,
  OTP_THRESHOLD_MIN,
  OtpThresholdSlider,
} from "@/components/on-time/OtpThreshold/OtpThresholdSlider";

export interface OtpThresholds {
  early: number;
  late: number;
}

interface OtpThresholdFormProps {
  /** Emitted when the user submits valid thresholds. */
  onCompare: (thresholds: OtpThresholds) => void;
}

const isValid = (value: number) =>
  Number.isInteger(value) &&
  value >= OTP_THRESHOLD_MIN &&
  value <= OTP_THRESHOLD_MAX;

const parseInput = (value: string): number =>
  value.trim() === "" ? NaN : Number(value);

/**
 * Form for choosing alternative "early" / "late" on-time thresholds (in
 * minutes) to compare punctuality against. Initial values come from the
 * persisted defaults; on submit the values are saved and emitted.
 */
export const OtpThresholdForm = ({ onCompare }: OtpThresholdFormProps) => {
  const defaults = useOtpThresholdDefaults();
  const [early, setEarly] = useState<number>(defaults.early);
  const [late, setLate] = useState<number>(defaults.late);
  const [submitted, setSubmitted] = useState(false);

  const hasError = submitted && (!isValid(early) || !isValid(late));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (!isValid(early) || !isValid(late)) return;
    defaults.setDefault("early", early);
    defaults.setDefault("late", late);
    onCompare({ early, late });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div
        className={`govuk-form-group${hasError ? " govuk-form-group--error" : ""}`}
      >
        <fieldset className="govuk-fieldset">
          {hasError ? (
            <p id="otp-threshold-error" className="govuk-error-message">
              <span className="govuk-visually-hidden">Error:</span> Please enter
              a value between {OTP_THRESHOLD_MIN} and {OTP_THRESHOLD_MAX}{" "}
              minutes
            </p>
          ) : null}

          <div className="otp-threshold-form__inputs">
            <div className="govuk-form-group otp-threshold-form__control">
              <label className="govuk-label" htmlFor="otp-threshold-early">
                Early
              </label>
              <div id="otp-threshold-early-hint" className="govuk-hint">
                Value greater than
              </div>
              <div className="govuk-input__wrapper">
                <input
                  className="govuk-input govuk-input--width-2"
                  id="otp-threshold-early"
                  name="otp-threshold-early"
                  type="number"
                  min={OTP_THRESHOLD_MIN}
                  max={OTP_THRESHOLD_MAX}
                  step={1}
                  value={Number.isNaN(early) ? "" : early}
                  aria-describedby="otp-threshold-early-hint"
                  onChange={(event) => setEarly(parseInput(event.target.value))}
                />
                <div className="govuk-input__suffix" aria-hidden="true">
                  {early === 1 ? "minute" : "minutes"}
                </div>
              </div>
            </div>

            <div className="govuk-form-group otp-threshold-form__control">
              <label className="govuk-label" htmlFor="otp-threshold-late">
                Late
              </label>
              <div id="otp-threshold-late-hint" className="govuk-hint">
                Value greater than or equal to
              </div>
              <div className="govuk-input__wrapper">
                <input
                  className="govuk-input govuk-input--width-2"
                  id="otp-threshold-late"
                  name="otp-threshold-late"
                  type="number"
                  min={OTP_THRESHOLD_MIN}
                  max={OTP_THRESHOLD_MAX}
                  step={1}
                  value={Number.isNaN(late) ? "" : late}
                  aria-describedby="otp-threshold-late-hint"
                  onChange={(event) => setLate(parseInput(event.target.value))}
                />
                <div className="govuk-input__suffix" aria-hidden="true">
                  {late === 1 ? "minute" : "minutes"}
                </div>
              </div>
            </div>
          </div>

          <div className="govuk-!-margin-top-4">
            <OtpThresholdSlider
              early={early}
              late={late}
              onEarlyChange={setEarly}
              onLateChange={setLate}
            />
          </div>
        </fieldset>
      </div>

      <button type="submit" className="govuk-button" data-module="govuk-button">
        Compare
      </button>
    </form>
  );
};
