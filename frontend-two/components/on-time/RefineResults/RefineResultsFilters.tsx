import { FormEvent, useEffect, useMemo, useState } from "react";
import { DayKey, DaySelect } from "@/components/shared/DaySelect";
import { TimeRangeSlider } from "@/components/shared/TimeRangeSlider";

const DELAY_OPTIONS = ["none", "10", "20", "30", "40", "50", "60"] as const;

export type DelayBound = (typeof DELAY_OPTIONS)[number];

export interface RefineResultsFilterValues {
  dayOfWeekFlags: Record<DayKey, boolean>;
  startTime: string;
  endTime: string;
  minDelayStr: DelayBound;
  maxDelayStr: DelayBound;
}

interface RefineResultsFiltersProps {
  isLoading: boolean;
  showDelay?: boolean;
  initialValues?: Partial<RefineResultsFilterValues>;
  onApply?: (values: RefineResultsFilterValues) => void;
  onCancel?: () => void;
  onReset?: (values: RefineResultsFilterValues) => void;
}

const buildDefaultValues = (): RefineResultsFilterValues => ({
  dayOfWeekFlags: {
    Mon: true,
    Tue: true,
    Wed: true,
    Thu: true,
    Fri: true,
    Sat: true,
    Sun: true,
  },
  startTime: "00:00",
  endTime: "23:59",
  minDelayStr: "none",
  maxDelayStr: "none",
});

export const RefineResultsFilters = ({
  isLoading,
  initialValues,
  onApply,
  onCancel,
  onReset,
}: RefineResultsFiltersProps) => {
  const initial = useMemo(() => {
    const defaults = buildDefaultValues();
    return {
      ...defaults,
      ...initialValues,
      dayOfWeekFlags: {
        ...defaults.dayOfWeekFlags,
        ...initialValues?.dayOfWeekFlags,
      },
    };
  }, [initialValues]);

  const [values, setValues] = useState<RefineResultsFilterValues>(initial);

  useEffect(() => {
    setValues(initial);
  }, [initial]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    onApply?.(values);
  };

  const resetToDefault = () => {
    const defaults = buildDefaultValues();
    setValues(defaults);
    onReset?.(defaults);
  };

  return (
    <form onSubmit={onSubmit} className="refine-results-filters">
      <div className="refine-results-filters__sections">
        <DaySelect
          selectedDays={values.dayOfWeekFlags}
          onDayChange={(day, checked) => {
            setValues((prev) => ({
              ...prev,
              dayOfWeekFlags: {
                ...prev.dayOfWeekFlags,
                [day]: checked,
              },
            }));
          }}
        />

        <TimeRangeSlider
          labelMin="Start time"
          labelMax="End time"
          legend="Time range"
          legendSize="s"
          startTime={values.startTime}
          endTime={values.endTime}
          onStartTimeChange={(startTime) =>
            setValues((prev) => ({ ...prev, startTime }))
          }
          onEndTimeChange={(endTime) =>
            setValues((prev) => ({ ...prev, endTime }))
          }
        />

        <fieldset className="govuk-fieldset">
          <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
            Performance
          </legend>
          <div className="refine-results-filters__delay-selects">
            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="max-early">
                Maximum early
              </label>
              <select
                id="max-early"
                className="govuk-select"
                value={values.minDelayStr}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    minDelayStr: event.target.value as DelayBound,
                  }))
                }
              >
                {DELAY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "none"
                      ? "No limit"
                      : `${Math.abs(Number(option))} minutes`}
                  </option>
                ))}
              </select>
            </div>
            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="max-late">
                Maximum late
              </label>
              <select
                id="max-late"
                className="govuk-select"
                value={values.maxDelayStr}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    maxDelayStr: event.target.value as DelayBound,
                  }))
                }
              >
                {DELAY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "none" ? "No limit" : `${option} minutes`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>
      </div>

      <div className="govuk-!-margin-bottom-4">
        <button type="button" className="govuk-body" onClick={resetToDefault}>
          <a href="#" className="govuk-link">
            Reset to defaults
          </a>
        </button>
      </div>

      <div className="govuk-button-group refine-results-filters__actions">
        <button
          type="button"
          className="govuk-button govuk-button--secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className="govuk-button" disabled={isLoading}>
          {isLoading ? "Applying..." : "Apply"}
        </button>
      </div>
    </form>
  );
};
