/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { CorridorGranularity } from './schema';
import { Direction } from './schema';
import { FeatureFlag } from './schema';
import { Granularity } from './schema';
import { MatchType } from './schema';
import { OtpEnum } from './schema';
import { RankingOrder } from './schema';
import { RouteType } from './schema';
import { StopsSegment } from './schema';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export * from "./schema";
export type AddFirstStopInputType = {
  adminAreaIds?: Array<string> | null | undefined;
  boundingBox?: BoundingBoxInputType | null | undefined;
  searchString?: string | null | undefined;
};

export type BoundingBoxInputType = {
  maxLatitude: number;
  maxLongitude: number;
  minLatitude: number;
  minLongitude: number;
};

export { CorridorGranularity };

export type CorridorStatsInputType = {
  corridorId: string;
  fromTimestamp: string;
  granularity: CorridorGranularity;
  matchType: MatchType;
  stopList: Array<string>;
  toTimestamp: string;
};

export type CorridorUpdateInputType = {
  id: number;
  name: string;
  stopList: Array<string>;
};

export type DayOfWeekFlagsInputType = {
  friday: boolean;
  monday: boolean;
  saturday: boolean;
  sunday: boolean;
  thursday: boolean;
  tuesday: boolean;
  wednesday: boolean;
};

export { Direction };

export type DistancesFilterInput = {
  adminAreaIds?: Array<string> | null | undefined;
  fromTimestamp: string;
  licenseIds?: Array<string> | null | undefined;
  nocLineAndServiceCodes?: Array<string> | null | undefined;
  operatorIds?: Array<string> | null | undefined;
  orgId?: string | null | undefined;
  toTimestamp: string;
};

export { FeatureFlag };

export type FrequentServiceInfoFilterType = {
  dayOfWeekFlags?: DayOfWeekFlagsInputType | null | undefined;
  endTime?: string | null | undefined;
  lineId?: string | null | undefined;
  noc?: string | null | undefined;
  operatorId?: string | null | undefined;
  startTime?: string | null | undefined;
};

export type FrequentServiceInfoInputType = {
  filters: FrequentServiceInfoFilterType;
  fromTimestamp: string;
  toTimestamp: string;
};

export { Granularity };

export type HeadwayFiltersInputType = {
  dayOfWeekFlags?: DayOfWeekFlagsInputType | null | undefined;
  endTime?: string | null | undefined;
  granularity?: Granularity | null | undefined;
  lineIds?: Array<string> | null | undefined;
  matchType?: MatchType | null | undefined;
  nocCodes?: Array<string> | null | undefined;
  operatorIds?: Array<string> | null | undefined;
  startTime?: string | null | undefined;
};

export type HeadwayInputType = {
  filters: HeadwayFiltersInputType;
  fromTimestamp: string;
  toTimestamp: string;
};

export { MatchType };

export { OtpEnum };

export type PagingInputType = {
  after: number;
  first: number;
};

export type PerformanceFiltersInputType = {
  addNonTagged?: boolean | null | undefined;
  adminAreaIds?: Array<string> | null | undefined;
  dayOfWeekFlags?: DayOfWeekFlagsInputType | null | undefined;
  direction?: Array<Direction | null | undefined> | null | undefined;
  endTime?: string | null | undefined;
  excludeItoLineId?: string | null | undefined;
  excludedDates?: Array<string> | null | undefined;
  granularity?: Granularity | null | undefined;
  lineIds?: Array<string> | null | undefined;
  matchType?: MatchType | null | undefined;
  maxDelay?: number | null | undefined;
  minDelay?: number | null | undefined;
  nocCodes?: Array<string> | null | undefined;
  onTimeMaxMinutes?: number | null | undefined;
  onTimeMinMinutes?: number | null | undefined;
  operatorIds?: Array<string> | null | undefined;
  startTime?: string | null | undefined;
  startTimes?: Array<string> | null | undefined;
  stopsSegment?: StopsSegment | null | undefined;
  tagIds?: Array<number> | null | undefined;
  timingPointsOnly?: boolean | null | undefined;
};

export type PerformanceInputType = {
  filters: PerformanceFiltersInputType;
  fromTimestamp: string;
  paging?: PagingInputType | null | undefined;
  toTimestamp: string;
};

export { RankingOrder };

export { RouteType };

export type ServicePerformanceFiltersInputType = {
  operatorIds?: Array<string> | null | undefined;
  timingPointsOnly?: boolean | null | undefined;
};

export type ServicePerformanceInputType = {
  filters: ServicePerformanceFiltersInputType;
  fromTimestamp: string;
  order: RankingOrder;
  toTimestamp: string;
};

export { StopsSegment };

export type LoginMutationVariables = Exact<{
  username: string;
  password: string;
}>;


export type LoginMutation = { login: { success: boolean, expiresAt: string | null, maxAttempts: number | null, unlockAt: string | null, failedAttempts: number | null, locked: boolean | null } | null };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { logout: boolean };

export type UserQueryVariables = Exact<{ [key: string]: never; }>;


export type UserQuery = { user: { currentUserId: string, canViewServiceMonitoring: boolean, canEditAllAlerts: boolean, canViewDistances: boolean, serviceMonitoringEmbedUrl: string | null, flags: Array<FeatureFlag> } | null };

export type CorridorsStopSearchQueryVariables = Exact<{
  inputs: AddFirstStopInputType;
}>;


export type CorridorsStopSearchQuery = { corridor: { addFirstStop: Array<{ stopId: string, stopName: string, lat: number, lon: number, localityName: string | null, adminAreaId: string | null, sourceId: string | null }> } | null };

export type CorridorsSubsequentStopsQueryVariables = Exact<{
  stopList: Array<string> | string;
}>;


export type CorridorsSubsequentStopsQuery = { corridor: { addSubsequentStops: Array<{ stopId: string, stopName: string, lon: number, lat: number, localityName: string | null, adminAreaId: string | null, sourceId: string | null }> } | null };

export type CorridorsListQueryVariables = Exact<{ [key: string]: never; }>;


export type CorridorsListQuery = { corridor: { corridorList: Array<{ id: number, name: string, stops: Array<{ stopId: string }> }> } | null };

export type GetCorridorQueryVariables = Exact<{
  corridorId: number;
}>;


export type GetCorridorQuery = { corridor: { getCorridor: { id: number, name: string, stops: Array<{ stopId: string, sourceId: string | null, stopName: string, stopLocation: { latitude: number, longitude: number }, stopLocality: { localityId: string | null, localityName: string | null, localityAreaId: string | null, localityAreaName: string | null } }> } | null } | null };

export type CorridorStatsQueryVariables = Exact<{
  params: CorridorStatsInputType;
}>;


