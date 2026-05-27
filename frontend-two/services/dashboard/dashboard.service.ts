import { DateTime } from "luxon";
import { PerformanceCategories, PunctualityOverview } from "@/types/dashboard";
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
} from "../../src/generated/graphql";

export const dashboardService = {
  fetchOperators: async (): Promise<
    DashboardOperatorListQuery["operatorsFeedMonitoring"]
  > => {
    try {
      const result = await apolloClient.query<DashboardOperatorListQuery>({
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
      const result =
        await apolloClient.query<DashboardOperatorVehicleCountsListQuery>({
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
    from: DateTime,
    to: DateTime,
  ): Promise<PunctualityOverview | null> => {
    const params = {
      fromTimestamp: from.toISO(),
      toTimestamp: to.toISO(),
      filters,
    };
    try {
      const result = await apolloClient.query<DashboardPerformanceStatsQuery>({
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
    from: DateTime,
    to: DateTime,
    order: RankingOrder,
    trendFrom: DateTime,
    trendTo: DateTime,
  ): Promise<ServicePunctualityType[]> => {
    const params = {
      fromTimestamp: from.toISO(),
      toTimestamp: to.toISO(),
      order,
      filters,
    };
    try {
      const result = await apolloClient.query<DashboardServiceRankingQuery>({
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
