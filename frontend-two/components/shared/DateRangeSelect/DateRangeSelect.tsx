import { useEffect, useRef, useState } from "react";
import { DateTime } from "luxon";
import { CalendarIcon } from "@/components/icons/CalendarIcon";
import { DateCalendarMonth } from "@/components/shared/DateCalendarMonth";
import {
  formatDateToDisplayString,
  formatDateToISODateString,
  formatISODateStringToDate,
} from "@/utils/date-formatter";

type CalendarDateRange = { start?: DateTime; end?: DateTime };

function applyDaySelection(
  date: DateTime,
  draft: CalendarDateRange,
): CalendarDateRange {
  if (draft.start?.isValid && draft.end?.isValid) {
    return { start: date };
  }
  if (!draft.start?.isValid) {
    return { start: date };
  }
  if (date >= draft.start) {
    return { start: draft.start, end: date };
  }
  return { start: date, end: draft.start };
}

interface DateRangeSelectProps {
  label?: string;
  value?: { from: string; to: string };
  onChange?: (dateRange: { from: string; to: string }) => void;
  hideLabel?: boolean;
}

export const DateRangeSelect = ({
  label = "Date Range",
  value,
  onChange,
  hideLabel = false,
}: DateRangeSelectProps) => {
  const today = DateTime.local().startOf("day");
  // maxDate is today: users can select today as end date; DateRangeSelect emits today+1 (exclusive)
  // which the API interprets as inclusive of today.
  const maxDate = today;

  const initialStart = value?.from
    ? formatISODateStringToDate(value.from)
    : today.minus({ days: 7 });
  const initialEndRaw = value?.to
    ? formatISODateStringToDate(value.to).minus({ days: 1 })
    : maxDate;
  const initialEnd = initialEndRaw > maxDate ? maxDate : initialEndRaw;

  const [selectedDateRange, setSelectedDateRange] = useState<CalendarDateRange>(
    {
      start: initialStart,
      end: initialEnd,
    },
  );

  const [draftDateRange, setDraftDateRange] =
    useState<CalendarDateRange>(selectedDateRange);

  const [monthLeft, setMonthLeft] = useState(
    today.minus({ months: 1 }).startOf("month"),
  );
  const monthRight = monthLeft.plus({ months: 1 });

  const [openDropdown, setOpenDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value?.from || !value?.to) return;

    const nextStart = formatISODateStringToDate(value.from);
    const nextEndRaw = formatISODateStringToDate(value.to).minus({ days: 1 });

    if (!nextStart.isValid || !nextEndRaw.isValid) return;

    const nextEnd = nextEndRaw > maxDate ? maxDate : nextEndRaw;
    const sameStart = selectedDateRange.start?.hasSame(nextStart, "day");
    const sameEnd = selectedDateRange.end?.hasSame(nextEnd, "day");

    if (!sameStart || !sameEnd) {
      const nextRange = { start: nextStart, end: nextEnd };
      setSelectedDateRange(nextRange);
      setDraftDateRange(nextRange);
      setMonthLeft(nextStart.startOf("month"));
    }
  }, [
    maxDate,
    selectedDateRange.end,
    selectedDateRange.start,
    value?.from,
    value?.to,
  ]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenDropdown(false);
        setDraftDateRange(selectedDateRange);
      }
    };
    if (openDropdown)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown, selectedDateRange]);

  const handleDaySelect = (date: DateTime) => {
    setDraftDateRange((prev) => applyDaySelection(date, prev));
  };

  const handleInputChange = (field: "start" | "end", val: string) => {
    const date = formatISODateStringToDate(val);
    if (date.isValid) {
      setDraftDateRange((prev) => ({ ...prev, [field]: date }));
    }
  };

  const handleApplyButton = () => {
    if (draftDateRange.start?.isValid && draftDateRange.end?.isValid) {
      const committed = {
        start: draftDateRange.start,
        end: draftDateRange.end,
      };

      setSelectedDateRange(committed);

      onChange &&
        onChange({
          from: formatDateToISODateString(draftDateRange.start),
          to: formatDateToISODateString(draftDateRange.end.plus({ days: 1 })),
        });

      setOpenDropdown(false);
    }
  };

  const handleCancelButton = () => {
    setDraftDateRange(selectedDateRange);
    setOpenDropdown(false);
  };

  const prevMonthDisabled =
    monthLeft.startOf("month") <= today.minus({ years: 5 }).startOf("month");
  const nextMonthDisabled =
    monthRight.startOf("month") >= today.startOf("month");

  const inRange = (date: DateTime) =>
    Boolean(
      draftDateRange.start?.isValid &&
        draftDateRange.end?.isValid &&
        date >= draftDateRange.start &&
        date <= draftDateRange.end,
    );

  const isStart = (date: DateTime) =>
    Boolean(
      draftDateRange.start?.isValid && draftDateRange.start.hasSame(date, "day"),
    );

  const isEnd = (date: DateTime) =>
    Boolean(
      draftDateRange.end?.isValid && draftDateRange.end.hasSame(date, "day"),
    );

  const calendarMaxDate = today.minus({ days: 1 });

  const triggerLabel =
    selectedDateRange.start?.isValid && selectedDateRange.end?.isValid
      ? `${formatDateToDisplayString(selectedDateRange.start)} - ${formatDateToDisplayString(selectedDateRange.end)}`
      : "Select date range";

  return (
    <div
      className={
        hideLabel ? "date-range-select" : "govuk-form-group date-range-select"
      }
      ref={ref}
    >
      {!hideLabel && <label className="govuk-label">{label}</label>}
      <button
        type="button"
        className="date-range-select__button"
        onClick={() => {
          setDraftDateRange(selectedDateRange);
          if (selectedDateRange.start?.isValid) {
            setMonthLeft(selectedDateRange.start.startOf("month"));
          }
          setOpenDropdown((v) => !v);
        }}
      >
        <span className="date-range-select__button-text">{triggerLabel}</span>
        <CalendarIcon className="date-range-select__icon" />
      </button>

      {openDropdown && (
        <div className="date-range-select__panel">
          <div className="date-range-select__inputs">
            <div className="govuk-form-group">
              <label className="govuk-label">Starting</label>
              <input
                readOnly={true}
                className="govuk-input date-range-select__date-input"
                type="date"
                max={formatDateToISODateString(maxDate)}
                value={
                  draftDateRange.start?.isValid
                    ? formatDateToISODateString(draftDateRange.start)
                    : ""
                }
                onChange={(e) => handleInputChange("start", e.target.value)}
              />
            </div>
            <div className="govuk-form-group">
              <label className="govuk-label">Ending</label>
              <input
                readOnly={true}
                className="govuk-input date-range-select__date-input"
                type="date"
                max={formatDateToISODateString(maxDate)}
                value={
                  draftDateRange.end?.isValid
                    ? formatDateToISODateString(draftDateRange.end)
                    : ""
                }
                onChange={(e) => handleInputChange("end", e.target.value)}
              />
            </div>
          </div>
          <div className="date-range-controls__calendar-wrapper">
            <div className="date-range-controls__calendar">
              <div className="date-range-controls__calendar-header">
                <button
                  type="button"
                  className={`date-range-controls__month-step date-range-controls__month-step--prev${prevMonthDisabled ? " date-range-controls__month-step--disabled" : ""}`}
                  onClick={() =>
                    !prevMonthDisabled &&
                    setMonthLeft((m) => m.minus({ months: 1 }))
                  }
                >
                  ‹
                </button>
                <span
                  className={`date-range-controls__month-name${monthLeft.hasSame(today, "month") ? " date-range-controls__month-name--this-month" : ""}`}
                >
                  {monthLeft.toFormat("MMM yyyy")}
                </span>
              </div>
              <DateCalendarMonth
                month={monthLeft}
                today={today}
                isSelectable={(date) => date <= calendarMaxDate}
                isIncluded={inRange}
                isStart={isStart}
                isEnd={isEnd}
                onDateChange={handleDaySelect}
              />
            </div>
            <div className="date-range-controls__calendar">
              <div className="date-range-controls__calendar-header">
                <span
                  className={`date-range-controls__month-name${monthRight.hasSame(today, "month") ? " date-range-controls__month-name--this-month" : ""}`}
                >
                  {monthRight.toFormat("MMM yyyy")}
                </span>
                <button
                  type="button"
                  className={`date-range-controls__month-step date-range-controls__month-step--next${nextMonthDisabled ? " date-range-controls__month-step--disabled" : ""}`}
                  onClick={() =>
                    !nextMonthDisabled &&
                    setMonthLeft((m) => m.plus({ months: 1 }))
                  }
                >
                  ›
                </button>
              </div>
              <DateCalendarMonth
                month={monthRight}
                today={today}
                isSelectable={(date) => date <= calendarMaxDate}
                isIncluded={inRange}
                isStart={isStart}
                isEnd={isEnd}
                onDateChange={handleDaySelect}
              />
            </div>
          </div>
          <div className="date-range-select__footer">
            <button
              type="button"
              className="govuk-button govuk-button--secondary"
              onClick={handleCancelButton}
            >
              Cancel
            </button>
            <button
              type="button"
              className="govuk-button date-range-select__apply"
              disabled={
                !draftDateRange.start?.isValid || !draftDateRange.end?.isValid
              }
              onClick={handleApplyButton}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
