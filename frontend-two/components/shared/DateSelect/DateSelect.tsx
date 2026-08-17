import styles from "./date-select.module.scss";

import { useEffect, useId, useRef, useState } from "react";
import { DateTime, Interval } from "luxon";
import { CalendarIcon } from "@/components/icons/CalendarIcon";
import { DateCalendarMonth } from "@/components/shared/DateCalendarMonth";
import { clsx } from "clsx";
import {
  formatDateToISODateString,
  formatISODateStringToDate,
  formatDateToShortDisplayString,
  formatShortDisplayStringToDate,
} from "@/utils/date-formatter";

interface DateSelectProps {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  validRange: Interval;
  error?: string;
  inputId?: string;
}

export const DateSelect = ({
  label = "Date",
  value,
  onChange,
  validRange,
  error,
  inputId,
}: DateSelectProps) => {
  const reactId = useId();
  const resolvedInputId = inputId ?? `date-select-${reactId.replace(/:/g, "")}`;
  const today = DateTime.local().startOf("day");
  const selectedDate = value ? formatISODateStringToDate(value) : null;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(
    selectedDate?.isValid
      ? selectedDate.startOf("month")
      : today.startOf("month"),
  );
  const [draftValue, setDraftValue] = useState(
    selectedDate?.isValid ? formatDateToShortDisplayString(selectedDate) : "",
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nextSelected = value ? formatISODateStringToDate(value) : null;
    setDraftValue(
      nextSelected?.isValid ? formatDateToShortDisplayString(nextSelected) : "",
    );
    if (nextSelected?.isValid) {
      setMonth(nextSelected.startOf("month"));
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const rangeStart = validRange.start?.startOf("day");
  const rangeEnd = validRange.end?.startOf("day");
  const canGoPrev =
    !rangeStart || month.startOf("month") > rangeStart.startOf("month");
  const canGoNext = !rangeEnd || month.endOf("month") < rangeEnd.endOf("month");
  const hasError = Boolean(error);
  const formGroupClass = clsx(styles.container, "govuk-form-group", hasError && "govuk-form-group--error");

  const commitDate = (next: DateTime) => {
    const iso = formatDateToISODateString(next);
    setDraftValue(formatDateToShortDisplayString(next));
    onChange(iso);
    setOpen(false);
  };

  const handleInputChange = (raw: string) => {
    setDraftValue(raw);
    const parsed = formatShortDisplayStringToDate(raw);
    if (!parsed.isValid) return;
    if (!validRange.contains(parsed)) return;
    setMonth(parsed.startOf("month"));
    onChange(formatDateToISODateString(parsed));
  };

  return (
    <div className={formGroupClass} ref={ref}>
      <label className="govuk-label" htmlFor={resolvedInputId}>
        {label}
      </label>
      {hasError ? (
        <p className="govuk-error-message" id={`${resolvedInputId}-error`}>
          <span className="govuk-visually-hidden">Error:</span> {error}
        </p>
      ) : null}
      <div className={styles.inputRow}>
        <input
          className={`govuk-input govuk-input--width-10${hasError ? " govuk-input--error" : ""}`}
          id={resolvedInputId}
          type="text"
          value={draftValue}
          inputMode="numeric"
          placeholder="DD/MM/YYYY"
          autoComplete="off"
          aria-describedby={hasError ? `${resolvedInputId}-error` : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => handleInputChange(event.target.value)}
        />
        <button
          type="button"
          className={`${styles.calendarToggle} unbuttoned`}
          aria-label="Toggle calendar"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <CalendarIcon className={styles.calendarIcon} />
        </button>
      </div>
      {open ? (
        <div className={styles.controls}>
          <div className={styles.calendarHeader}>
            <button
              type="button"
              className={`${styles.monthStep} ${styles.monthStepPrev} unbuttoned${!canGoPrev ? " " + styles.monthStepDisabled : ""}`}
              aria-label="Previous month"
              disabled={!canGoPrev}
              onClick={(event) => {
                event.preventDefault();
                setMonth((current) => current.minus({ months: 1 }));
              }}
            >
              ‹
            </button>
            <span
              className={`${styles.monthName}${month.hasSame(today, "month") ? " " + styles.monthNameCurrent : ""}`}
            >
              {month.toFormat("MMMM yyyy")}
            </span>
            <button
              type="button"
              className={`${styles.monthStep} ${styles.monthStepNext} unbuttoned${!canGoNext ? " " + styles.monthStepDisabled : ""}`}
              aria-label="Next month"
              disabled={!canGoNext}
              onClick={(event) => {
                event.preventDefault();
                setMonth((current) => current.plus({ months: 1 }));
              }}
            >
              ›
            </button>
          </div>
          <DateCalendarMonth
            month={month}
            today={today}
            isSelectable={(date) => validRange.contains(date)}
            isStart={(date) =>
              Boolean(
                selectedDate?.isValid && selectedDate.hasSame(date, "day"),
              )
            }
            isEnd={(date) =>
              Boolean(
                selectedDate?.isValid && selectedDate.hasSame(date, "day"),
              )
            }
            onDateChange={commitDate}
          />
        </div>
      ) : null}
    </div>
  );
};
