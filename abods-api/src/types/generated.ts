import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { RequestContext } from './extra';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: Date | string; output: Date | string; }
  DateTime: { input: Date | string; output: Date | string; }
  Time: { input: Date | string; output: Date | string; }
};

export type AwsQuicksightUser = {
  __typename?: 'AWSQuicksightUser';
  enabled: Scalars['Boolean']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type AddFirstStopInputType = {
  adminAreaIds?: InputMaybe<Array<Scalars['String']['input']>>;
  boundingBox?: InputMaybe<BoundingBoxInputType>;
  searchString?: InputMaybe<Scalars['String']['input']>;
};

export type AdminAreaInfoType = {
  __typename?: 'AdminAreaInfoType';
  adminAreaId: Scalars['String']['output'];
};

export type AdminAreasType = {
  __typename?: 'AdminAreasType';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  shape: Scalars['String']['output'];
};

export type AlertInputType = {
  alertType: AlertTypeEnum;
  eventHysterisis?: InputMaybe<Scalars['Int']['input']>;
  eventThreshold?: InputMaybe<Scalars['Int']['input']>;
  sendTo: AlertReferenceInput;
};

export type AlertReferenceInput = {
  id: Scalars['String']['input'];
};

export type AlertType = {
  __typename?: 'AlertType';
  alertId: Scalars['String']['output'];
  alertType?: Maybe<AlertTypeEnum>;
  createdBy?: Maybe<UserType>;
  eventHysterisis?: Maybe<Scalars['Int']['output']>;
  eventThreshold?: Maybe<Scalars['Int']['output']>;
  sendTo?: Maybe<UserType>;
};

export enum AlertTypeEnum {
  FeedAvailableEvent = 'FeedAvailableEvent',
  FeedComplianceFailure = 'FeedComplianceFailure',
  FeedFailure = 'FeedFailure',
  FeedUnavailableEvent = 'FeedUnavailableEvent',
  VehicleCountDisparity = 'VehicleCountDisparity',
  VehicleCountDisparityEvent = 'VehicleCountDisparityEvent'
}

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
  bin?: Maybe<Scalars['Int']['output']>;
  freq?: Maybe<Scalars['Int']['output']>;
};

export type CorridorInputType = {
  name: Scalars['String']['input'];
  stopIds: Array<Scalars['String']['input']>;
};

export type CorridorJourneyTimeStatsType = {
  __typename?: 'CorridorJourneyTimeStatsType';
  avgTransitTime?: Maybe<Scalars['Float']['output']>;
  maxTransitTime: Scalars['Int']['output'];
  minTransitTime: Scalars['Int']['output'];
  percentile25?: Maybe<Scalars['Float']['output']>;
  percentile75?: Maybe<Scalars['Float']['output']>;
  ts?: Maybe<Scalars['String']['output']>;
};

export type CorridorNamespace = {
  __typename?: 'CorridorNamespace';
  addFirstStop?: Maybe<Array<Maybe<StopType>>>;
  addSubsequentStops?: Maybe<Array<Maybe<StopType>>>;
  corridorList?: Maybe<Array<Maybe<CorridorType>>>;
  getCorridor?: Maybe<CorridorType>;
  stats?: Maybe<CorridorStatsType>;
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
  avgTransitTime?: Maybe<Scalars['Float']['output']>;
  dow: Scalars['Int']['output'];
  maxTransitTime: Scalars['Int']['output'];
  minTransitTime: Scalars['Int']['output'];
  percentile25?: Maybe<Scalars['Float']['output']>;
  percentile75?: Maybe<Scalars['Float']['output']>;
};

export type CorridorStatsHistogramType = {
  __typename?: 'CorridorStatsHistogramType';
  hist?: Maybe<Array<CorridorHistogramType>>;
  ts?: Maybe<Scalars['String']['output']>;
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
  noc?: Maybe<Scalars['String']['output']>;
  operatorName?: Maybe<Scalars['String']['output']>;
  recordedTransits?: Maybe<Scalars['Int']['output']>;
  scheduledTransits?: Maybe<Scalars['Int']['output']>;
  servicePatternName: Scalars['String']['output'];
  totalJourneyTime?: Maybe<Scalars['Int']['output']>;
};

export type CorridorStatsTimeOfDayType = {
  __typename?: 'CorridorStatsTimeOfDayType';
  avgTransitTime?: Maybe<Scalars['Float']['output']>;
  hour: Scalars['Int']['output'];
  maxTransitTime: Scalars['Int']['output'];
  minTransitTime: Scalars['Int']['output'];
  percentile25?: Maybe<Scalars['Float']['output']>;
  percentile75?: Maybe<Scalars['Float']['output']>;
};

export type CorridorStatsType = {
  __typename?: 'CorridorStatsType';
  journeyTimeDayOfWeekStats?: Maybe<Array<Maybe<CorridorStatsDayOfWeekType>>>;
  journeyTimeHistogram?: Maybe<Array<Maybe<CorridorStatsHistogramType>>>;
  journeyTimePerServiceStats?: Maybe<Array<Maybe<CorridorStatsPerServiceType>>>;
  journeyTimeStats?: Maybe<Array<Maybe<CorridorJourneyTimeStatsType>>>;
  journeyTimeTimeOfDayStats?: Maybe<Array<Maybe<CorridorStatsTimeOfDayType>>>;
  serviceLinks?: Maybe<Array<Maybe<ServiceLinkType>>>;
  summaryStats?: Maybe<CorridorSummaryStatsType>;
};

export type CorridorSummaryStatsType = {
  __typename?: 'CorridorSummaryStatsType';
  averageJourneyTime?: Maybe<Scalars['Int']['output']>;
  numberOfServices?: Maybe<Scalars['Int']['output']>;
  scheduledTransits?: Maybe<Scalars['Int']['output']>;
  totalTransits?: Maybe<Scalars['Int']['output']>;
};

export type CorridorType = {
  __typename?: 'CorridorType';
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  stops?: Maybe<Array<Maybe<StopInfoType>>>;
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
  frequency?: Maybe<Scalars['Int']['output']>;
};

export type EventData = {
  __typename?: 'EventData';
  message: Scalars['String']['output'];
};

