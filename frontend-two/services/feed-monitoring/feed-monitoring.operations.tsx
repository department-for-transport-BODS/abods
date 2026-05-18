// TODO:NOW: Potential to reduce some of these queries? Or condense
export const FEED_MONITORING_LIST_QUERY = `
  query feedMonitoringList {
    operatorsFeedMonitoring {
      name
      nocCode
      operatorId
      feedMonitoring {
          feedStatus
          availability
          lastOutage
          unavailableSince
          liveStats {
            updateFrequency
          }
      } 
    }
  }
`;

export const OPERATOR_FEED_MONITORING_QUERY = `
  query operatorSparklineStats($operatorIds: [String!]!) {
    operatorsFeedMonitoring(filterBy: { operatorIds: $operatorIds }) {
      nocCode
      operatorId
      feedMonitoring {
        liveStats {
          last24Hours {
              actual
              expected
              timestamp
          }
        }
      }
    }
  }
`;

export const OPERATOR_LIVE_STATUS_QUERY = `
  query operatorLiveStatus($operatorId: String!) {
    operatorFeedMonitoring(operatorId: $operatorId) {
      name
      nocCode 
      operatorId
      feedMonitoring {
          feedStatus
          availability
          lastOutage
          unavailableSince
          liveStats {
              updateFrequency
              currentVehicles
              expectedVehicles
              last24Hours {
                  actual
                  expected
                  timestamp
              }
              last20Minutes {
                  actual
                  expected
                  timestamp
              }
          }
      }
    }
  }
`;

export const OPERATOR_HISTORIC_STATS_QUERY = `
  query operatorHistoricStats( $operatorId: String!, $date: Date!, $start: DateTime!, $end: DateTime!) {
    operatorFeedMonitoring(operatorId: $operatorId) {
      name
      nocCode
      operatorId
      feedMonitoring {
        historicalStats(date: $date) {
          updateFrequency
          availability
        }
        vehicleStats(granularity: minute, start: $start, end: $end) {
          actual
          expected
          timestamp
        }
      }
    }
  }
`;

export const OPERATOR_EVENT_QUERY = `
  events($operatorId: String!, $start: DateTime!, $end: DateTime!) {
    events(operatorId: $operatorId, start: $start, end: $end) {
      items {
          timestamp
          type
          data {
              message
          }
      }
    }
  }
`;

export const OPERATOR_EVENT_STATS_QUERY = `
  query eventStats($operatorId: String!, $start: DateTime!, $end: DateTime!) {
    eventStats(operatorId: $operatorId, start: $start, end: $end) {
      count
      day
    }
  }
`;
