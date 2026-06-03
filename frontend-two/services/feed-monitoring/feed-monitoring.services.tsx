import { apolloClient } from "@/services/apolloClient";

import {
  EventsDocument,
  EventStatsDocument,
  FeedMonitoringListDocument,
  OperatorHistoricStatsDocument,
  OperatorLiveStatusDocument,
  OperatorSparklineStatsDocument,
} from "../../src/generated/graphql";

import {
    FeedMonitoringOperatorData,
    VehicleStat,
    OperatorLiveStatus,
    OperatorFeedHistory,
    FeedEvent,
    EventStat,
} from "@/types/feed-monitoring";

export const feedMonitoringService = {
  fetchFeedMonitoringList: async (): Promise<FeedMonitoringOperatorData[]> => {
    try {
      const result = await apolloClient.query({
        query: FeedMonitoringListDocument,
      });
      return result.data?.operatorsFeedMonitoring ?? [];
    } catch (error) {
      console.error("Failed to fetch feed monitoring list:", error);
      return [];
    }
  },

  fetchOperatorSparklines: async (operatorIds: string[]): Promise<{ operatorId: string; last24Hours: VehicleStat[] }[]> => {
    try {
      const result = await apolloClient.query({
        query: OperatorSparklineStatsDocument,
        variables: { operatorIds },
      });
      return (result.data?.operatorsFeedMonitoring ?? []).map((item) => ({
        operatorId: item.operatorId,
        last24Hours: item.feedMonitoring?.liveStats?.last24Hours ?? [],
      }));
    } catch (error) {
      console.error("Failed to fetch operator sparklines:", error);
      return [];
    }
  },

  fetchOperatorLiveStatus: async (operatorId: string): Promise<OperatorLiveStatus | null> => {
    try {
      const result = await apolloClient.query({
        query: OperatorLiveStatusDocument,
        variables: { operatorId },
      });
      return result.data?.operatorFeedMonitoring ?? null;
    } catch (error) {
      console.error("Failed to fetch operator live status:", error);
      return null;
    }
  },

  fetchOperatorHistory: async (
    operatorId: string,
    date: string,
    start: string,
    end: string,
  ): Promise<OperatorFeedHistory | null> => {
    try {
      const result = await apolloClient.query({
        query: OperatorHistoricStatsDocument,
        variables: { operatorId, date, start, end },
      });
      return result.data?.operatorFeedMonitoring ?? null;
    } catch (error) {
      console.error("Failed to fetch operator history:", error);
      return null;
    }
  },

  fetchEvents: async (
    operatorId: string,
    start: string,
    end: string,
  ): Promise<FeedEvent[]> => {
    try {
      const result = await apolloClient.query({
        query: EventsDocument,
        variables: { operatorId, start, end },
      });
      return result.data?.events?.items ?? [];
    } catch (error) {
      console.error("Failed to fetch events:", error);
      return [];
    }
  },

  fetchEventStats: async (
    operatorId: string,
    start: string,
    end: string,
  ): Promise<EventStat[]> => {
    try {
      const result = await apolloClient.query({
        query: EventStatsDocument,
        variables: { operatorId, start, end },
      });
      return result.data?.eventStats ?? [];
    } catch (error) {
      console.error("Failed to fetch event stats:", error);
      return [];
    }
  },
};
