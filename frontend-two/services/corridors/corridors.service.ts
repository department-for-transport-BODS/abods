import {
  Corridor,
  CorridorStats,
  CorridorStop,
  CorridorSummary,
  StopLists,
  CorridorStatsViewParams,
  BoxPlotChartDataItem,
  CorridorTimeStats,
} from "@/types/corridors";
import { DateTime, Interval } from "luxon";
import {
  keyBy as _keyBy,
  max as _max,
  mergeWith as _mergeWith,
  min as _min,
  range as _range,
  sortBy as _sortBy,
  values as _values,
} from "lodash-es";
import { apolloClient } from "@/services/apolloClient";
import {
  CorridorGranularity,
  CorridorsListDocument,
  CorridorsListQuery,
  CorridorsStopSearchDocument,
  CorridorsStopSearchQuery,
  CorridorsStopSearchQueryVariables,
  CorridorsSubsequentStopsDocument,
  CorridorsSubsequentStopsQuery,
  CorridorStatsDocument,
  CorridorStatsQuery,
  CorridorStatsQueryVariables,
  CorridorStatsType,
  CorridorUpdateInputType,
  CreateCorridorDocument,
  CreateCorridorMutation,
  DeleteCorridorDocument,
  DeleteCorridorMutation,
  GetCorridorDocument,
  GetCorridorQuery,
  GetCorridorQueryVariables,
  StopInfoType,
  StopType,
  UpdateCorridorDocument,
  UpdateCorridorMutation,
} from "../../src/generated/graphql";
import { nonNullishArray } from "@/utils/array-operators";
import { LngLatBounds } from "mapbox-gl";
import { operatorsService } from "@/services/operator.service";
import {
  formatDayOfWeek,
  formatDayOfWeekShort,
  formatDuration,
  formatMinuteSeconds,
  isoDayOfWeek,
} from "@/utils/date";

export const fillGaps = <T, U, K extends keyof T>(
  key: K,
  data: T[],
  defaultRange: T[K][],
  formatter: (n: T[K]) => U = () => ({}) as U,
  sortKey?: keyof U,
): (T & U)[] => {
  const defaults = defaultRange.map((n) => ({ [key]: n }));
  const completeData = _values(
    _mergeWith(_keyBy(defaults, key), _keyBy(nonNullishArray(data), key)),
  ).map((item) => ({
    ...item,
    ...formatter(item[key]),
  }));
  return sortKey ? _sortBy(completeData, sortKey) : completeData;
};

function* timeSeriesRange(
  interval: Interval,
  granularity: CorridorGranularity,
) {
  let cursor = interval.start!;
  while (cursor <= interval.end!) {
    yield cursor;
    cursor = cursor.plus({ [granularity]: 1 });
  }
}

const granularityFromRange = (
  from: DateTime,
  to: DateTime,
): CorridorGranularity => {
  return Math.abs(to.diff(from, "days").days) < 5
    ? CorridorGranularity.Hour
    : CorridorGranularity.Day;
};

let uniqueId = 0;

function isStopLocation(
  obj: Pick<StopType, "lon" | "lat"> | Pick<StopInfoType, "stopLocation">,
): obj is Pick<StopInfoType, "stopLocation"> {
  return Object.prototype.hasOwnProperty.call(obj, "stopLocation");
}

const toStop: (stop: StopType | StopInfoType) => CorridorStop = ({
  __typename,
  stopId,
  stopName,
  ...stop
}) => ({
  stopId,
  stopName,
  ...(isStopLocation(stop)
    ? {
        lon: stop.stopLocation.longitude,
        lat: stop.stopLocation.latitude,
        localityName: null,
        adminAreaId: null,
        sourceId: null,
      }
    : stop),
  naptan: stop.sourceId ? stop.sourceId : stopId,
  intId: ++uniqueId,
});

const addBoxPlotChartDataItems = (
  stat: CorridorTimeStats & BoxPlotChartDataItem,
) => {
  stat.yAxisMaxValue = stat.maxTransitTime ?? undefined;
  stat.yAxisMinValue = stat.minTransitTime ?? undefined;
  stat.yAxisMeanValue = stat.avgTransitTime ?? undefined;
};

