import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import {
  AdminArea,
  DayOfWeekFlags,
  Line,
  MatchType,
  Operator,
  StopTypeOption,
} from "@/types/stop-analysis";
import { MatchTypeToggle, StopTypeToggle } from "./Toggles";
import { MultiselectCheckbox } from "./MultiselectCheckbox";

interface StopAnalysisFiltersProps {
  fromTimestamp: string;
  toTimestamp: string;
  adminAreaIds: string[];
  operatorIds: string[];
  lineIds: string[];
  matchType: MatchType;
  stopType: StopTypeOption;
  dayOfWeekFlags?: DayOfWeekFlags;
  startTime?: string;
  endTime?: string;
  adminAreas: AdminArea[];
  operators: Operator[];
  lines: Line[];
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onAdminAreasChange: (values: string[]) => void;
  onOperatorsChange: (values: string[]) => void;
  onLinesChange: (values: string[]) => void;
  onMatchTypeChange: (value: MatchType) => void;
  onStopTypeChange: (value: StopTypeOption) => void;
  onDayOfWeekChange: (flags: DayOfWeekFlags | undefined) => void;
  onStartTimeChange: (value: string | undefined) => void;
  onEndTimeChange: (value: string | undefined) => void;
}

export const StopAnalysisFilters = ({
  fromTimestamp,
  toTimestamp,
  adminAreaIds,
  operatorIds,
  lineIds,
  matchType,
  stopType,
  dayOfWeekFlags,
  startTime,
  endTime,
  adminAreas,
  operators,
  lines,
  onFromChange,
  onToChange,
  onAdminAreasChange,
  onOperatorsChange,
  onLinesChange,
  onMatchTypeChange,
  onStopTypeChange,
  onDayOfWeekChange,
  onStartTimeChange,
  onEndTimeChange,
}: StopAnalysisFiltersProps) => {
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
            line.adminAreaIds.some((a) =>
              adminAreaIds.includes(a.toString()),
            ),
        )
        .map((line) => ({
          label: `${line.number}: ${line.name}`,
          value: line.id,
        })),
    [lines, adminAreaIds],
  );

  const fromDate = DateTime.fromISO(fromTimestamp).toISODate() ?? "";
  const toDate = DateTime.fromISO(toTimestamp).toISODate() ?? "";

  const activeChips: string[] = [];
  if (startTime) activeChips.push(`From ${startTime}`);
  if (endTime) activeChips.push(`Until ${endTime}`);
  if (dayOfWeekFlags) {
    const days = Object.entries(dayOfWeekFlags)
      .filter(([, v]) => v)
      .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
    if (days.length > 0 && days.length < 7) {
      activeChips.push(days.join(", "));
    }
  }

  return (
    <div className="stop-analysis-filters">
      <div className="filters govuk-!-margin-bottom-2">
        <div>
          <label className="govuk-label" htmlFor="sa-from-date">
            Date Range
          </label>
          <div className="stop-analysis-filters__date-range">
            <input
              id="sa-from-date"
              className="govuk-input govuk-input--width-10"
              type="date"
              value={fromDate}
              onChange={(e) => {
                const dt = DateTime.fromISO(e.target.value);
                if (dt.isValid) onFromChange(dt.startOf("day").toISO()!);
              }}
            />
            <span className="govuk-body govuk-!-margin-bottom-0"> to </span>
            <input
              id="sa-to-date"
              className="govuk-input govuk-input--width-10"
              type="date"
              value={toDate}
              onChange={(e) => {
                const dt = DateTime.fromISO(e.target.value);
                if (dt.isValid) onToChange(dt.endOf("day").toISO()!);
              }}
            />
          </div>
        </div>

        <MultiselectCheckbox
          id="sa-admin-areas"
          label="Admin Areas"
          options={adminAreaOptions}
          selectedValues={adminAreaIds}
          onChange={onAdminAreasChange}
          showAllLabel="All Areas"
          placeholder="Admin Areas"
        />

        <div className="stop-analysis-filters__toggles">
          <MatchTypeToggle matchType={matchType} onChange={onMatchTypeChange} />
          <StopTypeToggle stopType={stopType} onChange={onStopTypeChange} />
        </div>

        <MultiselectCheckbox
          id="sa-operators"
          label="Operators"
          options={operatorOptions}
          selectedValues={operatorIds}
          onChange={onOperatorsChange}
          showAllLabel="All Operators"
          placeholder="Operators"
        />

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

      <div className="stop-analysis-filters__refine">
        <RefineFilters
          dayOfWeekFlags={dayOfWeekFlags}
          startTime={startTime}
          endTime={endTime}
          onDayOfWeekChange={onDayOfWeekChange}
          onStartTimeChange={onStartTimeChange}
          onEndTimeChange={onEndTimeChange}
        />
        {activeChips.length > 0 && (
          <div className="stop-analysis-filters__chips">
            {activeChips.map((chip) => (
              <span key={chip} className="stop-analysis-filters__chip">
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface RefineFiltersProps {
  dayOfWeekFlags?: DayOfWeekFlags;
  startTime?: string;
  endTime?: string;
  onDayOfWeekChange: (flags: DayOfWeekFlags | undefined) => void;
  onStartTimeChange: (value: string | undefined) => void;
  onEndTimeChange: (value: string | undefined) => void;
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

const RefineFilters = ({
  dayOfWeekFlags,
  startTime,
  endTime,
  onDayOfWeekChange,
  onStartTimeChange,
  onEndTimeChange,
}: RefineFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <>
      <button
        type="button"
        className="govuk-link stop-analysis-filters__refine-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="refine-panel"
      >
        Refine results
      </button>
      {isOpen && (
        <div id="refine-panel" className="stop-analysis-filters__refine-panel">
          <fieldset className="govuk-fieldset">
            <legend className="govuk-fieldset__legend">Day of week</legend>
            <div className="govuk-checkboxes govuk-checkboxes--small">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="govuk-checkboxes__item">
                  <input
                    className="govuk-checkboxes__input"
                    id={`day-${day}`}
                    type="checkbox"
                    checked={dayOfWeekFlags?.[day] ?? true}
                    onChange={() => handleDayToggle(day)}
                  />
                  <label
                    className="govuk-checkboxes__label"
                    htmlFor={`day-${day}`}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="sa-start-time">
              Start time
            </label>
            <input
              id="sa-start-time"
              className="govuk-input govuk-input--width-5"
              type="time"
              value={startTime ?? ""}
              onChange={(e) =>
                onStartTimeChange(e.target.value || undefined)
              }
            />
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="sa-end-time">
              End time
            </label>
            <input
              id="sa-end-time"
              className="govuk-input govuk-input--width-5"
              type="time"
              value={endTime ?? ""}
              onChange={(e) =>
                onEndTimeChange(e.target.value || undefined)
              }
            />
          </div>
        </div>
      )}
    </>
  );
};