export type CorridorStatsQuery = { corridor: { stats: { summaryStats: { totalTransits: number | null, numberOfServices: number | null, averageTransitTime: number | null, scheduledTransits: number | null } | null, transitTimeStats: Array<{ ts: string | null, minTransitTime: number, maxTransitTime: number, avgTransitTime: number | null, percentile25: number | null, percentile75: number | null }>, transitTimeTimeOfDayStats: Array<{ hour: number, minTransitTime: number, maxTransitTime: number, avgTransitTime: number | null, percentile25: number | null, percentile75: number | null }>, transitTimeDayOfWeekStats: Array<{ dow: number, minTransitTime: number, maxTransitTime: number, avgTransitTime: number | null, percentile25: number | null, percentile75: number | null }>, transitTimePerServiceStats: Array<{ lineName: string, servicePatternName: string, noc: string | null, operatorName: string | null, totalTransitTime: number | null, recordedTransits: number | null, scheduledTransits: number | null }>, transitTimeHistogram: Array<{ ts: string | null, hist: Array<{ bin: number | null, freq: number | null }> }>, serviceLinks: Array<{ fromStop: string, toStop: string, distance: number, routeValidity: RouteType, linkRoute: string | null }> } | null } | null };

export type CreateCorridorMutationVariables = Exact<{
  name: string;
  stopIds: Array<string> | string;
}>;


export type CreateCorridorMutation = { createCorridor: { success: boolean, error: string | null } };

export type DeleteCorridorMutationVariables = Exact<{
  corridorId: number;
}>;


export type DeleteCorridorMutation = { deleteCorridor: { success: boolean, error: string | null } };

export type UpdateCorridorMutationVariables = Exact<{
  inputs: CorridorUpdateInputType;
}>;


export type UpdateCorridorMutation = { updateCorridor: { error: string | null, success: boolean } };

export type OperatorDashboardFragment = { name: string, nocCode: string, operatorId: string, feedMonitoring: { feedStatus: boolean | null, liveStats: { feedErrors: number | null, feedAlerts: number | null } | null } | null };

export type DashboardOperatorListQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardOperatorListQuery = { operatorsFeedMonitoring: Array<{ name: string, nocCode: string, operatorId: string, feedMonitoring: { feedStatus: boolean | null, liveStats: { feedErrors: number | null, feedAlerts: number | null } | null } | null }> };

export type DashboardOperatorVehicleCountsListQueryVariables = Exact<{
  operatorId?: string | null | undefined;
}>;


export type DashboardOperatorVehicleCountsListQuery = { dashboardVehicles: Array<{ operatorId: string, expected: number, actual: number }> };

export type DashboardPerformanceStatsQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type DashboardPerformanceStatsQuery = { onTimePerformance: { punctualityOverview: { onTime: number, late: number, early: number } | null } | null };

export type DashboardServiceRankingQueryVariables = Exact<{
  params: ServicePerformanceInputType;
  trendFrom: string;
  trendTo: string;
}>;


export type DashboardServiceRankingQuery = { onTimePerformance: { servicePunctuality: Array<{ nocCode: string | null, lineId: string | null, onTime: number | null, early: number | null, late: number | null, lineInfo: { serviceId: string, serviceName: string, serviceNumber: string } | null, trend: { onTime: number | null, early: number | null, late: number | null } | null }> } | null };

export type DashboadEmbeddedUrlQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboadEmbeddedUrlQuery = { embeddedUrl: { enabled: boolean, url: string | null } };

export type UserOrganisationsQueryVariables = Exact<{ [key: string]: never; }>;


export type UserOrganisationsQuery = { userOrgs: Array<{ name: string, id: number }> };

export type OrgOperatorListQueryVariables = Exact<{
  orgId: number;
}>;


export type OrgOperatorListQuery = { operators: Array<{ name: string, nocCode: string }> };

export type DistancesListQueryVariables = Exact<{
  filterBy: DistancesFilterInput;
}>;


export type DistancesListQuery = { distances: Array<{ operatorId: string, operatorName: string, nocLineAndServiceCode: string, lineName: string, serviceName: string | null, distance: number | null, avlDistance: number | null }> };

export type DistancesDropdownInputQueryVariables = Exact<{ [key: string]: never; }>;


export type DistancesDropdownInputQuery = { distancesDropdowns: { operators: Array<{ id: string, name: string, licenses: Array<{ id: string, services: Array<{ id: string, name: string, line: string }> | null }> | null }> | null } };

export type AdminOrgListQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminOrgListQuery = { adminOrgMap: Array<{ adminAreaId: number, adminName: string | null, operatorId: string, orgId: number, orgName: string | null }> };

export type EventFragment = { timestamp: string, type: string, data: { message: string } };

export type EventsQueryVariables = Exact<{
  operatorId: string;
  start: string;
  end: string;
}>;


export type EventsQuery = { events: { items: Array<{ timestamp: string, type: string, data: { message: string } }> } | null };

export type EventStatsQueryVariables = Exact<{
  operatorId: string;
  start: string;
  end: string;
}>;


export type EventStatsQuery = { eventStats: Array<{ count: number, day: string }> };

export type VehicleStatFragment = { actual: number, expected: number, timestamp: string };

export type BasicOperatorFragment = { name: string, nocCode: string, operatorId: string, feedMonitoring: { feedStatus: boolean | null, availability: number | null, lastOutage: string | null, unavailableSince: string | null, liveStats: { updateFrequency: number | null } | null } | null };

export type OperatorLiveStatusFragment = { name: string, nocCode: string, operatorId: string, feedMonitoring: { feedStatus: boolean | null, availability: number | null, lastOutage: string | null, unavailableSince: string | null, liveStats: { updateFrequency: number | null, currentVehicles: number | null, expectedVehicles: number | null, last24Hours: Array<{ actual: number, expected: number, timestamp: string }> | null, last20Minutes: Array<{ actual: number, expected: number, timestamp: string }> | null } | null } | null };

export type OperatorFeedHistoryFragment = { name: string, nocCode: string, operatorId: string, feedMonitoring: { historicalStats: { updateFrequency: number | null, availability: number | null } | null, vehicleStats: Array<{ actual: number, expected: number, timestamp: string }> | null } | null };

export type FeedMonitoringListQueryVariables = Exact<{ [key: string]: never; }>;


export type FeedMonitoringListQuery = { operatorsFeedMonitoring: Array<{ name: string, nocCode: string, operatorId: string, feedMonitoring: { feedStatus: boolean | null, availability: number | null, lastOutage: string | null, unavailableSince: string | null, liveStats: { updateFrequency: number | null } | null } | null }> };

export type OperatorSparklineStatsQueryVariables = Exact<{
  operatorIds: Array<string> | string;
}>;


export type OperatorSparklineStatsQuery = { operatorsFeedMonitoring: Array<{ nocCode: string, operatorId: string, feedMonitoring: { liveStats: { last24Hours: Array<{ actual: number, expected: number, timestamp: string }> | null } | null } | null }> };

export type OperatorLiveStatusQueryVariables = Exact<{
  operatorId: string;
}>;


