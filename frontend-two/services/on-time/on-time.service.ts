import { DateTime } from "luxon";
import { apolloClient } from "@/services/apolloClient";
import {
  DelayFrequencyType,
  OnTimeDelayFrequencyDocument,
  OnTimeDelayFrequencyQuery,
  OnTimeOperatorPerformanceListDocument,
  OnTimeOperatorPerformanceListQuery,
  OnTimePunctualityDayOfWeekDocument,
  OnTimePunctualityDayOfWeekQuery,
  OnTimePunctualityTimeOfDayDocument,
  OnTimePunctualityTimeOfDayQuery,
  OnTimeServicePerformanceListDocument,
  OnTimeServicePerformanceListQuery,
  OnTimeStatsDocument,
  OnTimeStatsQuery,
  OnTimeStopPerformanceListDocument,
  OnTimeStopPerformanceListQuery,
  OnTimeTimeSeriesDocument,
  OnTimeTimeSeriesQuery,
  OperatorPerformanceType,
  PerformanceFiltersInputType,
  PerformanceInputType,
  PunctualityDayOfWeekType,
  PunctualityTimeOfDayType,
  PunctualityTimeSeriesType,
  PunctualityTotalsType,
  ServiceInfoDocument,
  ServiceInfoQuery,
  ServiceInfoType,
  ServicePerformanceType,
  StopPerformanceType,
} from "../../src/generated/graphql";

export type PerformanceParams = Omit<PerformanceInputType, "filters"> & {
  filters: PerformanceFiltersInputType;
};

export interface OnTimeRatios {
  total: number;
  onTimeRatio: number | null;
  earlyRatio: number | null;
  lateRatio: number | null;
  completedRatio: number | null;
  noData?: number;
}

export type PunctualityOverview = Pick<
  PunctualityTotalsType,
  | "early"
  | "onTime"
  | "late"
  | "completed"
  | "scheduled"
  | "incomplete"
  | "averageDelay"
> & {
  noData: number;
};

export type TimeSeriesData = PunctualityTimeSeriesType & OnTimeRatios;
export type TimeOfDayData = Partial<PunctualityTimeOfDayType> &
  OnTimeRatios & {
    timeOfDay: string;
    tooltipLabel?: string;
  };
export type DayOfWeekData = Partial<
  Omit<PunctualityDayOfWeekType, "dayOfWeek">
> &
  OnTimeRatios & {
    dayOfWeek: string;
    tooltipLabel?: string;
  };

export type ServicePerformance = Omit<ServicePerformanceType, "operatorInfo"> &
  OnTimeRatios;
export type StopPerformance = StopPerformanceType & OnTimeRatios;
export type OperatorPerformance = Pick<
  OperatorPerformanceType,
  "name" | "nocCode" | "onTime" | "late" | "early" | "operatorId" | "averageDelay"
> &
  OnTimeRatios;

