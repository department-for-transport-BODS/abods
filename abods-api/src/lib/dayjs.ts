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

export const getDBDayValue = (datetime: string | Date) => {
  // Workaround for timezone, daylight savings issues
  // Any iso datetime can be passed in, and we determine the right 'day' value to use
  // When the time passed is a different day in utc to the local time given the offset, this will return the start of that day in utc
  // To be used when a date value needs to be used in a query.
  // Example: 2024-10-25T00:00:00+01:00 is 2024-10-24T23:00:00Z in UTC.
  // This adds the offset to that value, so that when used in a query, our ORM will serialise 2024-10-25 00:00:00 UTC, and return the expected results
  const dateOfJourney = getDate(datetime);
  return dateOfJourney
    .utc()
    .add(dateOfJourney.utcOffset(), "minute")
    .startOf("day")
    .toDate();
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
  return inputDate
    ? getUTCDate(inputDate).tz("Europe/London").toDate()
    : undefined;
};