export type OperatorLiveStatusQuery = { operatorFeedMonitoring: { name: string, nocCode: string, operatorId: string, feedMonitoring: { feedStatus: boolean | null, availability: number | null, lastOutage: string | null, unavailableSince: string | null, liveStats: { updateFrequency: number | null, currentVehicles: number | null, expectedVehicles: number | null, last24Hours: Array<{ actual: number, expected: number, timestamp: string }> | null, last20Minutes: Array<{ actual: number, expected: number, timestamp: string }> | null } | null } | null } | null };

export type OperatorHistoricStatsQueryVariables = Exact<{
  operatorId: string;
  date: string;
  start: string;
  end: string;
}>;


export type OperatorHistoricStatsQuery = { operatorFeedMonitoring: { name: string, nocCode: string, operatorId: string, feedMonitoring: { historicalStats: { updateFrequency: number | null, availability: number | null } | null, vehicleStats: Array<{ actual: number, expected: number, timestamp: string }> | null } | null } | null };

export type GetAdminAreasQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAdminAreasQuery = { adminAreas: Array<{ id: string, name: string, shape: string }> | null };

export type HeadwayTimeSeriesQueryVariables = Exact<{
  params: HeadwayInputType;
}>;


export type HeadwayTimeSeriesQuery = { headwayMetrics: { headwayTimeSeries: Array<{ ts: string, actual: number | null, scheduled: number | null, excess: number | null }> | null } | null };

export type HeadwayOverviewQueryVariables = Exact<{
  params: HeadwayInputType;
}>;


export type HeadwayOverviewQuery = { headwayMetrics: { headwayOverview: { excess: number | null } | null } | null };

export type HeadwayFrequentServicesQueryVariables = Exact<{
  operatorId: string;
  fromTimestamp: string;
  toTimestamp: string;
}>;


export type HeadwayFrequentServicesQuery = { headwayMetrics: { frequentServices: Array<{ serviceId: string }> | null } | null };

export type HeadwayFrequentServiceInfoQueryVariables = Exact<{
  inputs: FrequentServiceInfoInputType;
}>;


export type HeadwayFrequentServiceInfoQuery = { headwayMetrics: { frequentServiceInfo: { numHours: number | null, totalHours: number | null } | null } | null };

export type OnTimeDelayFrequencyQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeDelayFrequencyQuery = { onTimePerformance: { delayFrequency: Array<{ bucket: number, frequency: number | null }> | null } | null };

export type OnTimeTimeSeriesQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeTimeSeriesQuery = { onTimePerformance: { punctualityTimeSeries: Array<{ ts: string, onTime: number, early: number, late: number }> | null } | null };

export type OnTimeStatsQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeStatsQuery = { onTimePerformance: { punctualityOverview: { early: number, late: number, onTime: number, scheduled: number, completed: number, averageDeviation: number | null, incomplete: string, averageDelay: number | null } | null } | null };

export type OnTimePunctualityTimeOfDayQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimePunctualityTimeOfDayQuery = { onTimePerformance: { punctualityTimeOfDay: Array<{ timeOfDay: string, onTime: number, early: number, late: number }> | null } | null };

export type OnTimePunctualityDayOfWeekQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimePunctualityDayOfWeekQuery = { onTimePerformance: { punctualityDayOfWeek: Array<{ dayOfWeek: number, onTime: number, early: number, late: number }> | null } | null };

export type OnTimeServicePerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeServicePerformanceListQuery = { onTimePerformance: { servicePerformance: Array<{ lineId: string | null, early: number, onTime: number, late: number, averageDelay: number | null, countDelayed: number | null, scheduledDepartures: number, actualDepartures: number, direction: Direction | null, onTimeInSeconds: number | null, earlyInSeconds: number | null, lateInSeconds: number | null, lineInfo: { serviceId: string, serviceName: string, serviceNumber: string } }> | null } | null };

export type OnTimeStopPerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeStopPerformanceListQuery = { onTimePerformance: { stopPerformance: Array<{ lineId: string | null, stopId: string, early: number, onTime: number, late: number, averageDelay: number | null, countDelayed: number | null, scheduledDepartures: number, actualDepartures: number, timingPoint: boolean, direction: Direction | null, averageScheduled: number | null, averageActual: number | null, onTimeInSeconds: number | null, earlyInSeconds: number | null, lateInSeconds: number | null, stopInfo: { stopId: string, sourceId: string | null, stopName: string, stopLocation: { latitude: number, longitude: number }, stopLocality: { localityId: string | null, localityName: string | null, localityAreaId: string | null, localityAreaName: string | null } } }> | null } | null };

export type OnTimeOperatorPerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeOperatorPerformanceListQuery = { onTimePerformance: { operatorPerformance: { pageInfo: { totalCount: number | null, next: number | null } | null, items: Array<{ nocCode: string | null, operatorId: string | null, name: string | null, early: number, onTime: number, late: number, averageDelay: number | null }> } | null } | null };

export type ServiceInfoQueryVariables = Exact<{
  lineId: string;
}>;


export type ServiceInfoQuery = { serviceInfo: { serviceId: string, serviceNumber: string, serviceName: string } | null };

export type TransitModelServicePatternStopsQueryVariables = Exact<{
  operatorId: string;
  lineId: string;
}>;


export type TransitModelServicePatternStopsQuery = { servicePatterns: Array<{ servicePatternId: string, stops: Array<{ stopId: string, stopName: string, lon: number, lat: number }>, serviceLinks: Array<{ fromStop: string, toStop: string, distance: number, routeValidity: RouteType, linkRoute: string | null }> }> };

export type OperatorListQueryVariables = Exact<{ [key: string]: never; }>;


export type OperatorListQuery = { operators: Array<{ name: string, nocCode: string, operatorId: string, adminAreaIds: Array<string> }> };

export type OperatorLinesQueryVariables = Exact<{
  operatorIds: Array<string> | string;
  inputDate: string;
  endDate?: string | null | undefined;
}>;


export type OperatorLinesQuery = { lines: Array<{ id: string, name: string, number: string, adminAreaIds: Array<number> }> };

export type StopAnalysisQueryVariables = Exact<{
  adminAreaIds: Array<string> | string;
  boundingBox: BoundingBoxInputType;
  fromTimestamp: string;
  lineIds: Array<string> | string;
  matchType: MatchType;
  operatorIds: Array<string> | string;
  toTimestamp: string;
  dayOfWeekFlags?: DayOfWeekFlagsInputType | null | undefined;
  startTime?: string | null | undefined;
  endTime?: string | null | undefined;
}>;


export type StopAnalysisQuery = { stopAnalysis: Array<{ atcoCode: string, stopName: string, localityName: string, adminAreaName: string, timingPoint: boolean, latitude: number, longitude: number, early: number, late: number, onTime: number, scheduledDepartures: number, completedDepartures: number, totalDelay: number, onTimeInSeconds: number | null, earlyInSeconds: number | null, lateInSeconds: number | null, averageDelay: number | null, direction: string | null, countDelayed: number | null, averageScheduled: number | null, averageScheduledTimingPoint: number | null, averageActual: number | null, averageActualTimingPoint: number | null }> };

