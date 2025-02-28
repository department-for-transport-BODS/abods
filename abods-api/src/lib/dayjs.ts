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

export const standardFormat = (input: Dayjs): string =>
  input.format("YYYY-MM-DDTHH:mm:ssZ");

export const getFormattedDate = (inputDate: Date | null | undefined): string =>
  standardFormat(toUkTime(inputDate));

export const userSelectedDateAsUtc = (isoTimestamp: string) =>
  // Assumption is that the timestamp will be for the date they want in their local time zone
  // Avoid converting that to another timezone, and just grab the date part, ignoring time and offset
  dayjs(isoTimestamp.substring(0, 10));

export const toUkTime = (input: dayjs.ConfigType) =>
  dayjs(input).tz("Europe/London");
