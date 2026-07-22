import { DateTime } from "luxon";

function formatCsvDate(timestamp: string) {
  return DateTime.fromISO(timestamp).toFormat("yy-MM-dd");
}

function formatInclusiveToDate(timestamp: string) {
  return DateTime.fromISO(timestamp).minus({ minute: 1 }).toFormat("yy-MM-dd");
}

export function formatServicePerformanceCsvFilename({
  nocCode,
  fromTimestamp,
  toTimestamp,
}: {
  nocCode: string;
  fromTimestamp: string;
  toTimestamp: string;
}) {
  return `Service_Performance_${nocCode}_${formatCsvDate(fromTimestamp)}_-_${formatInclusiveToDate(toTimestamp)}`;
}

export function formatStopPerformanceCsvFilename({
  lineId,
  fromTimestamp,
  toTimestamp,
}: {
  lineId: string;
  fromTimestamp: string;
  toTimestamp: string;
}) {
  return `Stop_Performance_${lineId}_${formatCsvDate(fromTimestamp)}_-_${formatInclusiveToDate(toTimestamp)}`;
}