export type JourneyQueryVariables = Exact<{
  groupId: string;
  lineId: string;
}>;


export type JourneyQuery = { journey: { stops: Array<{ estimatedDepartureUtc: string | null, actualDepartureUtc: string | null, scheduledDepartureUtc: string, latitude: number, longitude: number, stopIndex: number, stopName: string, stopId: number, isTimingPoint: boolean, otp: OtpEnum | null, directionRef: string, incompleteReason: number, setDown: boolean }>, avls: Array<{ recordedAtTimeUtc: string, latitude: number, longitude: number, vehicleRef: string, directionRef: string }> } };

export type JourneysQueryVariables = Exact<{
  dateOfJourney: string;
  lineId: string;
}>;


export type JourneysQuery = { findJourneys: Array<{ groupId: string, startTime: string, serviceName: string, serviceNumber: string, operatorName: string, operatorNoc: string, directionRef: string | null, isCancelled: boolean, vehicleJourneyId: number | null }> };

export type ServicePatternDistanceGeomQueryVariables = Exact<{
  vehicleJourneyId: string | number;
}>;


export type ServicePatternDistanceGeomQuery = { getServicePatternDistanceGeom: { distance: number, geom: unknown } };

export type GetVersionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetVersionQuery = { apiInfo: { version: string, buildNumber: string } | null };

