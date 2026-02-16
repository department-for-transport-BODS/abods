import { DateTime } from "luxon";

export type Period = "last7" | "last28" | "lastMonth" | "monthToDate";

export interface WindowDatetimes {
  from: DateTime;
  to: DateTime;
  trendFrom: DateTime;
  trendTo: DateTime;
}

export const calculatePresetPeriod = (preset: Period, now: DateTime): WindowDatetimes => {
  let to = now.startOf("day");
  let from: DateTime;
  let trendTo: DateTime;
  let trendFrom: DateTime;

  switch (preset) {
    case "last7":
      from = to.minus({ days: 7 });
      trendTo = from;
      trendFrom = from.minus({ days: 7 });
      break;
    case "monthToDate":
      from = to.minus({ days: 1 }).startOf("month");
      trendFrom = from.minus({ months: 1 });
      trendTo = to.minus({ months: 1 });
      break;
    case "lastMonth":
      from = to.minus({ months: 1 }).startOf("month");
      to = from.plus({ months: 1 });
      trendTo = from;
      trendFrom = from.minus({ months: 1 });
      break;
    case "last28":
    default:
      from = to.minus({ days: 28 });
      trendTo = from;
      trendFrom = from.minus({ days: 28 });
      break;
  }

  return { from, to, trendFrom, trendTo };
};
