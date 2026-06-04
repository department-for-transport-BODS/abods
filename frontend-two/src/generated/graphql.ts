import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type LoginMutationVariables = Exact<{
  username: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { login: { __typename?: 'LoginResponse', success: boolean, expiresAt: string | null, maxAttempts: number | null, unlockAt: string | null, failedAttempts: number | null, locked: boolean | null } | null };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { logout: boolean };

export type UserQueryVariables = Exact<{ [key: string]: never; }>;


export type UserQuery = { user: { __typename?: 'LoginInfo', currentUserId: string, canViewServiceMonitoring: boolean, canEditAllAlerts: boolean, canViewDistances: boolean, serviceMonitoringEmbedUrl: string | null, flags: Array<FeatureFlag> } | null };

export type CorridorsStopSearchQueryVariables = Exact<{
  inputs: AddFirstStopInputType;
}>;


export type CorridorsStopSearchQuery = { corridor: { __typename?: 'CorridorNamespace', addFirstStop: Array<{ __typename?: 'StopType', stopId: string, stopName: string, lat: number, lon: number, localityName: string | null, adminAreaId: string | null, sourceId: string | null }> } | null };

export type CorridorsSubsequentStopsQueryVariables = Exact<{
  stopList: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type CorridorsSubsequentStopsQuery = { corridor: { __typename?: 'CorridorNamespace', addSubsequentStops: Array<{ __typename?: 'StopType', stopId: string, stopName: string, lon: number, lat: number, localityName: string | null, adminAreaId: string | null, sourceId: string | null }> } | null };

export type CorridorsListQueryVariables = Exact<{ [key: string]: never; }>;


export type CorridorsListQuery = { corridor: { __typename?: 'CorridorNamespace', corridorList: Array<{ __typename?: 'CorridorType', id: number, name: string, stops: Array<{ __typename?: 'StopInfoType', stopId: string }> }> } | null };

export type GetCorridorQueryVariables = Exact<{
  corridorId: Scalars['Int']['input'];
}>;


export type GetCorridorQuery = { corridor: { __typename?: 'CorridorNamespace', getCorridor: { __typename?: 'CorridorType', id: number, name: string, stops: Array<{ __typename?: 'StopInfoType', stopId: string, sourceId: string | null, stopName: string, stopLocation: { __typename?: 'GpsPointType', latitude: number, longitude: number }, stopLocality: { __typename?: 'LocalityType', localityId: string | null, localityName: string | null, localityAreaId: string | null, localityAreaName: string | null } }> } | null } | null };

export type CorridorStatsQueryVariables = Exact<{
  params: CorridorStatsInputType;
}>;


export type CorridorStatsQuery = { corridor: { __typename?: 'CorridorNamespace', stats: { __typename?: 'CorridorStatsType', summaryStats: { __typename?: 'CorridorSummaryStatsType', totalTransits: number | null, numberOfServices: number | null, averageTransitTime: number | null, scheduledTransits: number | null } | null, transitTimeStats: Array<{ __typename?: 'CorridorTransitTimeStatsType', ts: string | null, minTransitTime: number, maxTransitTime: number, avgTransitTime: number | null, percentile25: number | null, percentile75: number | null }>, transitTimeTimeOfDayStats: Array<{ __typename?: 'CorridorStatsTimeOfDayType', hour: number, minTransitTime: number, maxTransitTime: number, avgTransitTime: number | null, percentile25: number | null, percentile75: number | null }>, transitTimeDayOfWeekStats: Array<{ __typename?: 'CorridorStatsDayOfWeekType', dow: number, minTransitTime: number, maxTransitTime: number, avgTransitTime: number | null, percentile25: number | null, percentile75: number | null }>, transitTimePerServiceStats: Array<{ __typename?: 'CorridorStatsPerServiceType', lineName: string, servicePatternName: string, noc: string | null, operatorName: string | null, totalTransitTime: number | null, recordedTransits: number | null, scheduledTransits: number | null }>, transitTimeHistogram: Array<{ __typename?: 'CorridorStatsHistogramType', ts: string | null, hist: Array<{ __typename?: 'CorridorHistogramType', bin: number | null, freq: number | null }> }>, serviceLinks: Array<{ __typename?: 'ServiceLinkType', fromStop: string, toStop: string, distance: number, routeValidity: RouteType, linkRoute: string | null }> } | null } | null };

export type CreateCorridorMutationVariables = Exact<{
  name: Scalars['String']['input'];
  stopIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type CreateCorridorMutation = { createCorridor: { __typename?: 'MutationResponseType', success: boolean, error: string | null } };

export type DeleteCorridorMutationVariables = Exact<{
  corridorId: Scalars['Int']['input'];
}>;


export type DeleteCorridorMutation = { deleteCorridor: { __typename?: 'MutationResponseType', success: boolean, error: string | null } };

export type UpdateCorridorMutationVariables = Exact<{
  inputs: CorridorUpdateInputType;
}>;


export type UpdateCorridorMutation = { updateCorridor: { __typename?: 'MutationResponseType', error: string | null, success: boolean } };

export type OperatorDashboardFragment = { __typename?: 'OperatorFeedMonitoring', name: string, nocCode: string, operatorId: string, feedMonitoring: { __typename?: 'FeedMonitoringType', feedStatus: boolean | null, liveStats: { __typename?: 'LiveStatsType', feedErrors: number | null, feedAlerts: number | null } | null } | null };

export type DashboardOperatorListQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardOperatorListQuery = { operatorsFeedMonitoring: Array<{ __typename?: 'OperatorFeedMonitoring', name: string, nocCode: string, operatorId: string, feedMonitoring: { __typename?: 'FeedMonitoringType', feedStatus: boolean | null, liveStats: { __typename?: 'LiveStatsType', feedErrors: number | null, feedAlerts: number | null } | null } | null }> };

export type DashboardOperatorVehicleCountsListQueryVariables = Exact<{
  operatorId?: InputMaybe<Scalars['String']['input']>;
}>;


export type DashboardOperatorVehicleCountsListQuery = { dashboardVehicles: Array<{ __typename?: 'DashboardVehicles', operatorId: string, expected: number, actual: number }> };

export type DashboardPerformanceStatsQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type DashboardPerformanceStatsQuery = { onTimePerformance: { __typename?: 'OnTimePerformanceType', punctualityOverview: { __typename?: 'PunctualityTotalsType', onTime: number, late: number, early: number } | null } | null };

export type DashboardServiceRankingQueryVariables = Exact<{
  params: ServicePerformanceInputType;
  trendFrom: Scalars['DateTime']['input'];
  trendTo: Scalars['DateTime']['input'];
}>;


export type DashboardServiceRankingQuery = { onTimePerformance: { __typename?: 'OnTimePerformanceType', servicePunctuality: Array<{ __typename?: 'ServicePunctualityType', nocCode: string | null, lineId: string | null, onTime: number | null, early: number | null, late: number | null, lineInfo: { __typename?: 'ServiceInfoType', serviceId: string, serviceName: string, serviceNumber: string } | null, trend: { __typename?: 'ServicePunctualityType', onTime: number | null, early: number | null, late: number | null } | null }> } | null };

export type DashboadEmbeddedUrlQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboadEmbeddedUrlQuery = { embeddedUrl: { __typename?: 'AWSQuicksightUser', enabled: boolean, url: string | null } };

export type UserOrganisationsQueryVariables = Exact<{ [key: string]: never; }>;


export type UserOrganisationsQuery = { userOrgs: Array<{ __typename?: 'Organisation', name: string, id: number }> };

export type OrgOperatorListQueryVariables = Exact<{
  orgId: Scalars['Int']['input'];
}>;


export type OrgOperatorListQuery = { operators: Array<{ __typename?: 'OperatorType', name: string, nocCode: string }> };

export type DistancesListQueryVariables = Exact<{
  filterBy: DistancesFilterInput;
}>;


export type DistancesListQuery = { distances: Array<{ __typename?: 'Distance', operatorId: string, operatorName: string, nocLineAndServiceCode: string, lineName: string, serviceName: string | null, distance: number | null, avlDistance: number | null }> };

export type DistancesDropdownInputQueryVariables = Exact<{ [key: string]: never; }>;


export type DistancesDropdownInputQuery = { distancesDropdowns: { __typename?: 'DistancesDropdown', operators: Array<{ __typename?: 'OperatorForDistances', id: string, name: string, licenses: Array<{ __typename?: 'LicensesForDistance', id: string, services: Array<{ __typename?: 'ServiceForDistances', id: string, name: string, line: string }> | null }> | null }> | null } };

export type AdminOrgListQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminOrgListQuery = { adminOrgMap: Array<{ __typename?: 'AdminOrgOperatorMap', adminAreaId: number, adminName: string | null, operatorId: string, orgId: number, orgName: string | null }> };

export type EventFragment = { __typename?: 'EventType', timestamp: string, type: string, data: { __typename?: 'EventData', message: string } };

export type EventsQueryVariables = Exact<{
  operatorId: Scalars['String']['input'];
  start: Scalars['DateTime']['input'];
  end: Scalars['DateTime']['input'];
}>;


export type EventsQuery = { events: { __typename?: 'EventResponse', items: Array<{ __typename?: 'EventType', timestamp: string, type: string, data: { __typename?: 'EventData', message: string } }> } | null };

export type EventStatsQueryVariables = Exact<{
  operatorId: Scalars['String']['input'];
  start: Scalars['DateTime']['input'];
  end: Scalars['DateTime']['input'];
}>;


export type EventStatsQuery = { eventStats: Array<{ __typename?: 'EventStatsType', count: number, day: string }> };

export type VehicleStatFragment = { __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string };

export type BasicOperatorFragment = { __typename?: 'OperatorFeedMonitoring', name: string, nocCode: string, operatorId: string, feedMonitoring: { __typename?: 'FeedMonitoringType', feedStatus: boolean | null, availability: number | null, lastOutage: string | null, unavailableSince: string | null, liveStats: { __typename?: 'LiveStatsType', updateFrequency: number | null } | null } | null };

export type OperatorLiveStatusFragment = { __typename?: 'OperatorFeedMonitoring', name: string, nocCode: string, operatorId: string, feedMonitoring: { __typename?: 'FeedMonitoringType', feedStatus: boolean | null, availability: number | null, lastOutage: string | null, unavailableSince: string | null, liveStats: { __typename?: 'LiveStatsType', updateFrequency: number | null, currentVehicles: number | null, expectedVehicles: number | null, last24Hours: Array<{ __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string }> | null, last20Minutes: Array<{ __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string }> | null } | null } | null };

export type OperatorFeedHistoryFragment = { __typename?: 'OperatorFeedMonitoring', name: string, nocCode: string, operatorId: string, feedMonitoring: { __typename?: 'FeedMonitoringType', historicalStats: { __typename?: 'HistoricalStatsType', updateFrequency: number | null, availability: number | null } | null, vehicleStats: Array<{ __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string }> | null } | null };

export type FeedMonitoringListQueryVariables = Exact<{ [key: string]: never; }>;


export type FeedMonitoringListQuery = { operatorsFeedMonitoring: Array<{ __typename?: 'OperatorFeedMonitoring', name: string, nocCode: string, operatorId: string, feedMonitoring: { __typename?: 'FeedMonitoringType', feedStatus: boolean | null, availability: number | null, lastOutage: string | null, unavailableSince: string | null, liveStats: { __typename?: 'LiveStatsType', updateFrequency: number | null } | null } | null }> };

export type OperatorSparklineStatsQueryVariables = Exact<{
  operatorIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type OperatorSparklineStatsQuery = { operatorsFeedMonitoring: Array<{ __typename?: 'OperatorFeedMonitoring', nocCode: string, operatorId: string, feedMonitoring: { __typename?: 'FeedMonitoringType', liveStats: { __typename?: 'LiveStatsType', last24Hours: Array<{ __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string }> | null } | null } | null }> };

export type OperatorLiveStatusQueryVariables = Exact<{
  operatorId: Scalars['String']['input'];
}>;


export type OperatorLiveStatusQuery = { operatorFeedMonitoring: { __typename?: 'OperatorFeedMonitoring', name: string, nocCode: string, operatorId: string, feedMonitoring: { __typename?: 'FeedMonitoringType', feedStatus: boolean | null, availability: number | null, lastOutage: string | null, unavailableSince: string | null, liveStats: { __typename?: 'LiveStatsType', updateFrequency: number | null, currentVehicles: number | null, expectedVehicles: number | null, last24Hours: Array<{ __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string }> | null, last20Minutes: Array<{ __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string }> | null } | null } | null } | null };

export type OperatorHistoricStatsQueryVariables = Exact<{
  operatorId: Scalars['String']['input'];
  date: Scalars['Date']['input'];
  start: Scalars['DateTime']['input'];
  end: Scalars['DateTime']['input'];
}>;


export type OperatorHistoricStatsQuery = { operatorFeedMonitoring: { __typename?: 'OperatorFeedMonitoring', name: string, nocCode: string, operatorId: string, feedMonitoring: { __typename?: 'FeedMonitoringType', historicalStats: { __typename?: 'HistoricalStatsType', updateFrequency: number | null, availability: number | null } | null, vehicleStats: Array<{ __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string }> | null } | null } | null };

export type GetAdminAreasQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAdminAreasQuery = { adminAreas: Array<{ __typename?: 'AdminAreasType', id: string, name: string, shape: string }> | null };

export type HeadwayTimeSeriesQueryVariables = Exact<{
  params: HeadwayInputType;
}>;


export type HeadwayTimeSeriesQuery = { headwayMetrics: { __typename?: 'HeadwayMetricsType', headwayTimeSeries: Array<{ __typename?: 'HeadwayTimeSeriesType', ts: string, actual: number | null, scheduled: number | null, excess: number | null }> | null } | null };

export type HeadwayOverviewQueryVariables = Exact<{
  params: HeadwayInputType;
}>;


export type HeadwayOverviewQuery = { headwayMetrics: { __typename?: 'HeadwayMetricsType', headwayOverview: { __typename?: 'HeadwayOverviewType', excess: number | null } | null } | null };

export type HeadwayFrequentServicesQueryVariables = Exact<{
  operatorId: Scalars['String']['input'];
  fromTimestamp: Scalars['String']['input'];
  toTimestamp: Scalars['String']['input'];
}>;


export type HeadwayFrequentServicesQuery = { headwayMetrics: { __typename?: 'HeadwayMetricsType', frequentServices: Array<{ __typename?: 'FrequentServiceType', serviceId: string }> | null } | null };

export type HeadwayFrequentServiceInfoQueryVariables = Exact<{
  inputs: FrequentServiceInfoInputType;
}>;


export type HeadwayFrequentServiceInfoQuery = { headwayMetrics: { __typename?: 'HeadwayMetricsType', frequentServiceInfo: { __typename?: 'FrequentServiceInfoType', numHours: number | null, totalHours: number | null } | null } | null };

export type OnTimeDelayFrequencyQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeDelayFrequencyQuery = { onTimePerformance: { __typename?: 'OnTimePerformanceType', delayFrequency: Array<{ __typename?: 'DelayFrequencyType', bucket: number, frequency: number | null }> | null } | null };

export type OnTimeTimeSeriesQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeTimeSeriesQuery = { onTimePerformance: { __typename?: 'OnTimePerformanceType', punctualityTimeSeries: Array<{ __typename?: 'PunctualityTimeSeriesType', ts: string, onTime: number, early: number, late: number }> | null } | null };

export type OnTimeStatsQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeStatsQuery = { onTimePerformance: { __typename?: 'OnTimePerformanceType', punctualityOverview: { __typename?: 'PunctualityTotalsType', early: number, late: number, onTime: number, scheduled: number, completed: number, averageDeviation: number | null, incomplete: string, averageDelay: number | null } | null } | null };

export type OnTimePunctualityTimeOfDayQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimePunctualityTimeOfDayQuery = { onTimePerformance: { __typename?: 'OnTimePerformanceType', punctualityTimeOfDay: Array<{ __typename?: 'PunctualityTimeOfDayType', timeOfDay: string, onTime: number, early: number, late: number }> | null } | null };

export type OnTimePunctualityDayOfWeekQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimePunctualityDayOfWeekQuery = { onTimePerformance: { __typename?: 'OnTimePerformanceType', punctualityDayOfWeek: Array<{ __typename?: 'PunctualityDayOfWeekType', dayOfWeek: number, onTime: number, early: number, late: number }> | null } | null };

export type OnTimeServicePerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeServicePerformanceListQuery = { onTimePerformance: { __typename?: 'OnTimePerformanceType', servicePerformance: Array<{ __typename?: 'ServicePerformanceType', lineId: string | null, early: number, onTime: number, late: number, averageDelay: number | null, countDelayed: number | null, scheduledDepartures: number, actualDepartures: number, direction: Direction | null, onTimeInSeconds: number | null, earlyInSeconds: number | null, lateInSeconds: number | null, lineInfo: { __typename?: 'ServiceInfoType', serviceId: string, serviceName: string, serviceNumber: string } }> | null } | null };

export type OnTimeStopPerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeStopPerformanceListQuery = { onTimePerformance: { __typename?: 'OnTimePerformanceType', stopPerformance: Array<{ __typename?: 'StopPerformanceType', lineId: string | null, stopId: string, early: number, onTime: number, late: number, averageDelay: number | null, countDelayed: number | null, scheduledDepartures: number, actualDepartures: number, timingPoint: boolean, direction: Direction | null, averageScheduled: number | null, averageActual: number | null, onTimeInSeconds: number | null, earlyInSeconds: number | null, lateInSeconds: number | null, stopInfo: { __typename?: 'StopInfoType', stopId: string, sourceId: string | null, stopName: string, stopLocation: { __typename?: 'GpsPointType', latitude: number, longitude: number }, stopLocality: { __typename?: 'LocalityType', localityId: string | null, localityName: string | null, localityAreaId: string | null, localityAreaName: string | null } } }> | null } | null };

export type OnTimeOperatorPerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeOperatorPerformanceListQuery = { onTimePerformance: { __typename?: 'OnTimePerformanceType', operatorPerformance: { __typename?: 'OperatorPerformancePage', pageInfo: { __typename?: 'PageInfo', totalCount: number | null, next: number | null } | null, items: Array<{ __typename?: 'OperatorPerformanceType', nocCode: string | null, operatorId: string | null, name: string | null, early: number, onTime: number, late: number, averageDelay: number | null }> } | null } | null };

export type ServiceInfoQueryVariables = Exact<{
  lineId: Scalars['String']['input'];
}>;


export type ServiceInfoQuery = { serviceInfo: { __typename?: 'ServiceInfoType', serviceId: string, serviceNumber: string, serviceName: string } | null };

export type TransitModelServicePatternStopsQueryVariables = Exact<{
  operatorId: Scalars['String']['input'];
  lineId: Scalars['String']['input'];
}>;


export type TransitModelServicePatternStopsQuery = { servicePatterns: Array<{ __typename?: 'ServicePatternType', servicePatternId: string, stops: Array<{ __typename?: 'StopType', stopId: string, stopName: string, lon: number, lat: number }>, serviceLinks: Array<{ __typename?: 'ServiceLinkType', fromStop: string, toStop: string, distance: number, routeValidity: RouteType, linkRoute: string | null }> }> };

export type OperatorListQueryVariables = Exact<{ [key: string]: never; }>;


export type OperatorListQuery = { operators: Array<{ __typename?: 'OperatorType', name: string, nocCode: string, operatorId: string, adminAreaIds: Array<string> }> };

export type OperatorLinesQueryVariables = Exact<{
  operatorIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  inputDate: Scalars['String']['input'];
  endDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type OperatorLinesQuery = { lines: Array<{ __typename?: 'LineType', id: string, name: string, number: string, adminAreaIds: Array<number> }> };

export type StopAnalysisQueryVariables = Exact<{
  adminAreaIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  boundingBox: BoundingBoxInputType;
  fromTimestamp: Scalars['String']['input'];
  lineIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  matchType: MatchType;
  operatorIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  toTimestamp: Scalars['String']['input'];
  dayOfWeekFlags?: InputMaybe<DayOfWeekFlagsInputType>;
  startTime?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['String']['input']>;
}>;


export type StopAnalysisQuery = { stopAnalysis: Array<{ __typename?: 'StopStatistics', atcoCode: string, stopName: string, localityName: string, adminAreaName: string, timingPoint: boolean, latitude: number, longitude: number, early: number, late: number, onTime: number, scheduledDepartures: number, completedDepartures: number, totalDelay: number, onTimeInSeconds: number | null, earlyInSeconds: number | null, lateInSeconds: number | null, averageDelay: number | null, direction: string | null, countDelayed: number | null, averageScheduled: number | null, averageScheduledTimingPoint: number | null, averageActual: number | null, averageActualTimingPoint: number | null }> };

export type JourneyQueryVariables = Exact<{
  groupId: Scalars['String']['input'];
  lineId: Scalars['String']['input'];
}>;


export type JourneyQuery = { journey: { __typename?: 'JourneyResult', stops: Array<{ __typename?: 'Stop', estimatedDepartureUtc: string | null, actualDepartureUtc: string | null, scheduledDepartureUtc: string, latitude: number, longitude: number, stopIndex: number, stopName: string, stopId: number, isTimingPoint: boolean, otp: OtpEnum | null, directionRef: string, incompleteReason: number, setDown: boolean }>, avls: Array<{ __typename?: 'AvlPoint', recordedAtTimeUtc: string, latitude: number, longitude: number, vehicleRef: string, directionRef: string }> } };

export type JourneysQueryVariables = Exact<{
  dateOfJourney: Scalars['String']['input'];
  lineId: Scalars['String']['input'];
}>;


export type JourneysQuery = { findJourneys: Array<{ __typename?: 'Journey', groupId: string, startTime: string, serviceName: string, serviceNumber: string, operatorName: string, operatorNoc: string, directionRef: string | null, isCancelled: boolean, vehicleJourneyId: number | null }> };

export type ServicePatternDistanceGeomQueryVariables = Exact<{
  vehicleJourneyId: Scalars['ID']['input'];
}>;


export type ServicePatternDistanceGeomQuery = { getServicePatternDistanceGeom: { __typename?: 'ServicePatternDistanceResult', distance: number, geom: unknown } };

export type GetVersionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetVersionQuery = { apiInfo: { __typename?: 'ApiInfoType', version: string, buildNumber: string } | null };

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
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: string; output: string; }
  DateTime: { input: string; output: string; }
  JSON: { input: unknown; output: unknown; }
  Time: { input: string; output: string; }
};

export type AwsQuicksightUser = {
  __typename?: 'AWSQuicksightUser';
  enabled: Scalars['Boolean']['output'];
  url: Maybe<Scalars['String']['output']>;
};

export type AddFirstStopInputType = {
  adminAreaIds?: InputMaybe<Array<Scalars['String']['input']>>;
  boundingBox?: InputMaybe<BoundingBoxInputType>;
  searchString?: InputMaybe<Scalars['String']['input']>;
};

export type AdminAreasType = {
  __typename?: 'AdminAreasType';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  shape: Scalars['String']['output'];
};

export type AdminOrgOperatorMap = {
  __typename?: 'AdminOrgOperatorMap';
  adminAreaId: Scalars['Int']['output'];
  adminName: Maybe<Scalars['String']['output']>;
  operatorId: Scalars['String']['output'];
  orgId: Scalars['Int']['output'];
  orgName: Maybe<Scalars['String']['output']>;
};

export type ApiInfoType = {
  __typename?: 'ApiInfoType';
  buildNumber: Scalars['String']['output'];
  version: Scalars['String']['output'];
};

/**
 * Filters for AvlLineLevelStatus
 *
 * [BODS integration](https://github.com/department-for-transport-BODS/bods/blob/dev/transit_odp/avl/require_attention/abods/registery.py#L52) uses this so ensure all changes are backwards compatible
 */
export type AvlFiltersInput = {
  lineName?: InputMaybe<Scalars['String']['input']>;
  operatorNoc?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Last Received AVL for on a Line basis
 *
 * [BODS integrates](https://github.com/department-for-transport-BODS/bods/blob/dev/transit_odp/avl/require_attention/abods/registery.py#L52) with this endpoint so ensure all changes are backwards compatible
 */
export type AvlLineLevelStatus = {
  __typename?: 'AvlLineLevelStatus';
  lastRecordedAtTime: Scalars['DateTime']['output'];
  lineName: Scalars['String']['output'];
  operatorNoc: Scalars['String']['output'];
};

export type AvlPoint = {
  __typename?: 'AvlPoint';
  directionRef: Scalars['String']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  recordedAtTimeUtc: Scalars['String']['output'];
  vehicleRef: Scalars['String']['output'];
};

export type BoundingBoxInputType = {
  maxLatitude: Scalars['Float']['input'];
  maxLongitude: Scalars['Float']['input'];
  minLatitude: Scalars['Float']['input'];
  minLongitude: Scalars['Float']['input'];
};

export enum CorridorGranularity {
  Day = 'day',
  Hour = 'hour',
  Minute = 'minute'
}

export type CorridorHistogramType = {
  __typename?: 'CorridorHistogramType';
  bin: Maybe<Scalars['Int']['output']>;
  freq: Maybe<Scalars['Int']['output']>;
};

export type CorridorInputType = {
  name: Scalars['String']['input'];
  stopIds: Array<Scalars['String']['input']>;
};

export type CorridorNamespace = {
  __typename?: 'CorridorNamespace';
  addFirstStop: Array<StopType>;
  addSubsequentStops: Array<StopType>;
  corridorList: Array<CorridorType>;
  getCorridor: Maybe<CorridorType>;
  stats: Maybe<CorridorStatsType>;
};


export type CorridorNamespaceAddFirstStopArgs = {
  inputs: AddFirstStopInputType;
};


export type CorridorNamespaceAddSubsequentStopsArgs = {
  stopList: Array<Scalars['String']['input']>;
};


export type CorridorNamespaceGetCorridorArgs = {
  corridorId: Scalars['Int']['input'];
};


export type CorridorNamespaceStatsArgs = {
  inputs: CorridorStatsInputType;
};

export type CorridorStatsDayOfWeekType = {
  __typename?: 'CorridorStatsDayOfWeekType';
  avgTransitTime: Maybe<Scalars['Float']['output']>;
  dow: Scalars['Int']['output'];
  maxTransitTime: Scalars['Int']['output'];
  minTransitTime: Scalars['Int']['output'];
  percentile25: Maybe<Scalars['Float']['output']>;
  percentile75: Maybe<Scalars['Float']['output']>;
};

export type CorridorStatsHistogramType = {
  __typename?: 'CorridorStatsHistogramType';
  hist: Array<CorridorHistogramType>;
  ts: Maybe<Scalars['String']['output']>;
};

export type CorridorStatsInputType = {
  corridorId: Scalars['String']['input'];
  fromTimestamp: Scalars['String']['input'];
  granularity: CorridorGranularity;
  matchType: MatchType;
  stopList: Array<Scalars['String']['input']>;
  toTimestamp: Scalars['String']['input'];
};

export type CorridorStatsPerServiceType = {
  __typename?: 'CorridorStatsPerServiceType';
  lineName: Scalars['String']['output'];
  noc: Maybe<Scalars['String']['output']>;
  operatorName: Maybe<Scalars['String']['output']>;
  recordedTransits: Maybe<Scalars['Int']['output']>;
  scheduledTransits: Maybe<Scalars['Int']['output']>;
  servicePatternName: Scalars['String']['output'];
  totalTransitTime: Maybe<Scalars['Int']['output']>;
};

export type CorridorStatsTimeOfDayType = {
  __typename?: 'CorridorStatsTimeOfDayType';
  avgTransitTime: Maybe<Scalars['Float']['output']>;
  hour: Scalars['Int']['output'];
  maxTransitTime: Scalars['Int']['output'];
  minTransitTime: Scalars['Int']['output'];
  percentile25: Maybe<Scalars['Float']['output']>;
  percentile75: Maybe<Scalars['Float']['output']>;
};

export type CorridorStatsType = {
  __typename?: 'CorridorStatsType';
  serviceLinks: Array<ServiceLinkType>;
  summaryStats: Maybe<CorridorSummaryStatsType>;
  transitTimeDayOfWeekStats: Array<CorridorStatsDayOfWeekType>;
  transitTimeHistogram: Array<CorridorStatsHistogramType>;
  transitTimePerServiceStats: Array<CorridorStatsPerServiceType>;
  transitTimeStats: Array<CorridorTransitTimeStatsType>;
  transitTimeTimeOfDayStats: Array<CorridorStatsTimeOfDayType>;
};

export type CorridorSummaryStatsType = {
  __typename?: 'CorridorSummaryStatsType';
  averageTransitTime: Maybe<Scalars['Int']['output']>;
  numberOfServices: Maybe<Scalars['Int']['output']>;
  scheduledTransits: Maybe<Scalars['Int']['output']>;
  totalTransits: Maybe<Scalars['Int']['output']>;
};

export type CorridorTransitTimeStatsType = {
  __typename?: 'CorridorTransitTimeStatsType';
  avgTransitTime: Maybe<Scalars['Float']['output']>;
  maxTransitTime: Scalars['Int']['output'];
  minTransitTime: Scalars['Int']['output'];
  percentile25: Maybe<Scalars['Float']['output']>;
  percentile75: Maybe<Scalars['Float']['output']>;
  ts: Maybe<Scalars['String']['output']>;
};

export type CorridorType = {
  __typename?: 'CorridorType';
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  stops: Array<StopInfoType>;
};

export type CorridorUpdateInputType = {
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  stopList: Array<Scalars['String']['input']>;
};

export type DashboardVehicles = {
  __typename?: 'DashboardVehicles';
  actual: Scalars['Int']['output'];
  expected: Scalars['Int']['output'];
  operatorId: Scalars['String']['output'];
};

export type DayOfWeekFlagsInputType = {
  friday: Scalars['Boolean']['input'];
  monday: Scalars['Boolean']['input'];
  saturday: Scalars['Boolean']['input'];
  sunday: Scalars['Boolean']['input'];
  thursday: Scalars['Boolean']['input'];
  tuesday: Scalars['Boolean']['input'];
  wednesday: Scalars['Boolean']['input'];
};

export type DelayFrequencyType = {
  __typename?: 'DelayFrequencyType';
  bucket: Scalars['Int']['output'];
  frequency: Maybe<Scalars['Int']['output']>;
};

export enum Direction {
  All = 'all',
  Anticlockwise = 'anticlockwise',
  Clockwise = 'clockwise',
  Inbound = 'inbound',
  Outbound = 'outbound'
}

export type Distance = {
  __typename?: 'Distance';
  avlDistance: Maybe<Scalars['Int']['output']>;
  distance: Maybe<Scalars['Int']['output']>;
  lineName: Scalars['String']['output'];
  nocLineAndServiceCode: Scalars['String']['output'];
  operatorId: Scalars['String']['output'];
  operatorName: Scalars['String']['output'];
  serviceName: Maybe<Scalars['String']['output']>;
};

export type DistancesDropdown = {
  __typename?: 'DistancesDropdown';
  operators: Maybe<Array<OperatorForDistances>>;
};

export type DistancesFilterInput = {
  adminAreaIds?: InputMaybe<Array<Scalars['String']['input']>>;
  fromTimestamp: Scalars['String']['input'];
  licenseIds?: InputMaybe<Array<Scalars['String']['input']>>;
  nocLineAndServiceCodes?: InputMaybe<Array<Scalars['String']['input']>>;
  operatorIds?: InputMaybe<Array<Scalars['String']['input']>>;
  orgId?: InputMaybe<Scalars['String']['input']>;
  toTimestamp: Scalars['String']['input'];
};

export type EventData = {
  __typename?: 'EventData';
  message: Scalars['String']['output'];
};

export type EventResponse = {
  __typename?: 'EventResponse';
  items: Array<EventType>;
};

export type EventStatsType = {
  __typename?: 'EventStatsType';
  count: Scalars['Int']['output'];
  day: Scalars['Date']['output'];
};

export type EventType = {
  __typename?: 'EventType';
  data: EventData;
  timestamp: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export enum FeatureFlag {
  ServiceMonitoring = 'ServiceMonitoring'
}

export type FeedMonitoringType = {
  __typename?: 'FeedMonitoringType';
  availability: Maybe<Scalars['Float']['output']>;
  feedStatus: Maybe<Scalars['Boolean']['output']>;
  historicalStats: Maybe<HistoricalStatsType>;
  lastOutage: Maybe<Scalars['DateTime']['output']>;
  liveStats: Maybe<LiveStatsType>;
  operatorId: Scalars['String']['output'];
  unavailableSince: Maybe<Scalars['DateTime']['output']>;
  vehicleStats: Maybe<Array<VehicleStatsType>>;
};


export type FeedMonitoringTypeHistoricalStatsArgs = {
  date: Scalars['Date']['input'];
};


export type FeedMonitoringTypeVehicleStatsArgs = {
  end: Scalars['DateTime']['input'];
  granularity: Granularity;
  start: Scalars['DateTime']['input'];
};

export type FrequentServiceInfoFilterType = {
  dayOfWeekFlags?: InputMaybe<DayOfWeekFlagsInputType>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  lineId?: InputMaybe<Scalars['String']['input']>;
  noc?: InputMaybe<Scalars['String']['input']>;
  operatorId?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
};

export type FrequentServiceInfoInputType = {
  filters: FrequentServiceInfoFilterType;
  fromTimestamp: Scalars['String']['input'];
  toTimestamp: Scalars['String']['input'];
};

export type FrequentServiceInfoType = {
  __typename?: 'FrequentServiceInfoType';
  numHours: Maybe<Scalars['Int']['output']>;
  totalHours: Maybe<Scalars['Int']['output']>;
};

export type FrequentServiceType = {
  __typename?: 'FrequentServiceType';
  serviceId: Scalars['String']['output'];
};

export type GpsPointType = {
  __typename?: 'GpsPointType';
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
};

export enum Granularity {
  Day = 'day',
  Hour = 'hour',
  Minute = 'minute',
  Month = 'month'
}

export type HeadwayFiltersInputType = {
  dayOfWeekFlags?: InputMaybe<DayOfWeekFlagsInputType>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  granularity?: InputMaybe<Granularity>;
  lineIds?: InputMaybe<Array<Scalars['String']['input']>>;
  matchType?: InputMaybe<MatchType>;
  nocCodes?: InputMaybe<Array<Scalars['String']['input']>>;
  operatorIds?: InputMaybe<Array<Scalars['String']['input']>>;
  startTime?: InputMaybe<Scalars['String']['input']>;
};

export type HeadwayInputType = {
  filters: HeadwayFiltersInputType;
  fromTimestamp: Scalars['String']['input'];
  toTimestamp: Scalars['String']['input'];
};

export type HeadwayMetricsType = {
  __typename?: 'HeadwayMetricsType';
  frequentServiceInfo: Maybe<FrequentServiceInfoType>;
  frequentServices: Maybe<Array<FrequentServiceType>>;
  headwayOverview: Maybe<HeadwayOverviewType>;
  headwayTimeSeries: Maybe<Array<HeadwayTimeSeriesType>>;
};


export type HeadwayMetricsTypeFrequentServiceInfoArgs = {
  inputs: FrequentServiceInfoInputType;
};


export type HeadwayMetricsTypeFrequentServicesArgs = {
  fromTimestamp: Scalars['String']['input'];
  operatorId: Scalars['String']['input'];
  toTimestamp: Scalars['String']['input'];
};


export type HeadwayMetricsTypeHeadwayOverviewArgs = {
  inputs: HeadwayInputType;
};


export type HeadwayMetricsTypeHeadwayTimeSeriesArgs = {
  inputs: HeadwayInputType;
};

export type HeadwayOverviewType = {
  __typename?: 'HeadwayOverviewType';
  excess: Maybe<Scalars['Float']['output']>;
};

export type HeadwayTimeSeriesType = {
  __typename?: 'HeadwayTimeSeriesType';
  actual: Maybe<Scalars['Float']['output']>;
  excess: Maybe<Scalars['Float']['output']>;
  scheduled: Maybe<Scalars['Float']['output']>;
  ts: Scalars['DateTime']['output'];
};

export type HistoricalStatsType = {
  __typename?: 'HistoricalStatsType';
  availability: Maybe<Scalars['Float']['output']>;
  updateFrequency: Maybe<Scalars['Int']['output']>;
};

export type Journey = {
  __typename?: 'Journey';
  directionRef: Maybe<Scalars['String']['output']>;
  groupId: Scalars['String']['output'];
  isCancelled: Scalars['Boolean']['output'];
  operatorName: Scalars['String']['output'];
  operatorNoc: Scalars['String']['output'];
  serviceName: Scalars['String']['output'];
  serviceNumber: Scalars['String']['output'];
  startTime: Scalars['String']['output'];
  vehicleJourneyId: Maybe<Scalars['Int']['output']>;
};

export type JourneyResult = {
  __typename?: 'JourneyResult';
  avls: Array<AvlPoint>;
  stops: Array<Stop>;
};

export type LicensesForDistance = {
  __typename?: 'LicensesForDistance';
  id: Scalars['String']['output'];
  services: Maybe<Array<ServiceForDistances>>;
};

export type LineType = {
  __typename?: 'LineType';
  adminAreaIds: Array<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  number: Scalars['String']['output'];
};

export type LiveStatsType = {
  __typename?: 'LiveStatsType';
  currentVehicles: Maybe<Scalars['Int']['output']>;
  expectedVehicles: Maybe<Scalars['Int']['output']>;
  feedAlerts: Maybe<Scalars['Int']['output']>;
  feedErrors: Maybe<Scalars['Int']['output']>;
  last20Minutes: Maybe<Array<VehicleStatsType>>;
  last24Hours: Maybe<Array<VehicleStatsType>>;
  operatorId: Scalars['String']['output'];
  updateFrequency: Maybe<Scalars['Int']['output']>;
};

export type LocalityType = {
  __typename?: 'LocalityType';
  localityAreaId: Maybe<Scalars['String']['output']>;
  localityAreaName: Maybe<Scalars['String']['output']>;
  localityId: Maybe<Scalars['String']['output']>;
  localityName: Maybe<Scalars['String']['output']>;
};

export type LoginInfo = {
  __typename?: 'LoginInfo';
  canEditAllAlerts: Scalars['Boolean']['output'];
  canViewDistances: Scalars['Boolean']['output'];
  canViewServiceMonitoring: Scalars['Boolean']['output'];
  currentUserId: Scalars['String']['output'];
  flags: Array<FeatureFlag>;
  serviceMonitoringEmbedUrl: Maybe<Scalars['String']['output']>;
};

export type LoginResponse = {
  __typename?: 'LoginResponse';
  expiresAt: Maybe<Scalars['String']['output']>;
  failedAttempts: Maybe<Scalars['Int']['output']>;
  locked: Maybe<Scalars['Boolean']['output']>;
  maxAttempts: Maybe<Scalars['Int']['output']>;
  success: Scalars['Boolean']['output'];
  unlockAt: Maybe<Scalars['String']['output']>;
};

export enum MatchType {
  Estimated = 'estimated',
  Evidenced = 'evidenced'
}

export type Mutation = {
  __typename?: 'Mutation';
  createCorridor: MutationResponseType;
  deleteCorridor: MutationResponseType;
  login: Maybe<LoginResponse>;
  logout: Scalars['Boolean']['output'];
  updateCorridor: MutationResponseType;
};


export type MutationCreateCorridorArgs = {
  payload: CorridorInputType;
};


export type MutationDeleteCorridorArgs = {
  corridorId: Scalars['Int']['input'];
};


export type MutationLoginArgs = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationUpdateCorridorArgs = {
  inputs: CorridorUpdateInputType;
};

export type MutationResponseType = {
  __typename?: 'MutationResponseType';
  error: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type OnTimePerformanceType = {
  __typename?: 'OnTimePerformanceType';
  delayFrequency: Maybe<Array<DelayFrequencyType>>;
  operatorPerformance: Maybe<OperatorPerformancePage>;
  punctualityDayOfWeek: Maybe<Array<PunctualityDayOfWeekType>>;
  punctualityOverview: Maybe<PunctualityTotalsType>;
  punctualityTimeOfDay: Maybe<Array<PunctualityTimeOfDayType>>;
  punctualityTimeSeries: Maybe<Array<PunctualityTimeSeriesType>>;
  servicePerformance: Maybe<Array<ServicePerformanceType>>;
  servicePunctuality: Array<ServicePunctualityType>;
  stopPerformance: Maybe<Array<StopPerformanceType>>;
};


export type OnTimePerformanceTypeDelayFrequencyArgs = {
  inputs: PerformanceInputType;
};


export type OnTimePerformanceTypeOperatorPerformanceArgs = {
  inputs: PerformanceInputType;
};


export type OnTimePerformanceTypePunctualityDayOfWeekArgs = {
  inputs: PerformanceInputType;
};


export type OnTimePerformanceTypePunctualityOverviewArgs = {
  inputs: PerformanceInputType;
};


export type OnTimePerformanceTypePunctualityTimeOfDayArgs = {
  inputs: PerformanceInputType;
};


export type OnTimePerformanceTypePunctualityTimeSeriesArgs = {
  inputs: PerformanceInputType;
};


export type OnTimePerformanceTypeServicePerformanceArgs = {
  inputs: PerformanceInputType;
};


export type OnTimePerformanceTypeServicePunctualityArgs = {
  inputs: ServicePerformanceInputType;
};


export type OnTimePerformanceTypeStopPerformanceArgs = {
  inputs: PerformanceInputType;
};

export type OperatorFeedMonitoring = {
  __typename?: 'OperatorFeedMonitoring';
  feedMonitoring: Maybe<FeedMonitoringType>;
  name: Scalars['String']['output'];
  /** @deprecated nocCode is deprecated. Use operatorId instead. */
  nocCode: Scalars['String']['output'];
  operatorId: Scalars['String']['output'];
};

export type OperatorFilterInput = {
  operatorIds?: InputMaybe<Array<Scalars['String']['input']>>;
  orgId?: InputMaybe<Scalars['Int']['input']>;
};

export type OperatorForDistances = {
  __typename?: 'OperatorForDistances';
  id: Scalars['String']['output'];
  licenses: Maybe<Array<LicensesForDistance>>;
  name: Scalars['String']['output'];
};

export type OperatorPerformancePage = {
  __typename?: 'OperatorPerformancePage';
  items: Array<OperatorPerformanceType>;
  pageInfo: Maybe<PageInfo>;
};

export type OperatorPerformanceType = {
  __typename?: 'OperatorPerformanceType';
  averageDelay: Maybe<Scalars['Float']['output']>;
  early: Scalars['Int']['output'];
  late: Scalars['Int']['output'];
  name: Maybe<Scalars['String']['output']>;
  nocCode: Maybe<Scalars['String']['output']>;
  onTime: Scalars['Int']['output'];
  operatorId: Maybe<Scalars['String']['output']>;
};

export type OperatorType = {
  __typename?: 'OperatorType';
  adminAreaIds: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  nocCode: Scalars['String']['output'];
  operatorId: Scalars['String']['output'];
};

export type Organisation = {
  __typename?: 'Organisation';
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export enum OtpEnum {
  Early = 'Early',
  Late = 'Late',
  OnTime = 'OnTime'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  next: Maybe<Scalars['Int']['output']>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type PagingInputType = {
  after: Scalars['Int']['input'];
  first: Scalars['Int']['input'];
};

export type PerformanceFiltersInputType = {
  addNonTagged?: InputMaybe<Scalars['Boolean']['input']>;
  adminAreaIds?: InputMaybe<Array<Scalars['String']['input']>>;
  dayOfWeekFlags?: InputMaybe<DayOfWeekFlagsInputType>;
  direction?: InputMaybe<Array<InputMaybe<Direction>>>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  excludeItoLineId?: InputMaybe<Scalars['String']['input']>;
  excludedDates?: InputMaybe<Array<Scalars['Date']['input']>>;
  granularity?: InputMaybe<Granularity>;
  lineIds?: InputMaybe<Array<Scalars['String']['input']>>;
  matchType?: InputMaybe<MatchType>;
  maxDelay?: InputMaybe<Scalars['Int']['input']>;
  minDelay?: InputMaybe<Scalars['Int']['input']>;
  nocCodes?: InputMaybe<Array<Scalars['String']['input']>>;
  onTimeMaxMinutes?: InputMaybe<Scalars['Int']['input']>;
  onTimeMinMinutes?: InputMaybe<Scalars['Int']['input']>;
  operatorIds?: InputMaybe<Array<Scalars['String']['input']>>;
  startTime?: InputMaybe<Scalars['String']['input']>;
  startTimes?: InputMaybe<Array<Scalars['Time']['input']>>;
  stopsSegment?: InputMaybe<StopsSegment>;
  tagIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  timingPointsOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

export type PerformanceInputType = {
  filters: PerformanceFiltersInputType;
  fromTimestamp: Scalars['String']['input'];
  paging?: InputMaybe<PagingInputType>;
  toTimestamp: Scalars['String']['input'];
};

export type PunctualityDayOfWeekType = {
  __typename?: 'PunctualityDayOfWeekType';
  dayOfWeek: Scalars['Int']['output'];
  early: Scalars['Int']['output'];
  late: Scalars['Int']['output'];
  onTime: Scalars['Int']['output'];
};

export type PunctualityTimeOfDayType = {
  __typename?: 'PunctualityTimeOfDayType';
  early: Scalars['Int']['output'];
  late: Scalars['Int']['output'];
  onTime: Scalars['Int']['output'];
  timeOfDay: Scalars['Time']['output'];
};

export type PunctualityTimeSeriesType = {
  __typename?: 'PunctualityTimeSeriesType';
  early: Scalars['Int']['output'];
  late: Scalars['Int']['output'];
  onTime: Scalars['Int']['output'];
  ts: Scalars['DateTime']['output'];
};

export type PunctualityTotalsType = {
  __typename?: 'PunctualityTotalsType';
  averageDelay: Maybe<Scalars['Float']['output']>;
  averageDeviation: Maybe<Scalars['Float']['output']>;
  completed: Scalars['Int']['output'];
  early: Scalars['Int']['output'];
  incomplete: Scalars['String']['output'];
  late: Scalars['Int']['output'];
  onTime: Scalars['Int']['output'];
  scheduled: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  adminAreas: Maybe<Array<AdminAreasType>>;
  adminOrgMap: Array<AdminOrgOperatorMap>;
  apiInfo: Maybe<ApiInfoType>;
  avlLineLevelStatus: Array<AvlLineLevelStatus>;
  corridor: Maybe<CorridorNamespace>;
  dashboardVehicles: Array<DashboardVehicles>;
  distances: Array<Distance>;
  distancesDropdowns: DistancesDropdown;
  embeddedUrl: AwsQuicksightUser;
  eventStats: Array<EventStatsType>;
  events: Maybe<EventResponse>;
  findJourneys: Array<Journey>;
  getServicePatternDistanceGeom: ServicePatternDistanceResult;
  headwayMetrics: Maybe<HeadwayMetricsType>;
  journey: JourneyResult;
  lines: Array<LineType>;
  onTimePerformance: Maybe<OnTimePerformanceType>;
  operatorFeedMonitoring: Maybe<OperatorFeedMonitoring>;
  operators: Array<OperatorType>;
  operatorsFeedMonitoring: Array<OperatorFeedMonitoring>;
  serviceInfo: Maybe<ServiceInfoType>;
  servicePatterns: Array<ServicePatternType>;
  stopAnalysis: Array<StopStatistics>;
  user: Maybe<LoginInfo>;
  userOrgs: Array<Organisation>;
};


export type QueryAvlLineLevelStatusArgs = {
  filters?: InputMaybe<AvlFiltersInput>;
};


export type QueryDashboardVehiclesArgs = {
  operatorId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryDistancesArgs = {
  filterBy?: InputMaybe<DistancesFilterInput>;
};


export type QueryEventStatsArgs = {
  end: Scalars['DateTime']['input'];
  operatorId: Scalars['String']['input'];
  start: Scalars['DateTime']['input'];
};


export type QueryEventsArgs = {
  end: Scalars['DateTime']['input'];
  operatorId: Scalars['String']['input'];
  start: Scalars['DateTime']['input'];
};


export type QueryFindJourneysArgs = {
  dateOfJourney: Scalars['String']['input'];
  lineId: Scalars['String']['input'];
};


export type QueryGetServicePatternDistanceGeomArgs = {
  vehicleJourneyId: Scalars['ID']['input'];
};


export type QueryJourneyArgs = {
  groupId: Scalars['String']['input'];
  lineId: Scalars['String']['input'];
};


export type QueryLinesArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  inputDate: Scalars['String']['input'];
  operatorIds: Array<Scalars['String']['input']>;
};


export type QueryOperatorFeedMonitoringArgs = {
  operatorId: Scalars['String']['input'];
};


export type QueryOperatorsArgs = {
  filterBy?: InputMaybe<OperatorFilterInput>;
};


export type QueryOperatorsFeedMonitoringArgs = {
  filterBy?: InputMaybe<OperatorFilterInput>;
};


export type QueryServiceInfoArgs = {
  serviceId: Scalars['String']['input'];
};


export type QueryServicePatternsArgs = {
  lineId: Scalars['String']['input'];
  operatorId: Scalars['String']['input'];
};


export type QueryStopAnalysisArgs = {
  inputs: StopAnalysisFiltersInput;
};

export enum RankingOrder {
  Ascending = 'ascending',
  Descending = 'descending'
}

export enum RouteType {
  InvalidNoRoutePoints = 'INVALID_NO_ROUTE_POINTS',
  Valid = 'VALID'
}

export type ServiceForDistances = {
  __typename?: 'ServiceForDistances';
  id: Scalars['String']['output'];
  line: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type ServiceInfoType = {
  __typename?: 'ServiceInfoType';
  serviceId: Scalars['String']['output'];
  serviceName: Scalars['String']['output'];
  serviceNumber: Scalars['String']['output'];
};

export type ServiceLinkType = {
  __typename?: 'ServiceLinkType';
  distance: Scalars['Float']['output'];
  fromStop: Scalars['String']['output'];
  linkRoute: Maybe<Scalars['String']['output']>;
  routeValidity: RouteType;
  toStop: Scalars['String']['output'];
};

export type ServicePatternDistanceResult = {
  __typename?: 'ServicePatternDistanceResult';
  distance: Scalars['Int']['output'];
  geom: Scalars['JSON']['output'];
};

export type ServicePatternType = {
  __typename?: 'ServicePatternType';
  serviceLinks: Array<ServiceLinkType>;
  servicePatternId: Scalars['String']['output'];
  stops: Array<StopType>;
};

export type ServicePerformanceFiltersInputType = {
  operatorIds?: InputMaybe<Array<Scalars['String']['input']>>;
  timingPointsOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ServicePerformanceInputType = {
  filters: ServicePerformanceFiltersInputType;
  fromTimestamp: Scalars['String']['input'];
  order: RankingOrder;
  toTimestamp: Scalars['String']['input'];
};

export type ServicePerformanceType = {
  __typename?: 'ServicePerformanceType';
  actualDepartures: Scalars['Int']['output'];
  averageDelay: Maybe<Scalars['Float']['output']>;
  countDelayed: Maybe<Scalars['Int']['output']>;
  direction: Maybe<Direction>;
  early: Scalars['Int']['output'];
  earlyInSeconds: Maybe<Scalars['Float']['output']>;
  late: Scalars['Int']['output'];
  lateInSeconds: Maybe<Scalars['Float']['output']>;
  lineId: Maybe<Scalars['String']['output']>;
  lineInfo: ServiceInfoType;
  onTime: Scalars['Int']['output'];
  onTimeInSeconds: Maybe<Scalars['Float']['output']>;
  scheduledDepartures: Scalars['Int']['output'];
};

export type ServicePunctualityType = {
  __typename?: 'ServicePunctualityType';
  early: Maybe<Scalars['Int']['output']>;
  late: Maybe<Scalars['Int']['output']>;
  lineId: Maybe<Scalars['String']['output']>;
  lineInfo: Maybe<ServiceInfoType>;
  nocCode: Maybe<Scalars['String']['output']>;
  onTime: Maybe<Scalars['Int']['output']>;
  trend: Maybe<ServicePunctualityType>;
};


export type ServicePunctualityTypeTrendArgs = {
  fromTimestamp: Scalars['DateTime']['input'];
  toTimestamp: Scalars['DateTime']['input'];
};

export type Stop = {
  __typename?: 'Stop';
  actualDepartureUtc: Maybe<Scalars['String']['output']>;
  directionRef: Scalars['String']['output'];
  estimatedDepartureUtc: Maybe<Scalars['String']['output']>;
  incompleteReason: Scalars['Int']['output'];
  isTimingPoint: Scalars['Boolean']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  otp: Maybe<OtpEnum>;
  scheduledDepartureUtc: Scalars['String']['output'];
  setDown: Scalars['Boolean']['output'];
  stopId: Scalars['Int']['output'];
  stopIndex: Scalars['Int']['output'];
  stopName: Scalars['String']['output'];
};

export type StopAnalysisFiltersInput = {
  adminAreaIds: Array<Scalars['String']['input']>;
  boundingBox: BoundingBoxInputType;
  dayOfWeekFlags?: InputMaybe<DayOfWeekFlagsInputType>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  fromTimestamp: Scalars['String']['input'];
  lineIds: Array<Scalars['String']['input']>;
  matchType: MatchType;
  operatorIds: Array<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
  toTimestamp: Scalars['String']['input'];
};

export type StopInfoType = {
  __typename?: 'StopInfoType';
  sourceId: Maybe<Scalars['String']['output']>;
  stopId: Scalars['String']['output'];
  stopLocality: LocalityType;
  stopLocation: GpsPointType;
  stopName: Scalars['String']['output'];
};

export type StopPerformanceType = {
  __typename?: 'StopPerformanceType';
  actualDepartures: Scalars['Int']['output'];
  averageActual: Maybe<Scalars['Float']['output']>;
  averageDelay: Maybe<Scalars['Float']['output']>;
  averageScheduled: Maybe<Scalars['Float']['output']>;
  countDelayed: Maybe<Scalars['Int']['output']>;
  direction: Maybe<Direction>;
  early: Scalars['Int']['output'];
  earlyInSeconds: Maybe<Scalars['Float']['output']>;
  late: Scalars['Int']['output'];
  lateInSeconds: Maybe<Scalars['Float']['output']>;
  lineId: Maybe<Scalars['String']['output']>;
  onTime: Scalars['Int']['output'];
  onTimeInSeconds: Maybe<Scalars['Float']['output']>;
  scheduledDepartures: Scalars['Int']['output'];
  stopId: Scalars['String']['output'];
  stopInfo: StopInfoType;
  timingPoint: Scalars['Boolean']['output'];
};

export type StopStatistics = {
  __typename?: 'StopStatistics';
  adminAreaName: Scalars['String']['output'];
  atcoCode: Scalars['String']['output'];
  averageActual: Maybe<Scalars['Float']['output']>;
  averageActualTimingPoint: Maybe<Scalars['Float']['output']>;
  averageDelay: Maybe<Scalars['Int']['output']>;
  averageScheduled: Maybe<Scalars['Float']['output']>;
  averageScheduledTimingPoint: Maybe<Scalars['Float']['output']>;
  completedDepartures: Scalars['Int']['output'];
  countDelayed: Maybe<Scalars['Int']['output']>;
  direction: Maybe<Scalars['String']['output']>;
  early: Scalars['Int']['output'];
  earlyInSeconds: Maybe<Scalars['Float']['output']>;
  late: Scalars['Int']['output'];
  lateInSeconds: Maybe<Scalars['Float']['output']>;
  latitude: Scalars['Float']['output'];
  localityName: Scalars['String']['output'];
  longitude: Scalars['Float']['output'];
  onTime: Scalars['Int']['output'];
  onTimeInSeconds: Maybe<Scalars['Float']['output']>;
  scheduledDepartures: Scalars['Int']['output'];
  stopName: Scalars['String']['output'];
  timingPoint: Scalars['Boolean']['output'];
  totalDelay: Scalars['Float']['output'];
};

export type StopType = {
  __typename?: 'StopType';
  adminAreaId: Maybe<Scalars['String']['output']>;
  lat: Scalars['Float']['output'];
  localityName: Maybe<Scalars['String']['output']>;
  lon: Scalars['Float']['output'];
  sourceId: Maybe<Scalars['String']['output']>;
  stopId: Scalars['String']['output'];
  stopName: Scalars['String']['output'];
};

export enum StopTypeOption {
  AllStops = 'all_stops',
  TimingPoints = 'timing_points'
}

export enum StopsSegment {
  First = 'First',
  Intermediate = 'Intermediate'
}

export type VehicleStatsType = {
  __typename?: 'VehicleStatsType';
  actual: Scalars['Int']['output'];
  expected: Scalars['Int']['output'];
  timestamp: Scalars['DateTime']['output'];
};
