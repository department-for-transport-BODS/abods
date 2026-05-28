import { graphqlRequest } from "@/services/api";
import {
  Corridor,
  CorridorGranularity,
  CorridorHistogramBin,
  CorridorListItem,
  CorridorServiceStat,
  CorridorStats,
  CorridorStatsParams,
  CorridorStop,
  CorridorSummaryStats,
  CorridorTransitTimeStat,
  CorridorSummary,
  CorridorUpdateInput,
  MatchType,
  ServiceLink,
  StopLists,
} from "@/types/corridors";
import {
  CORRIDOR_STATS_QUERY,
  CORRIDORS_LIST_QUERY,
  CORRIDORS_STOP_SEARCH_QUERY,
  CORRIDORS_SUBSEQUENT_STOPS_QUERY,
  CREATE_CORRIDOR_MUTATION,
  DELETE_CORRIDOR_MUTATION,
  GET_CORRIDOR_QUERY,
  OPERATORS_QUERY,
  UPDATE_CORRIDOR_MUTATION,
} from "@/services/corridors/corridors.operations";
import {
  toFilledDayOfWeekStats,
  toFilledHistogram,
  toFilledTimeOfDayStats,
  toFilledTransitTimeStats,
} from "@/services/corridors/corridors.transforms";
import { DateTime } from "luxon";

interface StopSearchResult {
  stopId: string;
  stopName: string;
  lat: number;
  lon: number;
  localityName: string | null;
  adminAreaId: string | null;
  sourceId: string | null;
}

interface CorridorStopResult {
  stopId: string;
  stopName: string;
  sourceId: string | null;
  stopLocation: {
    latitude: number;
    longitude: number;
  };
  stopLocality: {
    localityName: string | null;
  } | null;
}

interface CorridorStatsResult {
  summaryStats: CorridorSummaryStats | null;
  transitTimeStats: Array<CorridorTransitTimeStat | null> | null;
  transitTimeTimeOfDayStats: Array<CorridorTransitTimeStat | null> | null;
  transitTimeDayOfWeekStats: Array<CorridorTransitTimeStat | null> | null;
  transitTimePerServiceStats: Array<CorridorServiceStat | null> | null;
  transitTimeHistogram: Array<{
    hist: Array<CorridorHistogramBin | null> | null;
  } | null> | null;
  serviceLinks: Array<ServiceLink | null> | null;
}

const toStats = (
  stats: CorridorStatsResult,
  params: CorridorStatsParams,
): CorridorStats => {
  const from = DateTime.fromISO(params.fromTimestamp);
  const to = DateTime.fromISO(params.toTimestamp);

  const transitTimeStats = (stats.transitTimeStats ?? []).filter(
    (item): item is CorridorTransitTimeStat => item !== null,
  );
  const transitTimeTimeOfDayStats = (
    stats.transitTimeTimeOfDayStats ?? []
  ).filter((item): item is CorridorTransitTimeStat => item !== null);
  const transitTimeDayOfWeekStats = (
    stats.transitTimeDayOfWeekStats ?? []
  ).filter((item): item is CorridorTransitTimeStat => item !== null);

  const histogramRaw = (
    (stats.transitTimeHistogram ?? [])[0]?.hist ?? []
  ).filter((item): item is CorridorHistogramBin => item !== null);

  return {
    summaryStats: {
      averageTransitTime: stats.summaryStats?.averageTransitTime ?? null,
      numberOfServices: stats.summaryStats?.numberOfServices ?? null,
      scheduledTransits: stats.summaryStats?.scheduledTransits ?? null,
      totalTransits: stats.summaryStats?.totalTransits ?? null,
    },
    transitTimeStats: toFilledTransitTimeStats(
      transitTimeStats,
      from,
      to,
      params.granularity,
    ),
    transitTimeTimeOfDayStats: toFilledTimeOfDayStats(
      transitTimeTimeOfDayStats,
    ),
    transitTimeDayOfWeekStats: toFilledDayOfWeekStats(
      transitTimeDayOfWeekStats,
    ),
    transitTimeHistogram: toFilledHistogram(histogramRaw),
    transitTimePerServiceStats: (stats.transitTimePerServiceStats ?? []).filter(
      (item): item is CorridorServiceStat => item !== null,
    ),
    serviceLinks: (stats.serviceLinks ?? []).filter(
      (item): item is ServiceLink => item !== null,
    ),
  };
};

const granularityFromRange = (
  fromTimestamp: string,
  toTimestamp: string,
): CorridorGranularity => {
  const from = DateTime.fromISO(fromTimestamp);
  const to = DateTime.fromISO(toTimestamp);
  return Math.abs(to.diff(from, "days").days) < 5 ? "hour" : "day";
};

const toStopFromSearch = (stop: StopSearchResult): CorridorStop => ({
  stopId: stop.stopId,
  stopName: stop.stopName,
  lon: stop.lon,
  lat: stop.lat,
  localityName: stop.localityName,
  adminAreaId: stop.adminAreaId,
  sourceId: stop.sourceId,
  naptan: stop.sourceId ?? stop.stopId,
});

const toStopFromCorridor = (stop: CorridorStopResult): CorridorStop => ({
  stopId: stop.stopId,
  stopName: stop.stopName,
  lon: stop.stopLocation.longitude,
  lat: stop.stopLocation.latitude,
  localityName: stop.stopLocality?.localityName ?? null,
  adminAreaId: null,
  sourceId: stop.sourceId,
  naptan: stop.sourceId ?? stop.stopId,
});

