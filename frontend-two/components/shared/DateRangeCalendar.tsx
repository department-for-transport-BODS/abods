import { DateTime } from "luxon";
import { Interface } from "readline";

const DAY_NAMES = ["M", "T", "W", "T", "F", "S", "S"];

type CalendarDateRange = { start?: DateTime; end?: DateTime };

type Day = {
  date: DateTime;
  isToday: boolean;
  isSelectable: boolean;
  isSaturday: boolean;
};

// NullDay represents the blank cells at the start of the calendar month
type NullDay = { 
    date: DateTime; 
    isToday: false; 
    isSelectable: false; 
    isSaturday: false 
};

// Calendar component is built as a 2D array of Day/NullDay, which is then rendered as a table
function buildCalendarTable(month: DateTime, today: DateTime, maxDate: DateTime): (Day | NullDay)[][] {
  const start = month.startOf("month");
  const end = month.endOf("month");

  // If month doesn't start on Monday, add blank cells until the first day of the month
  const leadingBlanks: NullDay[] = Array.from({ length: start.weekday - 1 }, () => ({
    date: DateTime.invalid("blank"),
    isToday: false as const,
    isSelectable: false as const,
    isSaturday: false as const,
  }));

  const days: Day[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push({
      date: cursor,
      isToday: cursor.hasSame(today, "day"),
      isSelectable: cursor <= maxDate,
      isSaturday: cursor.weekday === 6,
    });
    cursor = cursor.plus({ days: 1 });
  }

  const allCells = [...leadingBlanks, ...days];
  const table: (Day | NullDay)[][] = [];
  for (let i = 0; i < allCells.length; i += 7) {
    table.push(allCells.slice(i, i + 7));
  }
  return table;
}

interface DateRangeCalendarProps {
  month: DateTime;
  selected: CalendarDateRange;
  onDateChange: (date: DateTime) => void;
}

export const DateRangeCalendar = ({ month, selected, onDateChange }: DateRangeCalendarProps) => {

  const today = DateTime.local().startOf("day");

  // TODO:NOW Check whether users should be able to select today or only yesterday as latest date
  // Check old logic and review. Could be a timezone issue
  const maxDate = today
  const table = buildCalendarTable(month, today, maxDate);

  const inRange = (date: DateTime) =>
    selected.start?.isValid && selected.end?.isValid &&
    date >= selected.start && date <= selected.end;

  const isStart = (date: DateTime) =>
    selected.start?.isValid && selected.start.hasSame(date, "day");

  const isEnd = (date: DateTime) =>
    selected.end?.isValid && selected.end.hasSame(date, "day");

  return (
    <div>
      <div className="date-range-controls__calendar-day-names">
        {DAY_NAMES.map((name, i) => (
          <span
            key={i}
            className={[
              "date-range-controls__day-name",
              i === 5 ? "date-range-controls__day--saturday" : "",
            ].filter(Boolean).join(" ")}
          >
            {name}
          </span>
        ))}
      </div>
      <table className="date-range-controls__table">
        <tbody>
          {table.map((row, i) => (
            <tr key={i}>
              {row.map((day, j) => (
                <td
                  key={j}
                  className={[
                    "date-range-controls__table-cell",
                    day.date.isValid && inRange(day.date) ? "date-range-controls__table-cell--included" : "",
                    day.date.isValid && isStart(day.date) ? "date-range-controls__table-cell--start" : "",
                    day.date.isValid && isEnd(day.date) ? "date-range-controls__table-cell--end" : "",
                  ].filter(Boolean).join(" ")}
                >
                  {day.date.isValid && (
                    <button
                      type="button"
                      className={[
                        "date-range-controls__day",
                        day.isToday ? "date-range-controls__day--today" : "",
                        !day.isSelectable ? "date-range-controls__day--disabled" : "",
                        inRange(day.date) ? "date-range-controls__day--included" : "",
                        isStart(day.date) ? "date-range-controls__day--start" : "",
                        isEnd(day.date) ? "date-range-controls__day--end" : "",
                        day.isSaturday ? "date-range-controls__day--saturday" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => day.isSelectable && onDateChange(day.date)}
                    >
                      {day.date.day}
                    </button>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
