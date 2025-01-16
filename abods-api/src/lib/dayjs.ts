import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("en");

export const getDate = (
  date?: string | Date | null,
  format?: string,
): Dayjs => {
  if (format) {
    return dayjs(date, format);
  }
  if (date) {
    return dayjs(date);
  } else {
    return dayjs(new Date());
  }
};

export const getFormattedDate = (
  inputDate: Date | null | undefined,
  format?: string,
): string => {
  return format
    ? getDate(inputDate).tz("Europe/London").format(format)
    : getDate(inputDate).tz("Europe/London").format("YYYY-MM-DDTHH:mm:ssZ");
};

export const getHourFormattedDate = (
  inputDate: Date | null | undefined,
  format?: string,
): string => {
  return format
    ? getDate(inputDate).tz("Europe/London").startOf("hour").format(format)
    : getDate(inputDate)
        .tz("Europe/London")
        .startOf("hour")
        .format("YYYY-MM-DDTHH:mm:ssZ");
};

export const getDayFormattedDate = (
  inputDate: Date | null | undefined,
  format?: string,
): string => {
  return format
    ? getDate(inputDate).tz("Europe/London").startOf("day").format(format)
    : getDate(inputDate)
        .tz("Europe/London")
        .startOf("hour")
        .format("YYYY-MM-DDTHH:mm:ssZ");
};

export const userSelectedDateAsUtc = (isoTimestamp: string) =>
  // Assumption is that the timestamp will be for the date they want in their local time zone
  // Avoid converting that to another timezone, and just grab the date part, ignoring time and offset
  dayjs(isoTimestamp.substring(0, 10));

export const addUkTime = (date: Dayjs, time: string | null | undefined) => {
  const timestamp = date;
  if (!time) {
    return date.utc().toDate();
  }
  const [hours, minutes, _] = time.split(":").map(Number);
  return timestamp
    .tz("Europe/London")
    .set("hour", hours)
    .set("minute", minutes)
    .startOf("minute")
    .utc()
    .toDate();
};
