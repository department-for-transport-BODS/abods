import { DateTime } from "luxon";

// ISO date string (YYYY-MM-DD) to relative time (e.g. "2 hours ago")
export function formatISODateStringToRelativeTime(date: string): string {
  if (!date) return "-";
  const relative = DateTime.fromISO(date, { zone: "utc" }).toRelative();
  return relative ?? "-";
}

// DateTime object to ISO date string (YYYY-MM-DD)
export function formatDateToISODateString(date: DateTime): string {
  return date.toFormat("yyyy-MM-dd");
}

// DateTime object to display string (e.g. "06 May 2026")
export function formatDateToDisplayString(date: DateTime): string {
  return date.toFormat("dd MMM yyyy");
}

// DateTime object to short display string (e.g. "06/05/2026")
export function formatDateToShortDisplayString(date: DateTime): string {
  return date.toFormat("dd/MM/yyyy");
}

// ISO date string (YYYY-MM-DD) to DateTime object (local time)
export function formatISODateStringToDate(str: string): DateTime {
  return DateTime.fromISO(str).startOf("day");
}

// Short display string (DD/MM/YYYY) to DateTime object (local time)
export function formatShortDisplayStringToDate(str: string): DateTime {
  return DateTime.fromFormat(str, "dd/MM/yyyy").startOf("day");
}
