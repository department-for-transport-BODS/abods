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
import { isApiBypassed } from "@/utils/runtime";

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

const MOCK_OPERATORS: OperatorDashboard[] = [
  {
    name: "Demo Bus Co",
    nocCode: "DEMO",
    operatorId: "demo-operator",
    feedMonitoring: {
      feedStatus: "healthy",
      liveStats: {
        feedErrors: 0,
        feedAlerts: 0,
      },
    },
  },
  {
    name: "City Transit",
    nocCode: "CITY",
    operatorId: "city-operator",
    feedMonitoring: {
      feedStatus: "warnings",
      liveStats: {
        feedErrors: 2,
        feedAlerts: 1,
      },
    },
  },
];

const MOCK_VEHICLES: DashboardVehicles[] = [
  { operatorId: "demo-operator", expected: 120, actual: 113 },
  { operatorId: "city-operator", expected: 80, actual: 77 },
];

const MOCK_PUNCTUALITY: PunctualityOverview = {
  onTime: 84,
  early: 6,
  late: 10,
};

const MOCK_SERVICES: ServicePunctuality[] = [
  {
    nocCode: "DEMO",
    lineId: "line-1",
    lineInfo: {
      serviceId: "svc-1",
      serviceName: "Town Centre to Station",
      serviceNumber: "1",
    },
    onTime: 88,
    early: 5,
    late: 7,
    trend: {
      onTime: 86,
      early: 6,
      late: 8,
    },
  },
  {
    nocCode: "CITY",
    lineId: "line-10",
    lineInfo: {
      serviceId: "svc-10",
      serviceName: "Airport to Riverside",
      serviceNumber: "10",
    },
    onTime: 80,
    early: 7,
    late: 13,
    trend: {
      onTime: 79,
      early: 8,
      late: 13,
    },
  },
];

export const dashboardService = {
  fetchOperators: async (apiUrl: string): Promise<OperatorDashboard[]> => {
    if (isApiBypassed()) {
      return MOCK_OPERATORS;
    }
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
    if (isApiBypassed()) {
      if (!operatorId) {
        return MOCK_VEHICLES;
      }
      return MOCK_VEHICLES.filter((item) => item.operatorId === operatorId);
    }
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
    if (isApiBypassed()) {
      return MOCK_PUNCTUALITY;
    }
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
    if (isApiBypassed()) {
      return MOCK_SERVICES;
    }
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
