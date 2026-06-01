import { DateTime, Duration } from "luxon";

export const parseDate = (raw: string | null, fallback: DateTime): DateTime => {
  if (!raw) return fallback;
  const parsed = DateTime.fromISO(raw, { zone: "utc" });
  return parsed.isValid ? parsed : fallback;
};

export const toIsoDateInput = (dateTime: DateTime): string =>
  dateTime.toISODate() ?? DateTime.utc().toISODate()!;

export const formatTransitTime = (
  seconds: number | null | undefined,
): string => {
  if (!seconds || seconds <= 0) return "Unavailable";
  return Duration.fromObject({ seconds }).toFormat("mm:ss");
};

export const formatMinuteSeconds = (minute: number) =>
  Duration.fromObject({ minute }).toFormat("m:ss");

export const formatDuration = (minute: number) => {
  const min = Duration.fromObject({ minute });
  return `${min.toFormat("m:ss")} - ${min.plus({ seconds: 59 }).toFormat("m:ss")}`;
};

export const formatDayOfWeekShort = (weekday: number) =>
  DateTime.fromObject({
    weekday: weekday as 1 | 2 | 3 | 4 | 5 | 6 | 7,
  }).toFormat("ccc");

export const formatDayOfWeek = (weekday: number) =>
  DateTime.fromObject({
    weekday: weekday as 1 | 2 | 3 | 4 | 5 | 6 | 7,
  }).toFormat("cccc");

export const isoDayOfWeek = (dow: number) => (dow === 0 ? 7 : dow);
