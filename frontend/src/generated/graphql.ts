import { gql } from 'apollo-angular';
import { Injectable } from '@angular/core';
import * as Apollo from 'apollo-angular';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: string; output: string; }
  DateTime: { input: string; output: string; }
  Time: { input: string; output: string; }
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
  ts: Scalars['DateTime']['output'];
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
  serviceJourneys: Array<Journey>;
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

export type LoginMutationVariables = Exact<{
  username: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login?: { __typename?: 'LoginResponse', success: boolean, expiresAt?: string | null } | null };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type UserQueryVariables = Exact<{ [key: string]: never; }>;


export type UserQuery = { __typename?: 'Query', user?: { __typename?: 'UserType', id: string, email: string, username: string, firstName?: string | null, lastName?: string | null, organisation?: { __typename?: 'OrganisationType', id: string, name: string } | null, roles?: Array<{ __typename?: 'RoleType', id: string, name: string, scope: ScopeEnum }> | null } | null };

export type CorridorsStopSearchQueryVariables = Exact<{
  inputs: AddFirstStopInputType;
}>;


export type CorridorsStopSearchQuery = { __typename?: 'Query', corridor?: { __typename?: 'CorridorNamespace', addFirstStop?: Array<{ __typename?: 'StopType', stopId: string, stopName: string, lat: number, lon: number, localityName?: string | null, adminAreaId?: string | null, sourceId?: string | null } | null> | null } | null };

