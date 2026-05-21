import { Interval } from "luxon";
import {
  formatDayOfWeek,
  formatDayOfWeekShort,
  formatDuration,
  formatMinuteSeconds,
  isoDayOfWeek,
} from "@/utils/date";
import {
  CorridorGranularity,
  CorridorHistogramBin,
  CorridorTransitTimeStat,
} from "@/types/corridors";

const EMPTY_TRANSIT_TIME: CorridorTransitTimeStat = {
  minTransitTime: 0,
  maxTransitTime: 0,
  avgTransitTime: null,
  percentile25: null,
  percentile75: null,
};

const toIsoRange = (
  from: DateTime,
  to: DateTime,
  granularity: CorridorGranularity,
): string[] => {
  const values: string[] = [];
  const interval = Interval.fromDateTimes(from, to);

  if (!interval.start || !interval.end) return values;

  let cursor = interval.start;
  while (cursor <= interval.end) {
    const iso = cursor.toISO({ suppressMilliseconds: true });
    if (iso) {
      values.push(iso.replace("Z", "+00:00"));
    }
    cursor = cursor.plus({ [granularity]: 1 });
  }

  return values;
};

export const toFilledTransitTimeStats = (
  data: CorridorTransitTimeStat[],
  from: DateTime,
  to: DateTime,
  granularity: CorridorGranularity,
): CorridorTransitTimeStat[] => {
  const byTs = new Map<string, CorridorTransitTimeStat>();
  data.forEach((item) => {
    if (item.ts) {
      byTs.set(item.ts, item);
    }
  });

  return toIsoRange(from, to, granularity).map((ts) => ({
    ...(byTs.get(ts) ?? EMPTY_TRANSIT_TIME),
    ts,
  }));
};

export const toFilledDayOfWeekStats = (
  data: CorridorTransitTimeStat[],
): CorridorTransitTimeStat[] => {
  const byDow = new Map<number, CorridorTransitTimeStat>();
  data.forEach((item) => {
    if (typeof item.dow === "number") {
      byDow.set(item.dow, item);
    }
  });

  return Array.from({ length: 7 }, (_, dow) => {
    const current = byDow.get(dow) ?? EMPTY_TRANSIT_TIME;
    const isoDow = isoDayOfWeek(dow);
    return {
      ...current,
      dow,
      category: formatDayOfWeekShort(isoDow),
      binLabel: formatDayOfWeek(isoDow),
    };
  });
};

export const toFilledTimeOfDayStats = (
  data: CorridorTransitTimeStat[],
): CorridorTransitTimeStat[] => {
  const byHour = new Map<number, CorridorTransitTimeStat>();
  data.forEach((item) => {
    if (typeof item.hour === "number") {
      byHour.set(item.hour, item);
    }
  });

  return Array.from({ length: 25 }, (_, h) => {
    const current = byHour.get(h) ?? EMPTY_TRANSIT_TIME;
    const startTime = `${h.toString().padStart(2, "0")}:00`;
    const endTime = `${(h + 1).toString().padStart(2, "0")}:00`;
    return {
      ...current,
      hour: h,
      category: startTime,
      binLabel: `${startTime} - ${endTime}`,
    };
  });
};

export const toFilledHistogram = (
  histogram: CorridorHistogramBin[],
): CorridorHistogramBin[] => {
  const byBin = new Map<number, CorridorHistogramBin>();
  histogram.forEach((item) => {
    if (typeof item.bin === "number") {
      byBin.set(item.bin, item);
    }
  });

  const bins = histogram
    .map((item) => item.bin)
    .filter((bin): bin is number => typeof bin === "number");

  const minBin = bins.length ? Math.min(...bins) : 0;
  const maxBin = bins.length ? Math.max(...bins) : 0;

  const defaultRange = Array.from(
    { length: maxBin - minBin + 2 },
    (_, i) => minBin + i,
  );

  return defaultRange.map((bin) => {
    const current = byBin.get(bin) ?? { bin, freq: 0 };
    return {
      ...current,
      bin,
      xAxisCategory: formatMinuteSeconds(bin),
      xAxisLabel: formatDuration(bin),
    };
  });
};
