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

const OPERATOR_LIST_QUERY = `query dashboardOperatorList {
  operatorsFeedMonitoring {
    name
    nocCode
    operatorId
    feedMonitoring {
      feedStatus
      liveStats {
        feedErrors
        feedAlerts
      }
    }
  }
}`;

const VEHICLE_COUNTS_QUERY = `query dashboardOperatorVehicleCountsList($operatorId: String) {
  dashboardVehicles(operatorId: $operatorId) {
    operatorId
    expected
    actual
  }
}`;

const PERFORMANCE_STATS_QUERY = `query dashboardPerformanceStats($params: PerformanceInputType!) {
  onTimePerformance {
    punctualityOverview(inputs: $params) {
      onTime
      late
      early
    }
  }
}`;

const SERVICE_RANKING_QUERY = `query dashboardServiceRanking(
  $params: ServicePerformanceInputType!
  $trendFrom: DateTime!
  $trendTo: DateTime!
) {
  onTimePerformance {
    servicePunctuality(inputs: $params) {
      nocCode
      lineId
      lineInfo {
        serviceId
        serviceName
        serviceNumber
      }
      onTime
      early
      late
      trend(fromTimestamp: $trendFrom, toTimestamp: $trendTo) {
        onTime
        early
        late
      }
    }
  }
}`;

export const dashboardService = {
  fetchOperators: async (apiUrl: string): Promise<OperatorDashboard[]> => {
    try {
      const result = await graphqlRequest<{ operatorsFeedMonitoring: OperatorDashboard[] }>(
        apiUrl,
        OPERATOR_LIST_QUERY,
      );
      return result.operatorsFeedMonitoring ?? [];
    } catch {
      return [];
    }
  },
  fetchVehicleCounts: async (
    apiUrl: string,
    operatorId?: string | null,
  ): Promise<DashboardVehicles[]> => {
    try {
      const result = await graphqlRequest<{ dashboardVehicles: DashboardVehicles[] }>(
        apiUrl,
        VEHICLE_COUNTS_QUERY,
        { operatorId: operatorId ?? undefined },
      );
      return result.dashboardVehicles ?? [];
    } catch {
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
      const result = await graphqlRequest<{ onTimePerformance?: { punctualityOverview?: PunctualityOverview | null } | null }>(
        apiUrl,
        PERFORMANCE_STATS_QUERY,
        { params },
      );
      return result.onTimePerformance?.punctualityOverview ?? null;
    } catch {
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
      const result = await graphqlRequest<{ onTimePerformance?: { servicePunctuality?: ServicePunctuality[] | null } | null }>(
        apiUrl,
        SERVICE_RANKING_QUERY,
        {
          params,
          trendFrom: trendFrom.toISO(),
          trendTo: trendTo.toISO(),
        },
      );
      return result.onTimePerformance?.servicePunctuality ?? [];
    } catch {
      return [];
    }
  },
};
