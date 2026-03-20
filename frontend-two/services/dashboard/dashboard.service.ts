import { DateTime } from "luxon";
import { graphqlRequest } from "@/services/api";
import {
  DashboardVehicles,
  OperatorDashboard,
  PerformanceFiltersInputType,
  PunctualityOverview,
  RankingOrder,
  ServicePunctuality,
} from "@/types/dashboard";
import {
  OPERATOR_LIST_QUERY,
  PERFORMANCE_STATS_QUERY,
  SERVICE_RANKING_QUERY,
  VEHICLE_COUNTS_QUERY,
} from "@/services/dashboard/dashboard.operations";

export const dashboardService = {
  fetchOperators: async (apiUrl: string): Promise<OperatorDashboard[]> => {
    try {
      const result = await graphqlRequest<{
        operatorsFeedMonitoring: OperatorDashboard[];
      }>(apiUrl, OPERATOR_LIST_QUERY);
      return result.operatorsFeedMonitoring ?? [];
    } catch (error) {
      console.error("Failed to fetch operators:", error);
      return [];
    }
  },
  fetchVehicleCounts: async (
    apiUrl: string,
    operatorId?: string | null,
  ): Promise<DashboardVehicles[]> => {
    try {
      const result = await graphqlRequest<{
        dashboardVehicles: DashboardVehicles[];
      }>(apiUrl, VEHICLE_COUNTS_QUERY, { operatorId: operatorId ?? undefined });
      return result.dashboardVehicles ?? [];
    } catch (error) {
      console.error("Failed to fetch vehicle counts:", error);
      return [];
    }
  },
  fetchPunctualityStats: async (
    apiUrl: string,
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
      const result = await graphqlRequest<{
        onTimePerformance?: {
          punctualityOverview?: PunctualityOverview | null;
        } | null;
      }>(apiUrl, PERFORMANCE_STATS_QUERY, { params });
      return result.onTimePerformance?.punctualityOverview ?? null;
    } catch (error) {
      console.error("Failed to fetch punctuality stats:", error);
      return null;
    }
  },
  fetchServiceRanking: async (
    apiUrl: string,
    filters: PerformanceFiltersInputType,
    from: DateTime,
    to: DateTime,
    order: RankingOrder,
    trendFrom: DateTime,
    trendTo: DateTime,
  ): Promise<ServicePunctuality[]> => {
    const params = {
      fromTimestamp: from.toISO(),
      toTimestamp: to.toISO(),
      order,
      filters,
    };
    try {
      const result = await graphqlRequest<{
        onTimePerformance?: {
          servicePunctuality?: ServicePunctuality[] | null;
        } | null;
      }>(apiUrl, SERVICE_RANKING_QUERY, {
        params,
        trendFrom: trendFrom.toISO(),
        trendTo: trendTo.toISO(),
      });
      return result.onTimePerformance?.servicePunctuality ?? [];
    } catch (error) {
      console.error("Failed to fetch service ranking:", error);
      return [];
    }
  },
};
