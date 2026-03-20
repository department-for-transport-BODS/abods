export const OPERATOR_LIST_QUERY = `query dashboardOperatorList {
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

export const VEHICLE_COUNTS_QUERY = `query dashboardOperatorVehicleCountsList($operatorId: String) {
  dashboardVehicles(operatorId: $operatorId) {
    operatorId
    expected
    actual
  }
}`;

export const PERFORMANCE_STATS_QUERY = `query dashboardPerformanceStats($params: PerformanceInputType!) {
  onTimePerformance {
    punctualityOverview(inputs: $params) {
      onTime
      late
      early
    }
  }
}`;

export const SERVICE_RANKING_QUERY = `query dashboardServiceRanking(
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
