import { DateTime } from "luxon";
import { PunctualityOverview, ServiceRankingResult } from "@/types/dashboard";
import { apolloClient } from "@/services/apolloClient";
import {
  DashboardOperatorVehicleCountsListDocument,
  DashboardOperatorVehicleCountsListQuery,
  DashboardOperatorListDocument,
  DashboardOperatorListQuery,
  DashboardPerformanceStatsDocument,
  DashboardPerformanceStatsQuery,
  DashboardServiceRankingQuery,
  DashboardServiceRankingDocument,
  RankingOrder,
  PerformanceFiltersInputType,
  ServicePunctualityType,
  DashboardOperatorListQueryVariables,
  DashboardOperatorVehicleCountsListQueryVariables,
  DashboardPerformanceStatsQueryVariables,
} from "../../src/generated/graphql";
import { ApolloCache, FetchPolicy } from "@apollo/client";

export const dashboardService = {
  fetchOperators: async (): Promise<
    DashboardOperatorListQuery["operatorsFeedMonitoring"]
  > => {
    try {
      const result = await apolloClient.query({
        query: DashboardOperatorListDocument,
      });
      return result.data?.operatorsFeedMonitoring ?? [];
    } catch (error) {
      console.error("Failed to fetch operators:", error);
      return [];
    }
  },
  fetchOperatorVehicleCounts: async (
    operatorId?: string | null,
  ): Promise<DashboardOperatorVehicleCountsListQuery["dashboardVehicles"]> => {
    try {
      const result = await apolloClient.query({
        query: DashboardOperatorVehicleCountsListDocument,
        variables: { operatorId: operatorId ?? undefined },
      });
      return result.data?.dashboardVehicles ?? [];
    } catch (error) {
      console.error("Failed to fetch vehicle counts:", error);
      return [];
    }
  },
  fetchPunctualityStats: async (
    filters: PerformanceFiltersInputType,
    from: DateTime<true>,
    to: DateTime<true>,
  ): Promise<PunctualityOverview | null> => {
    const params = {
      fromTimestamp: from.toISO(),
      toTimestamp: to.toISO(),
      filters,
    };
    try {
      const result = await apolloClient.query({
        query: DashboardPerformanceStatsDocument,
        variables: { params },
        fetchPolicy: "no-cache",
      });
      return result.data?.onTimePerformance?.punctualityOverview ?? null;
    } catch (error) {
      console.error("Failed to fetch punctuality stats:", error);
      return null;
    }
  },
  fetchServiceRanking: async (
    filters: PerformanceFiltersInputType,
    from: DateTime<true>,
    to: DateTime<true>,
    order: RankingOrder,
    trendFrom: DateTime<true>,
    trendTo: DateTime<true>,
  ): Promise<ServiceRankingResult> => {
    const params = {
      fromTimestamp: from.toISO(),
      toTimestamp: to.toISO(),
      order,
      filters,
    };
    try {
      const result = await apolloClient.query({
        query: DashboardServiceRankingDocument,
        variables: {
          params,
          trendFrom: trendFrom.toISO(),
          trendTo: trendTo.toISO(),
        },
        fetchPolicy: "no-cache",
      });
      return result.data?.onTimePerformance?.servicePunctuality ?? [];
    } catch (error) {
      console.error("Failed to fetch service ranking:", error);
      return [];
    }
  },
};
