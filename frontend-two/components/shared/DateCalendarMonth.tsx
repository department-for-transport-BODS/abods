import { DateTime } from "luxon";

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
      <div className="date-range-controls__calendar-day-names">
        {DAY_NAMES.map((name, index) => (
          <span
            key={`${name}-${index}`}
            className={[
              "date-range-controls__day-name",
              index === 5 ? "date-range-controls__day--saturday" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {name}
          </span>
        ))}
      </div>
      <table className="date-range-controls__table">
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
                    className={[
                      "date-range-controls__table-cell",
                      included
                        ? "date-range-controls__table-cell--included"
                        : "",
                      start ? "date-range-controls__table-cell--start" : "",
                      end ? "date-range-controls__table-cell--end" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {dayIsValid ? (
                      <button
                        type="button"
                        className={[
                          "date-range-controls__day",
                          day.isToday ? "date-range-controls__day--today" : "",
                          !day.isSelectable
                            ? "date-range-controls__day--disabled"
                            : "",
                          included ? "date-range-controls__day--included" : "",
                          start ? "date-range-controls__day--start" : "",
                          end ? "date-range-controls__day--end" : "",
                          day.isSaturday
                            ? "date-range-controls__day--saturday"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
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
