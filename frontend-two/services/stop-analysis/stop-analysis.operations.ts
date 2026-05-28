export const STOP_ANALYSIS_QUERY = `query stopAnalysis(
  $adminAreaIds: [String!]!
  $boundingBox: BoundingBoxInputType!
  $fromTimestamp: String!
  $lineIds: [String!]!
  $matchType: MatchType!
  $operatorIds: [String!]!
  $toTimestamp: String!
  $dayOfWeekFlags: DayOfWeekFlagsInputType
  $startTime: String
  $endTime: String
) {
  stopAnalysis(
    inputs: {
      adminAreaIds: $adminAreaIds
      boundingBox: $boundingBox
      fromTimestamp: $fromTimestamp
      lineIds: $lineIds
      matchType: $matchType
      operatorIds: $operatorIds
      toTimestamp: $toTimestamp
      dayOfWeekFlags: $dayOfWeekFlags
      startTime: $startTime
      endTime: $endTime
    }
  ) {
    atcoCode
    stopName
    localityName
    adminAreaName
    timingPoint
    latitude
    longitude
    early
    late
    onTime
    scheduledDepartures
    completedDepartures
    totalDelay
    onTimeInSeconds
    earlyInSeconds
    lateInSeconds
    averageDelay
    direction
    countDelayed
    averageScheduled
    averageScheduledTimingPoint
    averageActual
    averageActualTimingPoint
  }
}`;

export const OPERATORS_QUERY = `query operators {
  operators {
    name
    nocCode
    operatorId
    adminAreaIds
  }
}`;

export const ADMIN_AREAS_QUERY = `query adminAreas {
  adminAreas {
    id
    name
    shape
  }
}`;

export const LINES_QUERY = `query lines($operatorIds: [String!]!, $inputDate: String!, $endDate: String) {
  lines(operatorIds: $operatorIds, inputDate: $inputDate, endDate: $endDate) {
    id
    name
    number
    adminAreaIds
  }
}`;