export const corridorsService = {
  fetchCorridors: async (apiUrl: string): Promise<CorridorSummary[] | null> => {
    try {
      const result = await graphqlRequest<{
        corridor: { corridorList: Array<CorridorListItem | null> | null };
      }>(apiUrl, CORRIDORS_LIST_QUERY);
      const list = result.corridor?.corridorList ?? [];
      return list
        .filter((c): c is CorridorListItem => c !== null)
        .map(({ id, name, stops }) => ({
          id,
          name,
          numStops: (stops ?? []).filter((s) => s !== null).length,
        }));
    } catch (error) {
      console.warn("Failed to fetch corridors:", error);
      return null;
    }
  },

  fetchCorridorById: async (
    apiUrl: string,
    corridorId: number,
  ): Promise<Corridor | null> => {
    try {
      const result = await graphqlRequest<{
        corridor: {
          getCorridor: {
            id: number;
            name: string;
            stops: Array<CorridorStopResult | null> | null;
          } | null;
        };
      }>(apiUrl, GET_CORRIDOR_QUERY, { corridorId });

      const corridor = result.corridor?.getCorridor;
      if (!corridor) return null;

      return {
        id: corridor.id,
        name: corridor.name,
        stops: (corridor.stops ?? [])
          .filter((stop): stop is CorridorStopResult => stop !== null)
          .map(toStopFromCorridor),
      };
    } catch (error) {
      console.warn("Failed to fetch corridor by id:", error);
      return null;
    }
  },

  queryStops: async (
    apiUrl: string,
    searchString: string,
  ): Promise<StopLists | null> => {
    try {
      const result = await graphqlRequest<{
        corridor: {
          addFirstStop: Array<StopSearchResult | null> | null;
        };
      }>(apiUrl, CORRIDORS_STOP_SEARCH_QUERY, {
        inputs: { searchString },
      });

      const allStops = (result.corridor?.addFirstStop ?? [])
        .filter((stop): stop is StopSearchResult => stop !== null)
        .map(toStopFromSearch);

      const operatorsResult = await graphqlRequest<{
        operators: Array<{ adminAreaIds: string[] }>;
      }>(apiUrl, OPERATORS_QUERY);
      const adminAreaIds = (operatorsResult.operators ?? []).flatMap(
        (op) => op.adminAreaIds,
      );

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
    apiUrl: string,
    stopList: string[],
  ): Promise<CorridorStop[] | null> => {
    try {
      const result = await graphqlRequest<{
        corridor: {
          addSubsequentStops: Array<StopSearchResult | null> | null;
        };
      }>(apiUrl, CORRIDORS_SUBSEQUENT_STOPS_QUERY, { stopList });

      return (result.corridor?.addSubsequentStops ?? [])
        .filter((stop): stop is StopSearchResult => stop !== null)
        .map(toStopFromSearch);
    } catch (error) {
      console.warn("Failed to fetch subsequent corridor stops:", error);
      return null;
    }
  },

  createCorridor: async (
    apiUrl: string,
    name: string,
    stopIds: string[],
  ): Promise<boolean> => {
    try {
      const result = await graphqlRequest<{
        createCorridor: { success: boolean; error: string | null };
      }>(apiUrl, CREATE_CORRIDOR_MUTATION, { name, stopIds });

      return result.createCorridor.success;
    } catch (error) {
      console.warn("Failed to create corridor:", error);
      return false;
    }
  },

  updateCorridor: async (
    apiUrl: string,
    inputs: CorridorUpdateInput,
  ): Promise<boolean> => {
    try {
      const result = await graphqlRequest<{
        updateCorridor: { success: boolean; error: string | null };
      }>(apiUrl, UPDATE_CORRIDOR_MUTATION, { inputs });

      return result.updateCorridor.success;
    } catch (error) {
      console.warn("Failed to update corridor:", error);
      return false;
    }
  },

  deleteCorridor: async (
    apiUrl: string,
    corridorId: number,
  ): Promise<boolean> => {
    try {
      const result = await graphqlRequest<{
        deleteCorridor: { success: boolean; error: string | null };
      }>(apiUrl, DELETE_CORRIDOR_MUTATION, { corridorId });

      return result.deleteCorridor.success;
    } catch (error) {
      console.warn("Failed to delete corridor:", error);
      return false;
    }
  },

  fetchStats: async (
    apiUrl: string,
    params: Omit<CorridorStatsParams, "granularity"> & {
      granularity?: CorridorGranularity;
      matchType?: MatchType;
    },
  ): Promise<CorridorStats | null> => {
    const payload: CorridorStatsParams = {
      ...params,
      granularity:
        params.granularity ??
        granularityFromRange(params.fromTimestamp, params.toTimestamp),
      matchType: params.matchType ?? "evidenced",
    };

    try {
      const result = await graphqlRequest<{
        corridor: {
          stats: CorridorStatsResult | null;
        };
      }>(apiUrl, CORRIDOR_STATS_QUERY, { params: payload });

      const stats = result.corridor?.stats;
      if (!stats) return null;
      return toStats(stats, payload);
    } catch (error) {
      console.warn("Failed to fetch corridor stats:", error);
      return null;
    }
  },
};
