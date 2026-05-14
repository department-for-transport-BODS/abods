// import { DateRange, RangeKeyDict } from 'react-date-dateRange';
import { useEffect, useRef, useState } from 'react';
// import 'react-date-dateRange/dist/styles.css';
// import 'react-date-dateRange/dist/theme/default.css';
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

export function DateRangeSelect({ value, onChange }
  : { value?: { from: string; to: string }; onChange?: (dateRange: { from: string; to: string }) => void }) {

  const [openDropdown, setOpenDropdown] = useState(false);
  
  const [dateRange, setDateRange] = useState([
    {
      startDate: value?.from ? parseLocalDate(value.from) : new Date(),
      endDate: value?.to ? parseLocalDate(value.to) : new Date(),
      key: 'selection'
    }
  ]);
  const [draftDateRange, setDraftDateRange] = useState(dateRange);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenDropdown(false);
        setDraftDateRange(dateRange);
      }
    };
    if (openDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown, dateRange]);

  // const handleCalendarSelect = (ranges: RangeKeyDict) => {
  //   setDraftDateRange([ranges.selection as typeof draftDateRange[0]]);
  // };

  const handleInputChange = (field: 'startDate' | 'endDate', val: string) => {
    const date = parseLocalDate(val);
    if (!isNaN(date.getTime())) {
      setDraftDateRange([{ ...draftDateRange[0], [field]: date }]);
    }
  };

  const handleApplyButton = () => {
    setDateRange(draftDateRange);
    onChange && onChange({ from: toInputValue(draftDateRange[0].startDate), to: toInputValue(draftDateRange[0].endDate) });
    setOpenDropdown(false);
  };

  const handleCancelButton = () => {
    setDraftDateRange(dateRange);
    setOpenDropdown(false);
  };

  return (
    <div className="govuk-form-group date-range-select" ref={ref}>
      <label className="govuk-label">Date Range</label>
      <button
        type="button"
        className="date-range-select__button"
        onClick={() => { setDraftDateRange(dateRange); setOpenDropdown((v) => !v); }}
      >
        <span className="date-range-select__button-text">{formatDate(dateRange[0].startDate)} - {formatDate(dateRange[0].endDate)}</span>
        <img src="/assets/icons/calendar.svg" alt="" className="date-range-select__icon" />
      </button>

      {openDropdown && (
        <div className="date-range-select__panel">
          <div className="date-range-select__inputs">
            <div className="govuk-form-group">
              <label className="govuk-label">Starting</label>
              <input
                className="govuk-input date-range-select__date-input"
                type="date"
                value={toInputValue(draftDateRange[0].startDate)}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
              />
            </div>
            <div className="govuk-form-group">
              <label className="govuk-label">Ending</label>
              <input
                className="govuk-input date-range-select__date-input"
                type="date"
                value={toInputValue(draftDateRange[0].endDate)}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
              />
            </div>
          </div>

          {/* <DateRange
            editableDateInputs={false}
            onChange={handleCalendarSelect}
            moveRangeOnFirstSelection={false}
            ranges={draftDateRange}
            months={2}
            direction="horizontal"
            weekStartsOn={1}
            showDateDisplay={false}
            rangeColors={['#1d70b8']}
            showMonthAndYearPickers={true}
            weekdayDisplayFormat="EEE"
          /> */}

          <div className="date-range-select__footer">
            <Button className="govuk-button--secondary" onClick={handleCancelButton}> Cancel </Button>
            <Button onClick={handleApplyButton}> Apply</Button>
          </div>
        </div>
      )}
    </div>
  );
}