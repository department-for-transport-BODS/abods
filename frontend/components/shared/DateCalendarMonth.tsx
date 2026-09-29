import { DateTime } from "luxon";
import styles from "./date-calendar-month.module.scss";
import { clsx } from "clsx";

const DAY_NAMES = ["M", "T", "W", "T", "F", "S", "S"];

type Day = {
  date: DateTime;
  isToday: boolean;
  isSelectable: boolean;
  isSaturday: boolean;
};

type NullDay = {
  date: DateTime;
  isToday: false;
  isSelectable: false;
  isSaturday: false;
};

const buildCalendarTable = (
  month: DateTime,
  today: DateTime,
  isSelectable: (date: DateTime) => boolean,
): (Day | NullDay)[][] => {
  const start = month.startOf("month");
  const end = month.endOf("month");

  const leadingBlanks: NullDay[] = Array.from(
    { length: start.weekday - 1 },
    () => ({
      date: DateTime.invalid("blank"),
      isToday: false as const,
      isSelectable: false as const,
      isSaturday: false as const,
    }),
  );

  const days: Day[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push({
      date: cursor,
      isToday: cursor.hasSame(today, "day"),
      isSelectable: isSelectable(cursor),
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
};

interface DateCalendarMonthProps {
  month: DateTime;
  today: DateTime;
  isSelectable: (date: DateTime) => boolean;
  onDateChange: (date: DateTime) => void;
  isIncluded?: (date: DateTime) => boolean;
  isStart?: (date: DateTime) => boolean;
  isEnd?: (date: DateTime) => boolean;
}

export const DateCalendarMonth = ({
  month,
  today,
  isSelectable,
  onDateChange,
  isIncluded = () => false,
  isStart = () => false,
  isEnd = () => false,
}: DateCalendarMonthProps) => {
  const table = buildCalendarTable(month, today, isSelectable);

  return (
    <div>
      <div className={styles.calendarDayNames}>
        {DAY_NAMES.map((name, index) => (
          <span
            key={`${name}-${index}`}
            className={clsx(styles.dayName, index === 5 && styles.daySaturday)}
          >
            {name}
          </span>
        ))}
      </div>
      <table className={styles.table}>
        <tbody>
          {table.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((day, cellIndex) => {
                const dayIsValid = day.date.isValid;
                const included = dayIsValid && isIncluded(day.date);
                const start = dayIsValid && isStart(day.date);
                const end = dayIsValid && isEnd(day.date);

                return (
                  <td
                    key={cellIndex}
                    className={clsx(
                      styles.tableCell,
                      included && styles.tableCellIncluded,
                      start && styles.tableCellStart,
                      end && styles.tableCellEnd,
                    )}
                  >
                    {dayIsValid ? (
                      <button
                        type="button"
                        className={clsx(
                          styles.day,
                          day.isToday && styles.dayToday,
                          !day.isSelectable && styles.dayDisabled,
                          included && styles.dayIncluded,
                          start && styles.dayStart,
                          end && styles.dayEnd,
                          day.isSaturday && styles.daySaturday,
                        )}
                        onClick={() => {
                          if (day.isSelectable) {
                            onDateChange(day.date);
                          }
                        }}
                      >
                        {day.date.day}
                      </button>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
