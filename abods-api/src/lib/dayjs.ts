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

export const getUTCDate = (date?: string | Date): Dayjs => {
  return dayjs.utc(date);
};

export const getBSTDate = (date: Date | Dayjs, format: string): string => {
  return dayjs(date).tz("Europe/London").format(format);
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

export const dbUtcToBstDate = (inputDate: Date | string): string => {
  return getUTCDate(inputDate).tz("Europe/London").format("YYYY-MM-DD");
};

export const utcToBstDBInput = (
  inputDate: Date | string | undefined,
): Date | undefined => {
  return inputDate ? new Date(dbUtcToBstDate(inputDate)) : undefined;
};

export const userLocalDate = (timestamp: string) =>
  new Date(timestamp.substring(0, 10));
