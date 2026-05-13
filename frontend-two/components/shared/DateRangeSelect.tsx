import { DateRange, RangeKeyDict } from 'react-date-range';
import { useEffect, useRef, useState } from 'react';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import dynamic from "next/dist/shared/lib/dynamic";

const Button = dynamic(
  () => import("kainossoftwareltd-govuk-react-kainos").then((mod) => mod.Button),
  { ssr: false },
);

// Date to string for user output
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// String to date 
function parseLocalDate(str: string): Date {
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Date to string
function toInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DateRangeSelect({ value, onChange }: { value?: { from: string; to: string }; onChange?: (range: { from: string; to: string }) => void }) {
  const [open, setOpen] = useState(false);

  const [range, setRange] = useState([
    {
      startDate: value?.from ? parseLocalDate(value.from) : new Date(),
      endDate: value?.to ? parseLocalDate(value.to) : new Date(),
      key: 'selection'
    }
  ]);
  const [draft, setDraft] = useState(range);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setDraft(range);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, range]);

  const handleCalendarSelect = (ranges: RangeKeyDict) => {
    setDraft([ranges.selection as typeof draft[0]]);
  };

  const handleInputChange = (field: 'startDate' | 'endDate', val: string) => {
    const date = parseLocalDate(val);
    if (!isNaN(date.getTime())) {
      setDraft([{ ...draft[0], [field]: date }]);
    }
  };

  const handleApplyButton = () => {
    setRange(draft);
    onChange && onChange({ from: toInputValue(draft[0].startDate), to: toInputValue(draft[0].endDate) });
    setOpen(false);
  };

  const handleCancelButton = () => {
    setDraft(range);
    setOpen(false);
  };

  return (
    <div className="govuk-form-group date-range-select" ref={ref}>
      <label className="govuk-label">Date Range</label>
      <button
        type="button"
        className="date-range-select__button"
        onClick={() => { setDraft(range); setOpen((v) => !v); }}
      >
        <span className="date-range-select__button-text">{formatDate(range[0].startDate)} - {formatDate(range[0].endDate)}</span>
        <img src="/assets/icons/calendar.svg" alt="" className="date-range-select__icon" />
      </button>

      {open && (
        <div className="date-range-select__panel">
          <div className="date-range-select__inputs">
            <div className="govuk-form-group">
              <label className="govuk-label">Starting</label>
              <input
                className="govuk-input date-range-select__date-input"
                type="date"
                value={toInputValue(draft[0].startDate)}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
              />
            </div>
            <div className="govuk-form-group">
              <label className="govuk-label">Ending</label>
              <input
                className="govuk-input date-range-select__date-input"
                type="date"
                value={toInputValue(draft[0].endDate)}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <DateRange
            editableDateInputs={false}
            onChange={handleCalendarSelect}
            moveRangeOnFirstSelection={false}
            ranges={draft}
            months={2}
            direction="horizontal"
            weekStartsOn={1}
            showDateDisplay={false}
            rangeColors={['#1d70b8']}
          />

          <div className="date-range-select__footer">
            <Button className="govuk-button--secondary" onClick={handleCancelButton}> Cancel </Button>
            <Button onClick={handleApplyButton}> Apply</Button>
          </div>
        </div>
      )}
    </div>
  );
}