export type EventResponse = {
  __typename?: 'EventResponse';
  items?: Maybe<Array<EventType>>;
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

export type FeedMonitoringType = {
  __typename?: 'FeedMonitoringType';
  availability?: Maybe<Scalars['Float']['output']>;
  feedStatus?: Maybe<Scalars['Boolean']['output']>;
  historicalStats?: Maybe<HistoricalStatsType>;
  lastOutage?: Maybe<Scalars['DateTime']['output']>;
  liveStats?: Maybe<LiveStatsType>;
  operatorId: Scalars['String']['output'];
  unavailableSince?: Maybe<Scalars['DateTime']['output']>;
  vehicleStats?: Maybe<Array<Maybe<VehicleStatsType>>>;
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
  numHours?: Maybe<Scalars['Int']['output']>;
  totalHours?: Maybe<Scalars['Int']['output']>;
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
  frequentServiceInfo?: Maybe<FrequentServiceInfoType>;
  frequentServices?: Maybe<Array<Maybe<FrequentServiceType>>>;
  headwayOverview?: Maybe<HeadwayOverviewType>;
  headwayTimeSeries?: Maybe<Array<Maybe<HeadwayTimeSeriesType>>>;
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
  excessWaitTime: Scalars['Float']['output'];
};

export type HeadwayTimeSeriesType = {
  __typename?: 'HeadwayTimeSeriesType';
  actualWaitTime: Scalars['Float']['output'];
  excessWaitTime: Scalars['Float']['output'];
  scheduledWaitTime: Scalars['Float']['output'];
  ts: Scalars['String']['output'];
};

export type HistoricalStatsType = {
  __typename?: 'HistoricalStatsType';
  availability?: Maybe<Scalars['Float']['output']>;
  updateFrequency?: Maybe<Scalars['Int']['output']>;
};

export type InvitationInput = {
  email: Scalars['String']['input'];
  organisation: OrganisationReferenceInput;
  role: RoleReferenceInput;
};

export type InvitationResponseType = {
  __typename?: 'InvitationResponseType';
  error?: Maybe<Scalars['String']['output']>;
  invitation?: Maybe<InvitationType>;
};

export type InvitationType = {
  __typename?: 'InvitationType';
  accepted: Scalars['Boolean']['output'];
  email: Scalars['String']['output'];
};

export type Journey = {
  __typename?: 'Journey';
  directionRef?: Maybe<Scalars['String']['output']>;
  groupId: Scalars['String']['output'];
  operatorName: Scalars['String']['output'];
  operatorNoc: Scalars['String']['output'];
  serviceName: Scalars['String']['output'];
  serviceNumber: Scalars['String']['output'];
  startTime: Scalars['String']['output'];
};

export type JourneyResult = {
  __typename?: 'JourneyResult';
  avls: Array<AvlPoint>;
  stops: Array<Stop>;
};

export enum LineDirection {
  All = 'All',
  Inbound = 'Inbound',
  Outbound = 'Outbound'
}

export type LineType = {
  __typename?: 'LineType';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  number: Scalars['String']['output'];
};

export type LiveStatsType = {
  __typename?: 'LiveStatsType';
  currentVehicles?: Maybe<Scalars['Int']['output']>;
  expectedVehicles?: Maybe<Scalars['Int']['output']>;
  feedAlerts?: Maybe<Scalars['Int']['output']>;
  feedErrors?: Maybe<Scalars['Int']['output']>;
  last20Minutes?: Maybe<Array<Maybe<VehicleStatsType>>>;
  last24Hours?: Maybe<Array<Maybe<VehicleStatsType>>>;
  operatorId: Scalars['String']['output'];
  updateFrequency?: Maybe<Scalars['Int']['output']>;
};

export type LocalityType = {
  __typename?: 'LocalityType';
  localityAreaId?: Maybe<Scalars['String']['output']>;
  localityAreaName?: Maybe<Scalars['String']['output']>;
  localityId?: Maybe<Scalars['String']['output']>;
  localityName?: Maybe<Scalars['String']['output']>;
};

export type LoginResponse = {
  __typename?: 'LoginResponse';
  expiresAt?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export enum MatchType {
  Estimated = 'estimated',
  Evidenced = 'evidenced'
}

export type Mutation = {
  __typename?: 'Mutation';
  addUserAlert: MutationResponseType;
  createCorridor: MutationResponseType;
  deleteCorridor: MutationResponseType;
  deleteUser: MutationResponseType;
  deleteUserAlert: MutationResponseType;
  inviteUser: InvitationResponseType;
  login?: Maybe<LoginResponse>;
  logout: Scalars['Boolean']['output'];
  requestResetPassword: MutationResponseType;
  resetPassword: MutationResponseType;
  signUp: MutationResponseType;
  updateCorridor: MutationResponseType;
  updateUser: UserUpdateResponseType;
  updateUserAlert: MutationResponseType;
  verifyResetPasswordToken: Scalars['Boolean']['output'];
};


export type MutationAddUserAlertArgs = {
  payload: AlertInputType;
};


export type MutationCreateCorridorArgs = {
  payload: CorridorInputType;
};


export type MutationDeleteCorridorArgs = {
  corridorId: Scalars['Int']['input'];
};


export type MutationDeleteUserArgs = {
  username: Scalars['String']['input'];
};


export type MutationDeleteUserAlertArgs = {
  alertId: Scalars['String']['input'];
};


export type MutationInviteUserArgs = {
  payload: InvitationInput;
};


export type MutationLoginArgs = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationRequestResetPasswordArgs = {
  email: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  confirmPassword: Scalars['String']['input'];
  password: Scalars['String']['input'];
  token: Scalars['String']['input'];
  uid: Scalars['String']['input'];
};


export type MutationSignUpArgs = {
  payload: SignupPayloadType;
};


export type MutationUpdateCorridorArgs = {
  inputs: CorridorUpdateInputType;
};


export type MutationUpdateUserArgs = {
  payload: UserUpdateInput;
  username: Scalars['String']['input'];
};


export type MutationUpdateUserAlertArgs = {
  alertId: Scalars['String']['input'];
  payload: AlertInputType;
};


export type MutationVerifyResetPasswordTokenArgs = {
  token: Scalars['String']['input'];
  uid: Scalars['String']['input'];
};

export type MutationResponseType = {
  __typename?: 'MutationResponseType';
  error?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type OnTimePerformanceType = {
  __typename?: 'OnTimePerformanceType';
  delayFrequency?: Maybe<Array<DelayFrequencyType>>;
  operatorPerformance?: Maybe<OperatorPerformancePage>;
  punctualityDayOfWeek?: Maybe<Array<PunctualityDayOfWeekType>>;
  punctualityOverview?: Maybe<PunctualityTotalsType>;
  punctualityTimeOfDay?: Maybe<Array<PunctualityTimeOfDayType>>;
  punctualityTimeSeries?: Maybe<Array<PunctualityTimeSeriesType>>;
  servicePerformance?: Maybe<Array<ServicePerformanceType>>;
  servicePunctuality?: Maybe<Array<Maybe<ServicePunctualityType>>>;
  stopPerformance?: Maybe<Array<StopPerformanceType>>;
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

export type OperatorFilterInput = {
  operatorIds: Array<Scalars['String']['input']>;
};

export type OperatorPerformancePage = {
  __typename?: 'OperatorPerformancePage';
  items?: Maybe<Array<OperatorPerformanceType>>;
  pageInfo?: Maybe<PageInfo>;
};

export type OperatorPerformanceType = {
  __typename?: 'OperatorPerformanceType';
  early: Scalars['Int']['output'];
  late: Scalars['Int']['output'];
  name?: Maybe<Scalars['String']['output']>;
  nocCode?: Maybe<Scalars['String']['output']>;
  onTime: Scalars['Int']['output'];
  operatorId?: Maybe<Scalars['String']['output']>;
};

export type OperatorType = {
  __typename?: 'OperatorType';
  adminAreas?: Maybe<Array<Maybe<AdminAreaInfoType>>>;
  feedMonitoring?: Maybe<FeedMonitoringType>;
  name?: Maybe<Scalars['String']['output']>;
  nocCode?: Maybe<Scalars['String']['output']>;
  operatorId: Scalars['String']['output'];
};

export type OperatorsPage = {
  __typename?: 'OperatorsPage';
  items?: Maybe<Array<Maybe<OperatorType>>>;
};

export type OrganisationReferenceInput = {
  id: Scalars['String']['input'];
};

export type OrganisationType = {
  __typename?: 'OrganisationType';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export enum OtpEnum {
  Early = 'Early',
  Late = 'Late',
  OnTime = 'OnTime'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  next?: Maybe<Scalars['Int']['output']>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type PagingInputType = {
  after: Scalars['Int']['input'];
  first: Scalars['Int']['input'];
};

export type PerformanceFiltersInputType = {
  addNonTagged?: InputMaybe<Scalars['Boolean']['input']>;
  adminAreaIds?: InputMaybe<Array<Scalars['String']['input']>>;
  dayOfWeekFlags?: InputMaybe<DayOfWeekFlagsInputType>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  excludeItoLineId?: InputMaybe<Scalars['String']['input']>;
  excludedDates?: InputMaybe<Array<Scalars['Date']['input']>>;
  granularity?: InputMaybe<Granularity>;
  lineDirection?: InputMaybe<LineDirection>;
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
  averageDeviation?: Maybe<Scalars['Float']['output']>;
  completed: Scalars['Int']['output'];
  early: Scalars['Int']['output'];
  incomplete: Scalars['String']['output'];
  late: Scalars['Int']['output'];
  onTime: Scalars['Int']['output'];
  scheduled: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  adminAreas?: Maybe<Array<AdminAreasType>>;
  apiInfo?: Maybe<ApiInfoType>;
  avlLineLevelStatus: Array<AvlLineLevelStatus>;
  corridor?: Maybe<CorridorNamespace>;
  dashboardVehicles: Array<DashboardVehicles>;
  embeddedUrl: AwsQuicksightUser;
  eventStats?: Maybe<Array<Maybe<EventStatsType>>>;
  events?: Maybe<EventResponse>;
  findJourneys: Array<Journey>;
  headwayMetrics?: Maybe<HeadwayMetricsType>;
  invitation?: Maybe<InvitationType>;
  journey: JourneyResult;
  lines: Array<LineType>;
  onTimePerformance?: Maybe<OnTimePerformanceType>;
  operator?: Maybe<OperatorType>;
  operators?: Maybe<OperatorsPage>;
  roles?: Maybe<Array<RoleType>>;
  serviceInfo?: Maybe<ServiceInfoType>;
  servicePatterns: Array<ServicePatternType>;
  stopAnalysis: Array<Maybe<StopAnalysisType>>;
  user?: Maybe<UserType>;
  userAlert?: Maybe<AlertType>;
  userAlerts?: Maybe<Array<AlertType>>;
  users?: Maybe<Array<UserType>>;
};


export type QueryAvlLineLevelStatusArgs = {
  filters?: InputMaybe<AvlFiltersInput>;
};


export type QueryDashboardVehiclesArgs = {
  operatorId?: InputMaybe<Scalars['String']['input']>;
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


export type QueryInvitationArgs = {
  key: Scalars['String']['input'];
};


export type QueryJourneyArgs = {
  groupId: Scalars['String']['input'];
  lineId: Scalars['String']['input'];
};


export type QueryLinesArgs = {
  inputDate?: InputMaybe<Scalars['String']['input']>;
  operatorId: Scalars['String']['input'];
};


export type QueryOperatorArgs = {
  operatorId: Scalars['String']['input'];
};


export type QueryOperatorsArgs = {
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


export type QueryUserAlertArgs = {
  alertId: Scalars['String']['input'];
};

export enum RankingOrder {
  Ascending = 'ascending',
  Descending = 'descending'
}

export type RoleReferenceInput = {
  id: Scalars['String']['input'];
};

export type RoleType = {
  __typename?: 'RoleType';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  scope: ScopeEnum;
};

export enum RouteType {
  InvalidNoRoutePoints = 'INVALID_NO_ROUTE_POINTS',
  Valid = 'VALID'
}

export enum ScopeEnum {
  Organisation = 'organisation',
  System = 'system'
}

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
  linkRoute?: Maybe<Scalars['String']['output']>;
  routeValidity: RouteType;
  toStop: Scalars['String']['output'];
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
  averageDelay: Scalars['Float']['output'];
  early: Scalars['Int']['output'];
  late: Scalars['Int']['output'];
  lineId?: Maybe<Scalars['String']['output']>;
  lineInfo: ServiceInfoType;
  onTime: Scalars['Int']['output'];
  scheduledDepartures: Scalars['Int']['output'];
};

export type ServicePunctualityType = {
  __typename?: 'ServicePunctualityType';
  early?: Maybe<Scalars['Int']['output']>;
  late?: Maybe<Scalars['Int']['output']>;
  lineId?: Maybe<Scalars['String']['output']>;
  lineInfo?: Maybe<ServiceInfoType>;
  nocCode?: Maybe<Scalars['String']['output']>;
  onTime?: Maybe<Scalars['Int']['output']>;
  trend?: Maybe<ServicePunctualityType>;
};


export type ServicePunctualityTypeTrendArgs = {
  fromTimestamp: Scalars['DateTime']['input'];
  toTimestamp: Scalars['DateTime']['input'];
};

export type SignupPayloadType = {
  firstName: Scalars['String']['input'];
  key: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Stop = {
  __typename?: 'Stop';
  actualDepartureUtc?: Maybe<Scalars['String']['output']>;
  directionRef: Scalars['String']['output'];
  estimatedDepartureUtc?: Maybe<Scalars['String']['output']>;
  incompleteReason: Scalars['Int']['output'];
  isTimingPoint: Scalars['Boolean']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  otp?: Maybe<OtpEnum>;
  scheduledDepartureUtc: Scalars['String']['output'];
  stopId: Scalars['Int']['output'];
  stopIndex: Scalars['Int']['output'];
  stopName: Scalars['String']['output'];
};

export type StopAnalysisFiltersInput = {
  adminAreaIds?: InputMaybe<Array<Scalars['String']['input']>>;
  boundingBox: BoundingBoxInputType;
  fromTimestamp?: InputMaybe<Scalars['DateTime']['input']>;
  lineId?: InputMaybe<Scalars['String']['input']>;
  operatorId?: InputMaybe<Scalars['String']['input']>;
  toTimestamp?: InputMaybe<Scalars['DateTime']['input']>;
};

export type StopAnalysisType = {
  __typename?: 'StopAnalysisType';
  averageDelay: Scalars['Float']['output'];
  completedDepartures: Scalars['Int']['output'];
  early: Scalars['Int']['output'];
  late: Scalars['Int']['output'];
  latitude: Scalars['Float']['output'];
  lineId?: Maybe<Scalars['String']['output']>;
  longitude: Scalars['Float']['output'];
  onTime: Scalars['Int']['output'];
  operatorId?: Maybe<Scalars['String']['output']>;
  scheduledDepartures: Scalars['Int']['output'];
  stopId: Scalars['Int']['output'];
  stopName: Scalars['String']['output'];
  timingPoint?: Maybe<Scalars['Boolean']['output']>;
};

export type StopInfoType = {
  __typename?: 'StopInfoType';
  sourceId?: Maybe<Scalars['String']['output']>;
  stopId: Scalars['String']['output'];
  stopLocality: LocalityType;
  stopLocation: GpsPointType;
  stopName: Scalars['String']['output'];
};

export type StopPerformanceType = {
  __typename?: 'StopPerformanceType';
  actualDepartures: Scalars['Int']['output'];
  averageDelay: Scalars['Float']['output'];
  early: Scalars['Int']['output'];
  late: Scalars['Int']['output'];
  lineId?: Maybe<Scalars['String']['output']>;
  onTime: Scalars['Int']['output'];
  scheduledDepartures: Scalars['Int']['output'];
  stopId: Scalars['String']['output'];
  stopInfo: StopInfoType;
  timingPoint?: Maybe<Scalars['Boolean']['output']>;
};

export type StopType = {
  __typename?: 'StopType';
  adminAreaId?: Maybe<Scalars['String']['output']>;
  lat: Scalars['Float']['output'];
  localityName?: Maybe<Scalars['String']['output']>;
  lon: Scalars['Float']['output'];
  sourceId?: Maybe<Scalars['String']['output']>;
  stopId: Scalars['String']['output'];
  stopName: Scalars['String']['output'];
};

export enum StopsSegment {
  First = 'First',
  Intermediate = 'Intermediate'
}

export type UserType = {
  __typename?: 'UserType';
  email: Scalars['String']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  organisation?: Maybe<OrganisationType>;
  roles?: Maybe<Array<RoleType>>;
  username: Scalars['String']['output'];
};

export type UserUpdateInput = {
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  role: RoleReferenceInput;
};

export type UserUpdateResponseType = {
  __typename?: 'UserUpdateResponseType';
  error?: Maybe<Scalars['String']['output']>;
  user?: Maybe<UserType>;
};

export type VehicleStatsType = {
  __typename?: 'VehicleStatsType';
  actual: Scalars['Int']['output'];
  expected: Scalars['Int']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AWSQuicksightUser: ResolverTypeWrapper<Partial<AwsQuicksightUser>>;
  AddFirstStopInputType: ResolverTypeWrapper<Partial<AddFirstStopInputType>>;
  AdminAreaInfoType: ResolverTypeWrapper<Partial<AdminAreaInfoType>>;
  AdminAreasType: ResolverTypeWrapper<Partial<AdminAreasType>>;
  AlertInputType: ResolverTypeWrapper<Partial<AlertInputType>>;
  AlertReferenceInput: ResolverTypeWrapper<Partial<AlertReferenceInput>>;
  AlertType: ResolverTypeWrapper<Partial<AlertType>>;
  AlertTypeEnum: ResolverTypeWrapper<Partial<AlertTypeEnum>>;
  ApiInfoType: ResolverTypeWrapper<Partial<ApiInfoType>>;
  AvlFiltersInput: ResolverTypeWrapper<Partial<AvlFiltersInput>>;
  AvlLineLevelStatus: ResolverTypeWrapper<Partial<AvlLineLevelStatus>>;
  AvlPoint: ResolverTypeWrapper<Partial<AvlPoint>>;
  Boolean: ResolverTypeWrapper<Partial<Scalars['Boolean']['output']>>;
  BoundingBoxInputType: ResolverTypeWrapper<Partial<BoundingBoxInputType>>;
  CorridorGranularity: ResolverTypeWrapper<Partial<CorridorGranularity>>;
  CorridorHistogramType: ResolverTypeWrapper<Partial<CorridorHistogramType>>;
  CorridorInputType: ResolverTypeWrapper<Partial<CorridorInputType>>;
  CorridorJourneyTimeStatsType: ResolverTypeWrapper<Partial<CorridorJourneyTimeStatsType>>;
  CorridorNamespace: ResolverTypeWrapper<Partial<CorridorNamespace>>;
  CorridorStatsDayOfWeekType: ResolverTypeWrapper<Partial<CorridorStatsDayOfWeekType>>;
  CorridorStatsHistogramType: ResolverTypeWrapper<Partial<CorridorStatsHistogramType>>;
  CorridorStatsInputType: ResolverTypeWrapper<Partial<CorridorStatsInputType>>;
  CorridorStatsPerServiceType: ResolverTypeWrapper<Partial<CorridorStatsPerServiceType>>;
  CorridorStatsTimeOfDayType: ResolverTypeWrapper<Partial<CorridorStatsTimeOfDayType>>;
  CorridorStatsType: ResolverTypeWrapper<Partial<CorridorStatsType>>;
  CorridorSummaryStatsType: ResolverTypeWrapper<Partial<CorridorSummaryStatsType>>;
  CorridorType: ResolverTypeWrapper<Partial<CorridorType>>;
  CorridorUpdateInputType: ResolverTypeWrapper<Partial<CorridorUpdateInputType>>;
  DashboardVehicles: ResolverTypeWrapper<Partial<DashboardVehicles>>;
  Date: ResolverTypeWrapper<Partial<Scalars['Date']['output']>>;
  DateTime: ResolverTypeWrapper<Partial<Scalars['DateTime']['output']>>;
  DayOfWeekFlagsInputType: ResolverTypeWrapper<Partial<DayOfWeekFlagsInputType>>;
  DelayFrequencyType: ResolverTypeWrapper<Partial<DelayFrequencyType>>;
  EventData: ResolverTypeWrapper<Partial<EventData>>;
  EventResponse: ResolverTypeWrapper<Partial<EventResponse>>;
  EventStatsType: ResolverTypeWrapper<Partial<EventStatsType>>;
  EventType: ResolverTypeWrapper<Partial<EventType>>;
  FeedMonitoringType: ResolverTypeWrapper<Partial<FeedMonitoringType>>;
  Float: ResolverTypeWrapper<Partial<Scalars['Float']['output']>>;
  FrequentServiceInfoFilterType: ResolverTypeWrapper<Partial<FrequentServiceInfoFilterType>>;
  FrequentServiceInfoInputType: ResolverTypeWrapper<Partial<FrequentServiceInfoInputType>>;
  FrequentServiceInfoType: ResolverTypeWrapper<Partial<FrequentServiceInfoType>>;
  FrequentServiceType: ResolverTypeWrapper<Partial<FrequentServiceType>>;
  GpsPointType: ResolverTypeWrapper<Partial<GpsPointType>>;
  Granularity: ResolverTypeWrapper<Partial<Granularity>>;
  HeadwayFiltersInputType: ResolverTypeWrapper<Partial<HeadwayFiltersInputType>>;
  HeadwayInputType: ResolverTypeWrapper<Partial<HeadwayInputType>>;
  HeadwayMetricsType: ResolverTypeWrapper<Partial<HeadwayMetricsType>>;
  HeadwayOverviewType: ResolverTypeWrapper<Partial<HeadwayOverviewType>>;
  HeadwayTimeSeriesType: ResolverTypeWrapper<Partial<HeadwayTimeSeriesType>>;
  HistoricalStatsType: ResolverTypeWrapper<Partial<HistoricalStatsType>>;
  Int: ResolverTypeWrapper<Partial<Scalars['Int']['output']>>;
  InvitationInput: ResolverTypeWrapper<Partial<InvitationInput>>;
  InvitationResponseType: ResolverTypeWrapper<Partial<InvitationResponseType>>;
  InvitationType: ResolverTypeWrapper<Partial<InvitationType>>;
  Journey: ResolverTypeWrapper<Partial<Journey>>;
  JourneyResult: ResolverTypeWrapper<Partial<JourneyResult>>;
  LineDirection: ResolverTypeWrapper<Partial<LineDirection>>;
  LineType: ResolverTypeWrapper<Partial<LineType>>;
  LiveStatsType: ResolverTypeWrapper<Partial<LiveStatsType>>;
  LocalityType: ResolverTypeWrapper<Partial<LocalityType>>;
  LoginResponse: ResolverTypeWrapper<Partial<LoginResponse>>;
  MatchType: ResolverTypeWrapper<Partial<MatchType>>;
  Mutation: ResolverTypeWrapper<{}>;
  MutationResponseType: ResolverTypeWrapper<Partial<MutationResponseType>>;
  OnTimePerformanceType: ResolverTypeWrapper<Partial<OnTimePerformanceType>>;
  OperatorFilterInput: ResolverTypeWrapper<Partial<OperatorFilterInput>>;
  OperatorPerformancePage: ResolverTypeWrapper<Partial<OperatorPerformancePage>>;
  OperatorPerformanceType: ResolverTypeWrapper<Partial<OperatorPerformanceType>>;
  OperatorType: ResolverTypeWrapper<Partial<OperatorType>>;
  OperatorsPage: ResolverTypeWrapper<Partial<OperatorsPage>>;
  OrganisationReferenceInput: ResolverTypeWrapper<Partial<OrganisationReferenceInput>>;
  OrganisationType: ResolverTypeWrapper<Partial<OrganisationType>>;
  OtpEnum: ResolverTypeWrapper<Partial<OtpEnum>>;
  PageInfo: ResolverTypeWrapper<Partial<PageInfo>>;
  PagingInputType: ResolverTypeWrapper<Partial<PagingInputType>>;
  PerformanceFiltersInputType: ResolverTypeWrapper<Partial<PerformanceFiltersInputType>>;
  PerformanceInputType: ResolverTypeWrapper<Partial<PerformanceInputType>>;
  PunctualityDayOfWeekType: ResolverTypeWrapper<Partial<PunctualityDayOfWeekType>>;
  PunctualityTimeOfDayType: ResolverTypeWrapper<Partial<PunctualityTimeOfDayType>>;
  PunctualityTimeSeriesType: ResolverTypeWrapper<Partial<PunctualityTimeSeriesType>>;
  PunctualityTotalsType: ResolverTypeWrapper<Partial<PunctualityTotalsType>>;
  Query: ResolverTypeWrapper<{}>;
  RankingOrder: ResolverTypeWrapper<Partial<RankingOrder>>;
  RoleReferenceInput: ResolverTypeWrapper<Partial<RoleReferenceInput>>;
  RoleType: ResolverTypeWrapper<Partial<RoleType>>;
  RouteType: ResolverTypeWrapper<Partial<RouteType>>;
  ScopeEnum: ResolverTypeWrapper<Partial<ScopeEnum>>;
  ServiceInfoType: ResolverTypeWrapper<Partial<ServiceInfoType>>;
  ServiceLinkType: ResolverTypeWrapper<Partial<ServiceLinkType>>;
  ServicePatternType: ResolverTypeWrapper<Partial<ServicePatternType>>;
  ServicePerformanceFiltersInputType: ResolverTypeWrapper<Partial<ServicePerformanceFiltersInputType>>;
  ServicePerformanceInputType: ResolverTypeWrapper<Partial<ServicePerformanceInputType>>;
  ServicePerformanceType: ResolverTypeWrapper<Partial<ServicePerformanceType>>;
  ServicePunctualityType: ResolverTypeWrapper<Partial<ServicePunctualityType>>;
  SignupPayloadType: ResolverTypeWrapper<Partial<SignupPayloadType>>;
  Stop: ResolverTypeWrapper<Partial<Stop>>;
  StopAnalysisFiltersInput: ResolverTypeWrapper<Partial<StopAnalysisFiltersInput>>;
  StopAnalysisType: ResolverTypeWrapper<Partial<StopAnalysisType>>;
  StopInfoType: ResolverTypeWrapper<Partial<StopInfoType>>;
  StopPerformanceType: ResolverTypeWrapper<Partial<StopPerformanceType>>;
  StopType: ResolverTypeWrapper<Partial<StopType>>;
  StopsSegment: ResolverTypeWrapper<Partial<StopsSegment>>;
  String: ResolverTypeWrapper<Partial<Scalars['String']['output']>>;
  Time: ResolverTypeWrapper<Partial<Scalars['Time']['output']>>;
  UserType: ResolverTypeWrapper<Partial<UserType>>;
  UserUpdateInput: ResolverTypeWrapper<Partial<UserUpdateInput>>;
  UserUpdateResponseType: ResolverTypeWrapper<Partial<UserUpdateResponseType>>;
  VehicleStatsType: ResolverTypeWrapper<Partial<VehicleStatsType>>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AWSQuicksightUser: Partial<AwsQuicksightUser>;
  AddFirstStopInputType: Partial<AddFirstStopInputType>;
  AdminAreaInfoType: Partial<AdminAreaInfoType>;
  AdminAreasType: Partial<AdminAreasType>;
  AlertInputType: Partial<AlertInputType>;
  AlertReferenceInput: Partial<AlertReferenceInput>;
  AlertType: Partial<AlertType>;
  ApiInfoType: Partial<ApiInfoType>;
  AvlFiltersInput: Partial<AvlFiltersInput>;
  AvlLineLevelStatus: Partial<AvlLineLevelStatus>;
  AvlPoint: Partial<AvlPoint>;
  Boolean: Partial<Scalars['Boolean']['output']>;
  BoundingBoxInputType: Partial<BoundingBoxInputType>;
  CorridorHistogramType: Partial<CorridorHistogramType>;
  CorridorInputType: Partial<CorridorInputType>;
  CorridorJourneyTimeStatsType: Partial<CorridorJourneyTimeStatsType>;
  CorridorNamespace: Partial<CorridorNamespace>;
  CorridorStatsDayOfWeekType: Partial<CorridorStatsDayOfWeekType>;
  CorridorStatsHistogramType: Partial<CorridorStatsHistogramType>;
  CorridorStatsInputType: Partial<CorridorStatsInputType>;
  CorridorStatsPerServiceType: Partial<CorridorStatsPerServiceType>;
  CorridorStatsTimeOfDayType: Partial<CorridorStatsTimeOfDayType>;
  CorridorStatsType: Partial<CorridorStatsType>;
  CorridorSummaryStatsType: Partial<CorridorSummaryStatsType>;
  CorridorType: Partial<CorridorType>;
  CorridorUpdateInputType: Partial<CorridorUpdateInputType>;
  DashboardVehicles: Partial<DashboardVehicles>;
  Date: Partial<Scalars['Date']['output']>;
  DateTime: Partial<Scalars['DateTime']['output']>;
  DayOfWeekFlagsInputType: Partial<DayOfWeekFlagsInputType>;
  DelayFrequencyType: Partial<DelayFrequencyType>;
  EventData: Partial<EventData>;
  EventResponse: Partial<EventResponse>;
  EventStatsType: Partial<EventStatsType>;
  EventType: Partial<EventType>;
  FeedMonitoringType: Partial<FeedMonitoringType>;
  Float: Partial<Scalars['Float']['output']>;
  FrequentServiceInfoFilterType: Partial<FrequentServiceInfoFilterType>;
  FrequentServiceInfoInputType: Partial<FrequentServiceInfoInputType>;
  FrequentServiceInfoType: Partial<FrequentServiceInfoType>;
  FrequentServiceType: Partial<FrequentServiceType>;
  GpsPointType: Partial<GpsPointType>;
  HeadwayFiltersInputType: Partial<HeadwayFiltersInputType>;
  HeadwayInputType: Partial<HeadwayInputType>;
  HeadwayMetricsType: Partial<HeadwayMetricsType>;
  HeadwayOverviewType: Partial<HeadwayOverviewType>;
  HeadwayTimeSeriesType: Partial<HeadwayTimeSeriesType>;
  HistoricalStatsType: Partial<HistoricalStatsType>;
  Int: Partial<Scalars['Int']['output']>;
  InvitationInput: Partial<InvitationInput>;
  InvitationResponseType: Partial<InvitationResponseType>;
  InvitationType: Partial<InvitationType>;
  Journey: Partial<Journey>;
  JourneyResult: Partial<JourneyResult>;
  LineType: Partial<LineType>;
  LiveStatsType: Partial<LiveStatsType>;
  LocalityType: Partial<LocalityType>;
  LoginResponse: Partial<LoginResponse>;
  Mutation: {};
  MutationResponseType: Partial<MutationResponseType>;
  OnTimePerformanceType: Partial<OnTimePerformanceType>;
  OperatorFilterInput: Partial<OperatorFilterInput>;
  OperatorPerformancePage: Partial<OperatorPerformancePage>;
  OperatorPerformanceType: Partial<OperatorPerformanceType>;
  OperatorType: Partial<OperatorType>;
  OperatorsPage: Partial<OperatorsPage>;
  OrganisationReferenceInput: Partial<OrganisationReferenceInput>;
  OrganisationType: Partial<OrganisationType>;
  PageInfo: Partial<PageInfo>;
  PagingInputType: Partial<PagingInputType>;
  PerformanceFiltersInputType: Partial<PerformanceFiltersInputType>;
  PerformanceInputType: Partial<PerformanceInputType>;
  PunctualityDayOfWeekType: Partial<PunctualityDayOfWeekType>;
  PunctualityTimeOfDayType: Partial<PunctualityTimeOfDayType>;
  PunctualityTimeSeriesType: Partial<PunctualityTimeSeriesType>;
  PunctualityTotalsType: Partial<PunctualityTotalsType>;
  Query: {};
  RoleReferenceInput: Partial<RoleReferenceInput>;
  RoleType: Partial<RoleType>;
  ServiceInfoType: Partial<ServiceInfoType>;
  ServiceLinkType: Partial<ServiceLinkType>;
  ServicePatternType: Partial<ServicePatternType>;
  ServicePerformanceFiltersInputType: Partial<ServicePerformanceFiltersInputType>;
  ServicePerformanceInputType: Partial<ServicePerformanceInputType>;
  ServicePerformanceType: Partial<ServicePerformanceType>;
  ServicePunctualityType: Partial<ServicePunctualityType>;
  SignupPayloadType: Partial<SignupPayloadType>;
  Stop: Partial<Stop>;
  StopAnalysisFiltersInput: Partial<StopAnalysisFiltersInput>;
  StopAnalysisType: Partial<StopAnalysisType>;
  StopInfoType: Partial<StopInfoType>;
  StopPerformanceType: Partial<StopPerformanceType>;
  StopType: Partial<StopType>;
  String: Partial<Scalars['String']['output']>;
  Time: Partial<Scalars['Time']['output']>;
  UserType: Partial<UserType>;
  UserUpdateInput: Partial<UserUpdateInput>;
  UserUpdateResponseType: Partial<UserUpdateResponseType>;
  VehicleStatsType: Partial<VehicleStatsType>;
}>;

export type AwsQuicksightUserResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['AWSQuicksightUser'] = ResolversParentTypes['AWSQuicksightUser']> = ResolversObject<{
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AdminAreaInfoTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['AdminAreaInfoType'] = ResolversParentTypes['AdminAreaInfoType']> = ResolversObject<{
  adminAreaId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AdminAreasTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['AdminAreasType'] = ResolversParentTypes['AdminAreasType']> = ResolversObject<{
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  shape?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AlertTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['AlertType'] = ResolversParentTypes['AlertType']> = ResolversObject<{
  alertId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  alertType?: Resolver<Maybe<ResolversTypes['AlertTypeEnum']>, ParentType, ContextType>;
  createdBy?: Resolver<Maybe<ResolversTypes['UserType']>, ParentType, ContextType>;
  eventHysterisis?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  eventThreshold?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  sendTo?: Resolver<Maybe<ResolversTypes['UserType']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ApiInfoTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['ApiInfoType'] = ResolversParentTypes['ApiInfoType']> = ResolversObject<{
  buildNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AvlLineLevelStatusResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['AvlLineLevelStatus'] = ResolversParentTypes['AvlLineLevelStatus']> = ResolversObject<{
  lastRecordedAtTime?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  lineName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  operatorNoc?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AvlPointResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['AvlPoint'] = ResolversParentTypes['AvlPoint']> = ResolversObject<{
  directionRef?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  latitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  longitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  recordedAtTimeUtc?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  vehicleRef?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorridorHistogramTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['CorridorHistogramType'] = ResolversParentTypes['CorridorHistogramType']> = ResolversObject<{
  bin?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  freq?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorridorJourneyTimeStatsTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['CorridorJourneyTimeStatsType'] = ResolversParentTypes['CorridorJourneyTimeStatsType']> = ResolversObject<{
  avgTransitTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  maxTransitTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  minTransitTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  percentile25?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  percentile75?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  ts?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorridorNamespaceResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['CorridorNamespace'] = ResolversParentTypes['CorridorNamespace']> = ResolversObject<{
  addFirstStop?: Resolver<Maybe<Array<Maybe<ResolversTypes['StopType']>>>, ParentType, ContextType, RequireFields<CorridorNamespaceAddFirstStopArgs, 'inputs'>>;
  addSubsequentStops?: Resolver<Maybe<Array<Maybe<ResolversTypes['StopType']>>>, ParentType, ContextType, RequireFields<CorridorNamespaceAddSubsequentStopsArgs, 'stopList'>>;
  corridorList?: Resolver<Maybe<Array<Maybe<ResolversTypes['CorridorType']>>>, ParentType, ContextType>;
  getCorridor?: Resolver<Maybe<ResolversTypes['CorridorType']>, ParentType, ContextType, RequireFields<CorridorNamespaceGetCorridorArgs, 'corridorId'>>;
  stats?: Resolver<Maybe<ResolversTypes['CorridorStatsType']>, ParentType, ContextType, RequireFields<CorridorNamespaceStatsArgs, 'inputs'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorridorStatsDayOfWeekTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['CorridorStatsDayOfWeekType'] = ResolversParentTypes['CorridorStatsDayOfWeekType']> = ResolversObject<{
  avgTransitTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  dow?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  maxTransitTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  minTransitTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  percentile25?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  percentile75?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorridorStatsHistogramTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['CorridorStatsHistogramType'] = ResolversParentTypes['CorridorStatsHistogramType']> = ResolversObject<{
  hist?: Resolver<Maybe<Array<ResolversTypes['CorridorHistogramType']>>, ParentType, ContextType>;
  ts?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorridorStatsPerServiceTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['CorridorStatsPerServiceType'] = ResolversParentTypes['CorridorStatsPerServiceType']> = ResolversObject<{
  lineName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  noc?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  operatorName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  recordedTransits?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  scheduledTransits?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  servicePatternName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalJourneyTime?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorridorStatsTimeOfDayTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['CorridorStatsTimeOfDayType'] = ResolversParentTypes['CorridorStatsTimeOfDayType']> = ResolversObject<{
  avgTransitTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  hour?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  maxTransitTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  minTransitTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  percentile25?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  percentile75?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorridorStatsTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['CorridorStatsType'] = ResolversParentTypes['CorridorStatsType']> = ResolversObject<{
  journeyTimeDayOfWeekStats?: Resolver<Maybe<Array<Maybe<ResolversTypes['CorridorStatsDayOfWeekType']>>>, ParentType, ContextType>;
  journeyTimeHistogram?: Resolver<Maybe<Array<Maybe<ResolversTypes['CorridorStatsHistogramType']>>>, ParentType, ContextType>;
  journeyTimePerServiceStats?: Resolver<Maybe<Array<Maybe<ResolversTypes['CorridorStatsPerServiceType']>>>, ParentType, ContextType>;
  journeyTimeStats?: Resolver<Maybe<Array<Maybe<ResolversTypes['CorridorJourneyTimeStatsType']>>>, ParentType, ContextType>;
  journeyTimeTimeOfDayStats?: Resolver<Maybe<Array<Maybe<ResolversTypes['CorridorStatsTimeOfDayType']>>>, ParentType, ContextType>;
  serviceLinks?: Resolver<Maybe<Array<Maybe<ResolversTypes['ServiceLinkType']>>>, ParentType, ContextType>;
  summaryStats?: Resolver<Maybe<ResolversTypes['CorridorSummaryStatsType']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorridorSummaryStatsTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['CorridorSummaryStatsType'] = ResolversParentTypes['CorridorSummaryStatsType']> = ResolversObject<{
  averageJourneyTime?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  numberOfServices?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  scheduledTransits?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalTransits?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorridorTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['CorridorType'] = ResolversParentTypes['CorridorType']> = ResolversObject<{
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stops?: Resolver<Maybe<Array<Maybe<ResolversTypes['StopInfoType']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardVehiclesResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['DashboardVehicles'] = ResolversParentTypes['DashboardVehicles']> = ResolversObject<{
  actual?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  expected?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  operatorId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DelayFrequencyTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['DelayFrequencyType'] = ResolversParentTypes['DelayFrequencyType']> = ResolversObject<{
  bucket?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  frequency?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventDataResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['EventData'] = ResolversParentTypes['EventData']> = ResolversObject<{
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventResponseResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['EventResponse'] = ResolversParentTypes['EventResponse']> = ResolversObject<{
  items?: Resolver<Maybe<Array<ResolversTypes['EventType']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventStatsTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['EventStatsType'] = ResolversParentTypes['EventStatsType']> = ResolversObject<{
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  day?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['EventType'] = ResolversParentTypes['EventType']> = ResolversObject<{
  data?: Resolver<ResolversTypes['EventData'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FeedMonitoringTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['FeedMonitoringType'] = ResolversParentTypes['FeedMonitoringType']> = ResolversObject<{
  availability?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  feedStatus?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  historicalStats?: Resolver<Maybe<ResolversTypes['HistoricalStatsType']>, ParentType, ContextType, RequireFields<FeedMonitoringTypeHistoricalStatsArgs, 'date'>>;
  lastOutage?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  liveStats?: Resolver<Maybe<ResolversTypes['LiveStatsType']>, ParentType, ContextType>;
  operatorId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  unavailableSince?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  vehicleStats?: Resolver<Maybe<Array<Maybe<ResolversTypes['VehicleStatsType']>>>, ParentType, ContextType, RequireFields<FeedMonitoringTypeVehicleStatsArgs, 'end' | 'granularity' | 'start'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FrequentServiceInfoTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['FrequentServiceInfoType'] = ResolversParentTypes['FrequentServiceInfoType']> = ResolversObject<{
  numHours?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalHours?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FrequentServiceTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['FrequentServiceType'] = ResolversParentTypes['FrequentServiceType']> = ResolversObject<{
  serviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GpsPointTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['GpsPointType'] = ResolversParentTypes['GpsPointType']> = ResolversObject<{
  latitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  longitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HeadwayMetricsTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['HeadwayMetricsType'] = ResolversParentTypes['HeadwayMetricsType']> = ResolversObject<{
  frequentServiceInfo?: Resolver<Maybe<ResolversTypes['FrequentServiceInfoType']>, ParentType, ContextType, RequireFields<HeadwayMetricsTypeFrequentServiceInfoArgs, 'inputs'>>;
  frequentServices?: Resolver<Maybe<Array<Maybe<ResolversTypes['FrequentServiceType']>>>, ParentType, ContextType, RequireFields<HeadwayMetricsTypeFrequentServicesArgs, 'fromTimestamp' | 'operatorId' | 'toTimestamp'>>;
  headwayOverview?: Resolver<Maybe<ResolversTypes['HeadwayOverviewType']>, ParentType, ContextType, RequireFields<HeadwayMetricsTypeHeadwayOverviewArgs, 'inputs'>>;
  headwayTimeSeries?: Resolver<Maybe<Array<Maybe<ResolversTypes['HeadwayTimeSeriesType']>>>, ParentType, ContextType, RequireFields<HeadwayMetricsTypeHeadwayTimeSeriesArgs, 'inputs'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HeadwayOverviewTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['HeadwayOverviewType'] = ResolversParentTypes['HeadwayOverviewType']> = ResolversObject<{
  excessWaitTime?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HeadwayTimeSeriesTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['HeadwayTimeSeriesType'] = ResolversParentTypes['HeadwayTimeSeriesType']> = ResolversObject<{
  actualWaitTime?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  excessWaitTime?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  scheduledWaitTime?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  ts?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HistoricalStatsTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['HistoricalStatsType'] = ResolversParentTypes['HistoricalStatsType']> = ResolversObject<{
  availability?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  updateFrequency?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InvitationResponseTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['InvitationResponseType'] = ResolversParentTypes['InvitationResponseType']> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  invitation?: Resolver<Maybe<ResolversTypes['InvitationType']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InvitationTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['InvitationType'] = ResolversParentTypes['InvitationType']> = ResolversObject<{
  accepted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type JourneyResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['Journey'] = ResolversParentTypes['Journey']> = ResolversObject<{
  directionRef?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  groupId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  operatorName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  operatorNoc?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serviceName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serviceNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type JourneyResultResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['JourneyResult'] = ResolversParentTypes['JourneyResult']> = ResolversObject<{
  avls?: Resolver<Array<ResolversTypes['AvlPoint']>, ParentType, ContextType>;
  stops?: Resolver<Array<ResolversTypes['Stop']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LineTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['LineType'] = ResolversParentTypes['LineType']> = ResolversObject<{
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  number?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LiveStatsTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['LiveStatsType'] = ResolversParentTypes['LiveStatsType']> = ResolversObject<{
  currentVehicles?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  expectedVehicles?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  feedAlerts?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  feedErrors?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  last20Minutes?: Resolver<Maybe<Array<Maybe<ResolversTypes['VehicleStatsType']>>>, ParentType, ContextType>;
  last24Hours?: Resolver<Maybe<Array<Maybe<ResolversTypes['VehicleStatsType']>>>, ParentType, ContextType>;
  operatorId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updateFrequency?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LocalityTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['LocalityType'] = ResolversParentTypes['LocalityType']> = ResolversObject<{
  localityAreaId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  localityAreaName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  localityId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  localityName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LoginResponseResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['LoginResponse'] = ResolversParentTypes['LoginResponse']> = ResolversObject<{
  expiresAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  addUserAlert?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationAddUserAlertArgs, 'payload'>>;
  createCorridor?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationCreateCorridorArgs, 'payload'>>;
  deleteCorridor?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationDeleteCorridorArgs, 'corridorId'>>;
  deleteUser?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'username'>>;
  deleteUserAlert?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationDeleteUserAlertArgs, 'alertId'>>;
  inviteUser?: Resolver<ResolversTypes['InvitationResponseType'], ParentType, ContextType, RequireFields<MutationInviteUserArgs, 'payload'>>;
  login?: Resolver<Maybe<ResolversTypes['LoginResponse']>, ParentType, ContextType, RequireFields<MutationLoginArgs, 'password' | 'username'>>;
  logout?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  requestResetPassword?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationRequestResetPasswordArgs, 'email'>>;
  resetPassword?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationResetPasswordArgs, 'confirmPassword' | 'password' | 'token' | 'uid'>>;
  signUp?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationSignUpArgs, 'payload'>>;
  updateCorridor?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationUpdateCorridorArgs, 'inputs'>>;
  updateUser?: Resolver<ResolversTypes['UserUpdateResponseType'], ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'payload' | 'username'>>;
  updateUserAlert?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationUpdateUserAlertArgs, 'alertId' | 'payload'>>;
  verifyResetPasswordToken?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationVerifyResetPasswordTokenArgs, 'token' | 'uid'>>;
}>;

export type MutationResponseTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['MutationResponseType'] = ResolversParentTypes['MutationResponseType']> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OnTimePerformanceTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['OnTimePerformanceType'] = ResolversParentTypes['OnTimePerformanceType']> = ResolversObject<{
  delayFrequency?: Resolver<Maybe<Array<ResolversTypes['DelayFrequencyType']>>, ParentType, ContextType, RequireFields<OnTimePerformanceTypeDelayFrequencyArgs, 'inputs'>>;
  operatorPerformance?: Resolver<Maybe<ResolversTypes['OperatorPerformancePage']>, ParentType, ContextType, RequireFields<OnTimePerformanceTypeOperatorPerformanceArgs, 'inputs'>>;
  punctualityDayOfWeek?: Resolver<Maybe<Array<ResolversTypes['PunctualityDayOfWeekType']>>, ParentType, ContextType, RequireFields<OnTimePerformanceTypePunctualityDayOfWeekArgs, 'inputs'>>;
  punctualityOverview?: Resolver<Maybe<ResolversTypes['PunctualityTotalsType']>, ParentType, ContextType, RequireFields<OnTimePerformanceTypePunctualityOverviewArgs, 'inputs'>>;
  punctualityTimeOfDay?: Resolver<Maybe<Array<ResolversTypes['PunctualityTimeOfDayType']>>, ParentType, ContextType, RequireFields<OnTimePerformanceTypePunctualityTimeOfDayArgs, 'inputs'>>;
  punctualityTimeSeries?: Resolver<Maybe<Array<ResolversTypes['PunctualityTimeSeriesType']>>, ParentType, ContextType, RequireFields<OnTimePerformanceTypePunctualityTimeSeriesArgs, 'inputs'>>;
  servicePerformance?: Resolver<Maybe<Array<ResolversTypes['ServicePerformanceType']>>, ParentType, ContextType, RequireFields<OnTimePerformanceTypeServicePerformanceArgs, 'inputs'>>;
  servicePunctuality?: Resolver<Maybe<Array<Maybe<ResolversTypes['ServicePunctualityType']>>>, ParentType, ContextType, RequireFields<OnTimePerformanceTypeServicePunctualityArgs, 'inputs'>>;
  stopPerformance?: Resolver<Maybe<Array<ResolversTypes['StopPerformanceType']>>, ParentType, ContextType, RequireFields<OnTimePerformanceTypeStopPerformanceArgs, 'inputs'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OperatorPerformancePageResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['OperatorPerformancePage'] = ResolversParentTypes['OperatorPerformancePage']> = ResolversObject<{
  items?: Resolver<Maybe<Array<ResolversTypes['OperatorPerformanceType']>>, ParentType, ContextType>;
  pageInfo?: Resolver<Maybe<ResolversTypes['PageInfo']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OperatorPerformanceTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['OperatorPerformanceType'] = ResolversParentTypes['OperatorPerformanceType']> = ResolversObject<{
  early?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  late?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nocCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  onTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  operatorId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OperatorTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['OperatorType'] = ResolversParentTypes['OperatorType']> = ResolversObject<{
  adminAreas?: Resolver<Maybe<Array<Maybe<ResolversTypes['AdminAreaInfoType']>>>, ParentType, ContextType>;
  feedMonitoring?: Resolver<Maybe<ResolversTypes['FeedMonitoringType']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nocCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  operatorId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OperatorsPageResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['OperatorsPage'] = ResolversParentTypes['OperatorsPage']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['OperatorType']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganisationTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['OrganisationType'] = ResolversParentTypes['OrganisationType']> = ResolversObject<{
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PageInfoResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = ResolversObject<{
  next?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PunctualityDayOfWeekTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['PunctualityDayOfWeekType'] = ResolversParentTypes['PunctualityDayOfWeekType']> = ResolversObject<{
  dayOfWeek?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  early?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  late?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  onTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PunctualityTimeOfDayTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['PunctualityTimeOfDayType'] = ResolversParentTypes['PunctualityTimeOfDayType']> = ResolversObject<{
  early?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  late?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  onTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  timeOfDay?: Resolver<ResolversTypes['Time'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PunctualityTimeSeriesTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['PunctualityTimeSeriesType'] = ResolversParentTypes['PunctualityTimeSeriesType']> = ResolversObject<{
  early?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  late?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  onTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  ts?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PunctualityTotalsTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['PunctualityTotalsType'] = ResolversParentTypes['PunctualityTotalsType']> = ResolversObject<{
  averageDeviation?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  completed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  early?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  incomplete?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  late?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  onTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  scheduled?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  adminAreas?: Resolver<Maybe<Array<ResolversTypes['AdminAreasType']>>, ParentType, ContextType>;
  apiInfo?: Resolver<Maybe<ResolversTypes['ApiInfoType']>, ParentType, ContextType>;
  avlLineLevelStatus?: Resolver<Array<ResolversTypes['AvlLineLevelStatus']>, ParentType, ContextType, Partial<QueryAvlLineLevelStatusArgs>>;
  corridor?: Resolver<Maybe<ResolversTypes['CorridorNamespace']>, ParentType, ContextType>;
  dashboardVehicles?: Resolver<Array<ResolversTypes['DashboardVehicles']>, ParentType, ContextType, Partial<QueryDashboardVehiclesArgs>>;
  embeddedUrl?: Resolver<ResolversTypes['AWSQuicksightUser'], ParentType, ContextType>;
  eventStats?: Resolver<Maybe<Array<Maybe<ResolversTypes['EventStatsType']>>>, ParentType, ContextType, RequireFields<QueryEventStatsArgs, 'end' | 'operatorId' | 'start'>>;
  events?: Resolver<Maybe<ResolversTypes['EventResponse']>, ParentType, ContextType, RequireFields<QueryEventsArgs, 'end' | 'operatorId' | 'start'>>;
  findJourneys?: Resolver<Array<ResolversTypes['Journey']>, ParentType, ContextType, RequireFields<QueryFindJourneysArgs, 'dateOfJourney' | 'lineId'>>;
  headwayMetrics?: Resolver<Maybe<ResolversTypes['HeadwayMetricsType']>, ParentType, ContextType>;
  invitation?: Resolver<Maybe<ResolversTypes['InvitationType']>, ParentType, ContextType, RequireFields<QueryInvitationArgs, 'key'>>;
  journey?: Resolver<ResolversTypes['JourneyResult'], ParentType, ContextType, RequireFields<QueryJourneyArgs, 'groupId' | 'lineId'>>;
  lines?: Resolver<Array<ResolversTypes['LineType']>, ParentType, ContextType, RequireFields<QueryLinesArgs, 'operatorId'>>;
  onTimePerformance?: Resolver<Maybe<ResolversTypes['OnTimePerformanceType']>, ParentType, ContextType>;
  operator?: Resolver<Maybe<ResolversTypes['OperatorType']>, ParentType, ContextType, RequireFields<QueryOperatorArgs, 'operatorId'>>;
  operators?: Resolver<Maybe<ResolversTypes['OperatorsPage']>, ParentType, ContextType, Partial<QueryOperatorsArgs>>;
  roles?: Resolver<Maybe<Array<ResolversTypes['RoleType']>>, ParentType, ContextType>;
  serviceInfo?: Resolver<Maybe<ResolversTypes['ServiceInfoType']>, ParentType, ContextType, RequireFields<QueryServiceInfoArgs, 'serviceId'>>;
  servicePatterns?: Resolver<Array<ResolversTypes['ServicePatternType']>, ParentType, ContextType, RequireFields<QueryServicePatternsArgs, 'lineId' | 'operatorId'>>;
  stopAnalysis?: Resolver<Array<Maybe<ResolversTypes['StopAnalysisType']>>, ParentType, ContextType, RequireFields<QueryStopAnalysisArgs, 'inputs'>>;
  user?: Resolver<Maybe<ResolversTypes['UserType']>, ParentType, ContextType>;
  userAlert?: Resolver<Maybe<ResolversTypes['AlertType']>, ParentType, ContextType, RequireFields<QueryUserAlertArgs, 'alertId'>>;
  userAlerts?: Resolver<Maybe<Array<ResolversTypes['AlertType']>>, ParentType, ContextType>;
  users?: Resolver<Maybe<Array<ResolversTypes['UserType']>>, ParentType, ContextType>;
}>;

export type RoleTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['RoleType'] = ResolversParentTypes['RoleType']> = ResolversObject<{
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scope?: Resolver<ResolversTypes['ScopeEnum'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ServiceInfoTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['ServiceInfoType'] = ResolversParentTypes['ServiceInfoType']> = ResolversObject<{
  serviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serviceName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serviceNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ServiceLinkTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['ServiceLinkType'] = ResolversParentTypes['ServiceLinkType']> = ResolversObject<{
  distance?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  fromStop?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  linkRoute?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  routeValidity?: Resolver<ResolversTypes['RouteType'], ParentType, ContextType>;
  toStop?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ServicePatternTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['ServicePatternType'] = ResolversParentTypes['ServicePatternType']> = ResolversObject<{
  serviceLinks?: Resolver<Array<ResolversTypes['ServiceLinkType']>, ParentType, ContextType>;
  servicePatternId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stops?: Resolver<Array<ResolversTypes['StopType']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ServicePerformanceTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['ServicePerformanceType'] = ResolversParentTypes['ServicePerformanceType']> = ResolversObject<{
  actualDepartures?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  averageDelay?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  early?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  late?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lineId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lineInfo?: Resolver<ResolversTypes['ServiceInfoType'], ParentType, ContextType>;
  onTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  scheduledDepartures?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ServicePunctualityTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['ServicePunctualityType'] = ResolversParentTypes['ServicePunctualityType']> = ResolversObject<{
  early?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  late?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  lineId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lineInfo?: Resolver<Maybe<ResolversTypes['ServiceInfoType']>, ParentType, ContextType>;
  nocCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  onTime?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  trend?: Resolver<Maybe<ResolversTypes['ServicePunctualityType']>, ParentType, ContextType, RequireFields<ServicePunctualityTypeTrendArgs, 'fromTimestamp' | 'toTimestamp'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StopResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['Stop'] = ResolversParentTypes['Stop']> = ResolversObject<{
  actualDepartureUtc?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  directionRef?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  estimatedDepartureUtc?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  incompleteReason?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isTimingPoint?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  latitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  longitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  otp?: Resolver<Maybe<ResolversTypes['OtpEnum']>, ParentType, ContextType>;
  scheduledDepartureUtc?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stopId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stopIndex?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stopName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StopAnalysisTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['StopAnalysisType'] = ResolversParentTypes['StopAnalysisType']> = ResolversObject<{
  averageDelay?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  completedDepartures?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  early?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  late?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  latitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  lineId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  longitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  onTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  operatorId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  scheduledDepartures?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stopId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stopName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timingPoint?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StopInfoTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['StopInfoType'] = ResolversParentTypes['StopInfoType']> = ResolversObject<{
  sourceId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  stopId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stopLocality?: Resolver<ResolversTypes['LocalityType'], ParentType, ContextType>;
  stopLocation?: Resolver<ResolversTypes['GpsPointType'], ParentType, ContextType>;
  stopName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StopPerformanceTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['StopPerformanceType'] = ResolversParentTypes['StopPerformanceType']> = ResolversObject<{
  actualDepartures?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  averageDelay?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  early?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  late?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lineId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  onTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  scheduledDepartures?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stopId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stopInfo?: Resolver<ResolversTypes['StopInfoType'], ParentType, ContextType>;
  timingPoint?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StopTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['StopType'] = ResolversParentTypes['StopType']> = ResolversObject<{
  adminAreaId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lat?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  localityName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lon?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  sourceId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  stopId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stopName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface TimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Time'], any> {
  name: 'Time';
}

export type UserTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['UserType'] = ResolversParentTypes['UserType']> = ResolversObject<{
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  firstName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  organisation?: Resolver<Maybe<ResolversTypes['OrganisationType']>, ParentType, ContextType>;
  roles?: Resolver<Maybe<Array<ResolversTypes['RoleType']>>, ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserUpdateResponseTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['UserUpdateResponseType'] = ResolversParentTypes['UserUpdateResponseType']> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['UserType']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VehicleStatsTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['VehicleStatsType'] = ResolversParentTypes['VehicleStatsType']> = ResolversObject<{
  actual?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  expected?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = RequestContext> = ResolversObject<{
  AWSQuicksightUser?: AwsQuicksightUserResolvers<ContextType>;
  AdminAreaInfoType?: AdminAreaInfoTypeResolvers<ContextType>;
  AdminAreasType?: AdminAreasTypeResolvers<ContextType>;
  AlertType?: AlertTypeResolvers<ContextType>;
  ApiInfoType?: ApiInfoTypeResolvers<ContextType>;
  AvlLineLevelStatus?: AvlLineLevelStatusResolvers<ContextType>;
  AvlPoint?: AvlPointResolvers<ContextType>;
  CorridorHistogramType?: CorridorHistogramTypeResolvers<ContextType>;
  CorridorJourneyTimeStatsType?: CorridorJourneyTimeStatsTypeResolvers<ContextType>;
  CorridorNamespace?: CorridorNamespaceResolvers<ContextType>;
  CorridorStatsDayOfWeekType?: CorridorStatsDayOfWeekTypeResolvers<ContextType>;
  CorridorStatsHistogramType?: CorridorStatsHistogramTypeResolvers<ContextType>;
  CorridorStatsPerServiceType?: CorridorStatsPerServiceTypeResolvers<ContextType>;
  CorridorStatsTimeOfDayType?: CorridorStatsTimeOfDayTypeResolvers<ContextType>;
  CorridorStatsType?: CorridorStatsTypeResolvers<ContextType>;
  CorridorSummaryStatsType?: CorridorSummaryStatsTypeResolvers<ContextType>;
  CorridorType?: CorridorTypeResolvers<ContextType>;
  DashboardVehicles?: DashboardVehiclesResolvers<ContextType>;
  Date?: GraphQLScalarType;
  DateTime?: GraphQLScalarType;
  DelayFrequencyType?: DelayFrequencyTypeResolvers<ContextType>;
  EventData?: EventDataResolvers<ContextType>;
  EventResponse?: EventResponseResolvers<ContextType>;
  EventStatsType?: EventStatsTypeResolvers<ContextType>;
  EventType?: EventTypeResolvers<ContextType>;
  FeedMonitoringType?: FeedMonitoringTypeResolvers<ContextType>;
  FrequentServiceInfoType?: FrequentServiceInfoTypeResolvers<ContextType>;
  FrequentServiceType?: FrequentServiceTypeResolvers<ContextType>;
  GpsPointType?: GpsPointTypeResolvers<ContextType>;
  HeadwayMetricsType?: HeadwayMetricsTypeResolvers<ContextType>;
  HeadwayOverviewType?: HeadwayOverviewTypeResolvers<ContextType>;
  HeadwayTimeSeriesType?: HeadwayTimeSeriesTypeResolvers<ContextType>;
  HistoricalStatsType?: HistoricalStatsTypeResolvers<ContextType>;
  InvitationResponseType?: InvitationResponseTypeResolvers<ContextType>;
  InvitationType?: InvitationTypeResolvers<ContextType>;
  Journey?: JourneyResolvers<ContextType>;
  JourneyResult?: JourneyResultResolvers<ContextType>;
  LineType?: LineTypeResolvers<ContextType>;
  LiveStatsType?: LiveStatsTypeResolvers<ContextType>;
  LocalityType?: LocalityTypeResolvers<ContextType>;
  LoginResponse?: LoginResponseResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  MutationResponseType?: MutationResponseTypeResolvers<ContextType>;
  OnTimePerformanceType?: OnTimePerformanceTypeResolvers<ContextType>;
  OperatorPerformancePage?: OperatorPerformancePageResolvers<ContextType>;
  OperatorPerformanceType?: OperatorPerformanceTypeResolvers<ContextType>;
  OperatorType?: OperatorTypeResolvers<ContextType>;
  OperatorsPage?: OperatorsPageResolvers<ContextType>;
  OrganisationType?: OrganisationTypeResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  PunctualityDayOfWeekType?: PunctualityDayOfWeekTypeResolvers<ContextType>;
  PunctualityTimeOfDayType?: PunctualityTimeOfDayTypeResolvers<ContextType>;
  PunctualityTimeSeriesType?: PunctualityTimeSeriesTypeResolvers<ContextType>;
  PunctualityTotalsType?: PunctualityTotalsTypeResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RoleType?: RoleTypeResolvers<ContextType>;
  ServiceInfoType?: ServiceInfoTypeResolvers<ContextType>;
  ServiceLinkType?: ServiceLinkTypeResolvers<ContextType>;
  ServicePatternType?: ServicePatternTypeResolvers<ContextType>;
  ServicePerformanceType?: ServicePerformanceTypeResolvers<ContextType>;
  ServicePunctualityType?: ServicePunctualityTypeResolvers<ContextType>;
  Stop?: StopResolvers<ContextType>;
  StopAnalysisType?: StopAnalysisTypeResolvers<ContextType>;
  StopInfoType?: StopInfoTypeResolvers<ContextType>;
  StopPerformanceType?: StopPerformanceTypeResolvers<ContextType>;
  StopType?: StopTypeResolvers<ContextType>;
  Time?: GraphQLScalarType;
  UserType?: UserTypeResolvers<ContextType>;
  UserUpdateResponseType?: UserUpdateResponseTypeResolvers<ContextType>;
  VehicleStatsType?: VehicleStatsTypeResolvers<ContextType>;
}>;

