export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
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
