import { useEffect, useRef, useState } from "react";
import { DateTime } from "luxon";
import { CalendarIcon } from "@/components/icons/CalendarIcon";
import { DateCalendarMonth } from "@/components/shared/DateCalendarMonth";
import { clsx } from "clsx";
import styles from "./date-range-select.module.scss";
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
  fullWidth?: boolean;
}

export const DateRangeSelect = ({
  label = "Date Range",
  value,
  onChange,
  hideLabel = false,
  fullWidth = false,
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
      draftDateRange.start?.isValid &&
        draftDateRange.start.hasSame(date, "day"),
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
      className={clsx(
        styles.dateRangeSelect,
        fullWidth && styles.fullWidth,
        !hideLabel && "govuk-form-group",
      )}
      ref={ref}
    >
      {!hideLabel && <label className="govuk-label">{label}</label>}
      <button
        type="button"
        className={clsx(styles.button, fullWidth && styles.buttonFullWidth)}
        onClick={() => {
          setDraftDateRange(selectedDateRange);
          if (selectedDateRange.start?.isValid) {
            setMonthLeft(selectedDateRange.start.startOf("month"));
          }
          setOpenDropdown((v) => !v);
        }}
      >
        <span className={styles.buttonText}>{triggerLabel}</span>
        <CalendarIcon className={styles.icon} />
      </button>

      {openDropdown && (
        <div className={styles.panel}>
          <div className={styles.inputs}>
            <div className="govuk-form-group">
              <label className="govuk-label">Starting</label>
              <input
                readOnly={true}
                className={clsx("govuk-input", styles.dateInput)}
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
                className={clsx("govuk-input", styles.dateInput)}
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
          <div className={styles.dateRangeControlsCalendarWrapper}>
            <div className={styles.dateRangeControlsCalendar}>
              <div className={styles.dateRangeControlsCalendarHeader}>
                <button
                  type="button"
                  className={clsx(
                    styles.dateRangeControlsMonthStep,
                    styles.dateRangeControlsMonthStepPrev,
                    prevMonthDisabled &&
                      styles.dateRangeControlsMonthStepDisabled,
                  )}
                  onClick={() =>
                    !prevMonthDisabled &&
                    setMonthLeft((m) => m.minus({ months: 1 }))
                  }
                >
                  ‹
                </button>
                <span
                  className={clsx(
                    styles.dateRangeControlsMonthName,
                    monthLeft.hasSame(today, "month") &&
                      styles.dateRangeControlsMonthNameThisMonth,
                  )}
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
            <div className={styles.dateRangeControlsCalendar}>
              <div className={styles.dateRangeControlsCalendarHeader}>
                <span
                  className={clsx(
                    styles.dateRangeControlsMonthName,
                    monthRight.hasSame(today, "month") &&
                      styles.dateRangeControlsMonthNameThisMonth,
                  )}
                >
                  {monthRight.toFormat("MMM yyyy")}
                </span>
                <button
                  type="button"
                  className={clsx(
                    styles.dateRangeControlsMonthStep,
                    styles.dateRangeControlsMonthStepNext,
                    nextMonthDisabled &&
                      styles.dateRangeControlsMonthStepDisabled,
                  )}
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
          <div className={styles.footer}>
            <button
              type="button"
              className="govuk-button govuk-button--secondary"
              onClick={handleCancelButton}
            >
              Cancel
            </button>
            <button
              type="button"
              className={clsx("govuk-button", styles.apply)}
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
