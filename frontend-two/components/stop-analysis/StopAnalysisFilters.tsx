import { useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";
import noUiSlider, { API as NoUiSliderApi } from "nouislider";
import { Period } from "@/utils/dateRange";
import { StopTypeOption } from "@/types/stop-analysis";
import { DayOfWeekFlagsInputType as DayOfWeekFlags } from "@/src/generated/graphql";
import { DateRangeSelect } from "@/components/shared/DateRangeSelect";
import { LocationLookupField } from "@/components/shared/LocationLookupField";
import { MatchTypeToggle, StopTypeToggle } from "./Toggles";
import { MultiselectCheckbox } from "./MultiselectCheckbox";
import {
  AdminAreasType,
  LineType,
  MatchType,
  OperatorType,
} from "@/src/generated/graphql";

interface StopAnalysisFiltersProps {
  fromTimestamp: string;
  toTimestamp: string;
  adminAreaIds: string[];
  operatorIds: string[];
  lineIds: string[];
  matchType: MatchType;
  stopType: StopTypeOption;
  adminAreas: AdminAreasType[];
  operators: OperatorType[];
  lines: LineType[];
  mapboxToken?: string;
  onDateRangeChange: (from: string, to: string) => void;
  onAdminAreasChange: (values: string[]) => void;
  onOperatorsChange: (values: string[]) => void;
  onLinesChange: (values: string[]) => void;
  onMatchTypeChange: (value: MatchType) => void;
  onStopTypeChange: (value: StopTypeOption) => void;
  onLocationSelect: (location: {
    center?: [number, number];
    bbox?: [number, number, number, number];
  }) => void;
  onPresetChange: (preset: Period) => void;
}

const PRESET_OPTIONS: { value: Period; label: string }[] = [
  { value: "last7", label: "Last 7 days" },
  { value: "last28", label: "Last 28 days" },
  { value: "monthToDate", label: "Month to date" },
  { value: "lastMonth", label: "Last month" },
];

function getPresetWindow(preset: Period, today: DateTime) {
  const yesterday = today.minus({ days: 1 });

  switch (preset) {
    case "last7":
      return {
        from: today.minus({ days: 7 }),
        to: yesterday,
      };
    case "last28":
      return {
        from: today.minus({ days: 28 }),
        to: yesterday,
      };
    case "monthToDate":
      return {
        from: today.startOf("month"),
        to: yesterday,
      };
    case "lastMonth": {
      const from = today.minus({ months: 1 }).startOf("month");
      return {
        from,
        to: from.plus({ months: 1 }).minus({ days: 1 }),
      };
    }
  }
}

export const StopAnalysisFilters = ({
  fromTimestamp,
  toTimestamp,
  adminAreaIds,
  operatorIds,
  lineIds,
  matchType,
  stopType,
  adminAreas,
  operators,
  lines,
  mapboxToken,
  onDateRangeChange,
  onAdminAreasChange,
  onOperatorsChange,
  onLinesChange,
  onMatchTypeChange,
  onStopTypeChange,
  onLocationSelect,
  onPresetChange,
}: StopAnalysisFiltersProps) => {
  const [locationQuery, setLocationQuery] = useState("");

  const adminAreaOptions = useMemo(
    () =>
      adminAreas
        .map((area) => ({ label: area.name, value: area.id }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [adminAreas],
  );

  const operatorOptions = useMemo(
    () =>
      operators
        .filter(
          (op) =>
            adminAreaIds.length === 0 ||
            op.adminAreaIds.some((a) => adminAreaIds.includes(a)),
        )
        .map((op) => ({
          label: `${op.name} (${op.operatorId})`,
          value: op.operatorId,
        })),
    [operators, adminAreaIds],
  );

  const lineOptions = useMemo(
    () =>
      lines
        .filter(
          (line) =>
            adminAreaIds.length === 0 ||
            line.adminAreaIds.some((a) => adminAreaIds.includes(a.toString())),
        )
        .map((line) => ({
          label: `${line.number}: ${line.name}`,
          value: line.id,
        })),
    [lines, adminAreaIds],
  );

  const activePreset = useMemo<Period | "custom">(() => {
    const currentFrom = DateTime.fromISO(fromTimestamp);
    const currentTo = DateTime.fromISO(toTimestamp);
    if (!currentFrom.isValid || !currentTo.isValid) {
      return "custom";
    }

    const now = DateTime.local();
    for (const option of PRESET_OPTIONS) {
      const window = getPresetWindow(option.value, now);
      if (
        currentFrom.hasSame(window.from, "day") &&
        currentTo.hasSame(window.to, "day")
      ) {
        return option.value;
      }
    }

    return "custom";
  }, [fromTimestamp, toTimestamp]);

  const handlePresetChange = (preset: Period) => {
    onPresetChange(preset);
  };

  return (
    <div className="stop-analysis-filters">
      <div className="filters stop-analysis-filters__grid govuk-!-margin-bottom-2">
        <div className="stop-analysis-filters__item stop-analysis-filters__item--date">
          <label className="govuk-label">Date Range</label>
          <div className="stop-analysis-filters__date-range">
            <DateRangeSelect
              value={{ from: fromTimestamp, to: toTimestamp }}
              onChange={({ from, to }) => onDateRangeChange(from, to)}
              hideLabel
            />
            <select
              className="govuk-select stop-analysis-filters__preset-select"
              value={activePreset}
              onChange={(event) =>
                handlePresetChange(event.target.value as Period)
              }
              aria-label="Preset date range"
            >
              {PRESET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              {activePreset === "custom" && (
                <option value="custom">Custom</option>
              )}
            </select>
          </div>
        </div>

        <div className="stop-analysis-filters__item stop-analysis-filters__item--admin">
          <MultiselectCheckbox
            id="sa-admin-areas"
            label="Admin Areas"
            options={adminAreaOptions}
            selectedValues={adminAreaIds}
            onChange={onAdminAreasChange}
            showAllLabel="All Areas"
            placeholder="Admin Areas"
          />
        </div>

        <div className="stop-analysis-filters__item stop-analysis-filters__item--toggles stop-analysis-filters__toggles">
          <MatchTypeToggle matchType={matchType} onChange={onMatchTypeChange} />
          <StopTypeToggle stopType={stopType} onChange={onStopTypeChange} />
        </div>

        <div className="stop-analysis-filters__item stop-analysis-filters__item--location">
          <LocationLookupField
            id="sa-location-search"
            label="Location name or postcode"
            value={locationQuery}
            onValueChange={setLocationQuery}
            onSelect={(location) => {
              onLocationSelect({
                center: location.center,
                bbox: location.bbox,
              });
            }}
            mapboxToken={mapboxToken}
            disabled={!mapboxToken}
          />
        </div>

        <div className="stop-analysis-filters__item stop-analysis-filters__item--operators">
          <MultiselectCheckbox
            id="sa-operators"
            label="Operators"
            options={operatorOptions}
            selectedValues={operatorIds}
            onChange={onOperatorsChange}
            showAllLabel="All Operators"
            placeholder="Operators"
          />
        </div>

        <div className="stop-analysis-filters__item stop-analysis-filters__item--services">
          <MultiselectCheckbox
            id="sa-services"
            label="Services"
            options={lineOptions}
            selectedValues={lineIds}
            onChange={onLinesChange}
            showAllLabel="All Services"
            placeholder="Services"
            disabled={operatorIds.length === 0}
          />
        </div>
      </div>
    </div>
  );
};

export interface RefineFiltersProps {
  dayOfWeekFlags?: DayOfWeekFlags;
  startTime?: string;
  endTime?: string;
  onDayOfWeekChange: (flags: DayOfWeekFlags | undefined) => void;
  onStartTimeChange: (value: string | undefined) => void;
  onEndTimeChange: (value: string | undefined) => void;
  onResetDefaults: () => void;
  onClose: () => void;
}

const DAYS_OF_WEEK: (keyof DayOfWeekFlags)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_ABBREVIATIONS: Record<keyof DayOfWeekFlags, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const parseStartHour = (value?: string): number => {
  if (!value || !/^\d\d:00$/.test(value)) return 0;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(23, Math.max(0, parsed));
};

const parseEndHourExclusive = (value?: string): number => {
  if (!value || !/^\d\d:59$/.test(value)) return 24;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return 24;
  return Math.min(24, Math.max(1, parsed + 1));
};

export const RefineFilters = ({
  dayOfWeekFlags,
  startTime,
  endTime,
  onDayOfWeekChange,
  onStartTimeChange,
  onEndTimeChange,
  onResetDefaults,
  onClose,
}: RefineFiltersProps) => {
  const sliderHostRef = useRef<HTMLDivElement | null>(null);
  const sliderRef = useRef<NoUiSliderApi | null>(null);
  const latestTimesRef = useRef({
    startTime: startTime ?? "00:00",
    endTime: endTime ?? "23:59",
  });
  const startHour = parseStartHour(startTime);
  const endHourExclusive = parseEndHourExclusive(endTime);

  useEffect(() => {
    latestTimesRef.current = {
      startTime: startTime ?? "00:00",
      endTime: endTime ?? "23:59",
    };
  }, [startTime, endTime]);

  const handleDayToggle = (day: keyof DayOfWeekFlags) => {
    const current = dayOfWeekFlags ?? {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    };
    const updated = { ...current, [day]: !current[day] };
    const allSelected = Object.values(updated).every(Boolean);
    onDayOfWeekChange(allSelected ? undefined : updated);
  };

  const handleStartHourChange = (nextHour: number) => {
    const clamped = Math.min(23, Math.max(0, nextHour));
    const adjustedEnd = Math.max(endHourExclusive, clamped + 1);
    onStartTimeChange(`${clamped.toString().padStart(2, "0")}:00`);
    if (adjustedEnd !== endHourExclusive) {
      onEndTimeChange(`${(adjustedEnd - 1).toString().padStart(2, "0")}:59`);
    }
  };

  const handleEndHourChange = (nextHourExclusive: number) => {
    const clamped = Math.min(24, Math.max(1, nextHourExclusive));
    const adjustedStart = Math.min(startHour, clamped - 1);
    if (adjustedStart !== startHour) {
      onStartTimeChange(`${adjustedStart.toString().padStart(2, "0")}:00`);
    }
    onEndTimeChange(`${(clamped - 1).toString().padStart(2, "0")}:59`);
  };

  useEffect(() => {
    if (!sliderHostRef.current || sliderRef.current) {
      return;
    }

    const initialStartHour = parseStartHour(latestTimesRef.current.startTime);
    const initialEndHourExclusive = parseEndHourExclusive(
      latestTimesRef.current.endTime,
    );

    const slider = noUiSlider.create(sliderHostRef.current, {
      start: [initialStartHour, initialEndHourExclusive],
      connect: true,
      step: 1,
      margin: 1,
      range: {
        min: 0,
        max: 24,
      },
    });

    slider.on("change", (values: (number | string)[]) => {
      const nextStart = Math.round(Number(values[0]));
      const nextEndExclusive = Math.round(Number(values[1]));

      const nextStartTime = `${nextStart.toString().padStart(2, "0")}:00`;
      const nextEndTime = `${(nextEndExclusive - 1).toString().padStart(2, "0")}:59`;

      if (nextStartTime !== latestTimesRef.current.startTime) {
        onStartTimeChange(nextStartTime);
      }

      if (nextEndTime !== latestTimesRef.current.endTime) {
        onEndTimeChange(nextEndTime);
      }
    });

    sliderRef.current = slider;

    return () => {
      slider.destroy();
      sliderRef.current = null;
    };
  }, [onEndTimeChange, onStartTimeChange]);

  useEffect(() => {
    if (!sliderRef.current) {
      return;
    }

    sliderRef.current.set([startHour, endHourExclusive]);
  }, [startHour, endHourExclusive]);

  return (
    <div className="refine-filters-panel">
      <div className="refine-filters-panel__heading">
        <h2 className="govuk-heading-l govuk-!-margin-bottom-0">
          Refine results
        </h2>
        <button
          type="button"
          className="govuk-link button-link refine-filters-panel__close"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <fieldset className="govuk-fieldset govuk-!-margin-top-4">
        <legend className="govuk-fieldset__legend govuk-fieldset__legend--m">
          <h3 className="govuk-fieldset__heading">Day of week</h3>
        </legend>
        <div className="govuk-checkboxes govuk-checkboxes--small">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="govuk-checkboxes__item">
              <input
                className="govuk-checkboxes__input"
                id={`day-${day}`}
                type="checkbox"
                checked={dayOfWeekFlags?.[day] ?? true}
                onChange={() => handleDayToggle(day)}
                aria-label={day.charAt(0).toUpperCase() + day.slice(1)}
              />
              <label className="govuk-checkboxes__label" htmlFor={`day-${day}`}>
                {DAY_ABBREVIATIONS[day]}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="govuk-form-group govuk-!-margin-top-4">
        <fieldset className="govuk-fieldset govuk-!-margin-top-4">
          <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
            <h3 className="govuk-fieldset__heading">Time range</h3>
          </legend>

          <div className="range-slider refine-filters-panel__range-slider">
            <div
              id="time-range-slider"
              ref={sliderHostRef}
              className="ng2-nouislider"
            />
          </div>

          <div className="refine-filters-panel__time-range time-range-slider__textboxes">
            <div>
              <label className="govuk-label" htmlFor="sa-start-hour-input">
                Start time
              </label>
              <div className="govuk-input__wrapper">
                <input
                  id="sa-start-hour-input"
                  className="govuk-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  value={startHour.toString().padStart(2, "0")}
                  onChange={(e) =>
                    handleStartHourChange(parseInt(e.target.value || "0", 10))
                  }
                />
                <span className="govuk-input__suffix" aria-hidden="true">
                  :00
                </span>
              </div>
            </div>

            <div>
              <label className="govuk-label" htmlFor="sa-end-hour-input">
                End time
              </label>
              <div className="govuk-input__wrapper">
                <input
                  id="sa-end-hour-input"
                  className="govuk-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  value={(endHourExclusive - 1).toString().padStart(2, "0")}
                  onChange={(e) =>
                    handleEndHourChange(parseInt(e.target.value || "0", 10) + 1)
                  }
                />
                <span className="govuk-input__suffix" aria-hidden="true">
                  :59
                </span>
              </div>
            </div>
          </div>
        </fieldset>
      </div>

      <button
        type="button"
        className="govuk-link button-link refine-filters-panel__reset"
        onClick={onResetDefaults}
      >
        Reset to defaults
      </button>

      <div className="refine-filters-panel__actions">
        <button
          type="button"
          className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="govuk-button govuk-!-margin-bottom-0"
          onClick={onClose}
        >
          Apply
        </button>
      </div>
    </div>
  );
};
