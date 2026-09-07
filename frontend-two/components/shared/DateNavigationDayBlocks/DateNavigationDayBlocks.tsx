import styles from "./date-navigation-day-blocks.module.scss";

import { DateTime } from "luxon";
import { clsx } from "clsx";

interface DateNavigationDayBlocksProps {
  dateArray: { date: DateTime }[];
  selectedDate: DateTime;
  onDateSelected: (date: DateTime) => void;
}

export const DateNavigationDayBlocks = ({
  dateArray,
  selectedDate,
  onDateSelected,
}: DateNavigationDayBlocksProps) => {
  return (
    <div className={styles.container}>
      {dateArray.map((item) => {
        const isActive = selectedDate.hasSame(item.date, "day");
        const isFirstOfMonth = item.date.day === 1;

        return (
          <div key={item.date.toISODate()} className={styles.itemWrapper}>
            <button
              className={clsx(styles.item, isActive && styles.itemActive)}
              onClick={() => onDateSelected(item.date)}
              aria-label={item.date.toFormat("d MMMM")}
            >
              <span className="govuk-visually-hidden">
                {item.date.toFormat("d MMMM")}
              </span>
            </button>
            <span className={styles.tooltip} aria-hidden="true">
              {item.date.toFormat("d MMMM")}
            </span>
            {isFirstOfMonth && (
              <span className={styles.monthLabel}>
                {item.date.toFormat("MMM")}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
