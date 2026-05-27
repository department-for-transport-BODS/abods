import gql from "graphql-tag";

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
