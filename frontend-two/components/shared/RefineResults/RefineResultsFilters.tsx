import styles from "./refine-results-filters.module.scss";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DayKey, DaySelect } from "@/components/shared/DaySelect/DaySelect";
import { MultiselectCheckbox } from "@/components/shared/MultiselectCheckbox/MultiselectCheckbox";
import { TimeRangeSlider } from "@/components/shared/TimeRangeSlider/TimeRangeSlider";
import { PerformanceFiltersInputType } from "@/src/generated/graphql";

const DELAY_OPTIONS = ["none", "10", "20", "30", "40", "50", "60"] as const;

export type DelayBound = (typeof DELAY_OPTIONS)[number];

export interface RefineResultsFilterValues {
  adminAreaIds: string[];
  dayOfWeekFlags: Record<DayKey, boolean>;
  startTime: string;
  endTime: string;
  minDelayStr: DelayBound;
  maxDelayStr: DelayBound;
}

export interface RefineResultsAdminAreaOption {
  label: string;
  value: string;
}

interface RefineResultsFiltersProps {
  isLoading: boolean;
  showPerformanceFilters?: boolean;
  showAdminAreaFilter?: boolean;
  adminAreaOptions?: RefineResultsAdminAreaOption[];
  initialValues?: Partial<RefineResultsFilterValues>;
  onApply?: (values: RefineResultsFilterValues) => void;
  onCancel?: () => void;
  onReset?: (values: RefineResultsFilterValues) => void;
}

const buildDefaultValues = (): RefineResultsFilterValues => ({
  adminAreaIds: [],
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
  showPerformanceFilters = true,
  showAdminAreaFilter = false,
  adminAreaOptions = [],
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
    <form onSubmit={onSubmit} className={styles.container}>
      <div className={styles.scrollbox}>
        <div className={styles.scrollboxContent}>
          <div className={styles.sections}>
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

            {showPerformanceFilters && (
              <fieldset className="govuk-fieldset">
                <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
                  Performance
                </legend>
                <div className={styles.delaySelects}>
                  <div className="govuk-form-group">
                    <label className="govuk-label" htmlFor="max-early">
                      Maximum early
                    </label>
                    <select
                      id="max-early"
                      className={`govuk-select ${styles.selectWidth}`}
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
                      className={`govuk-select ${styles.selectWidth}`}
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
            )}
            {showAdminAreaFilter && (
              <fieldset className="govuk-fieldset">
                <div className="govuk-form-group">
                  <MultiselectCheckbox
                    id="refine-results-area"
                    label="Area"
                    options={adminAreaOptions}
                    selectedValues={values.adminAreaIds}
                    onChange={(adminAreaIds) =>
                      setValues((prev) => ({ ...prev, adminAreaIds }))
                    }
                    placeholder="All areas"
                    disabled={adminAreaOptions.length === 0}
                  />
                </div>
              </fieldset>
            )}
          </div>

          <div className={styles.reset}>
            <button
              type="button"
              className="button-link govuk-link"
              onClick={resetToDefault}
            >
              Reset to defaults
            </button>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="govuk-button govuk-!-margin-bottom-0"
          disabled={isLoading}
        >
          Apply
        </button>
      </div>
    </form>
  );
};

export const refineResultsToPerformanceFilters = (
  values: RefineResultsFilterValues,
): PerformanceFiltersInputType => {
  const hasCustomDaySelection = Object.values(values.dayOfWeekFlags).some(
    (enabled) => !enabled,
  );

  return {
    ...(values.adminAreaIds.length > 0
      ? { adminAreaIds: values.adminAreaIds }
      : {}),
    ...(hasCustomDaySelection
      ? {
          dayOfWeekFlags: {
            monday: values.dayOfWeekFlags.Mon,
            tuesday: values.dayOfWeekFlags.Tue,
            wednesday: values.dayOfWeekFlags.Wed,
            thursday: values.dayOfWeekFlags.Thu,
            friday: values.dayOfWeekFlags.Fri,
            saturday: values.dayOfWeekFlags.Sat,
            sunday: values.dayOfWeekFlags.Sun,
          },
        }
      : {}),
    ...(values.startTime !== "00:00" ? { startTime: values.startTime } : {}),
    ...(values.endTime !== "23:59" ? { endTime: values.endTime } : {}),
    ...(values.minDelayStr !== "none"
      ? { minDelay: -1 * Number(values.minDelayStr) }
      : {}),
    ...(values.maxDelayStr !== "none"
      ? { maxDelay: Number(values.maxDelayStr) }
      : {}),
  };
};

export const performanceFiltersToRefineResults = (
  filters: PerformanceFiltersInputType,
): Partial<RefineResultsFilterValues> => {
  return {
    ...(filters.adminAreaIds ? { adminAreaIds: filters.adminAreaIds } : {}),
    ...(filters.dayOfWeekFlags
      ? {
          dayOfWeekFlags: {
            Mon: Boolean(filters.dayOfWeekFlags.monday),
            Tue: Boolean(filters.dayOfWeekFlags.tuesday),
            Wed: Boolean(filters.dayOfWeekFlags.wednesday),
            Thu: Boolean(filters.dayOfWeekFlags.thursday),
            Fri: Boolean(filters.dayOfWeekFlags.friday),
            Sat: Boolean(filters.dayOfWeekFlags.saturday),
            Sun: Boolean(filters.dayOfWeekFlags.sunday),
          },
        }
      : {}),
    ...(filters.startTime ? { startTime: filters.startTime } : {}),
    ...(filters.endTime ? { endTime: filters.endTime } : {}),
    ...(typeof filters.minDelay === "number"
      ? {
          minDelayStr: String(
            Math.abs(filters.minDelay),
          ) as RefineResultsFilterValues["minDelayStr"],
        }
      : {}),
    ...(typeof filters.maxDelay === "number"
      ? {
          maxDelayStr: String(
            filters.maxDelay,
          ) as RefineResultsFilterValues["maxDelayStr"],
        }
      : {}),
  };
};