export type CorridorsSubsequentStopsQueryVariables = Exact<{
  stopList: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type CorridorsSubsequentStopsQuery = { __typename?: 'Query', corridor?: { __typename?: 'CorridorNamespace', addSubsequentStops?: Array<{ __typename?: 'StopType', stopId: string, stopName: string, lon: number, lat: number, localityName?: string | null, adminAreaId?: string | null, sourceId?: string | null } | null> | null } | null };

export type CorridorsListQueryVariables = Exact<{ [key: string]: never; }>;


export type CorridorsListQuery = { __typename?: 'Query', corridor?: { __typename?: 'CorridorNamespace', corridorList?: Array<{ __typename?: 'CorridorType', id: number, name: string, stops?: Array<{ __typename?: 'StopInfoType', stopId: string } | null> | null } | null> | null } | null };

export type GetCorridorQueryVariables = Exact<{
  corridorId: Scalars['Int']['input'];
}>;


export type GetCorridorQuery = { __typename?: 'Query', corridor?: { __typename?: 'CorridorNamespace', getCorridor?: { __typename?: 'CorridorType', id: number, name: string, stops?: Array<{ __typename?: 'StopInfoType', stopId: string, sourceId?: string | null, stopName: string, stopLocation: { __typename?: 'GpsPointType', latitude: number, longitude: number }, stopLocality: { __typename?: 'LocalityType', localityId?: string | null, localityName?: string | null, localityAreaId?: string | null, localityAreaName?: string | null } } | null> | null } | null } | null };

export type CorridorStatsQueryVariables = Exact<{
  params: CorridorStatsInputType;
}>;


export type CorridorStatsQuery = { __typename?: 'Query', corridor?: { __typename?: 'CorridorNamespace', stats?: { __typename?: 'CorridorStatsType', summaryStats?: { __typename?: 'CorridorSummaryStatsType', totalTransits?: number | null, numberOfServices?: number | null, averageJourneyTime?: number | null, scheduledTransits?: number | null } | null, journeyTimeStats?: Array<{ __typename?: 'CorridorJourneyTimeStatsType', ts?: string | null, minTransitTime: number, maxTransitTime: number, avgTransitTime?: number | null, percentile25?: number | null, percentile75?: number | null } | null> | null, journeyTimeTimeOfDayStats?: Array<{ __typename?: 'CorridorStatsTimeOfDayType', hour: number, minTransitTime: number, maxTransitTime: number, avgTransitTime?: number | null, percentile25?: number | null, percentile75?: number | null } | null> | null, journeyTimeDayOfWeekStats?: Array<{ __typename?: 'CorridorStatsDayOfWeekType', dow: number, minTransitTime: number, maxTransitTime: number, avgTransitTime?: number | null, percentile25?: number | null, percentile75?: number | null } | null> | null, journeyTimePerServiceStats?: Array<{ __typename?: 'CorridorStatsPerServiceType', lineName: string, servicePatternName: string, noc?: string | null, operatorName?: string | null, totalJourneyTime?: number | null, recordedTransits?: number | null, scheduledTransits?: number | null } | null> | null, journeyTimeHistogram?: Array<{ __typename?: 'CorridorStatsHistogramType', ts?: string | null, hist?: Array<{ __typename?: 'CorridorHistogramType', bin?: number | null, freq?: number | null }> | null } | null> | null, serviceLinks?: Array<{ __typename?: 'ServiceLinkType', fromStop: string, toStop: string, distance: number, routeValidity: RouteType, linkRoute?: string | null } | null> | null } | null } | null };

export type CreateCorridorMutationVariables = Exact<{
  name: Scalars['String']['input'];
  stopIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type CreateCorridorMutation = { __typename?: 'Mutation', createCorridor: { __typename?: 'MutationResponseType', success: boolean, error?: string | null } };

export type DeleteCorridorMutationVariables = Exact<{
  corridorId: Scalars['Int']['input'];
}>;


export type DeleteCorridorMutation = { __typename?: 'Mutation', deleteCorridor: { __typename?: 'MutationResponseType', success: boolean, error?: string | null } };

export type UpdateCorridorMutationVariables = Exact<{
  inputs: CorridorUpdateInputType;
}>;


export type UpdateCorridorMutation = { __typename?: 'Mutation', updateCorridor: { __typename?: 'MutationResponseType', error?: string | null, success: boolean } };

export type OperatorDashboardFragment = { __typename?: 'OperatorType', name?: string | null, nocCode?: string | null, operatorId: string, feedMonitoring?: { __typename?: 'FeedMonitoringType', feedStatus?: boolean | null, liveStats?: { __typename?: 'LiveStatsType', feedErrors?: number | null, feedAlerts?: number | null } | null } | null };

export type DashboardOperatorListQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardOperatorListQuery = { __typename?: 'Query', operators?: { __typename?: 'OperatorsPage', items?: Array<{ __typename?: 'OperatorType', name?: string | null, nocCode?: string | null, operatorId: string, feedMonitoring?: { __typename?: 'FeedMonitoringType', feedStatus?: boolean | null, liveStats?: { __typename?: 'LiveStatsType', feedErrors?: number | null, feedAlerts?: number | null } | null } | null } | null> | null } | null };

export type DashboardOperatorVehicleCountsListQueryVariables = Exact<{
  operatorId?: InputMaybe<Scalars['String']['input']>;
}>;


export type DashboardOperatorVehicleCountsListQuery = { __typename?: 'Query', dashboardVehicles: Array<{ __typename?: 'DashboardVehicles', operatorId: string, expected: number, actual: number }> };

export type DashboardPerformanceStatsQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type DashboardPerformanceStatsQuery = { __typename?: 'Query', onTimePerformance?: { __typename?: 'OnTimePerformanceType', punctualityOverview?: { __typename?: 'PunctualityTotalsType', onTime: number, late: number, early: number } | null } | null };

export type DashboardServiceRankingQueryVariables = Exact<{
  params: ServicePerformanceInputType;
  trendFrom: Scalars['DateTime']['input'];
  trendTo: Scalars['DateTime']['input'];
}>;


export type DashboardServiceRankingQuery = { __typename?: 'Query', onTimePerformance?: { __typename?: 'OnTimePerformanceType', servicePunctuality?: Array<{ __typename?: 'ServicePunctualityType', nocCode?: string | null, lineId?: string | null, onTime?: number | null, early?: number | null, late?: number | null, lineInfo?: { __typename?: 'ServiceInfoType', serviceId: string, serviceName: string, serviceNumber: string } | null, trend?: { __typename?: 'ServicePunctualityType', onTime?: number | null, early?: number | null, late?: number | null } | null } | null> | null } | null };

export type EventFragment = { __typename?: 'EventType', timestamp: string, type: string, data: { __typename?: 'EventData', message: string } };

export type EventsQueryVariables = Exact<{
  operatorId: Scalars['String']['input'];
  start: Scalars['DateTime']['input'];
  end: Scalars['DateTime']['input'];
}>;


export type EventsQuery = { __typename?: 'Query', events?: { __typename?: 'EventResponse', items?: Array<{ __typename?: 'EventType', timestamp: string, type: string, data: { __typename?: 'EventData', message: string } }> | null } | null };

export type EventStatsQueryVariables = Exact<{
  operatorId: Scalars['String']['input'];
  start: Scalars['DateTime']['input'];
  end: Scalars['DateTime']['input'];
}>;


export type EventStatsQuery = { __typename?: 'Query', eventStats?: Array<{ __typename?: 'EventStatsType', count: number, day: string } | null> | null };

export type VehicleStatFragment = { __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string };

export type BasicOperatorFragment = { __typename?: 'OperatorType', name?: string | null, nocCode?: string | null, operatorId: string, feedMonitoring?: { __typename?: 'FeedMonitoringType', feedStatus?: boolean | null, availability?: number | null, lastOutage?: string | null, unavailableSince?: string | null, liveStats?: { __typename?: 'LiveStatsType', updateFrequency?: number | null } | null } | null };

export type OperatorLiveStatusFragment = { __typename?: 'OperatorType', name?: string | null, nocCode?: string | null, operatorId: string, feedMonitoring?: { __typename?: 'FeedMonitoringType', feedStatus?: boolean | null, availability?: number | null, lastOutage?: string | null, unavailableSince?: string | null, liveStats?: { __typename?: 'LiveStatsType', updateFrequency?: number | null, currentVehicles?: number | null, expectedVehicles?: number | null, last24Hours?: Array<{ __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string } | null> | null, last20Minutes?: Array<{ __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string } | null> | null } | null } | null };

export type OperatorFeedHistoryFragment = { __typename?: 'OperatorType', name?: string | null, nocCode?: string | null, operatorId: string, feedMonitoring?: { __typename?: 'FeedMonitoringType', historicalStats?: { __typename?: 'HistoricalStatsType', updateFrequency?: number | null, availability?: number | null } | null, vehicleStats?: Array<{ __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string } | null> | null } | null };

export type FeedMonitoringListQueryVariables = Exact<{ [key: string]: never; }>;


export type FeedMonitoringListQuery = { __typename?: 'Query', operators?: { __typename?: 'OperatorsPage', items?: Array<{ __typename?: 'OperatorType', name?: string | null, nocCode?: string | null, operatorId: string, feedMonitoring?: { __typename?: 'FeedMonitoringType', feedStatus?: boolean | null, availability?: number | null, lastOutage?: string | null, unavailableSince?: string | null, liveStats?: { __typename?: 'LiveStatsType', updateFrequency?: number | null } | null } | null } | null> | null } | null };

export type OperatorSparklineStatsQueryVariables = Exact<{
  operatorIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type OperatorSparklineStatsQuery = { __typename?: 'Query', operators?: { __typename?: 'OperatorsPage', items?: Array<{ __typename?: 'OperatorType', nocCode?: string | null, operatorId: string, feedMonitoring?: { __typename?: 'FeedMonitoringType', liveStats?: { __typename?: 'LiveStatsType', last24Hours?: Array<{ __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string } | null> | null } | null } | null } | null> | null } | null };

export type OperatorLiveStatusQueryVariables = Exact<{
  operatorId: Scalars['String']['input'];
}>;


export type OperatorLiveStatusQuery = { __typename?: 'Query', operator?: { __typename?: 'OperatorType', name?: string | null, nocCode?: string | null, operatorId: string, feedMonitoring?: { __typename?: 'FeedMonitoringType', feedStatus?: boolean | null, availability?: number | null, lastOutage?: string | null, unavailableSince?: string | null, liveStats?: { __typename?: 'LiveStatsType', updateFrequency?: number | null, currentVehicles?: number | null, expectedVehicles?: number | null, last24Hours?: Array<{ __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string } | null> | null, last20Minutes?: Array<{ __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string } | null> | null } | null } | null } | null };

export type OperatorHistoricStatsQueryVariables = Exact<{
  operatorId: Scalars['String']['input'];
  date: Scalars['Date']['input'];
  start: Scalars['DateTime']['input'];
  end: Scalars['DateTime']['input'];
}>;


export type OperatorHistoricStatsQuery = { __typename?: 'Query', operator?: { __typename?: 'OperatorType', name?: string | null, nocCode?: string | null, operatorId: string, feedMonitoring?: { __typename?: 'FeedMonitoringType', historicalStats?: { __typename?: 'HistoricalStatsType', updateFrequency?: number | null, availability?: number | null } | null, vehicleStats?: Array<{ __typename?: 'VehicleStatsType', actual: number, expected: number, timestamp: string } | null> | null } | null } | null };

export type GetAdminAreasQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAdminAreasQuery = { __typename?: 'Query', adminAreas?: Array<{ __typename?: 'AdminAreasType', id: string, name: string, shape: string }> | null };

export type HeadwayTimeSeriesQueryVariables = Exact<{
  params: HeadwayInputType;
}>;


export type HeadwayTimeSeriesQuery = { __typename?: 'Query', headwayMetrics?: { __typename?: 'HeadwayMetricsType', headwayTimeSeries?: Array<{ __typename?: 'HeadwayTimeSeriesType', ts: string, actual: number, scheduled: number, excess: number } | null> | null } | null };

export type HeadwayOverviewQueryVariables = Exact<{
  params: HeadwayInputType;
}>;


export type HeadwayOverviewQuery = { __typename?: 'Query', headwayMetrics?: { __typename?: 'HeadwayMetricsType', headwayOverview?: { __typename?: 'HeadwayOverviewType', excess: number } | null } | null };

export type HeadwayFrequentServicesQueryVariables = Exact<{
  operatorId: Scalars['String']['input'];
  fromTimestamp: Scalars['String']['input'];
  toTimestamp: Scalars['String']['input'];
}>;


export type HeadwayFrequentServicesQuery = { __typename?: 'Query', headwayMetrics?: { __typename?: 'HeadwayMetricsType', frequentServices?: Array<{ __typename?: 'FrequentServiceType', serviceId: string } | null> | null } | null };

export type HeadwayFrequentServiceInfoQueryVariables = Exact<{
  inputs: FrequentServiceInfoInputType;
}>;


export type HeadwayFrequentServiceInfoQuery = { __typename?: 'Query', headwayMetrics?: { __typename?: 'HeadwayMetricsType', frequentServiceInfo?: { __typename?: 'FrequentServiceInfoType', numHours?: number | null, totalHours?: number | null } | null } | null };

export type OnTimeDelayFrequencyQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeDelayFrequencyQuery = { __typename?: 'Query', onTimePerformance?: { __typename?: 'OnTimePerformanceType', delayFrequency?: Array<{ __typename?: 'DelayFrequencyType', bucket: number, frequency?: number | null }> | null } | null };

export type OnTimeTimeSeriesQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeTimeSeriesQuery = { __typename?: 'Query', onTimePerformance?: { __typename?: 'OnTimePerformanceType', punctualityTimeSeries?: Array<{ __typename?: 'PunctualityTimeSeriesType', ts: string, onTime: number, early: number, late: number }> | null } | null };

export type OnTimeStatsQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeStatsQuery = { __typename?: 'Query', onTimePerformance?: { __typename?: 'OnTimePerformanceType', punctualityOverview?: { __typename?: 'PunctualityTotalsType', early: number, late: number, onTime: number, scheduled: number, completed: number, averageDeviation?: number | null, incomplete: string } | null } | null };

export type OnTimePunctualityTimeOfDayQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimePunctualityTimeOfDayQuery = { __typename?: 'Query', onTimePerformance?: { __typename?: 'OnTimePerformanceType', punctualityTimeOfDay?: Array<{ __typename?: 'PunctualityTimeOfDayType', timeOfDay: string, onTime: number, early: number, late: number }> | null } | null };

export type OnTimePunctualityDayOfWeekQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimePunctualityDayOfWeekQuery = { __typename?: 'Query', onTimePerformance?: { __typename?: 'OnTimePerformanceType', punctualityDayOfWeek?: Array<{ __typename?: 'PunctualityDayOfWeekType', dayOfWeek: number, onTime: number, early: number, late: number }> | null } | null };

export type OnTimeServicePerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeServicePerformanceListQuery = { __typename?: 'Query', onTimePerformance?: { __typename?: 'OnTimePerformanceType', servicePerformance?: Array<{ __typename?: 'ServicePerformanceType', lineId?: string | null, early: number, onTime: number, late: number, averageDelay: number, scheduledDepartures: number, actualDepartures: number, lineInfo: { __typename?: 'ServiceInfoType', serviceId: string, serviceName: string, serviceNumber: string } }> | null } | null };

export type OnTimeStopPerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeStopPerformanceListQuery = { __typename?: 'Query', onTimePerformance?: { __typename?: 'OnTimePerformanceType', stopPerformance?: Array<{ __typename?: 'StopPerformanceType', lineId?: string | null, stopId: string, early: number, onTime: number, late: number, averageDelay: number, scheduledDepartures: number, actualDepartures: number, timingPoint?: boolean | null, stopInfo: { __typename?: 'StopInfoType', stopId: string, sourceId?: string | null, stopName: string, stopLocation: { __typename?: 'GpsPointType', latitude: number, longitude: number }, stopLocality: { __typename?: 'LocalityType', localityId?: string | null, localityName?: string | null, localityAreaId?: string | null, localityAreaName?: string | null } } }> | null } | null };

export type OnTimeOperatorPerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeOperatorPerformanceListQuery = { __typename?: 'Query', onTimePerformance?: { __typename?: 'OnTimePerformanceType', operatorPerformance?: { __typename?: 'OperatorPerformancePage', pageInfo?: { __typename?: 'PageInfo', totalCount?: number | null, next?: number | null } | null, items?: Array<{ __typename?: 'OperatorPerformanceType', nocCode?: string | null, operatorId?: string | null, name?: string | null, early: number, onTime: number, late: number }> | null } | null } | null };

export type ServiceInfoQueryVariables = Exact<{
  lineId: Scalars['String']['input'];
}>;


export type ServiceInfoQuery = { __typename?: 'Query', serviceInfo?: { __typename?: 'ServiceInfoType', serviceId: string, serviceNumber: string, serviceName: string } | null };

export type TransitModelServicePatternStopsQueryVariables = Exact<{
  operatorId: Scalars['String']['input'];
  lineId: Scalars['String']['input'];
}>;


export type TransitModelServicePatternStopsQuery = { __typename?: 'Query', servicePatterns: Array<{ __typename?: 'ServicePatternType', servicePatternId: string, stops: Array<{ __typename?: 'StopType', stopId: string, stopName: string, lon: number, lat: number }>, serviceLinks: Array<{ __typename?: 'ServiceLinkType', fromStop: string, toStop: string, distance: number, routeValidity: RouteType, linkRoute?: string | null }> }> };

export type UserFragment = { __typename?: 'UserType', id: string, email: string, username: string, firstName?: string | null, lastName?: string | null, organisation?: { __typename?: 'OrganisationType', id: string, name: string } | null, roles?: Array<{ __typename?: 'RoleType', id: string, name: string, scope: ScopeEnum }> | null };

export type RoleFragment = { __typename?: 'RoleType', id: string, name: string, scope: ScopeEnum };

export type AlertFragment = { __typename?: 'AlertType', alertId: string, alertType?: AlertTypeEnum | null, eventHysterisis?: number | null, eventThreshold?: number | null, createdBy?: { __typename?: 'UserType', firstName?: string | null, lastName?: string | null, username: string } | null, sendTo?: { __typename?: 'UserType', id: string, firstName?: string | null, lastName?: string | null, username: string } | null };

export type ListUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type ListUsersQuery = { __typename?: 'Query', users?: Array<{ __typename?: 'UserType', id: string, email: string, username: string, firstName?: string | null, lastName?: string | null, organisation?: { __typename?: 'OrganisationType', id: string, name: string } | null, roles?: Array<{ __typename?: 'RoleType', id: string, name: string, scope: ScopeEnum }> | null }> | null };

export type ListRolesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListRolesQuery = { __typename?: 'Query', roles?: Array<{ __typename?: 'RoleType', id: string, name: string, scope: ScopeEnum }> | null };

export type ListUserAlertsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListUserAlertsQuery = { __typename?: 'Query', userAlerts?: Array<{ __typename?: 'AlertType', alertId: string, alertType?: AlertTypeEnum | null, eventHysterisis?: number | null, eventThreshold?: number | null, createdBy?: { __typename?: 'UserType', firstName?: string | null, lastName?: string | null, username: string } | null, sendTo?: { __typename?: 'UserType', id: string, firstName?: string | null, lastName?: string | null, username: string } | null }> | null };

export type FetchUserAlertQueryVariables = Exact<{
  alertId: Scalars['String']['input'];
}>;


export type FetchUserAlertQuery = { __typename?: 'Query', userAlert?: { __typename?: 'AlertType', alertId: string, alertType?: AlertTypeEnum | null, eventHysterisis?: number | null, eventThreshold?: number | null, createdBy?: { __typename?: 'UserType', firstName?: string | null, lastName?: string | null, username: string } | null, sendTo?: { __typename?: 'UserType', id: string, firstName?: string | null, lastName?: string | null, username: string } | null } | null };

export type EditUserMutationVariables = Exact<{
  username: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  role: Scalars['String']['input'];
}>;


export type EditUserMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'UserUpdateResponseType', error?: string | null, user?: { __typename?: 'UserType', id: string, email: string, username: string, firstName?: string | null, lastName?: string | null, organisation?: { __typename?: 'OrganisationType', id: string, name: string } | null, roles?: Array<{ __typename?: 'RoleType', id: string, name: string, scope: ScopeEnum }> | null } | null } };

export type RemoveUserMutationVariables = Exact<{
  username: Scalars['String']['input'];
}>;


export type RemoveUserMutation = { __typename?: 'Mutation', deleteUser: { __typename?: 'MutationResponseType', success: boolean, error?: string | null } };

export type InviteUserMutationVariables = Exact<{
  email: Scalars['String']['input'];
  organisationId: Scalars['String']['input'];
  roleId: Scalars['String']['input'];
}>;


export type InviteUserMutation = { __typename?: 'Mutation', inviteUser: { __typename?: 'InvitationResponseType', error?: string | null, invitation?: { __typename?: 'InvitationType', email: string, accepted: boolean } | null } };

export type UpdateUserAlertMutationVariables = Exact<{
  alertId: Scalars['String']['input'];
  alertType: AlertTypeEnum;
  sendToId: Scalars['String']['input'];
  eventHysterisis?: InputMaybe<Scalars['Int']['input']>;
  eventThreshold?: InputMaybe<Scalars['Int']['input']>;
}>;


export type UpdateUserAlertMutation = { __typename?: 'Mutation', updateUserAlert: { __typename?: 'MutationResponseType', success: boolean, error?: string | null } };

export type CreateUserAlertMutationVariables = Exact<{
  alertType: AlertTypeEnum;
  sendToId: Scalars['String']['input'];
  eventHysterisis?: InputMaybe<Scalars['Int']['input']>;
  eventThreshold?: InputMaybe<Scalars['Int']['input']>;
}>;


export type CreateUserAlertMutation = { __typename?: 'Mutation', addUserAlert: { __typename?: 'MutationResponseType', success: boolean, error?: string | null } };

export type DeleteUserAlertMutationVariables = Exact<{
  alertId: Scalars['String']['input'];
}>;


export type DeleteUserAlertMutation = { __typename?: 'Mutation', deleteUserAlert: { __typename?: 'MutationResponseType', success: boolean, error?: string | null } };

export type OperatorListQueryVariables = Exact<{ [key: string]: never; }>;


export type OperatorListQuery = { __typename?: 'Query', operators?: { __typename?: 'OperatorsPage', items?: Array<{ __typename?: 'OperatorType', name?: string | null, nocCode?: string | null, operatorId: string, adminAreas?: Array<{ __typename?: 'AdminAreaInfoType', adminAreaId: string } | null> | null } | null> | null } | null };

export type OperatorLinesQueryVariables = Exact<{
  operatorId: Scalars['String']['input'];
  inputDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type OperatorLinesQuery = { __typename?: 'Query', lines: Array<{ __typename?: 'LineType', id: string, name: string, number: string }> };

export type RequestResetPasswordMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type RequestResetPasswordMutation = { __typename?: 'Mutation', requestResetPassword: { __typename?: 'MutationResponseType', error?: string | null, success: boolean } };

export type ResetPasswordMutationVariables = Exact<{
  uid: Scalars['String']['input'];
  token: Scalars['String']['input'];
  password: Scalars['String']['input'];
  confirmPassword: Scalars['String']['input'];
}>;


export type ResetPasswordMutation = { __typename?: 'Mutation', resetPassword: { __typename?: 'MutationResponseType', error?: string | null, success: boolean } };

export type VerifyResetPasswordTokenMutationVariables = Exact<{
  uid: Scalars['String']['input'];
  token: Scalars['String']['input'];
}>;


export type VerifyResetPasswordTokenMutation = { __typename?: 'Mutation', verifyResetPasswordToken: boolean };

export type SignUpMutationVariables = Exact<{
  key: Scalars['String']['input'];
  password: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
}>;


export type SignUpMutation = { __typename?: 'Mutation', signUp: { __typename?: 'MutationResponseType', error?: string | null, success: boolean } };

export type InvitationQueryVariables = Exact<{
  key: Scalars['String']['input'];
}>;


export type InvitationQuery = { __typename?: 'Query', invitation?: { __typename?: 'InvitationType', email: string, accepted: boolean } | null };

export type JourneyQueryVariables = Exact<{
  groupId: Scalars['String']['input'];
  lineId: Scalars['String']['input'];
}>;


export type JourneyQuery = { __typename?: 'Query', journey: { __typename?: 'JourneyResult', stops: Array<{ __typename?: 'Stop', estimatedDepartureUtc?: string | null, actualDepartureUtc?: string | null, scheduledDepartureUtc: string, latitude: number, longitude: number, stopIndex: number, stopName: string, stopId: number, isTimingPoint: boolean, otp?: OtpEnum | null, directionRef: string, incompleteReason: number }>, avls: Array<{ __typename?: 'AvlPoint', recordedAtTimeUtc: string, latitude: number, longitude: number, vehicleRef: string, directionRef: string }>, serviceJourneys: Array<{ __typename?: 'Journey', groupId: string, startTime: string, serviceName: string, serviceNumber: string, operatorName: string, operatorNoc: string, directionRef?: string | null }> } };

export type JourneysQueryVariables = Exact<{
  dateOfJourney: Scalars['String']['input'];
  lineId: Scalars['String']['input'];
}>;


export type JourneysQuery = { __typename?: 'Query', findJourneys: Array<{ __typename?: 'Journey', groupId: string, startTime: string, serviceName: string, serviceNumber: string, operatorName: string, operatorNoc: string, directionRef?: string | null }> };

export type GetVersionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetVersionQuery = { __typename?: 'Query', apiInfo?: { __typename?: 'ApiInfoType', version: string, buildNumber: string } | null };

export const OperatorDashboardFragmentDoc = gql`
    fragment OperatorDashboard on OperatorType {
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
    `;
export const EventFragmentDoc = gql`
    fragment Event on EventType {
  timestamp
  type
  data {
    message
  }
}
    `;
export const BasicOperatorFragmentDoc = gql`
    fragment BasicOperator on OperatorType {
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
    `;
export const VehicleStatFragmentDoc = gql`
    fragment VehicleStat on VehicleStatsType {
  actual
  expected
  timestamp
}
    `;
export const OperatorLiveStatusFragmentDoc = gql`
    fragment OperatorLiveStatus on OperatorType {
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
        ...VehicleStat
      }
      last20Minutes {
        ...VehicleStat
      }
    }
  }
}
    ${VehicleStatFragmentDoc}`;
export const OperatorFeedHistoryFragmentDoc = gql`
    fragment OperatorFeedHistory on OperatorType {
  name
  nocCode
  operatorId
  feedMonitoring {
    historicalStats(date: $date) {
      updateFrequency
      availability
    }
    vehicleStats(granularity: minute, start: $start, end: $end) {
      ...VehicleStat
    }
  }
}
    ${VehicleStatFragmentDoc}`;
export const RoleFragmentDoc = gql`
    fragment Role on RoleType {
  id
  name
  scope
}
    `;
export const UserFragmentDoc = gql`
    fragment User on UserType {
  id
  email
  username
  firstName
  lastName
  organisation {
    id
    name
  }
  roles {
    ...Role
  }
}
    ${RoleFragmentDoc}`;
export const AlertFragmentDoc = gql`
    fragment Alert on AlertType {
  alertId
  alertType
  createdBy {
    firstName
    lastName
    username
  }
  sendTo {
    id
    firstName
    lastName
    username
  }
  eventHysterisis
  eventThreshold
}
    `;
export const LoginDocument = gql`
    mutation login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    success
    expiresAt
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class LoginGQL extends Apollo.Mutation<LoginMutation, LoginMutationVariables> {
    document = LoginDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const LogoutDocument = gql`
    mutation logout {
  logout
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class LogoutGQL extends Apollo.Mutation<LogoutMutation, LogoutMutationVariables> {
    document = LogoutDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const UserDocument = gql`
    query user {
  user {
    ...User
  }
}
    ${UserFragmentDoc}`;

  @Injectable({
    providedIn: 'root'
  })
  export class UserGQL extends Apollo.Query<UserQuery, UserQueryVariables> {
    document = UserDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const CorridorsStopSearchDocument = gql`
    query corridorsStopSearch($inputs: AddFirstStopInputType!) {
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
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class CorridorsStopSearchGQL extends Apollo.Query<CorridorsStopSearchQuery, CorridorsStopSearchQueryVariables> {
    document = CorridorsStopSearchDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const CorridorsSubsequentStopsDocument = gql`
    query corridorsSubsequentStops($stopList: [String!]!) {
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
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class CorridorsSubsequentStopsGQL extends Apollo.Query<CorridorsSubsequentStopsQuery, CorridorsSubsequentStopsQueryVariables> {
    document = CorridorsSubsequentStopsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const CorridorsListDocument = gql`
    query corridorsList {
  corridor {
    corridorList {
      id
      name
      stops {
        stopId
      }
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class CorridorsListGQL extends Apollo.Query<CorridorsListQuery, CorridorsListQueryVariables> {
    document = CorridorsListDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const GetCorridorDocument = gql`
    query getCorridor($corridorId: Int!) {
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
          localityId
          localityName
          localityAreaId
          localityAreaName
        }
      }
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class GetCorridorGQL extends Apollo.Query<GetCorridorQuery, GetCorridorQueryVariables> {
    document = GetCorridorDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const CorridorStatsDocument = gql`
    query corridorStats($params: CorridorStatsInputType!) {
  corridor {
    stats(inputs: $params) {
      summaryStats {
        totalTransits
        numberOfServices
        averageJourneyTime
        scheduledTransits
      }
      journeyTimeStats {
        ts
        minTransitTime
        maxTransitTime
        avgTransitTime
        percentile25
        percentile75
      }
      journeyTimeTimeOfDayStats {
        hour
        minTransitTime
        maxTransitTime
        avgTransitTime
        percentile25
        percentile75
      }
      journeyTimeDayOfWeekStats {
        dow
        minTransitTime
        maxTransitTime
        avgTransitTime
        percentile25
        percentile75
      }
      journeyTimePerServiceStats {
        lineName
        servicePatternName
        noc
        operatorName
        totalJourneyTime
        recordedTransits
        scheduledTransits
      }
      journeyTimeHistogram {
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
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class CorridorStatsGQL extends Apollo.Query<CorridorStatsQuery, CorridorStatsQueryVariables> {
    document = CorridorStatsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const CreateCorridorDocument = gql`
    mutation createCorridor($name: String!, $stopIds: [String!]!) {
  createCorridor(payload: {name: $name, stopIds: $stopIds}) {
    success
    error
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class CreateCorridorGQL extends Apollo.Mutation<CreateCorridorMutation, CreateCorridorMutationVariables> {
    document = CreateCorridorDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const DeleteCorridorDocument = gql`
    mutation deleteCorridor($corridorId: Int!) {
  deleteCorridor(corridorId: $corridorId) {
    success
    error
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class DeleteCorridorGQL extends Apollo.Mutation<DeleteCorridorMutation, DeleteCorridorMutationVariables> {
    document = DeleteCorridorDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const UpdateCorridorDocument = gql`
    mutation updateCorridor($inputs: CorridorUpdateInputType!) {
  updateCorridor(inputs: $inputs) {
    error
    success
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class UpdateCorridorGQL extends Apollo.Mutation<UpdateCorridorMutation, UpdateCorridorMutationVariables> {
    document = UpdateCorridorDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const DashboardOperatorListDocument = gql`
    query dashboardOperatorList {
  operators {
    items {
      ...OperatorDashboard
    }
  }
}
    ${OperatorDashboardFragmentDoc}`;

  @Injectable({
    providedIn: 'root'
  })
  export class DashboardOperatorListGQL extends Apollo.Query<DashboardOperatorListQuery, DashboardOperatorListQueryVariables> {
    document = DashboardOperatorListDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const DashboardOperatorVehicleCountsListDocument = gql`
    query dashboardOperatorVehicleCountsList($operatorId: String) {
  dashboardVehicles(operatorId: $operatorId) {
    operatorId
    expected
    actual
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class DashboardOperatorVehicleCountsListGQL extends Apollo.Query<DashboardOperatorVehicleCountsListQuery, DashboardOperatorVehicleCountsListQueryVariables> {
    document = DashboardOperatorVehicleCountsListDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const DashboardPerformanceStatsDocument = gql`
    query dashboardPerformanceStats($params: PerformanceInputType!) {
  onTimePerformance {
    punctualityOverview(inputs: $params) {
      onTime
      late
      early
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class DashboardPerformanceStatsGQL extends Apollo.Query<DashboardPerformanceStatsQuery, DashboardPerformanceStatsQueryVariables> {
    document = DashboardPerformanceStatsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const DashboardServiceRankingDocument = gql`
    query dashboardServiceRanking($params: ServicePerformanceInputType!, $trendFrom: DateTime!, $trendTo: DateTime!) {
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
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class DashboardServiceRankingGQL extends Apollo.Query<DashboardServiceRankingQuery, DashboardServiceRankingQueryVariables> {
    document = DashboardServiceRankingDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const EventsDocument = gql`
    query events($operatorId: String!, $start: DateTime!, $end: DateTime!) {
  events(operatorId: $operatorId, start: $start, end: $end) {
    items {
      ...Event
    }
  }
}
    ${EventFragmentDoc}`;

  @Injectable({
    providedIn: 'root'
  })
  export class EventsGQL extends Apollo.Query<EventsQuery, EventsQueryVariables> {
    document = EventsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const EventStatsDocument = gql`
    query eventStats($operatorId: String!, $start: DateTime!, $end: DateTime!) {
  eventStats(operatorId: $operatorId, start: $start, end: $end) {
    count
    day
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class EventStatsGQL extends Apollo.Query<EventStatsQuery, EventStatsQueryVariables> {
    document = EventStatsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const FeedMonitoringListDocument = gql`
    query feedMonitoringList {
  operators {
    items {
      ...BasicOperator
    }
  }
}
    ${BasicOperatorFragmentDoc}`;

  @Injectable({
    providedIn: 'root'
  })
  export class FeedMonitoringListGQL extends Apollo.Query<FeedMonitoringListQuery, FeedMonitoringListQueryVariables> {
    document = FeedMonitoringListDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const OperatorSparklineStatsDocument = gql`
    query operatorSparklineStats($operatorIds: [String!]!) {
  operators(filterBy: {operatorIds: $operatorIds}) {
    items {
      nocCode
      operatorId
      feedMonitoring {
        liveStats {
          last24Hours {
            ...VehicleStat
          }
        }
      }
    }
  }
}
    ${VehicleStatFragmentDoc}`;

  @Injectable({
    providedIn: 'root'
  })
  export class OperatorSparklineStatsGQL extends Apollo.Query<OperatorSparklineStatsQuery, OperatorSparklineStatsQueryVariables> {
    document = OperatorSparklineStatsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const OperatorLiveStatusDocument = gql`
    query operatorLiveStatus($operatorId: String!) {
  operator(operatorId: $operatorId) {
    ...OperatorLiveStatus
  }
}
    ${OperatorLiveStatusFragmentDoc}`;

  @Injectable({
    providedIn: 'root'
  })
  export class OperatorLiveStatusGQL extends Apollo.Query<OperatorLiveStatusQuery, OperatorLiveStatusQueryVariables> {
    document = OperatorLiveStatusDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const OperatorHistoricStatsDocument = gql`
    query operatorHistoricStats($operatorId: String!, $date: Date!, $start: DateTime!, $end: DateTime!) {
  operator(operatorId: $operatorId) {
    ...OperatorFeedHistory
  }
}
    ${OperatorFeedHistoryFragmentDoc}`;

  @Injectable({
    providedIn: 'root'
  })
  export class OperatorHistoricStatsGQL extends Apollo.Query<OperatorHistoricStatsQuery, OperatorHistoricStatsQueryVariables> {
    document = OperatorHistoricStatsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const GetAdminAreasDocument = gql`
    query getAdminAreas {
  adminAreas {
    id
    name
    shape
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class GetAdminAreasGQL extends Apollo.Query<GetAdminAreasQuery, GetAdminAreasQueryVariables> {
    document = GetAdminAreasDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const HeadwayTimeSeriesDocument = gql`
    query headwayTimeSeries($params: HeadwayInputType!) {
  headwayMetrics {
    headwayTimeSeries(inputs: $params) {
      ts
      actual: actualWaitTime
      scheduled: scheduledWaitTime
      excess: excessWaitTime
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class HeadwayTimeSeriesGQL extends Apollo.Query<HeadwayTimeSeriesQuery, HeadwayTimeSeriesQueryVariables> {
    document = HeadwayTimeSeriesDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const HeadwayOverviewDocument = gql`
    query headwayOverview($params: HeadwayInputType!) {
  headwayMetrics {
    headwayOverview(inputs: $params) {
      excess: excessWaitTime
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class HeadwayOverviewGQL extends Apollo.Query<HeadwayOverviewQuery, HeadwayOverviewQueryVariables> {
    document = HeadwayOverviewDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const HeadwayFrequentServicesDocument = gql`
    query headwayFrequentServices($operatorId: String!, $fromTimestamp: String!, $toTimestamp: String!) {
  headwayMetrics {
    frequentServices(
      operatorId: $operatorId
      fromTimestamp: $fromTimestamp
      toTimestamp: $toTimestamp
    ) {
      serviceId
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class HeadwayFrequentServicesGQL extends Apollo.Query<HeadwayFrequentServicesQuery, HeadwayFrequentServicesQueryVariables> {
    document = HeadwayFrequentServicesDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const HeadwayFrequentServiceInfoDocument = gql`
    query headwayFrequentServiceInfo($inputs: FrequentServiceInfoInputType!) {
  headwayMetrics {
    frequentServiceInfo(inputs: $inputs) {
      numHours
      totalHours
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class HeadwayFrequentServiceInfoGQL extends Apollo.Query<HeadwayFrequentServiceInfoQuery, HeadwayFrequentServiceInfoQueryVariables> {
    document = HeadwayFrequentServiceInfoDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const OnTimeDelayFrequencyDocument = gql`
    query onTimeDelayFrequency($params: PerformanceInputType!) {
  onTimePerformance {
    delayFrequency(inputs: $params) {
      bucket
      frequency
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class OnTimeDelayFrequencyGQL extends Apollo.Query<OnTimeDelayFrequencyQuery, OnTimeDelayFrequencyQueryVariables> {
    document = OnTimeDelayFrequencyDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const OnTimeTimeSeriesDocument = gql`
    query onTimeTimeSeries($params: PerformanceInputType!) {
  onTimePerformance {
    punctualityTimeSeries(inputs: $params) {
      ts
      onTime
      early
      late
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class OnTimeTimeSeriesGQL extends Apollo.Query<OnTimeTimeSeriesQuery, OnTimeTimeSeriesQueryVariables> {
    document = OnTimeTimeSeriesDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const OnTimeStatsDocument = gql`
    query onTimeStats($params: PerformanceInputType!) {
  onTimePerformance {
    punctualityOverview(inputs: $params) {
      early
      late
      onTime
      scheduled
      completed
      averageDeviation
      incomplete
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class OnTimeStatsGQL extends Apollo.Query<OnTimeStatsQuery, OnTimeStatsQueryVariables> {
    document = OnTimeStatsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const OnTimePunctualityTimeOfDayDocument = gql`
    query onTimePunctualityTimeOfDay($params: PerformanceInputType!) {
  onTimePerformance {
    punctualityTimeOfDay(inputs: $params) {
      timeOfDay
      onTime
      early
      late
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class OnTimePunctualityTimeOfDayGQL extends Apollo.Query<OnTimePunctualityTimeOfDayQuery, OnTimePunctualityTimeOfDayQueryVariables> {
    document = OnTimePunctualityTimeOfDayDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const OnTimePunctualityDayOfWeekDocument = gql`
    query onTimePunctualityDayOfWeek($params: PerformanceInputType!) {
  onTimePerformance {
    punctualityDayOfWeek(inputs: $params) {
      dayOfWeek
      onTime
      early
      late
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class OnTimePunctualityDayOfWeekGQL extends Apollo.Query<OnTimePunctualityDayOfWeekQuery, OnTimePunctualityDayOfWeekQueryVariables> {
    document = OnTimePunctualityDayOfWeekDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const OnTimeServicePerformanceListDocument = gql`
    query onTimeServicePerformanceList($params: PerformanceInputType!) {
  onTimePerformance {
    servicePerformance(inputs: $params) {
      lineId
      lineInfo {
        serviceId
        serviceName
        serviceNumber
      }
      early
      onTime
      late
      averageDelay
      scheduledDepartures
      actualDepartures
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class OnTimeServicePerformanceListGQL extends Apollo.Query<OnTimeServicePerformanceListQuery, OnTimeServicePerformanceListQueryVariables> {
    document = OnTimeServicePerformanceListDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const OnTimeStopPerformanceListDocument = gql`
    query onTimeStopPerformanceList($params: PerformanceInputType!) {
  onTimePerformance {
    stopPerformance(inputs: $params) {
      lineId
      stopId
      stopInfo {
        stopId
        sourceId
        stopName
        stopLocation {
          latitude
          longitude
        }
        stopLocality {
          localityId
          localityName
          localityAreaId
          localityAreaName
        }
      }
      early
      onTime
      late
      averageDelay
      scheduledDepartures
      actualDepartures
      timingPoint
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class OnTimeStopPerformanceListGQL extends Apollo.Query<OnTimeStopPerformanceListQuery, OnTimeStopPerformanceListQueryVariables> {
    document = OnTimeStopPerformanceListDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const OnTimeOperatorPerformanceListDocument = gql`
    query onTimeOperatorPerformanceList($params: PerformanceInputType!) {
  onTimePerformance {
    operatorPerformance(inputs: $params) {
      pageInfo {
        totalCount
        next
      }
      items {
        nocCode
        operatorId
        name
        early
        onTime
        late
      }
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class OnTimeOperatorPerformanceListGQL extends Apollo.Query<OnTimeOperatorPerformanceListQuery, OnTimeOperatorPerformanceListQueryVariables> {
    document = OnTimeOperatorPerformanceListDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const ServiceInfoDocument = gql`
    query serviceInfo($lineId: String!) {
  serviceInfo(serviceId: $lineId) {
    serviceId
    serviceNumber
    serviceName
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class ServiceInfoGQL extends Apollo.Query<ServiceInfoQuery, ServiceInfoQueryVariables> {
    document = ServiceInfoDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const TransitModelServicePatternStopsDocument = gql`
    query transitModelServicePatternStops($operatorId: String!, $lineId: String!) {
  servicePatterns(operatorId: $operatorId, lineId: $lineId) {
    servicePatternId
    stops {
      stopId
      stopName
      lon
      lat
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
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class TransitModelServicePatternStopsGQL extends Apollo.Query<TransitModelServicePatternStopsQuery, TransitModelServicePatternStopsQueryVariables> {
    document = TransitModelServicePatternStopsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const ListUsersDocument = gql`
    query listUsers {
  users {
    ...User
  }
}
    ${UserFragmentDoc}`;

  @Injectable({
    providedIn: 'root'
  })
  export class ListUsersGQL extends Apollo.Query<ListUsersQuery, ListUsersQueryVariables> {
    document = ListUsersDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const ListRolesDocument = gql`
    query listRoles {
  roles {
    ...Role
  }
}
    ${RoleFragmentDoc}`;

  @Injectable({
    providedIn: 'root'
  })
  export class ListRolesGQL extends Apollo.Query<ListRolesQuery, ListRolesQueryVariables> {
    document = ListRolesDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const ListUserAlertsDocument = gql`
    query listUserAlerts {
  userAlerts {
    ...Alert
  }
}
    ${AlertFragmentDoc}`;

  @Injectable({
    providedIn: 'root'
  })
  export class ListUserAlertsGQL extends Apollo.Query<ListUserAlertsQuery, ListUserAlertsQueryVariables> {
    document = ListUserAlertsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const FetchUserAlertDocument = gql`
    query fetchUserAlert($alertId: String!) {
  userAlert(alertId: $alertId) {
    ...Alert
  }
}
    ${AlertFragmentDoc}`;

  @Injectable({
    providedIn: 'root'
  })
  export class FetchUserAlertGQL extends Apollo.Query<FetchUserAlertQuery, FetchUserAlertQueryVariables> {
    document = FetchUserAlertDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const EditUserDocument = gql`
    mutation editUser($username: String!, $firstName: String!, $lastName: String!, $role: String!) {
  updateUser(
    username: $username
    payload: {firstName: $firstName, lastName: $lastName, role: {id: $role}}
  ) {
    error
    user {
      ...User
    }
  }
}
    ${UserFragmentDoc}`;

  @Injectable({
    providedIn: 'root'
  })
  export class EditUserGQL extends Apollo.Mutation<EditUserMutation, EditUserMutationVariables> {
    document = EditUserDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const RemoveUserDocument = gql`
    mutation removeUser($username: String!) {
  deleteUser(username: $username) {
    success
    error
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class RemoveUserGQL extends Apollo.Mutation<RemoveUserMutation, RemoveUserMutationVariables> {
    document = RemoveUserDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const InviteUserDocument = gql`
    mutation inviteUser($email: String!, $organisationId: String!, $roleId: String!) {
  inviteUser(
    payload: {email: $email, organisation: {id: $organisationId}, role: {id: $roleId}}
  ) {
    invitation {
      email
      accepted
    }
    error
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class InviteUserGQL extends Apollo.Mutation<InviteUserMutation, InviteUserMutationVariables> {
    document = InviteUserDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const UpdateUserAlertDocument = gql`
    mutation updateUserAlert($alertId: String!, $alertType: AlertTypeEnum!, $sendToId: String!, $eventHysterisis: Int, $eventThreshold: Int) {
  updateUserAlert(
    alertId: $alertId
    payload: {alertType: $alertType, sendTo: {id: $sendToId}, eventHysterisis: $eventHysterisis, eventThreshold: $eventThreshold}
  ) {
    success
    error
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class UpdateUserAlertGQL extends Apollo.Mutation<UpdateUserAlertMutation, UpdateUserAlertMutationVariables> {
    document = UpdateUserAlertDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const CreateUserAlertDocument = gql`
    mutation createUserAlert($alertType: AlertTypeEnum!, $sendToId: String!, $eventHysterisis: Int, $eventThreshold: Int) {
  addUserAlert(
    payload: {alertType: $alertType, sendTo: {id: $sendToId}, eventHysterisis: $eventHysterisis, eventThreshold: $eventThreshold}
  ) {
    success
    error
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class CreateUserAlertGQL extends Apollo.Mutation<CreateUserAlertMutation, CreateUserAlertMutationVariables> {
    document = CreateUserAlertDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const DeleteUserAlertDocument = gql`
    mutation deleteUserAlert($alertId: String!) {
  deleteUserAlert(alertId: $alertId) {
    success
    error
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class DeleteUserAlertGQL extends Apollo.Mutation<DeleteUserAlertMutation, DeleteUserAlertMutationVariables> {
    document = DeleteUserAlertDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const OperatorListDocument = gql`
    query operatorList {
  operators {
    items {
      name
      nocCode
      operatorId
      adminAreas {
        adminAreaId
      }
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class OperatorListGQL extends Apollo.Query<OperatorListQuery, OperatorListQueryVariables> {
    document = OperatorListDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const OperatorLinesDocument = gql`
    query operatorLines($operatorId: String!, $inputDate: String) {
  lines(operatorId: $operatorId, inputDate: $inputDate) {
    id
    name
    number
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class OperatorLinesGQL extends Apollo.Query<OperatorLinesQuery, OperatorLinesQueryVariables> {
    document = OperatorLinesDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const RequestResetPasswordDocument = gql`
    mutation requestResetPassword($email: String!) {
  requestResetPassword(email: $email) {
    error
    success
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class RequestResetPasswordGQL extends Apollo.Mutation<RequestResetPasswordMutation, RequestResetPasswordMutationVariables> {
    document = RequestResetPasswordDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const ResetPasswordDocument = gql`
    mutation resetPassword($uid: String!, $token: String!, $password: String!, $confirmPassword: String!) {
  resetPassword(
    uid: $uid
    token: $token
    password: $password
    confirmPassword: $confirmPassword
  ) {
    error
    success
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class ResetPasswordGQL extends Apollo.Mutation<ResetPasswordMutation, ResetPasswordMutationVariables> {
    document = ResetPasswordDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const VerifyResetPasswordTokenDocument = gql`
    mutation verifyResetPasswordToken($uid: String!, $token: String!) {
  verifyResetPasswordToken(uid: $uid, token: $token)
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class VerifyResetPasswordTokenGQL extends Apollo.Mutation<VerifyResetPasswordTokenMutation, VerifyResetPasswordTokenMutationVariables> {
    document = VerifyResetPasswordTokenDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const SignUpDocument = gql`
    mutation signUp($key: String!, $password: String!, $firstName: String!, $lastName: String!) {
  signUp(
    payload: {key: $key, password: $password, firstName: $firstName, lastName: $lastName}
  ) {
    error
    success
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class SignUpGQL extends Apollo.Mutation<SignUpMutation, SignUpMutationVariables> {
    document = SignUpDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const InvitationDocument = gql`
    query Invitation($key: String!) {
  invitation(key: $key) {
    email
    accepted
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class InvitationGQL extends Apollo.Query<InvitationQuery, InvitationQueryVariables> {
    document = InvitationDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const JourneyDocument = gql`
    query journey($groupId: String!, $lineId: String!) {
  journey(groupId: $groupId, lineId: $lineId) {
    stops {
      estimatedDepartureUtc
      actualDepartureUtc
      scheduledDepartureUtc
      latitude
      longitude
      stopIndex
      stopName
      stopId
      isTimingPoint
      otp
      directionRef
      incompleteReason
    }
    avls {
      recordedAtTimeUtc
      latitude
      longitude
      vehicleRef
      directionRef
    }
    serviceJourneys {
      groupId
      startTime
      serviceName
      serviceNumber
      operatorName
      operatorNoc
      directionRef
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class JourneyGQL extends Apollo.Query<JourneyQuery, JourneyQueryVariables> {
    document = JourneyDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const JourneysDocument = gql`
    query journeys($dateOfJourney: String!, $lineId: String!) {
  findJourneys(dateOfJourney: $dateOfJourney, lineId: $lineId) {
    groupId
    startTime
    serviceName
    serviceNumber
    operatorName
    operatorNoc
    directionRef
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class JourneysGQL extends Apollo.Query<JourneysQuery, JourneysQueryVariables> {
    document = JourneysDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const GetVersionDocument = gql`
    query getVersion {
  apiInfo {
    version
    buildNumber
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class GetVersionGQL extends Apollo.Query<GetVersionQuery, GetVersionQueryVariables> {
    document = GetVersionDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }