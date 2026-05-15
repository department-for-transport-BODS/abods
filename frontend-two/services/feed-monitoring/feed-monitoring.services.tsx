import { graphqlRequest } from "@/services/api";

import {
  FEED_MONITORING_LIST_QUERY,
  OPERATOR_FEED_MONITORING_QUERY,
  OPERATOR_LIVE_STATUS_QUERY,
  OPERATOR_HISTORIC_STATS_QUERY,
  OPERATOR_EVENT_QUERY,
  OPERATOR_EVENT_STATS_QUERY,
} from "@/services/feed-monitoring/feed-monitoring.operations";

import {
    FeedMonitoringOperatorData,
    VehicleStat,
    OperatorLiveStatus,
    OperatorFeedHistory,
    FeedEvent,
    EventStat,
} from "@/types/feed-monitoring";

export const feedMonitoringService = {
  fetchFeedMonitoringList: async ( apiUrl: string ): Promise<FeedMonitoringOperatorData[]> => {
    try {
      const result = await graphqlRequest<{
        operatorsFeedMonitoring: FeedMonitoringOperatorData[];
      }>(apiUrl, FEED_MONITORING_LIST_QUERY);
      return result.operatorsFeedMonitoring ?? [];
    } catch (error) {
      console.error("Failed to fetch feed monitoring list:", error);
      return [];
    }
  },

  fetchOperatorSparklines: async ( apiUrl: string, operatorIds: string[] ): Promise<{ operatorId: string; last24Hours: VehicleStat[] }[]> => {
    try {
      const result = await graphqlRequest<{
        operatorsFeedMonitoring: {
          operatorId: string;
          feedMonitoring?: {
            liveStats?: { last24Hours?: VehicleStat[] | null } | null;
          } | null;
        }[];
      }>(apiUrl, OPERATOR_FEED_MONITORING_QUERY, { operatorIds });
      return (result.operatorsFeedMonitoring ?? []).map((item) => ({
        operatorId: item.operatorId,
        last24Hours: item.feedMonitoring?.liveStats?.last24Hours ?? [],
      }));
    } catch (error) {
      console.error("Failed to fetch operator sparklines:", error);
      return [];
    }
  },

  fetchOperatorLiveStatus: async ( apiUrl: string, operatorId: string ): Promise<OperatorLiveStatus | null> => {
    try {
      const result = await graphqlRequest<{
        operatorFeedMonitoring: OperatorLiveStatus | null;
      }>(apiUrl, OPERATOR_LIVE_STATUS_QUERY, { operatorId });
      return result.operatorFeedMonitoring ?? null;
    } catch (error) {
      console.error("Failed to fetch operator live status:", error);
      return null;
    }
  },

  fetchOperatorHistory: async (
    apiUrl: string,
    operatorId: string,
    date: string,
    start: string,
    end: string,
  ): Promise<OperatorFeedHistory | null> => {
    try {
      const result = await graphqlRequest<{
        operatorFeedMonitoring: OperatorFeedHistory | null;
      }>(apiUrl, OPERATOR_HISTORIC_STATS_QUERY, {
        operatorId,
        date,
        start,
        end,
      });
      return result.operatorFeedMonitoring ?? null;
    } catch (error) {
      console.error("Failed to fetch operator history:", error);
      return null;
    }
  },

  fetchEvents: async (
    apiUrl: string,
    operatorId: string,
    start: string,
    end: string,
  ): Promise<FeedEvent[]> => {
    try {
      const result = await graphqlRequest<{
        events: { items: FeedEvent[] };
      }>(apiUrl, OPERATOR_EVENT_QUERY, { operatorId, start, end });
      return result.events?.items ?? [];
    } catch (error) {
      console.error("Failed to fetch events:", error);
      return [];
    }
  },

  fetchEventStats: async (
    apiUrl: string,
    operatorId: string,
    start: string,
    end: string,
  ): Promise<EventStat[]> => {
    try {
      const result = await graphqlRequest<{
        eventStats: EventStat[];
      }>(apiUrl, OPERATOR_EVENT_STATS_QUERY, { operatorId, start, end });
      return result.eventStats ?? [];
    } catch (error) {
      console.error("Failed to fetch event stats:", error);
      return [];
    }
  },
};