const addBoxPlotData = (stats: CorridorStats): CorridorStats => {
  stats.transitTimeStats.forEach((stat) => {
    addBoxPlotChartDataItems(stat);
  });
  stats.transitTimeDayOfWeekStats.forEach((stat) => {
    addBoxPlotChartDataItems(stat);
  });
  stats.transitTimeTimeOfDayStats.forEach((stat) => {
    addBoxPlotChartDataItems(stat);
  });
  return stats;
};

export const corridorsService = {
  fetchCorridors: async (): Promise<CorridorSummary[] | null> => {
    try {
      const result = await apolloClient.query({
        query: CorridorsListDocument,
        fetchPolicy: "no-cache",
      });

      return nonNullishArray(result.data?.corridor?.corridorList).map(
        ({ stops, ...corridor }) => ({
          ...corridor,
          numStops: nonNullishArray(stops).length,
        }),
      );
    } catch (error) {
      console.warn("Failed to fetch corridors:", error);
      return null;
    }
  },

  fetchCorridorById: async (corridorId: number): Promise<Corridor | null> => {
    try {
      const result = await apolloClient.query({
        query: GetCorridorDocument,
        variables: { corridorId },
        fetchPolicy: "no-cache",
      });

      const corridor = result.data?.corridor?.getCorridor;
      if (!corridor) return null;

      return {
        ...corridor,
        stops: nonNullishArray(corridor.stops).map(toStop),
      };
    } catch (error) {
      console.warn("Failed to fetch corridor by id:", error);
      return null;
    }
  },

  queryStops: async (
    searchString?: string,
    bounds?: LngLatBounds,
  ): Promise<StopLists | null> => {
    try {
      const adminAreaIds = await operatorsService.fetchAdminAreaIds();

      const result = await apolloClient.query({
        query: CorridorsStopSearchDocument,
        variables: {
          inputs: {
            ...(searchString ? { searchString } : {}),
            ...(bounds
              ? {
                  boundingBox: {
                    minLongitude: bounds.getWest(),
                    minLatitude: bounds.getSouth(),
                    maxLongitude: bounds.getEast(),
                    maxLatitude: bounds.getNorth(),
                  },
                }
              : {}),
          },
        },
        fetchPolicy: "no-cache",
      });

      const allStops = nonNullishArray(
        result?.data?.corridor?.addFirstStop,
      ).map(toStop);

      const orgStops = allStops.filter((stop) =>
        adminAreaIds.some((id) => id === stop.adminAreaId),
      );
      const nonOrgStops = allStops.filter((stop) =>
        adminAreaIds.every((id) => id !== stop.adminAreaId),
      );

      return { orgStops, nonOrgStops };
    } catch (error) {
      console.warn("Failed to search corridor stops:", error);
      return null;
    }
  },

  fetchSubsequentStops: async (
    stopList: string[],
  ): Promise<CorridorStop[] | null> => {
    try {
      const result = await apolloClient.query({
        query: CorridorsSubsequentStopsDocument,
        variables: { stopList },
        fetchPolicy: "no-cache",
      });

      return nonNullishArray(result.data?.corridor?.addSubsequentStops).map(
        toStop,
      );
    } catch (error) {
      console.warn("Failed to fetch subsequent corridor stops:", error);
      return null;
    }
  },

  createCorridor: async (name: string, stopIds: string[]): Promise<boolean> => {
    try {
      const result = await apolloClient.mutate({
        mutation: CreateCorridorDocument,
        variables: { name, stopIds },
      });

      if (!result.data?.createCorridor?.success) {
        throw result.data?.createCorridor.error ?? "Unknown error";
      }

      return result.data.createCorridor.success;
    } catch (error) {
      console.warn("Failed to create corridor:", error);
      return false;
    }
  },

  updateCorridor: async (inputs: CorridorUpdateInputType): Promise<boolean> => {
    try {
      const result = await apolloClient.mutate({
        mutation: UpdateCorridorDocument,
        variables: { inputs },
      });

      if (!result.data?.updateCorridor?.success) {
        throw result.data?.updateCorridor.error ?? "Unknown error";
      }

      return result.data.updateCorridor.success;
    } catch (error) {
      console.warn("Failed to update corridor:", error);
      return false;
    }
  },

  deleteCorridor: async (corridorId: number): Promise<boolean> => {
    try {
      const result = await apolloClient.mutate({
        mutation: DeleteCorridorDocument,
        variables: { corridorId },
      });

      if (!result.data?.deleteCorridor?.success) {
        throw result.data?.deleteCorridor.error ?? "Unknown error";
      }

      return result.data.deleteCorridor.success;
    } catch (error) {
      console.warn("Failed to delete corridor:", error);
      return false;
    }
  },

  convertStats(
    stats: CorridorStatsType,
    params: CorridorStatsViewParams,
  ): CorridorStats {
    const timeSeries = nonNullishArray(stats.transitTimeStats);
    const dayOfWeek = nonNullishArray(stats.transitTimeDayOfWeekStats);
    const timeOfDay = nonNullishArray(stats.transitTimeTimeOfDayStats);
    const histogram = nonNullishArray(
      nonNullishArray(stats.transitTimeHistogram)?.[0]?.hist,
    );
    const histBins = histogram.map((h) => h.bin);
    const histRange = _range(_min(histBins) ?? 0, (_max(histBins) ?? 0) + 2);

    return {
      summaryStats: stats.summaryStats ?? {
        totalTransits: 0,
        numberOfServices: 0,
        averageTransitTime: 0,
        scheduledTransits: 0,
      },
      transitTimeStats: fillGaps(
        "ts",
        timeSeries,
        Array.from(
          timeSeriesRange(
            Interval.fromDateTimes(params.from, params.to),
            params.granularity,
          ),
        ).map((dateTime) =>
          dateTime.toISO({ suppressMilliseconds: true }).replace("Z", "+00:00"),
        ),
      ),
      transitTimePerServiceStats: nonNullishArray(
        stats.transitTimePerServiceStats,
      ),
      transitTimeDayOfWeekStats: fillGaps(
        "dow",
        dayOfWeek,
        _range(0, 7),
        (dow) => ({
          category: formatDayOfWeekShort(isoDayOfWeek(dow)),
          binLabel: formatDayOfWeek(isoDayOfWeek(dow)),
          isoDayOfWeek: isoDayOfWeek(dow),
        }),
        "isoDayOfWeek",
      ),
      transitTimeTimeOfDayStats: fillGaps(
        "hour",
        timeOfDay,
        _range(0, 25),
        (hour) => {
          /**
           * This deliberately styles midnight at the start of the day as '00:00' and midnight
           * at the end the day as '24:00' so that amCharts can distinguish the 2 categories
           */
          const startTime = `${hour.toString().padStart(2, "0")}:00`;
          const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;
          return {
            category: startTime,
            binLabel: `${startTime} - ${endTime}`,
          };
        },
      ),
      transitTimeHistogram: fillGaps("bin", histogram, histRange, (bin) => ({
        xAxisCategory: formatMinuteSeconds(Number(bin)),
        xAxisLabel: formatDuration(Number(bin)),
      })),
      serviceLinks: stats.serviceLinks ?? [],
    };
  },

  fetchStats: async (
    params: CorridorStatsViewParams,
  ): Promise<CorridorStats | null> => {
    try {
      const granularity = granularityFromRange(params.from, params.to);

      const result = await apolloClient.query({
        query: CorridorStatsDocument,
        variables: {
          params: {
            corridorId: params.corridorId,
            matchType: params.matchType,
            fromTimestamp: params.from.toISO(),
            toTimestamp: params.to.toISO(),
            granularity,
            stopList: params.stops.map((stop) => stop.naptan),
          },
        },
      });

      if (!result.data?.corridor?.stats) return null;

      const convertedStats = corridorsService.convertStats(
        result.data.corridor.stats,
        {
          ...params,
          granularity,
        },
      );

      return addBoxPlotData(convertedStats);
    } catch (error) {
      console.warn("Failed to fetch corridor stats:", error);
      return null;
    }
  },
};
