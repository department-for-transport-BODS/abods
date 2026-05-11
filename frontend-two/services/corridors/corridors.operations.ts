export const CORRIDORS_LIST_QUERY = `query corridorsList {
  corridor {
    corridorList {
      id
      name
      stops {
        stopId
      }
    }
  }
}`;

export const CORRIDORS_STOP_SEARCH_QUERY = `query corridorsStopSearch($inputs: AddFirstStopInputType!) {
  corridor {
    addFirstStop(inputs: $inputs) {
      stopId
      stopName
      lat
      lon
      localityName
      adminAreaId
      sourceId
    }
  }
}`;

export const CORRIDORS_SUBSEQUENT_STOPS_QUERY = `query corridorsSubsequentStops($stopList: [String!]!) {
  corridor {
    addSubsequentStops(stopList: $stopList) {
      stopId
      stopName
      lon
      lat
      localityName
      adminAreaId
      sourceId
    }
  }
}`;

export const GET_CORRIDOR_QUERY = `query getCorridor($corridorId: Int!) {
  corridor {
    getCorridor(corridorId: $corridorId) {
      id
      name
      stops {
        stopId
        sourceId
        stopName
        stopLocation {
          latitude
          longitude
        }
        stopLocality {
          localityName
        }
      }
    }
  }
}`;

export const CREATE_CORRIDOR_MUTATION = `mutation createCorridor($name: String!, $stopIds: [String!]!) {
  createCorridor(payload: { name: $name, stopIds: $stopIds }) {
    success
    error
  }
}`;

export const UPDATE_CORRIDOR_MUTATION = `mutation updateCorridor($inputs: CorridorUpdateInputType!) {
  updateCorridor(inputs: $inputs) {
    success
    error
  }
}`;

export const DELETE_CORRIDOR_MUTATION = `mutation deleteCorridor($corridorId: Int!) {
  deleteCorridor(corridorId: $corridorId) {
    success
    error
  }
}`;

export const CORRIDOR_STATS_QUERY = `query corridorStats($params: CorridorStatsInputType!) {
  corridor {
    stats(inputs: $params) {
      summaryStats {
        totalTransits
        numberOfServices
        averageTransitTime
        scheduledTransits
      }
      transitTimeStats {
        ts
        minTransitTime
        maxTransitTime
        avgTransitTime
        percentile25
        percentile75
      }
      transitTimeTimeOfDayStats {
        hour
        minTransitTime
        maxTransitTime
        avgTransitTime
        percentile25
        percentile75
      }
      transitTimeDayOfWeekStats {
        dow
        minTransitTime
        maxTransitTime
        avgTransitTime
        percentile25
        percentile75
      }
      transitTimePerServiceStats {
        lineName
        servicePatternName
        noc
        operatorName
        totalTransitTime
        recordedTransits
        scheduledTransits
      }
      transitTimeHistogram {
        ts
        hist {
          bin
          freq
        }
      }
      serviceLinks {
        fromStop
        toStop
        distance
        routeValidity
        linkRoute
      }
    }
  }
}`;