// RAA day-of-week format: 1 = Sunday, 2 = Monday, ... ISO weekday: 1 = Monday, ... 7 = Sunday.
const formatDayOfWeek = (dow: number, format = "ccc") => {
  const isoWeekday = (dow === 1 ? 7 : dow - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
  return DateTime.fromObject({ weekday: isoWeekday }).toFormat(format);
};

const assert = <T>(value: T | null | undefined): T => {
  if (value === null || value === undefined) {
    throw new Error("Expected non-null value");
  }
  return value;
};

const range = (start: number, end: number): number[] => {
  const out: number[] = [];
  for (let i = start; i < end; i += 1) out.push(i);
  return out;
};

const keyBy = <T>(items: T[], key: keyof T): Record<string, T> => {
  const out: Record<string, T> = {};
  for (const item of items) {
    out[String(item[key])] = item;
  }
  return out;
};

const calculateOnTimePcts = <
  T extends {
    onTime?: number | null;
    late?: number | null;
    early?: number | null;
  },
>(
  val: T,
): T & OnTimeRatios => {
  const { onTime, late, early } = val;

  let total = 0;
  if (onTime || early || late) {
    total = (onTime ?? 0) + (late ?? 0) + (early ?? 0);
  }

  return {
    ...val,
    total,
    onTimeRatio: (onTime ?? 0) / total || 0,
    lateRatio: (late ?? 0) / total || 0,
    earlyRatio: (early ?? 0) / total || 0,
    completedRatio: 0,
  };
};

const fillDelayFrequencyGaps = (
  data: DelayFrequencyType[],
): DelayFrequencyType[] => {
  if (data.length === 0) return [];
  const sorted = [...data].sort((a, b) => a.bucket - b.bucket);
  const out: DelayFrequencyType[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    for (let b = prev.bucket + 1; b < curr.bucket; b += 1) {
      out.push({ bucket: b, frequency: 0 });
    }
    out.push(curr);
  }
  return out;
};

const fillGaps = <T extends OnTimeRatios>(
  key: keyof T,
  indexes: number[],
  indexer: (n: number) => string | number,
  data: T[],
): T[] => {
  if (data.length === 0) return [];

  const defaults = indexes.map(
    (n) =>
      ({
        [key]: indexer(n),
        noData: 1,
        onTimeRatio: null,
        lateRatio: null,
        earlyRatio: null,
      }) as unknown as T,
  );

  const merged: Record<string, T> = {
    ...keyBy(defaults, key),
    ...keyBy(data, key),
  };
  return Object.values(merged);
};

const fillTimeOfDayGaps = (data: TimeOfDayData[]): TimeOfDayData[] =>
  fillGaps(
    "timeOfDay",
    range(0, 24),
    (hour) => DateTime.fromObject({ hour }).toFormat("HH:mm"),
    data,
  );

const fillDayOfWeekGaps = (data: DayOfWeekData[]): DayOfWeekData[] =>
  fillGaps(
    "dayOfWeek",
    [...range(2, 8), 1],
    (dow) => formatDayOfWeek(dow),
    data,
  );

export const onTimeService = {
  calculateOnTimePcts,

  fetchOnTimeStats: async (
    params: PerformanceParams,
  ): Promise<PunctualityOverview> => {
    const result = await apolloClient.query({
      query: OnTimeStatsDocument,
      variables: { params },
      fetchPolicy: "no-cache",
    });
    const overview = assert(
      result.data?.onTimePerformance?.punctualityOverview,
    );
    return {
      ...overview,
      completed:
        overview.completed || overview.early + overview.onTime + overview.late,
      noData:
        overview.scheduled || overview.completed
          ? Math.max(0, overview.scheduled - overview.completed)
          : NaN,
    };
  },

  fetchOnTimeDelayFrequencyData: async (
    params: PerformanceParams,
  ): Promise<DelayFrequencyType[]> => {
    const result = await apolloClient.query({
      query: OnTimeDelayFrequencyDocument,
      variables: { params },
      fetchPolicy: "no-cache",
    });
    return fillDelayFrequencyGaps(
      assert(result.data?.onTimePerformance?.delayFrequency),
    );
  },

  fetchOnTimeTimeSeriesData: async (
    params: PerformanceParams,
  ): Promise<TimeSeriesData[]> => {
    const result = await apolloClient.query({
      query: OnTimeTimeSeriesDocument,
      variables: { params },
      fetchPolicy: "no-cache",
    });
    return assert(result.data?.onTimePerformance?.punctualityTimeSeries).map(
      (item) => calculateOnTimePcts(item),
    );
  },

  fetchOnTimePunctualityTimeOfDayData: async (
    params: PerformanceParams,
  ): Promise<TimeOfDayData[]> => {
    const result = await apolloClient.query({
      query: OnTimePunctualityTimeOfDayDocument,
      variables: { params },
      fetchPolicy: "no-cache",
    });
    const items = assert(
      result.data?.onTimePerformance?.punctualityTimeOfDay,
    ).map((value) => {
      const time = DateTime.fromISO(value.timeOfDay, {
        zone: "Europe/London",
      });
      const timeOfDay = time.toFormat("HH:mm");
      return {
        ...calculateOnTimePcts(value),
        timeOfDay,
        tooltipLabel: `${timeOfDay} - ${time.plus({ hours: 1 }).toFormat("HH:mm")}`,
      };
    });
    return fillTimeOfDayGaps(items);
  },

  fetchOnTimePunctualityDayOfWeekData: async (
    params: PerformanceParams,
  ): Promise<DayOfWeekData[]> => {
    const result = await apolloClient.query({
      query: OnTimePunctualityDayOfWeekDocument,
      variables: { params },
      fetchPolicy: "no-cache",
    });
    const items = assert(
      result.data?.onTimePerformance?.punctualityDayOfWeek,
    ).map((value) => ({
      ...calculateOnTimePcts(value),
      dayOfWeek: formatDayOfWeek(value.dayOfWeek),
      tooltipLabel: formatDayOfWeek(value.dayOfWeek, "cccc"),
    }));
    return fillDayOfWeekGaps(items);
  },

  fetchOnTimePerformanceList: async (
    params: PerformanceParams,
  ): Promise<ServicePerformance[]> => {
    const result = await apolloClient.query({
      query: OnTimeServicePerformanceListDocument,
      variables: { params },
      fetchPolicy: "no-cache",
    });
    return (result.data?.onTimePerformance?.servicePerformance ?? []).map(
      (item) => calculateOnTimePcts(item),
    );
  },

  fetchStopPerformanceList: async (
    params: PerformanceInputType,
  ): Promise<StopPerformance[]> => {
    const result = await apolloClient.query({
      query: OnTimeStopPerformanceListDocument,
      variables: { params },
      fetchPolicy: "no-cache",
    });
    return (result.data?.onTimePerformance?.stopPerformance ?? []).map((item) =>
      calculateOnTimePcts(item),
    );
  },

  fetchOperatorPerformanceList: async (
    params: PerformanceInputType,
  ): Promise<OperatorPerformance[]> => {
    const result = await apolloClient.query({
      query: OnTimeOperatorPerformanceListDocument,
      variables: { params },
      fetchPolicy: "no-cache",
    });
    const items =
      result.data?.onTimePerformance?.operatorPerformance?.items ?? [];
    return items
      .filter((item): item is NonNullable<typeof item> => item != null)
      .map((item) => calculateOnTimePcts(item));
  },

  fetchServiceInfo: async (lineId: string): Promise<ServiceInfoType> => {
    const result = await apolloClient.query({
      query: ServiceInfoDocument,
      variables: { lineId },
      fetchPolicy: "no-cache",
    });
    return assert(result.data?.serviceInfo);
  },
};
