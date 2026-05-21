import { DateTime } from "luxon";

interface DateNavigationDayBlocksProps {
  dateArray: { date: DateTime }[];
  selectedDate: DateTime;
  onDateSelected: (date: DateTime) => void;
}

export const DateNavigationDayBlocks = ({ dateArray, selectedDate, onDateSelected }: DateNavigationDayBlocksProps) => {
  return (
    <div className="datenav__day-blocks datenav__day-blocks--with-labels">
      {dateArray.map((item) => {
        const isActive = selectedDate.hasSame(item.date, "day");
        const isFirstOfMonth = item.date.day === 1;

        return (
          <div key={item.date.toISODate()} className="datenav__item-wrapper">
            <button
              className={["datenav__item", isActive ? "datenav__item--active" : ""].filter(Boolean).join(" ")}
              onClick={() => onDateSelected(item.date)}
              aria-label={item.date.toFormat("d MMMM")}
            >
              <span className="govuk-visually-hidden">{item.date.toFormat("d MMMM")}</span>
            </button>
            <span className="datenav__tooltip" aria-hidden="true">{item.date.toFormat("d MMMM")}</span>
            {isFirstOfMonth && (
              <span className="datenav__month-label">{item.date.toFormat("MMM")}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