export const OperatorDashboardFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperatorDashboard"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperatorFeedMonitoring"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nocCode"}},{"kind":"Field","name":{"kind":"Name","value":"operatorId"}},{"kind":"Field","name":{"kind":"Name","value":"feedMonitoring"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"feedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"liveStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"feedErrors"}},{"kind":"Field","name":{"kind":"Name","value":"feedAlerts"}}]}}]}}]}}]} as unknown as DocumentNode<OperatorDashboardFragment, unknown>;
export const EventFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Event"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<EventFragment, unknown>;
export const BasicOperatorFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicOperator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperatorFeedMonitoring"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nocCode"}},{"kind":"Field","name":{"kind":"Name","value":"operatorId"}},{"kind":"Field","name":{"kind":"Name","value":"feedMonitoring"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"feedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"availability"}},{"kind":"Field","name":{"kind":"Name","value":"lastOutage"}},{"kind":"Field","name":{"kind":"Name","value":"unavailableSince"}},{"kind":"Field","name":{"kind":"Name","value":"liveStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFrequency"}}]}}]}}]}}]} as unknown as DocumentNode<BasicOperatorFragment, unknown>;
export const VehicleStatFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VehicleStat"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VehicleStatsType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actual"}},{"kind":"Field","name":{"kind":"Name","value":"expected"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]} as unknown as DocumentNode<VehicleStatFragment, unknown>;
export const OperatorLiveStatusFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperatorLiveStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperatorFeedMonitoring"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nocCode"}},{"kind":"Field","name":{"kind":"Name","value":"operatorId"}},{"kind":"Field","name":{"kind":"Name","value":"feedMonitoring"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"feedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"availability"}},{"kind":"Field","name":{"kind":"Name","value":"lastOutage"}},{"kind":"Field","name":{"kind":"Name","value":"unavailableSince"}},{"kind":"Field","name":{"kind":"Name","value":"liveStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFrequency"}},{"kind":"Field","name":{"kind":"Name","value":"currentVehicles"}},{"kind":"Field","name":{"kind":"Name","value":"expectedVehicles"}},{"kind":"Field","name":{"kind":"Name","value":"last24Hours"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"VehicleStat"}}]}},{"kind":"Field","name":{"kind":"Name","value":"last20Minutes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"VehicleStat"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VehicleStat"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VehicleStatsType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actual"}},{"kind":"Field","name":{"kind":"Name","value":"expected"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]} as unknown as DocumentNode<OperatorLiveStatusFragment, unknown>;
export const OperatorFeedHistoryFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperatorFeedHistory"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperatorFeedMonitoring"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nocCode"}},{"kind":"Field","name":{"kind":"Name","value":"operatorId"}},{"kind":"Field","name":{"kind":"Name","value":"feedMonitoring"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"historicalStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFrequency"}},{"kind":"Field","name":{"kind":"Name","value":"availability"}}]}},{"kind":"Field","name":{"kind":"Name","value":"vehicleStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"granularity"},"value":{"kind":"EnumValue","value":"minute"}},{"kind":"Argument","name":{"kind":"Name","value":"start"},"value":{"kind":"Variable","name":{"kind":"Name","value":"start"}}},{"kind":"Argument","name":{"kind":"Name","value":"end"},"value":{"kind":"Variable","name":{"kind":"Name","value":"end"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"VehicleStat"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VehicleStat"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VehicleStatsType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actual"}},{"kind":"Field","name":{"kind":"Name","value":"expected"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]} as unknown as DocumentNode<OperatorFeedHistoryFragment, unknown>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"username"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"username"},"value":{"kind":"Variable","name":{"kind":"Name","value":"username"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"maxAttempts"}},{"kind":"Field","name":{"kind":"Name","value":"unlockAt"}},{"kind":"Field","name":{"kind":"Name","value":"failedAttempts"}},{"kind":"Field","name":{"kind":"Name","value":"locked"}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const UserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentUserId"}},{"kind":"Field","name":{"kind":"Name","value":"canViewServiceMonitoring"}},{"kind":"Field","name":{"kind":"Name","value":"canEditAllAlerts"}},{"kind":"Field","name":{"kind":"Name","value":"canViewDistances"}},{"kind":"Field","name":{"kind":"Name","value":"serviceMonitoringEmbedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"flags"}}]}}]}}]} as unknown as DocumentNode<UserQuery, UserQueryVariables>;
export const CorridorsStopSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"corridorsStopSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddFirstStopInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"corridor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addFirstStop"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopId"}},{"kind":"Field","name":{"kind":"Name","value":"stopName"}},{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"lon"}},{"kind":"Field","name":{"kind":"Name","value":"localityName"}},{"kind":"Field","name":{"kind":"Name","value":"adminAreaId"}},{"kind":"Field","name":{"kind":"Name","value":"sourceId"}}]}}]}}]}}]} as unknown as DocumentNode<CorridorsStopSearchQuery, CorridorsStopSearchQueryVariables>;
export const CorridorsSubsequentStopsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"corridorsSubsequentStops"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stopList"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"corridor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addSubsequentStops"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"stopList"},"value":{"kind":"Variable","name":{"kind":"Name","value":"stopList"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopId"}},{"kind":"Field","name":{"kind":"Name","value":"stopName"}},{"kind":"Field","name":{"kind":"Name","value":"lon"}},{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"localityName"}},{"kind":"Field","name":{"kind":"Name","value":"adminAreaId"}},{"kind":"Field","name":{"kind":"Name","value":"sourceId"}}]}}]}}]}}]} as unknown as DocumentNode<CorridorsSubsequentStopsQuery, CorridorsSubsequentStopsQueryVariables>;
export const CorridorsListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"corridorsList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"corridor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"corridorList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"stops"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopId"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CorridorsListQuery, CorridorsListQueryVariables>;
export const GetCorridorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCorridor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"corridorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"corridor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCorridor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"corridorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"corridorId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"stops"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopId"}},{"kind":"Field","name":{"kind":"Name","value":"sourceId"}},{"kind":"Field","name":{"kind":"Name","value":"stopName"}},{"kind":"Field","name":{"kind":"Name","value":"stopLocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stopLocality"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"localityId"}},{"kind":"Field","name":{"kind":"Name","value":"localityName"}},{"kind":"Field","name":{"kind":"Name","value":"localityAreaId"}},{"kind":"Field","name":{"kind":"Name","value":"localityAreaName"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetCorridorQuery, GetCorridorQueryVariables>;
export const CorridorStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"corridorStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CorridorStatsInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"corridor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"summaryStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalTransits"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfServices"}},{"kind":"Field","name":{"kind":"Name","value":"averageTransitTime"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledTransits"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transitTimeStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ts"}},{"kind":"Field","name":{"kind":"Name","value":"minTransitTime"}},{"kind":"Field","name":{"kind":"Name","value":"maxTransitTime"}},{"kind":"Field","name":{"kind":"Name","value":"avgTransitTime"}},{"kind":"Field","name":{"kind":"Name","value":"percentile25"}},{"kind":"Field","name":{"kind":"Name","value":"percentile75"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transitTimeTimeOfDayStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minTransitTime"}},{"kind":"Field","name":{"kind":"Name","value":"maxTransitTime"}},{"kind":"Field","name":{"kind":"Name","value":"avgTransitTime"}},{"kind":"Field","name":{"kind":"Name","value":"percentile25"}},{"kind":"Field","name":{"kind":"Name","value":"percentile75"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transitTimeDayOfWeekStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dow"}},{"kind":"Field","name":{"kind":"Name","value":"minTransitTime"}},{"kind":"Field","name":{"kind":"Name","value":"maxTransitTime"}},{"kind":"Field","name":{"kind":"Name","value":"avgTransitTime"}},{"kind":"Field","name":{"kind":"Name","value":"percentile25"}},{"kind":"Field","name":{"kind":"Name","value":"percentile75"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transitTimePerServiceStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lineName"}},{"kind":"Field","name":{"kind":"Name","value":"servicePatternName"}},{"kind":"Field","name":{"kind":"Name","value":"noc"}},{"kind":"Field","name":{"kind":"Name","value":"operatorName"}},{"kind":"Field","name":{"kind":"Name","value":"totalTransitTime"}},{"kind":"Field","name":{"kind":"Name","value":"recordedTransits"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledTransits"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transitTimeHistogram"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ts"}},{"kind":"Field","name":{"kind":"Name","value":"hist"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bin"}},{"kind":"Field","name":{"kind":"Name","value":"freq"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"serviceLinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromStop"}},{"kind":"Field","name":{"kind":"Name","value":"toStop"}},{"kind":"Field","name":{"kind":"Name","value":"distance"}},{"kind":"Field","name":{"kind":"Name","value":"routeValidity"}},{"kind":"Field","name":{"kind":"Name","value":"linkRoute"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CorridorStatsQuery, CorridorStatsQueryVariables>;
export const CreateCorridorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createCorridor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stopIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCorridor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"payload"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"stopIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"stopIds"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<CreateCorridorMutation, CreateCorridorMutationVariables>;
export const DeleteCorridorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteCorridor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"corridorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCorridor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"corridorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"corridorId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<DeleteCorridorMutation, DeleteCorridorMutationVariables>;
export const UpdateCorridorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateCorridor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CorridorUpdateInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCorridor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<UpdateCorridorMutation, UpdateCorridorMutationVariables>;
export const DashboardOperatorListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"dashboardOperatorList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operatorsFeedMonitoring"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperatorDashboard"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperatorDashboard"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperatorFeedMonitoring"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nocCode"}},{"kind":"Field","name":{"kind":"Name","value":"operatorId"}},{"kind":"Field","name":{"kind":"Name","value":"feedMonitoring"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"feedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"liveStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"feedErrors"}},{"kind":"Field","name":{"kind":"Name","value":"feedAlerts"}}]}}]}}]}}]} as unknown as DocumentNode<DashboardOperatorListQuery, DashboardOperatorListQueryVariables>;
export const DashboardOperatorVehicleCountsListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"dashboardOperatorVehicleCountsList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"operatorId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dashboardVehicles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"operatorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"operatorId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operatorId"}},{"kind":"Field","name":{"kind":"Name","value":"expected"}},{"kind":"Field","name":{"kind":"Name","value":"actual"}}]}}]}}]} as unknown as DocumentNode<DashboardOperatorVehicleCountsListQuery, DashboardOperatorVehicleCountsListQueryVariables>;
export const DashboardPerformanceStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"dashboardPerformanceStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PerformanceInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onTimePerformance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"punctualityOverview"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onTime"}},{"kind":"Field","name":{"kind":"Name","value":"late"}},{"kind":"Field","name":{"kind":"Name","value":"early"}}]}}]}}]}}]} as unknown as DocumentNode<DashboardPerformanceStatsQuery, DashboardPerformanceStatsQueryVariables>;
export const DashboardServiceRankingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"dashboardServiceRanking"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ServicePerformanceInputType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"trendFrom"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"trendTo"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onTimePerformance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"servicePunctuality"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nocCode"}},{"kind":"Field","name":{"kind":"Name","value":"lineId"}},{"kind":"Field","name":{"kind":"Name","value":"lineInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"serviceName"}},{"kind":"Field","name":{"kind":"Name","value":"serviceNumber"}}]}},{"kind":"Field","name":{"kind":"Name","value":"onTime"}},{"kind":"Field","name":{"kind":"Name","value":"early"}},{"kind":"Field","name":{"kind":"Name","value":"late"}},{"kind":"Field","name":{"kind":"Name","value":"trend"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fromTimestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"trendFrom"}}},{"kind":"Argument","name":{"kind":"Name","value":"toTimestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"trendTo"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onTime"}},{"kind":"Field","name":{"kind":"Name","value":"early"}},{"kind":"Field","name":{"kind":"Name","value":"late"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DashboardServiceRankingQuery, DashboardServiceRankingQueryVariables>;
export const DashboadEmbeddedUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"dashboadEmbeddedUrl"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"embeddedUrl"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<DashboadEmbeddedUrlQuery, DashboadEmbeddedUrlQueryVariables>;
export const UserOrganisationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"userOrganisations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userOrgs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UserOrganisationsQuery, UserOrganisationsQueryVariables>;
export const OrgOperatorListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"orgOperatorList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operators"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filterBy"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"orgId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nocCode"}}]}}]}}]} as unknown as DocumentNode<OrgOperatorListQuery, OrgOperatorListQueryVariables>;
export const DistancesListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"distancesList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filterBy"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DistancesFilterInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"distances"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filterBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filterBy"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operatorId"}},{"kind":"Field","name":{"kind":"Name","value":"operatorName"}},{"kind":"Field","name":{"kind":"Name","value":"nocLineAndServiceCode"}},{"kind":"Field","name":{"kind":"Name","value":"lineName"}},{"kind":"Field","name":{"kind":"Name","value":"serviceName"}},{"kind":"Field","name":{"kind":"Name","value":"distance"}},{"kind":"Field","name":{"kind":"Name","value":"avlDistance"}}]}}]}}]} as unknown as DocumentNode<DistancesListQuery, DistancesListQueryVariables>;
export const DistancesDropdownInputDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"distancesDropdownInput"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"distancesDropdowns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operators"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"licenses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"services"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"line"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<DistancesDropdownInputQuery, DistancesDropdownInputQueryVariables>;
export const AdminOrgListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"adminOrgList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminOrgMap"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminAreaId"}},{"kind":"Field","name":{"kind":"Name","value":"adminName"}},{"kind":"Field","name":{"kind":"Name","value":"operatorId"}},{"kind":"Field","name":{"kind":"Name","value":"orgId"}},{"kind":"Field","name":{"kind":"Name","value":"orgName"}}]}}]}}]} as unknown as DocumentNode<AdminOrgListQuery, AdminOrgListQueryVariables>;
export const EventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"events"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"operatorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"start"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"end"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"events"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"operatorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"operatorId"}}},{"kind":"Argument","name":{"kind":"Name","value":"start"},"value":{"kind":"Variable","name":{"kind":"Name","value":"start"}}},{"kind":"Argument","name":{"kind":"Name","value":"end"},"value":{"kind":"Variable","name":{"kind":"Name","value":"end"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Event"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Event"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<EventsQuery, EventsQueryVariables>;
export const EventStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"eventStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"operatorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"start"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"end"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"eventStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"operatorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"operatorId"}}},{"kind":"Argument","name":{"kind":"Name","value":"start"},"value":{"kind":"Variable","name":{"kind":"Name","value":"start"}}},{"kind":"Argument","name":{"kind":"Name","value":"end"},"value":{"kind":"Variable","name":{"kind":"Name","value":"end"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"day"}}]}}]}}]} as unknown as DocumentNode<EventStatsQuery, EventStatsQueryVariables>;
export const FeedMonitoringListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"feedMonitoringList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operatorsFeedMonitoring"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BasicOperator"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BasicOperator"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperatorFeedMonitoring"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nocCode"}},{"kind":"Field","name":{"kind":"Name","value":"operatorId"}},{"kind":"Field","name":{"kind":"Name","value":"feedMonitoring"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"feedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"availability"}},{"kind":"Field","name":{"kind":"Name","value":"lastOutage"}},{"kind":"Field","name":{"kind":"Name","value":"unavailableSince"}},{"kind":"Field","name":{"kind":"Name","value":"liveStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFrequency"}}]}}]}}]}}]} as unknown as DocumentNode<FeedMonitoringListQuery, FeedMonitoringListQueryVariables>;
export const OperatorSparklineStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"operatorSparklineStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"operatorIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operatorsFeedMonitoring"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filterBy"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"operatorIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"operatorIds"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nocCode"}},{"kind":"Field","name":{"kind":"Name","value":"operatorId"}},{"kind":"Field","name":{"kind":"Name","value":"feedMonitoring"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"liveStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"last24Hours"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"VehicleStat"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VehicleStat"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VehicleStatsType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actual"}},{"kind":"Field","name":{"kind":"Name","value":"expected"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]} as unknown as DocumentNode<OperatorSparklineStatsQuery, OperatorSparklineStatsQueryVariables>;
export const OperatorLiveStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"operatorLiveStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"operatorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operatorFeedMonitoring"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"operatorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"operatorId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperatorLiveStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VehicleStat"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VehicleStatsType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actual"}},{"kind":"Field","name":{"kind":"Name","value":"expected"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperatorLiveStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperatorFeedMonitoring"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nocCode"}},{"kind":"Field","name":{"kind":"Name","value":"operatorId"}},{"kind":"Field","name":{"kind":"Name","value":"feedMonitoring"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"feedStatus"}},{"kind":"Field","name":{"kind":"Name","value":"availability"}},{"kind":"Field","name":{"kind":"Name","value":"lastOutage"}},{"kind":"Field","name":{"kind":"Name","value":"unavailableSince"}},{"kind":"Field","name":{"kind":"Name","value":"liveStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFrequency"}},{"kind":"Field","name":{"kind":"Name","value":"currentVehicles"}},{"kind":"Field","name":{"kind":"Name","value":"expectedVehicles"}},{"kind":"Field","name":{"kind":"Name","value":"last24Hours"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"VehicleStat"}}]}},{"kind":"Field","name":{"kind":"Name","value":"last20Minutes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"VehicleStat"}}]}}]}}]}}]}}]} as unknown as DocumentNode<OperatorLiveStatusQuery, OperatorLiveStatusQueryVariables>;
export const OperatorHistoricStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"operatorHistoricStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"operatorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"start"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"end"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operatorFeedMonitoring"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"operatorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"operatorId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperatorFeedHistory"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VehicleStat"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VehicleStatsType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actual"}},{"kind":"Field","name":{"kind":"Name","value":"expected"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperatorFeedHistory"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperatorFeedMonitoring"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nocCode"}},{"kind":"Field","name":{"kind":"Name","value":"operatorId"}},{"kind":"Field","name":{"kind":"Name","value":"feedMonitoring"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"historicalStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFrequency"}},{"kind":"Field","name":{"kind":"Name","value":"availability"}}]}},{"kind":"Field","name":{"kind":"Name","value":"vehicleStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"granularity"},"value":{"kind":"EnumValue","value":"minute"}},{"kind":"Argument","name":{"kind":"Name","value":"start"},"value":{"kind":"Variable","name":{"kind":"Name","value":"start"}}},{"kind":"Argument","name":{"kind":"Name","value":"end"},"value":{"kind":"Variable","name":{"kind":"Name","value":"end"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"VehicleStat"}}]}}]}}]}}]} as unknown as DocumentNode<OperatorHistoricStatsQuery, OperatorHistoricStatsQueryVariables>;
export const GetAdminAreasDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getAdminAreas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminAreas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shape"}}]}}]}}]} as unknown as DocumentNode<GetAdminAreasQuery, GetAdminAreasQueryVariables>;
export const HeadwayTimeSeriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"headwayTimeSeries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HeadwayInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"headwayMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"headwayTimeSeries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ts"}},{"kind":"Field","name":{"kind":"Name","value":"actual"}},{"kind":"Field","name":{"kind":"Name","value":"scheduled"}},{"kind":"Field","name":{"kind":"Name","value":"excess"}}]}}]}}]}}]} as unknown as DocumentNode<HeadwayTimeSeriesQuery, HeadwayTimeSeriesQueryVariables>;
export const HeadwayOverviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"headwayOverview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HeadwayInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"headwayMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"headwayOverview"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"excess"}}]}}]}}]}}]} as unknown as DocumentNode<HeadwayOverviewQuery, HeadwayOverviewQueryVariables>;
export const HeadwayFrequentServicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"headwayFrequentServices"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"operatorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromTimestamp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toTimestamp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"headwayMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"frequentServices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"operatorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"operatorId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromTimestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromTimestamp"}}},{"kind":"Argument","name":{"kind":"Name","value":"toTimestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toTimestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceId"}}]}}]}}]}}]} as unknown as DocumentNode<HeadwayFrequentServicesQuery, HeadwayFrequentServicesQueryVariables>;
export const HeadwayFrequentServiceInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"headwayFrequentServiceInfo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FrequentServiceInfoInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"headwayMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"frequentServiceInfo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"numHours"}},{"kind":"Field","name":{"kind":"Name","value":"totalHours"}}]}}]}}]}}]} as unknown as DocumentNode<HeadwayFrequentServiceInfoQuery, HeadwayFrequentServiceInfoQueryVariables>;
export const OnTimeDelayFrequencyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"onTimeDelayFrequency"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PerformanceInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onTimePerformance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delayFrequency"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bucket"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}}]}}]}}]}}]} as unknown as DocumentNode<OnTimeDelayFrequencyQuery, OnTimeDelayFrequencyQueryVariables>;
export const OnTimeTimeSeriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"onTimeTimeSeries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PerformanceInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onTimePerformance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"punctualityTimeSeries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ts"}},{"kind":"Field","name":{"kind":"Name","value":"onTime"}},{"kind":"Field","name":{"kind":"Name","value":"early"}},{"kind":"Field","name":{"kind":"Name","value":"late"}}]}}]}}]}}]} as unknown as DocumentNode<OnTimeTimeSeriesQuery, OnTimeTimeSeriesQueryVariables>;
export const OnTimeStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"onTimeStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PerformanceInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onTimePerformance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"punctualityOverview"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"early"}},{"kind":"Field","name":{"kind":"Name","value":"late"}},{"kind":"Field","name":{"kind":"Name","value":"onTime"}},{"kind":"Field","name":{"kind":"Name","value":"scheduled"}},{"kind":"Field","name":{"kind":"Name","value":"completed"}},{"kind":"Field","name":{"kind":"Name","value":"averageDeviation"}},{"kind":"Field","name":{"kind":"Name","value":"incomplete"}},{"kind":"Field","name":{"kind":"Name","value":"averageDelay"}}]}}]}}]}}]} as unknown as DocumentNode<OnTimeStatsQuery, OnTimeStatsQueryVariables>;
export const OnTimePunctualityTimeOfDayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"onTimePunctualityTimeOfDay"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PerformanceInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onTimePerformance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"punctualityTimeOfDay"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timeOfDay"}},{"kind":"Field","name":{"kind":"Name","value":"onTime"}},{"kind":"Field","name":{"kind":"Name","value":"early"}},{"kind":"Field","name":{"kind":"Name","value":"late"}}]}}]}}]}}]} as unknown as DocumentNode<OnTimePunctualityTimeOfDayQuery, OnTimePunctualityTimeOfDayQueryVariables>;
export const OnTimePunctualityDayOfWeekDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"onTimePunctualityDayOfWeek"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PerformanceInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onTimePerformance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"punctualityDayOfWeek"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dayOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"onTime"}},{"kind":"Field","name":{"kind":"Name","value":"early"}},{"kind":"Field","name":{"kind":"Name","value":"late"}}]}}]}}]}}]} as unknown as DocumentNode<OnTimePunctualityDayOfWeekQuery, OnTimePunctualityDayOfWeekQueryVariables>;
export const OnTimeServicePerformanceListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"onTimeServicePerformanceList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PerformanceInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onTimePerformance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"servicePerformance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lineId"}},{"kind":"Field","name":{"kind":"Name","value":"lineInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"serviceName"}},{"kind":"Field","name":{"kind":"Name","value":"serviceNumber"}}]}},{"kind":"Field","name":{"kind":"Name","value":"early"}},{"kind":"Field","name":{"kind":"Name","value":"onTime"}},{"kind":"Field","name":{"kind":"Name","value":"late"}},{"kind":"Field","name":{"kind":"Name","value":"averageDelay"}},{"kind":"Field","name":{"kind":"Name","value":"countDelayed"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDepartures"}},{"kind":"Field","name":{"kind":"Name","value":"actualDepartures"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"onTimeInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"earlyInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"lateInSeconds"}}]}}]}}]}}]} as unknown as DocumentNode<OnTimeServicePerformanceListQuery, OnTimeServicePerformanceListQueryVariables>;
export const OnTimeStopPerformanceListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"onTimeStopPerformanceList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PerformanceInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onTimePerformance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopPerformance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lineId"}},{"kind":"Field","name":{"kind":"Name","value":"stopId"}},{"kind":"Field","name":{"kind":"Name","value":"stopInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopId"}},{"kind":"Field","name":{"kind":"Name","value":"sourceId"}},{"kind":"Field","name":{"kind":"Name","value":"stopName"}},{"kind":"Field","name":{"kind":"Name","value":"stopLocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stopLocality"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"localityId"}},{"kind":"Field","name":{"kind":"Name","value":"localityName"}},{"kind":"Field","name":{"kind":"Name","value":"localityAreaId"}},{"kind":"Field","name":{"kind":"Name","value":"localityAreaName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"early"}},{"kind":"Field","name":{"kind":"Name","value":"onTime"}},{"kind":"Field","name":{"kind":"Name","value":"late"}},{"kind":"Field","name":{"kind":"Name","value":"averageDelay"}},{"kind":"Field","name":{"kind":"Name","value":"countDelayed"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDepartures"}},{"kind":"Field","name":{"kind":"Name","value":"actualDepartures"}},{"kind":"Field","name":{"kind":"Name","value":"timingPoint"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"averageScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"averageActual"}},{"kind":"Field","name":{"kind":"Name","value":"onTimeInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"earlyInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"lateInSeconds"}}]}}]}}]}}]} as unknown as DocumentNode<OnTimeStopPerformanceListQuery, OnTimeStopPerformanceListQueryVariables>;
export const OnTimeOperatorPerformanceListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"onTimeOperatorPerformanceList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PerformanceInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onTimePerformance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operatorPerformance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"next"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nocCode"}},{"kind":"Field","name":{"kind":"Name","value":"operatorId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"early"}},{"kind":"Field","name":{"kind":"Name","value":"onTime"}},{"kind":"Field","name":{"kind":"Name","value":"late"}},{"kind":"Field","name":{"kind":"Name","value":"averageDelay"}}]}}]}}]}}]}}]} as unknown as DocumentNode<OnTimeOperatorPerformanceListQuery, OnTimeOperatorPerformanceListQueryVariables>;
export const ServiceInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"serviceInfo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lineId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceInfo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"serviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lineId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"serviceNumber"}},{"kind":"Field","name":{"kind":"Name","value":"serviceName"}}]}}]}}]} as unknown as DocumentNode<ServiceInfoQuery, ServiceInfoQueryVariables>;
export const TransitModelServicePatternStopsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"transitModelServicePatternStops"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"operatorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lineId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"servicePatterns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"operatorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"operatorId"}}},{"kind":"Argument","name":{"kind":"Name","value":"lineId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lineId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"servicePatternId"}},{"kind":"Field","name":{"kind":"Name","value":"stops"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopId"}},{"kind":"Field","name":{"kind":"Name","value":"stopName"}},{"kind":"Field","name":{"kind":"Name","value":"lon"}},{"kind":"Field","name":{"kind":"Name","value":"lat"}}]}},{"kind":"Field","name":{"kind":"Name","value":"serviceLinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromStop"}},{"kind":"Field","name":{"kind":"Name","value":"toStop"}},{"kind":"Field","name":{"kind":"Name","value":"distance"}},{"kind":"Field","name":{"kind":"Name","value":"routeValidity"}},{"kind":"Field","name":{"kind":"Name","value":"linkRoute"}}]}}]}}]}}]} as unknown as DocumentNode<TransitModelServicePatternStopsQuery, TransitModelServicePatternStopsQueryVariables>;
export const OperatorListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"operatorList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operators"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nocCode"}},{"kind":"Field","name":{"kind":"Name","value":"operatorId"}},{"kind":"Field","name":{"kind":"Name","value":"adminAreaIds"}}]}}]}}]} as unknown as DocumentNode<OperatorListQuery, OperatorListQueryVariables>;
export const OperatorLinesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"operatorLines"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"operatorIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inputDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lines"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"operatorIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"operatorIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"inputDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inputDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"adminAreaIds"}}]}}]}}]} as unknown as DocumentNode<OperatorLinesQuery, OperatorLinesQueryVariables>;
export const StopAnalysisDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"stopAnalysis"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"adminAreaIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"boundingBox"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BoundingBoxInputType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromTimestamp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lineIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"matchType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MatchType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"operatorIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toTimestamp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dayOfWeekFlags"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DayOfWeekFlagsInputType"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopAnalysis"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"adminAreaIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"adminAreaIds"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"boundingBox"},"value":{"kind":"Variable","name":{"kind":"Name","value":"boundingBox"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"fromTimestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromTimestamp"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lineIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lineIds"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"matchType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"matchType"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"operatorIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"operatorIds"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"toTimestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toTimestamp"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"dayOfWeekFlags"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dayOfWeekFlags"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"startTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startTime"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"endTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endTime"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"atcoCode"}},{"kind":"Field","name":{"kind":"Name","value":"stopName"}},{"kind":"Field","name":{"kind":"Name","value":"localityName"}},{"kind":"Field","name":{"kind":"Name","value":"adminAreaName"}},{"kind":"Field","name":{"kind":"Name","value":"timingPoint"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"early"}},{"kind":"Field","name":{"kind":"Name","value":"late"}},{"kind":"Field","name":{"kind":"Name","value":"onTime"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDepartures"}},{"kind":"Field","name":{"kind":"Name","value":"completedDepartures"}},{"kind":"Field","name":{"kind":"Name","value":"totalDelay"}},{"kind":"Field","name":{"kind":"Name","value":"onTimeInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"earlyInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"lateInSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"averageDelay"}},{"kind":"Field","name":{"kind":"Name","value":"direction"}},{"kind":"Field","name":{"kind":"Name","value":"countDelayed"}},{"kind":"Field","name":{"kind":"Name","value":"averageScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"averageScheduledTimingPoint"}},{"kind":"Field","name":{"kind":"Name","value":"averageActual"}},{"kind":"Field","name":{"kind":"Name","value":"averageActualTimingPoint"}}]}}]}}]} as unknown as DocumentNode<StopAnalysisQuery, StopAnalysisQueryVariables>;
export const JourneyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"journey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lineId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"journey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}},{"kind":"Argument","name":{"kind":"Name","value":"lineId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lineId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stops"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"estimatedDepartureUtc"}},{"kind":"Field","name":{"kind":"Name","value":"actualDepartureUtc"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledDepartureUtc"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"stopIndex"}},{"kind":"Field","name":{"kind":"Name","value":"stopName"}},{"kind":"Field","name":{"kind":"Name","value":"stopId"}},{"kind":"Field","name":{"kind":"Name","value":"isTimingPoint"}},{"kind":"Field","name":{"kind":"Name","value":"otp"}},{"kind":"Field","name":{"kind":"Name","value":"directionRef"}},{"kind":"Field","name":{"kind":"Name","value":"incompleteReason"}},{"kind":"Field","name":{"kind":"Name","value":"setDown"}}]}},{"kind":"Field","name":{"kind":"Name","value":"avls"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recordedAtTimeUtc"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"vehicleRef"}},{"kind":"Field","name":{"kind":"Name","value":"directionRef"}}]}}]}}]}}]} as unknown as DocumentNode<JourneyQuery, JourneyQueryVariables>;
export const JourneysDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"journeys"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dateOfJourney"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lineId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findJourneys"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dateOfJourney"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dateOfJourney"}}},{"kind":"Argument","name":{"kind":"Name","value":"lineId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lineId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"serviceName"}},{"kind":"Field","name":{"kind":"Name","value":"serviceNumber"}},{"kind":"Field","name":{"kind":"Name","value":"operatorName"}},{"kind":"Field","name":{"kind":"Name","value":"operatorNoc"}},{"kind":"Field","name":{"kind":"Name","value":"directionRef"}},{"kind":"Field","name":{"kind":"Name","value":"isCancelled"}},{"kind":"Field","name":{"kind":"Name","value":"vehicleJourneyId"}}]}}]}}]} as unknown as DocumentNode<JourneysQuery, JourneysQueryVariables>;
export const ServicePatternDistanceGeomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"servicePatternDistanceGeom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"vehicleJourneyId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getServicePatternDistanceGeom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"vehicleJourneyId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"vehicleJourneyId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"distance"}},{"kind":"Field","name":{"kind":"Name","value":"geom"}}]}}]}}]} as unknown as DocumentNode<ServicePatternDistanceGeomQuery, ServicePatternDistanceGeomQueryVariables>;
export const GetVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getVersion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"buildNumber"}}]}}]}}]} as unknown as DocumentNode<GetVersionQuery, GetVersionQueryVariables>;