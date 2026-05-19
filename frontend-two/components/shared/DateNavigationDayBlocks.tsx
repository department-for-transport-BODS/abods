import { DateTime } from "luxon";
import { DateNavigationHeatmapItem } from "@/types";

// TODO:NOW Check whether we need the heat map to work
export const DateNavigationDayBlocks = ({ stats, date, onDateSelected }: {stats: DateNavigationHeatmapItem[]; date: DateTime; onDateSelected: (date: DateTime) => void;}) => {
  return (
    <div className="datenav__day-blocks datenav__day-blocks--with-labels">
      {stats.map((item) => {
        const isActive = date.hasSame(item.date, "day");
        const isFirstOfMonth = item.date.day === 1;
        const heatClass = item.heat > 0 ? `datenav__item--heat-${item.heat}` : "";

        return (
          <div key={item.date.toISODate()} className="datenav__item-wrapper">
            <button
              className={["datenav__item", heatClass, isActive ? "datenav__item--active" : ""].filter(Boolean).join(" ")}
              onClick={() => onDateSelected(item.date)}
              aria-label={item.date.toFormat("d MMMM")}
            >
              <span className="govuk-visually-hidden">{item.date.toFormat("d MMMM")}</span>
              <span className="datenav__tooltip" aria-hidden="true">{item.date.toFormat("d MMMM")}</span>
            </button>
            {isFirstOfMonth && (
              <span className="datenav__month-label">{item.date.toFormat("MMM")}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
