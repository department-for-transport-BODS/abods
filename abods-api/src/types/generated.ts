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
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
  Time: { input: any; output: any; }
};

export type AddFirstStopInputType = {
  adminAreaIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  boundingBox?: InputMaybe<BoundingBoxInputType>;
  searchString?: InputMaybe<Scalars['String']['input']>;
};

export type AdminAreaInfoType = {
  __typename?: 'AdminAreaInfoType';
  adminAreaId: Scalars['String']['output'];
};

export type AdminAreasType = {
  __typename?: 'AdminAreasType';
  adminAreaId: Scalars['String']['output'];
  adminAreaName: Scalars['String']['output'];
  shape: Scalars['String']['output'];
};

export type AlertInputType = {
  alertType?: InputMaybe<AlertTypeEnum>;
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
  FeedComplianceFailure = 'FeedComplianceFailure',
  FeedFailure = 'FeedFailure',
  VehicleCountDisparity = 'VehicleCountDisparity'
}

export type ApiInfoType = {
  __typename?: 'ApiInfoType';
  buildNumber: Scalars['String']['output'];
  version: Scalars['String']['output'];
};

export type AvlPoint = {
  __typename?: 'AvlPoint';
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  recordedAtTimeUtc: Scalars['String']['output'];
  vehicleRef: Scalars['String']['output'];
};

export type BoundingBoxInputType = {
  maxLatitude?: InputMaybe<Scalars['Float']['input']>;
  maxLongitude?: InputMaybe<Scalars['Float']['input']>;
  minLatitude?: InputMaybe<Scalars['Float']['input']>;
  minLongitude?: InputMaybe<Scalars['Float']['input']>;
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
  name?: InputMaybe<Scalars['String']['input']>;
  stopIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type CorridorJourneyTimeStatsType = {
  __typename?: 'CorridorJourneyTimeStatsType';
  avgTransitTime?: Maybe<Scalars['Float']['output']>;
  maxTransitTime: Scalars['Int']['output'];
  minTransitTime: Scalars['Int']['output'];
  percentile5?: Maybe<Scalars['Float']['output']>;
  percentile25?: Maybe<Scalars['Float']['output']>;
  percentile75?: Maybe<Scalars['Float']['output']>;
  percentile95?: Maybe<Scalars['Float']['output']>;
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
  inputs?: InputMaybe<AddFirstStopInputType>;
};


export type CorridorNamespaceAddSubsequentStopsArgs = {
  stopList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type CorridorNamespaceGetCorridorArgs = {
  corridorId: Scalars['Int']['input'];
};


export type CorridorNamespaceStatsArgs = {
  inputs?: InputMaybe<CorridorStatsInputType>;
};

export type CorridorStatsDayOfWeekType = {
  __typename?: 'CorridorStatsDayOfWeekType';
  avgTransitTime?: Maybe<Scalars['Float']['output']>;
  dow: Scalars['Int']['output'];
  maxTransitTime: Scalars['Int']['output'];
  minTransitTime: Scalars['Int']['output'];
  percentile5?: Maybe<Scalars['Float']['output']>;
  percentile25?: Maybe<Scalars['Float']['output']>;
  percentile75?: Maybe<Scalars['Float']['output']>;
  percentile95?: Maybe<Scalars['Float']['output']>;
};

export type CorridorStatsHistogramType = {
  __typename?: 'CorridorStatsHistogramType';
  hist?: Maybe<Array<Maybe<CorridorHistogramType>>>;
  ts?: Maybe<Scalars['String']['output']>;
};

export type CorridorStatsInputType = {
  corridorId: Scalars['String']['input'];
  fromTimestamp: Scalars['DateTime']['input'];
  granularity: CorridorGranularity;
  stopList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  toTimestamp: Scalars['DateTime']['input'];
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
  percentile5?: Maybe<Scalars['Float']['output']>;
  percentile25?: Maybe<Scalars['Float']['output']>;
  percentile75?: Maybe<Scalars['Float']['output']>;
  percentile95?: Maybe<Scalars['Float']['output']>;
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
  operatorName?: Maybe<Scalars['Int']['output']>;
  percentile95?: Maybe<Scalars['Float']['output']>;
  scheduledJourneyTime?: Maybe<Scalars['Int']['output']>;
  scheduledTransits?: Maybe<Scalars['Int']['output']>;
  totalTransits?: Maybe<Scalars['Int']['output']>;
};

export type CorridorType = {
  __typename?: 'CorridorType';
  createdBy?: Maybe<UserType>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  organisation?: Maybe<OrganisationType>;
  stops?: Maybe<Array<Maybe<StopInfoType>>>;
};

export type CorridorUpdateInputType = {
  id?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  stopList?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
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

export type FeatureFlagType = {
  __typename?: 'FeatureFlagType';
  consolidateHistogram?: Maybe<Scalars['Boolean']['output']>;
  corridorStatsTimezoneEnabled?: Maybe<Scalars['Boolean']['output']>;
  freshdeskEnabled?: Maybe<Scalars['Boolean']['output']>;
  lineDirectionFiltering?: Maybe<Scalars['Boolean']['output']>;
  ssoEnabled?: Maybe<Scalars['Boolean']['output']>;
  stopIndexFiltering?: Maybe<Scalars['Boolean']['output']>;
  taggingIncludeBankHolidays?: Maybe<Scalars['Boolean']['output']>;
  vehicleReplayFromTimestream?: Maybe<Scalars['Boolean']['output']>;
};

export type FeedMonitoringType = {
  __typename?: 'FeedMonitoringType';
  availability?: Maybe<Scalars['Float']['output']>;
  feedStatus?: Maybe<Scalars['Boolean']['output']>;
  historicalStats?: Maybe<HistoricalStatsType>;
  lastOutage?: Maybe<Scalars['DateTime']['output']>;
  liveStats?: Maybe<LiveStatsType>;
  unavailableSince?: Maybe<Scalars['DateTime']['output']>;
  vehicleStats?: Maybe<Array<Maybe<VehicleStatsType>>>;
};


export type FeedMonitoringTypeHistoricalStatsArgs = {
  date: Scalars['Date']['input'];
};


export type FeedMonitoringTypeVehicleStatsArgs = {
  end: Scalars['DateTime']['input'];
  granularity?: InputMaybe<Granularity>;
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
  filters?: InputMaybe<FrequentServiceInfoFilterType>;
  fromTimestamp: Scalars['DateTime']['input'];
  toTimestamp: Scalars['DateTime']['input'];
};

export type FrequentServiceInfoType = {
  __typename?: 'FrequentServiceInfoType';
  numHours?: Maybe<Scalars['Int']['output']>;
  totalHours?: Maybe<Scalars['Int']['output']>;
};

export type FrequentServiceType = {
  __typename?: 'FrequentServiceType';
  serviceId: Scalars['String']['output'];
  serviceInfo?: Maybe<ServiceInfoType>;
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

export type HeadwayDayOfWeekType = {
  __typename?: 'HeadwayDayOfWeekType';
  actualWaitTime?: Maybe<Scalars['Float']['output']>;
  dayOfWeek?: Maybe<Scalars['Int']['output']>;
  excessWaitTime?: Maybe<Scalars['Float']['output']>;
  scheduledWaitTime?: Maybe<Scalars['Float']['output']>;
};

export type HeadwayFiltersInputType = {
  dayOfWeekFlags?: InputMaybe<DayOfWeekFlagsInputType>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  granularity?: InputMaybe<Granularity>;
  lineIds?: InputMaybe<Array<Scalars['String']['input']>>;
  nocCodes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  operatorIds?: InputMaybe<Array<Scalars['String']['input']>>;
  startTime?: InputMaybe<Scalars['String']['input']>;
};

export type HeadwayInputType = {
  filters?: InputMaybe<HeadwayFiltersInputType>;
  fromTimestamp: Scalars['DateTime']['input'];
  toTimestamp: Scalars['DateTime']['input'];
};

export type HeadwayMetricsType = {
  __typename?: 'HeadwayMetricsType';
  frequentServiceInfo?: Maybe<FrequentServiceInfoType>;
  frequentServices?: Maybe<Array<Maybe<FrequentServiceType>>>;
  headwayDayOfWeek?: Maybe<Array<Maybe<HeadwayDayOfWeekType>>>;
  headwayOverview?: Maybe<HeadwayOverviewType>;
  headwayTimeOfDay?: Maybe<Array<Maybe<HeadwayTimeOfDayType>>>;
  headwayTimeSeries?: Maybe<Array<Maybe<HeadwayTimeSeriesType>>>;
};


export type HeadwayMetricsTypeFrequentServiceInfoArgs = {
  inputs?: InputMaybe<FrequentServiceInfoInputType>;
};


export type HeadwayMetricsTypeFrequentServicesArgs = {
  fromTimestamp: Scalars['DateTime']['input'];
  operatorId: Scalars['String']['input'];
  toTimestamp: Scalars['DateTime']['input'];
};


export type HeadwayMetricsTypeHeadwayDayOfWeekArgs = {
  lineId: Scalars['String']['input'];
};


export type HeadwayMetricsTypeHeadwayOverviewArgs = {
  inputs: HeadwayInputType;
};


export type HeadwayMetricsTypeHeadwayTimeOfDayArgs = {
  lineId: Scalars['String']['input'];
};


export type HeadwayMetricsTypeHeadwayTimeSeriesArgs = {
  inputs: HeadwayInputType;
};

export type HeadwayOverviewType = {
  __typename?: 'HeadwayOverviewType';
  actualWaitTime: Scalars['Float']['output'];
  excessWaitTime: Scalars['Float']['output'];
  scheduledWaitTime: Scalars['Float']['output'];
};

export enum HeadwaySortEnum {
  ActualWaitTime = 'ActualWaitTime',
  ExcessWaitTime = 'ExcessWaitTime',
  ScheduledWaitTime = 'ScheduledWaitTime'
}

export type HeadwaySortType = {
  field?: InputMaybe<HeadwaySortEnum>;
  order?: InputMaybe<SortOrderEnum>;
};

export type HeadwayTimeOfDayType = {
  __typename?: 'HeadwayTimeOfDayType';
  actualWaitTime?: Maybe<Scalars['Float']['output']>;
  excessWaitTime?: Maybe<Scalars['Float']['output']>;
  scheduledWaitTime?: Maybe<Scalars['Float']['output']>;
  timeOfDay?: Maybe<Scalars['Time']['output']>;
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
  compliance?: Maybe<Scalars['Float']['output']>;
  updateFrequency?: Maybe<Scalars['Int']['output']>;
  vehicleStats?: Maybe<Array<Maybe<VehicleStatsType>>>;
};

export type InvitationInput = {
  email: Scalars['String']['input'];
  organisation?: InputMaybe<OrganisationReferenceInput>;
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
  organisation?: Maybe<OrganisationType>;
  role?: Maybe<RoleType>;
};

export type JourneyScheduledStartTimes = {
  __typename?: 'JourneyScheduledStartTimes';
  days?: Maybe<Array<Maybe<ShortCodeDayOfWeek>>>;
  fromDate?: Maybe<Scalars['DateTime']['output']>;
  startTimes?: Maybe<Array<Maybe<Scalars['Time']['output']>>>;
  toDate?: Maybe<Scalars['DateTime']['output']>;
};

export enum LineDirection {
  All = 'All',
  Inbound = 'Inbound',
  Outbound = 'Outbound'
}

export type LineFilterType = {
  lineIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type LineType = {
  __typename?: 'LineType';
  lineId: Scalars['String']['output'];
  lineName: Scalars['String']['output'];
  lineNumber: Scalars['String']['output'];
  servicePatterns?: Maybe<Array<Maybe<ServicePatternType>>>;
};

export type LiveStatsType = {
  __typename?: 'LiveStatsType';
  currentVehicles?: Maybe<Scalars['Int']['output']>;
  expectedVehicles?: Maybe<Scalars['Int']['output']>;
  feedAlerts?: Maybe<Scalars['Int']['output']>;
  feedErrors?: Maybe<Scalars['Int']['output']>;
  last20Minutes?: Maybe<Array<Maybe<VehicleStatsType>>>;
  last24Hours?: Maybe<Array<Maybe<VehicleStatsType>>>;
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
  payload?: InputMaybe<CorridorInputType>;
};


export type MutationDeleteCorridorArgs = {
  corridorId?: InputMaybe<Scalars['Int']['input']>;
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
  inputs?: InputMaybe<CorridorUpdateInputType>;
};


export type MutationUpdateUserArgs = {
  payload?: InputMaybe<UserUpdateInput>;
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
  journeyScheduledStartTimes?: Maybe<Array<Maybe<JourneyScheduledStartTimes>>>;
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
  operatorIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type OperatorInfoType = {
  __typename?: 'OperatorInfoType';
  nocCode?: Maybe<Scalars['String']['output']>;
  operatorId?: Maybe<Scalars['String']['output']>;
  operatorName?: Maybe<Scalars['String']['output']>;
};

export type OperatorPerformancePage = {
  __typename?: 'OperatorPerformancePage';
  items?: Maybe<Array<OperatorPerformanceType>>;
  pageInfo?: Maybe<PageInfo>;
};

export type OperatorPerformanceType = {
  __typename?: 'OperatorPerformanceType';
  actualDepartures?: Maybe<Scalars['Int']['output']>;
  averageDelay?: Maybe<Scalars['Float']['output']>;
  early: Scalars['Int']['output'];
  late: Scalars['Int']['output'];
  name?: Maybe<Scalars['String']['output']>;
  nocCode?: Maybe<Scalars['String']['output']>;
  onTime: Scalars['Int']['output'];
  operatorId?: Maybe<Scalars['String']['output']>;
  scheduledDepartures?: Maybe<Scalars['Int']['output']>;
};

export type OperatorType = {
  __typename?: 'OperatorType';
  adminAreas?: Maybe<Array<Maybe<AdminAreaInfoType>>>;
  feedMonitoring?: Maybe<FeedMonitoringType>;
  name?: Maybe<Scalars['String']['output']>;
  nocCode?: Maybe<Scalars['String']['output']>;
  operatorId?: Maybe<Scalars['String']['output']>;
  transitModel?: Maybe<TransitModelType>;
};

export type OperatorsPage = {
  __typename?: 'OperatorsPage';
  items?: Maybe<Array<Maybe<OperatorType>>>;
  pageInfo?: Maybe<PageInfo>;
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

export type PaginatedLineType = {
  __typename?: 'PaginatedLineType';
  items?: Maybe<Array<Maybe<LineType>>>;
};

export type PagingInputType = {
  after?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type PerformanceFiltersInputType = {
  addNonTagged?: InputMaybe<Scalars['Boolean']['input']>;
  adminAreaIds?: InputMaybe<Array<Scalars['String']['input']>>;
  dayOfWeekFlags?: InputMaybe<DayOfWeekFlagsInputType>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  excludeItoLineId?: InputMaybe<Scalars['String']['input']>;
  excludedDates?: InputMaybe<Array<InputMaybe<Scalars['Date']['input']>>>;
  granularity?: InputMaybe<Granularity>;
  lineDirection?: InputMaybe<LineDirection>;
  lineIds?: InputMaybe<Array<Scalars['String']['input']>>;
  maxDelay?: InputMaybe<Scalars['Int']['input']>;
  minDelay?: InputMaybe<Scalars['Int']['input']>;
  nocCodes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  onTimeMaxMinutes?: InputMaybe<Scalars['Int']['input']>;
  onTimeMinMinutes?: InputMaybe<Scalars['Int']['input']>;
  operatorIds?: InputMaybe<Array<Scalars['String']['input']>>;
  startTime?: InputMaybe<Scalars['String']['input']>;
  startTimes?: InputMaybe<Array<InputMaybe<Scalars['Time']['input']>>>;
  stopsSegment?: InputMaybe<StopsSegment>;
  tagIds?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  timingPointsOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

export type PerformanceInputType = {
  filters?: InputMaybe<PerformanceFiltersInputType>;
  fromTimestamp: Scalars['DateTime']['input'];
  paging?: InputMaybe<PagingInputType>;
  toTimestamp: Scalars['DateTime']['input'];
};

export type PunctualityDayOfWeekType = {
  __typename?: 'PunctualityDayOfWeekType';
  dayOfWeek: Scalars['Int']['output'];
  early: Scalars['Int']['output'];
  late: Scalars['Int']['output'];
  onTime: Scalars['Int']['output'];
};

export enum PunctualitySortEnum {
  Early = 'Early',
  Late = 'Late',
  OnTime = 'OnTime'
}

export type PunctualitySortType = {
  field?: InputMaybe<PunctualitySortEnum>;
  order?: InputMaybe<SortOrderEnum>;
};

export type PunctualityTimeOfDayType = {
  __typename?: 'PunctualityTimeOfDayType';
  early: Scalars['Int']['output'];
  late: Scalars['Int']['output'];
  onTime: Scalars['Int']['output'];
  timeOfDay: Scalars['String']['output'];
};

export type PunctualityTimeSeriesType = {
  __typename?: 'PunctualityTimeSeriesType';
  early: Scalars['Int']['output'];
  late: Scalars['Int']['output'];
  onTime: Scalars['Int']['output'];
  ts: Scalars['String']['output'];
};

export type PunctualityTotalsType = {
  __typename?: 'PunctualityTotalsType';
  averageDeviation?: Maybe<Scalars['Float']['output']>;
  completed: Scalars['Int']['output'];
  early: Scalars['Int']['output'];
  late: Scalars['Int']['output'];
  onTime: Scalars['Int']['output'];
  scheduled: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  adminAreas?: Maybe<Array<Maybe<AdminAreasType>>>;
  apiInfo?: Maybe<ApiInfoType>;
  avls: Array<AvlPoint>;
  corridor?: Maybe<CorridorNamespace>;
  eventStats?: Maybe<Array<Maybe<EventStatsType>>>;
  events?: Maybe<EventResponse>;
  headwayMetrics?: Maybe<HeadwayMetricsType>;
  invitation?: Maybe<InvitationType>;
  onTimePerformance?: Maybe<OnTimePerformanceType>;
  operator?: Maybe<OperatorType>;
  operators?: Maybe<OperatorsPage>;
  roles?: Maybe<Array<RoleType>>;
  route: Array<Stop>;
  serviceInfo?: Maybe<ServiceInfoType>;
  user?: Maybe<UserType>;
  userAlert?: Maybe<AlertType>;
  userAlerts?: Maybe<Array<AlertType>>;
  users?: Maybe<Array<UserType>>;
  vehicleReplay?: Maybe<VehicleReplayNamespace>;
};


export type QueryAdminAreasArgs = {
  adminAreaIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryAvlsArgs = {
  groupId: Scalars['String']['input'];
};


export type QueryEventStatsArgs = {
  end: Scalars['Date']['input'];
  operatorId: Scalars['String']['input'];
  start: Scalars['Date']['input'];
};


export type QueryEventsArgs = {
  end: Scalars['DateTime']['input'];
  operatorId: Scalars['String']['input'];
  start: Scalars['DateTime']['input'];
};


export type QueryInvitationArgs = {
  key: Scalars['String']['input'];
};


export type QueryOperatorArgs = {
  operatorId: Scalars['String']['input'];
};


export type QueryOperatorsArgs = {
  filterBy?: InputMaybe<OperatorFilterInput>;
};


export type QueryRouteArgs = {
  groupId: Scalars['String']['input'];
};


export type QueryServiceInfoArgs = {
  serviceId: Scalars['String']['input'];
};


export type QueryUserArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
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
  scope: Scalars['String']['output'];
};

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
  distance: Scalars['Int']['output'];
  fromStop?: Maybe<Scalars['String']['output']>;
  linkRoute?: Maybe<Scalars['String']['output']>;
  routeValidity?: Maybe<Scalars['String']['output']>;
  toStop?: Maybe<Scalars['String']['output']>;
};

export type ServicePatternType = {
  __typename?: 'ServicePatternType';
  name: Scalars['String']['output'];
  serviceLinks?: Maybe<Array<ServiceLinkType>>;
  servicePatternId: Scalars['String']['output'];
  stops?: Maybe<Array<StopType>>;
};

export type ServicePerformanceFiltersInputType = {
  operatorIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  timingPointsOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ServicePerformanceInputType = {
  filters?: InputMaybe<ServicePerformanceFiltersInputType>;
  fromTimestamp?: InputMaybe<Scalars['DateTime']['input']>;
  order?: InputMaybe<RankingOrder>;
  toTimestamp?: InputMaybe<Scalars['DateTime']['input']>;
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
  operatorInfo?: Maybe<OperatorInfoType>;
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
  operatorId?: Maybe<Scalars['String']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  trend?: Maybe<ServicePunctualityType>;
};


export type ServicePunctualityTypeTrendArgs = {
  fromTimestamp: Scalars['DateTime']['input'];
  toTimestamp: Scalars['DateTime']['input'];
};

export enum ShortCodeDayOfWeek {
  Fri = 'Fri',
  Mon = 'Mon',
  Sat = 'Sat',
  Sun = 'Sun',
  Thu = 'Thu',
  Tue = 'Tue',
  Wed = 'Wed'
}

export type SignupPayloadType = {
  firstName: Scalars['String']['input'];
  key: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export enum SortOrderEnum {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Stop = {
  __typename?: 'Stop';
  actualDepartureUtc?: Maybe<Scalars['String']['output']>;
  isTimingPoint: Scalars['Boolean']['output'];
  latitude: Scalars['Float']['output'];
  lineName: Scalars['String']['output'];
  longitude: Scalars['Float']['output'];
  operatorName: Scalars['String']['output'];
  operatorNoc: Scalars['String']['output'];
  otp?: Maybe<OtpEnum>;
  scheduledDepartureUtc: Scalars['String']['output'];
  serviceId: Scalars['String']['output'];
  serviceName: Scalars['String']['output'];
  startTime: Scalars['String']['output'];
  stopId: Scalars['Int']['output'];
  stopIndex: Scalars['Int']['output'];
  stopName: Scalars['String']['output'];
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
  stopIndex?: Maybe<Scalars['Int']['output']>;
  stopInfo: StopInfoType;
  timingPoint?: Maybe<Scalars['Boolean']['output']>;
};

export type StopType = {
  __typename?: 'StopType';
  adminAreaId?: Maybe<Scalars['String']['output']>;
  adminAreaName?: Maybe<Scalars['String']['output']>;
  lat: Scalars['Float']['output'];
  localityId?: Maybe<Scalars['String']['output']>;
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

export type TransitModelType = {
  __typename?: 'TransitModelType';
  lines?: Maybe<PaginatedLineType>;
};


export type TransitModelTypeLinesArgs = {
  filterBy?: InputMaybe<LineFilterType>;
};

export type UniqueJourneyType = {
  __typename?: 'UniqueJourneyType';
  serviceInfo: ServiceInfoType;
  startTime: Scalars['String']['output'];
  vehicleJourneyId?: Maybe<Scalars['String']['output']>;
};

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
  role?: InputMaybe<RoleReferenceInput>;
};

export type UserUpdateResponseType = {
  __typename?: 'UserUpdateResponseType';
  error?: Maybe<Scalars['String']['output']>;
  user?: Maybe<UserType>;
};

export type VehicleReplayFilterInputType = {
  filterOnStartTime?: InputMaybe<Scalars['Boolean']['input']>;
  lineIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  stopIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type VehicleReplayInputType = {
  filters?: InputMaybe<VehicleReplayFilterInputType>;
  fromTimestamp: Scalars['DateTime']['input'];
  toTimestamp: Scalars['DateTime']['input'];
};

export type VehicleReplayNamespace = {
  __typename?: 'VehicleReplayNamespace';
  findJourneys?: Maybe<Array<Maybe<UniqueJourneyType>>>;
};


export type VehicleReplayNamespaceFindJourneysArgs = {
  inputs: VehicleReplayInputType;
};

export type VehicleStatsType = {
  __typename?: 'VehicleStatsType';
  actual?: Maybe<Scalars['Int']['output']>;
  expected?: Maybe<Scalars['Int']['output']>;
  timestamp?: Maybe<Scalars['DateTime']['output']>;
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
  AddFirstStopInputType: AddFirstStopInputType;
  AdminAreaInfoType: ResolverTypeWrapper<AdminAreaInfoType>;
  AdminAreasType: ResolverTypeWrapper<AdminAreasType>;
  AlertInputType: AlertInputType;
  AlertReferenceInput: AlertReferenceInput;
  AlertType: ResolverTypeWrapper<AlertType>;
  AlertTypeEnum: AlertTypeEnum;
  ApiInfoType: ResolverTypeWrapper<ApiInfoType>;
  AvlPoint: ResolverTypeWrapper<AvlPoint>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BoundingBoxInputType: BoundingBoxInputType;
  CorridorGranularity: CorridorGranularity;
  CorridorHistogramType: ResolverTypeWrapper<CorridorHistogramType>;
  CorridorInputType: CorridorInputType;
  CorridorJourneyTimeStatsType: ResolverTypeWrapper<CorridorJourneyTimeStatsType>;
  CorridorNamespace: ResolverTypeWrapper<CorridorNamespace>;
  CorridorStatsDayOfWeekType: ResolverTypeWrapper<CorridorStatsDayOfWeekType>;
  CorridorStatsHistogramType: ResolverTypeWrapper<CorridorStatsHistogramType>;
  CorridorStatsInputType: CorridorStatsInputType;
  CorridorStatsPerServiceType: ResolverTypeWrapper<CorridorStatsPerServiceType>;
  CorridorStatsTimeOfDayType: ResolverTypeWrapper<CorridorStatsTimeOfDayType>;
  CorridorStatsType: ResolverTypeWrapper<CorridorStatsType>;
  CorridorSummaryStatsType: ResolverTypeWrapper<CorridorSummaryStatsType>;
  CorridorType: ResolverTypeWrapper<CorridorType>;
  CorridorUpdateInputType: CorridorUpdateInputType;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  DayOfWeekFlagsInputType: DayOfWeekFlagsInputType;
  DelayFrequencyType: ResolverTypeWrapper<DelayFrequencyType>;
  EventData: ResolverTypeWrapper<EventData>;
  EventResponse: ResolverTypeWrapper<EventResponse>;
  EventStatsType: ResolverTypeWrapper<EventStatsType>;
  EventType: ResolverTypeWrapper<EventType>;
  FeatureFlagType: ResolverTypeWrapper<FeatureFlagType>;
  FeedMonitoringType: ResolverTypeWrapper<FeedMonitoringType>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  FrequentServiceInfoFilterType: FrequentServiceInfoFilterType;
  FrequentServiceInfoInputType: FrequentServiceInfoInputType;
  FrequentServiceInfoType: ResolverTypeWrapper<FrequentServiceInfoType>;
  FrequentServiceType: ResolverTypeWrapper<FrequentServiceType>;
  GpsPointType: ResolverTypeWrapper<GpsPointType>;
  Granularity: Granularity;
  HeadwayDayOfWeekType: ResolverTypeWrapper<HeadwayDayOfWeekType>;
  HeadwayFiltersInputType: HeadwayFiltersInputType;
  HeadwayInputType: HeadwayInputType;
  HeadwayMetricsType: ResolverTypeWrapper<HeadwayMetricsType>;
  HeadwayOverviewType: ResolverTypeWrapper<HeadwayOverviewType>;
  HeadwaySortEnum: HeadwaySortEnum;
  HeadwaySortType: HeadwaySortType;
  HeadwayTimeOfDayType: ResolverTypeWrapper<HeadwayTimeOfDayType>;
  HeadwayTimeSeriesType: ResolverTypeWrapper<HeadwayTimeSeriesType>;
  HistoricalStatsType: ResolverTypeWrapper<HistoricalStatsType>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  InvitationInput: InvitationInput;
  InvitationResponseType: ResolverTypeWrapper<InvitationResponseType>;
  InvitationType: ResolverTypeWrapper<InvitationType>;
  JourneyScheduledStartTimes: ResolverTypeWrapper<JourneyScheduledStartTimes>;
  LineDirection: LineDirection;
  LineFilterType: LineFilterType;
  LineType: ResolverTypeWrapper<LineType>;
  LiveStatsType: ResolverTypeWrapper<LiveStatsType>;
  LocalityType: ResolverTypeWrapper<LocalityType>;
  LoginResponse: ResolverTypeWrapper<LoginResponse>;
  Mutation: ResolverTypeWrapper<{}>;
  MutationResponseType: ResolverTypeWrapper<MutationResponseType>;
  OnTimePerformanceType: ResolverTypeWrapper<OnTimePerformanceType>;
  OperatorFilterInput: OperatorFilterInput;
  OperatorInfoType: ResolverTypeWrapper<OperatorInfoType>;
  OperatorPerformancePage: ResolverTypeWrapper<OperatorPerformancePage>;
  OperatorPerformanceType: ResolverTypeWrapper<OperatorPerformanceType>;
  OperatorType: ResolverTypeWrapper<OperatorType>;
  OperatorsPage: ResolverTypeWrapper<OperatorsPage>;
  OrganisationReferenceInput: OrganisationReferenceInput;
  OrganisationType: ResolverTypeWrapper<OrganisationType>;
  OtpEnum: OtpEnum;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  PaginatedLineType: ResolverTypeWrapper<PaginatedLineType>;
  PagingInputType: PagingInputType;
  PerformanceFiltersInputType: PerformanceFiltersInputType;
  PerformanceInputType: PerformanceInputType;
  PunctualityDayOfWeekType: ResolverTypeWrapper<PunctualityDayOfWeekType>;
  PunctualitySortEnum: PunctualitySortEnum;
  PunctualitySortType: PunctualitySortType;
  PunctualityTimeOfDayType: ResolverTypeWrapper<PunctualityTimeOfDayType>;
  PunctualityTimeSeriesType: ResolverTypeWrapper<PunctualityTimeSeriesType>;
  PunctualityTotalsType: ResolverTypeWrapper<PunctualityTotalsType>;
  Query: ResolverTypeWrapper<{}>;
  RankingOrder: RankingOrder;
  RoleReferenceInput: RoleReferenceInput;
  RoleType: ResolverTypeWrapper<RoleType>;
  ScopeEnum: ScopeEnum;
  ServiceInfoType: ResolverTypeWrapper<ServiceInfoType>;
  ServiceLinkType: ResolverTypeWrapper<ServiceLinkType>;
  ServicePatternType: ResolverTypeWrapper<ServicePatternType>;
  ServicePerformanceFiltersInputType: ServicePerformanceFiltersInputType;
  ServicePerformanceInputType: ServicePerformanceInputType;
  ServicePerformanceType: ResolverTypeWrapper<ServicePerformanceType>;
  ServicePunctualityType: ResolverTypeWrapper<ServicePunctualityType>;
  ShortCodeDayOfWeek: ShortCodeDayOfWeek;
  SignupPayloadType: SignupPayloadType;
  SortOrderEnum: SortOrderEnum;
  Stop: ResolverTypeWrapper<Stop>;
  StopInfoType: ResolverTypeWrapper<StopInfoType>;
  StopPerformanceType: ResolverTypeWrapper<StopPerformanceType>;
  StopType: ResolverTypeWrapper<StopType>;
  StopsSegment: StopsSegment;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Time: ResolverTypeWrapper<Scalars['Time']['output']>;
  TransitModelType: ResolverTypeWrapper<TransitModelType>;
  UniqueJourneyType: ResolverTypeWrapper<UniqueJourneyType>;
  UserType: ResolverTypeWrapper<UserType>;
  UserUpdateInput: UserUpdateInput;
  UserUpdateResponseType: ResolverTypeWrapper<UserUpdateResponseType>;
  VehicleReplayFilterInputType: VehicleReplayFilterInputType;
  VehicleReplayInputType: VehicleReplayInputType;
  VehicleReplayNamespace: ResolverTypeWrapper<VehicleReplayNamespace>;
  VehicleStatsType: ResolverTypeWrapper<VehicleStatsType>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AddFirstStopInputType: AddFirstStopInputType;
  AdminAreaInfoType: AdminAreaInfoType;
  AdminAreasType: AdminAreasType;
  AlertInputType: AlertInputType;
  AlertReferenceInput: AlertReferenceInput;
  AlertType: AlertType;
  ApiInfoType: ApiInfoType;
  AvlPoint: AvlPoint;
  Boolean: Scalars['Boolean']['output'];
  BoundingBoxInputType: BoundingBoxInputType;
  CorridorHistogramType: CorridorHistogramType;
  CorridorInputType: CorridorInputType;
  CorridorJourneyTimeStatsType: CorridorJourneyTimeStatsType;
  CorridorNamespace: CorridorNamespace;
  CorridorStatsDayOfWeekType: CorridorStatsDayOfWeekType;
  CorridorStatsHistogramType: CorridorStatsHistogramType;
  CorridorStatsInputType: CorridorStatsInputType;
  CorridorStatsPerServiceType: CorridorStatsPerServiceType;
  CorridorStatsTimeOfDayType: CorridorStatsTimeOfDayType;
  CorridorStatsType: CorridorStatsType;
  CorridorSummaryStatsType: CorridorSummaryStatsType;
  CorridorType: CorridorType;
  CorridorUpdateInputType: CorridorUpdateInputType;
  Date: Scalars['Date']['output'];
  DateTime: Scalars['DateTime']['output'];
  DayOfWeekFlagsInputType: DayOfWeekFlagsInputType;
  DelayFrequencyType: DelayFrequencyType;
  EventData: EventData;
  EventResponse: EventResponse;
  EventStatsType: EventStatsType;
  EventType: EventType;
  FeatureFlagType: FeatureFlagType;
  FeedMonitoringType: FeedMonitoringType;
  Float: Scalars['Float']['output'];
  FrequentServiceInfoFilterType: FrequentServiceInfoFilterType;
  FrequentServiceInfoInputType: FrequentServiceInfoInputType;
  FrequentServiceInfoType: FrequentServiceInfoType;
  FrequentServiceType: FrequentServiceType;
  GpsPointType: GpsPointType;
  HeadwayDayOfWeekType: HeadwayDayOfWeekType;
  HeadwayFiltersInputType: HeadwayFiltersInputType;
  HeadwayInputType: HeadwayInputType;
  HeadwayMetricsType: HeadwayMetricsType;
  HeadwayOverviewType: HeadwayOverviewType;
  HeadwaySortType: HeadwaySortType;
  HeadwayTimeOfDayType: HeadwayTimeOfDayType;
  HeadwayTimeSeriesType: HeadwayTimeSeriesType;
  HistoricalStatsType: HistoricalStatsType;
  Int: Scalars['Int']['output'];
  InvitationInput: InvitationInput;
  InvitationResponseType: InvitationResponseType;
  InvitationType: InvitationType;
  JourneyScheduledStartTimes: JourneyScheduledStartTimes;
  LineFilterType: LineFilterType;
  LineType: LineType;
  LiveStatsType: LiveStatsType;
  LocalityType: LocalityType;
  LoginResponse: LoginResponse;
  Mutation: {};
  MutationResponseType: MutationResponseType;
  OnTimePerformanceType: OnTimePerformanceType;
  OperatorFilterInput: OperatorFilterInput;
  OperatorInfoType: OperatorInfoType;
  OperatorPerformancePage: OperatorPerformancePage;
  OperatorPerformanceType: OperatorPerformanceType;
  OperatorType: OperatorType;
  OperatorsPage: OperatorsPage;
  OrganisationReferenceInput: OrganisationReferenceInput;
  OrganisationType: OrganisationType;
  PageInfo: PageInfo;
  PaginatedLineType: PaginatedLineType;
  PagingInputType: PagingInputType;
  PerformanceFiltersInputType: PerformanceFiltersInputType;
  PerformanceInputType: PerformanceInputType;
  PunctualityDayOfWeekType: PunctualityDayOfWeekType;
  PunctualitySortType: PunctualitySortType;
  PunctualityTimeOfDayType: PunctualityTimeOfDayType;
  PunctualityTimeSeriesType: PunctualityTimeSeriesType;
  PunctualityTotalsType: PunctualityTotalsType;
  Query: {};
  RoleReferenceInput: RoleReferenceInput;
  RoleType: RoleType;
  ServiceInfoType: ServiceInfoType;
  ServiceLinkType: ServiceLinkType;
  ServicePatternType: ServicePatternType;
  ServicePerformanceFiltersInputType: ServicePerformanceFiltersInputType;
  ServicePerformanceInputType: ServicePerformanceInputType;
  ServicePerformanceType: ServicePerformanceType;
  ServicePunctualityType: ServicePunctualityType;
  SignupPayloadType: SignupPayloadType;
  Stop: Stop;
  StopInfoType: StopInfoType;
  StopPerformanceType: StopPerformanceType;
  StopType: StopType;
  String: Scalars['String']['output'];
  Time: Scalars['Time']['output'];
  TransitModelType: TransitModelType;
  UniqueJourneyType: UniqueJourneyType;
  UserType: UserType;
  UserUpdateInput: UserUpdateInput;
  UserUpdateResponseType: UserUpdateResponseType;
  VehicleReplayFilterInputType: VehicleReplayFilterInputType;
  VehicleReplayInputType: VehicleReplayInputType;
  VehicleReplayNamespace: VehicleReplayNamespace;
  VehicleStatsType: VehicleStatsType;
}>;

export type AdminAreaInfoTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['AdminAreaInfoType'] = ResolversParentTypes['AdminAreaInfoType']> = ResolversObject<{
  adminAreaId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AdminAreasTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['AdminAreasType'] = ResolversParentTypes['AdminAreasType']> = ResolversObject<{
  adminAreaId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  adminAreaName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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

export type AvlPointResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['AvlPoint'] = ResolversParentTypes['AvlPoint']> = ResolversObject<{
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
  percentile5?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  percentile25?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  percentile75?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  percentile95?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  ts?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorridorNamespaceResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['CorridorNamespace'] = ResolversParentTypes['CorridorNamespace']> = ResolversObject<{
  addFirstStop?: Resolver<Maybe<Array<Maybe<ResolversTypes['StopType']>>>, ParentType, ContextType, Partial<CorridorNamespaceAddFirstStopArgs>>;
  addSubsequentStops?: Resolver<Maybe<Array<Maybe<ResolversTypes['StopType']>>>, ParentType, ContextType, Partial<CorridorNamespaceAddSubsequentStopsArgs>>;
  corridorList?: Resolver<Maybe<Array<Maybe<ResolversTypes['CorridorType']>>>, ParentType, ContextType>;
  getCorridor?: Resolver<Maybe<ResolversTypes['CorridorType']>, ParentType, ContextType, RequireFields<CorridorNamespaceGetCorridorArgs, 'corridorId'>>;
  stats?: Resolver<Maybe<ResolversTypes['CorridorStatsType']>, ParentType, ContextType, Partial<CorridorNamespaceStatsArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorridorStatsDayOfWeekTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['CorridorStatsDayOfWeekType'] = ResolversParentTypes['CorridorStatsDayOfWeekType']> = ResolversObject<{
  avgTransitTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  dow?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  maxTransitTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  minTransitTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  percentile5?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  percentile25?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  percentile75?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  percentile95?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorridorStatsHistogramTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['CorridorStatsHistogramType'] = ResolversParentTypes['CorridorStatsHistogramType']> = ResolversObject<{
  hist?: Resolver<Maybe<Array<Maybe<ResolversTypes['CorridorHistogramType']>>>, ParentType, ContextType>;
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
  percentile5?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  percentile25?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  percentile75?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  percentile95?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
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
  operatorName?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  percentile95?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  scheduledJourneyTime?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  scheduledTransits?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalTransits?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorridorTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['CorridorType'] = ResolversParentTypes['CorridorType']> = ResolversObject<{
  createdBy?: Resolver<Maybe<ResolversTypes['UserType']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  organisation?: Resolver<Maybe<ResolversTypes['OrganisationType']>, ParentType, ContextType>;
  stops?: Resolver<Maybe<Array<Maybe<ResolversTypes['StopInfoType']>>>, ParentType, ContextType>;
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

export type FeatureFlagTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['FeatureFlagType'] = ResolversParentTypes['FeatureFlagType']> = ResolversObject<{
  consolidateHistogram?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  corridorStatsTimezoneEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  freshdeskEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  lineDirectionFiltering?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  ssoEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  stopIndexFiltering?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  taggingIncludeBankHolidays?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  vehicleReplayFromTimestream?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FeedMonitoringTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['FeedMonitoringType'] = ResolversParentTypes['FeedMonitoringType']> = ResolversObject<{
  availability?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  feedStatus?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  historicalStats?: Resolver<Maybe<ResolversTypes['HistoricalStatsType']>, ParentType, ContextType, RequireFields<FeedMonitoringTypeHistoricalStatsArgs, 'date'>>;
  lastOutage?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  liveStats?: Resolver<Maybe<ResolversTypes['LiveStatsType']>, ParentType, ContextType>;
  unavailableSince?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  vehicleStats?: Resolver<Maybe<Array<Maybe<ResolversTypes['VehicleStatsType']>>>, ParentType, ContextType, RequireFields<FeedMonitoringTypeVehicleStatsArgs, 'end' | 'start'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FrequentServiceInfoTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['FrequentServiceInfoType'] = ResolversParentTypes['FrequentServiceInfoType']> = ResolversObject<{
  numHours?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalHours?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FrequentServiceTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['FrequentServiceType'] = ResolversParentTypes['FrequentServiceType']> = ResolversObject<{
  serviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serviceInfo?: Resolver<Maybe<ResolversTypes['ServiceInfoType']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GpsPointTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['GpsPointType'] = ResolversParentTypes['GpsPointType']> = ResolversObject<{
  latitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  longitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HeadwayDayOfWeekTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['HeadwayDayOfWeekType'] = ResolversParentTypes['HeadwayDayOfWeekType']> = ResolversObject<{
  actualWaitTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  dayOfWeek?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  excessWaitTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  scheduledWaitTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HeadwayMetricsTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['HeadwayMetricsType'] = ResolversParentTypes['HeadwayMetricsType']> = ResolversObject<{
  frequentServiceInfo?: Resolver<Maybe<ResolversTypes['FrequentServiceInfoType']>, ParentType, ContextType, Partial<HeadwayMetricsTypeFrequentServiceInfoArgs>>;
  frequentServices?: Resolver<Maybe<Array<Maybe<ResolversTypes['FrequentServiceType']>>>, ParentType, ContextType, RequireFields<HeadwayMetricsTypeFrequentServicesArgs, 'fromTimestamp' | 'operatorId' | 'toTimestamp'>>;
  headwayDayOfWeek?: Resolver<Maybe<Array<Maybe<ResolversTypes['HeadwayDayOfWeekType']>>>, ParentType, ContextType, RequireFields<HeadwayMetricsTypeHeadwayDayOfWeekArgs, 'lineId'>>;
  headwayOverview?: Resolver<Maybe<ResolversTypes['HeadwayOverviewType']>, ParentType, ContextType, RequireFields<HeadwayMetricsTypeHeadwayOverviewArgs, 'inputs'>>;
  headwayTimeOfDay?: Resolver<Maybe<Array<Maybe<ResolversTypes['HeadwayTimeOfDayType']>>>, ParentType, ContextType, RequireFields<HeadwayMetricsTypeHeadwayTimeOfDayArgs, 'lineId'>>;
  headwayTimeSeries?: Resolver<Maybe<Array<Maybe<ResolversTypes['HeadwayTimeSeriesType']>>>, ParentType, ContextType, RequireFields<HeadwayMetricsTypeHeadwayTimeSeriesArgs, 'inputs'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HeadwayOverviewTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['HeadwayOverviewType'] = ResolversParentTypes['HeadwayOverviewType']> = ResolversObject<{
  actualWaitTime?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  excessWaitTime?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  scheduledWaitTime?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HeadwayTimeOfDayTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['HeadwayTimeOfDayType'] = ResolversParentTypes['HeadwayTimeOfDayType']> = ResolversObject<{
  actualWaitTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  excessWaitTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  scheduledWaitTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  timeOfDay?: Resolver<Maybe<ResolversTypes['Time']>, ParentType, ContextType>;
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
  compliance?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  updateFrequency?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  vehicleStats?: Resolver<Maybe<Array<Maybe<ResolversTypes['VehicleStatsType']>>>, ParentType, ContextType>;
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
  organisation?: Resolver<Maybe<ResolversTypes['OrganisationType']>, ParentType, ContextType>;
  role?: Resolver<Maybe<ResolversTypes['RoleType']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type JourneyScheduledStartTimesResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['JourneyScheduledStartTimes'] = ResolversParentTypes['JourneyScheduledStartTimes']> = ResolversObject<{
  days?: Resolver<Maybe<Array<Maybe<ResolversTypes['ShortCodeDayOfWeek']>>>, ParentType, ContextType>;
  fromDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  startTimes?: Resolver<Maybe<Array<Maybe<ResolversTypes['Time']>>>, ParentType, ContextType>;
  toDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LineTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['LineType'] = ResolversParentTypes['LineType']> = ResolversObject<{
  lineId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lineName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lineNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  servicePatterns?: Resolver<Maybe<Array<Maybe<ResolversTypes['ServicePatternType']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LiveStatsTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['LiveStatsType'] = ResolversParentTypes['LiveStatsType']> = ResolversObject<{
  currentVehicles?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  expectedVehicles?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  feedAlerts?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  feedErrors?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  last20Minutes?: Resolver<Maybe<Array<Maybe<ResolversTypes['VehicleStatsType']>>>, ParentType, ContextType>;
  last24Hours?: Resolver<Maybe<Array<Maybe<ResolversTypes['VehicleStatsType']>>>, ParentType, ContextType>;
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
  createCorridor?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, Partial<MutationCreateCorridorArgs>>;
  deleteCorridor?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, Partial<MutationDeleteCorridorArgs>>;
  deleteUser?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'username'>>;
  deleteUserAlert?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationDeleteUserAlertArgs, 'alertId'>>;
  inviteUser?: Resolver<ResolversTypes['InvitationResponseType'], ParentType, ContextType, RequireFields<MutationInviteUserArgs, 'payload'>>;
  login?: Resolver<Maybe<ResolversTypes['LoginResponse']>, ParentType, ContextType, RequireFields<MutationLoginArgs, 'password' | 'username'>>;
  logout?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  requestResetPassword?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationRequestResetPasswordArgs, 'email'>>;
  resetPassword?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationResetPasswordArgs, 'confirmPassword' | 'password' | 'token' | 'uid'>>;
  signUp?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, RequireFields<MutationSignUpArgs, 'payload'>>;
  updateCorridor?: Resolver<ResolversTypes['MutationResponseType'], ParentType, ContextType, Partial<MutationUpdateCorridorArgs>>;
  updateUser?: Resolver<ResolversTypes['UserUpdateResponseType'], ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'username'>>;
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
  journeyScheduledStartTimes?: Resolver<Maybe<Array<Maybe<ResolversTypes['JourneyScheduledStartTimes']>>>, ParentType, ContextType>;
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

export type OperatorInfoTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['OperatorInfoType'] = ResolversParentTypes['OperatorInfoType']> = ResolversObject<{
  nocCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  operatorId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  operatorName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OperatorPerformancePageResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['OperatorPerformancePage'] = ResolversParentTypes['OperatorPerformancePage']> = ResolversObject<{
  items?: Resolver<Maybe<Array<ResolversTypes['OperatorPerformanceType']>>, ParentType, ContextType>;
  pageInfo?: Resolver<Maybe<ResolversTypes['PageInfo']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OperatorPerformanceTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['OperatorPerformanceType'] = ResolversParentTypes['OperatorPerformanceType']> = ResolversObject<{
  actualDepartures?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  averageDelay?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  early?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  late?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nocCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  onTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  operatorId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  scheduledDepartures?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OperatorTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['OperatorType'] = ResolversParentTypes['OperatorType']> = ResolversObject<{
  adminAreas?: Resolver<Maybe<Array<Maybe<ResolversTypes['AdminAreaInfoType']>>>, ParentType, ContextType>;
  feedMonitoring?: Resolver<Maybe<ResolversTypes['FeedMonitoringType']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nocCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  operatorId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  transitModel?: Resolver<Maybe<ResolversTypes['TransitModelType']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OperatorsPageResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['OperatorsPage'] = ResolversParentTypes['OperatorsPage']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['OperatorType']>>>, ParentType, ContextType>;
  pageInfo?: Resolver<Maybe<ResolversTypes['PageInfo']>, ParentType, ContextType>;
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

export type PaginatedLineTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['PaginatedLineType'] = ResolversParentTypes['PaginatedLineType']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['LineType']>>>, ParentType, ContextType>;
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
  timeOfDay?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PunctualityTimeSeriesTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['PunctualityTimeSeriesType'] = ResolversParentTypes['PunctualityTimeSeriesType']> = ResolversObject<{
  early?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  late?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  onTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  ts?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PunctualityTotalsTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['PunctualityTotalsType'] = ResolversParentTypes['PunctualityTotalsType']> = ResolversObject<{
  averageDeviation?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  completed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  early?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  late?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  onTime?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  scheduled?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  adminAreas?: Resolver<Maybe<Array<Maybe<ResolversTypes['AdminAreasType']>>>, ParentType, ContextType, Partial<QueryAdminAreasArgs>>;
  apiInfo?: Resolver<Maybe<ResolversTypes['ApiInfoType']>, ParentType, ContextType>;
  avls?: Resolver<Array<ResolversTypes['AvlPoint']>, ParentType, ContextType, RequireFields<QueryAvlsArgs, 'groupId'>>;
  corridor?: Resolver<Maybe<ResolversTypes['CorridorNamespace']>, ParentType, ContextType>;
  eventStats?: Resolver<Maybe<Array<Maybe<ResolversTypes['EventStatsType']>>>, ParentType, ContextType, RequireFields<QueryEventStatsArgs, 'end' | 'operatorId' | 'start'>>;
  events?: Resolver<Maybe<ResolversTypes['EventResponse']>, ParentType, ContextType, RequireFields<QueryEventsArgs, 'end' | 'operatorId' | 'start'>>;
  headwayMetrics?: Resolver<Maybe<ResolversTypes['HeadwayMetricsType']>, ParentType, ContextType>;
  invitation?: Resolver<Maybe<ResolversTypes['InvitationType']>, ParentType, ContextType, RequireFields<QueryInvitationArgs, 'key'>>;
  onTimePerformance?: Resolver<Maybe<ResolversTypes['OnTimePerformanceType']>, ParentType, ContextType>;
  operator?: Resolver<Maybe<ResolversTypes['OperatorType']>, ParentType, ContextType, RequireFields<QueryOperatorArgs, 'operatorId'>>;
  operators?: Resolver<Maybe<ResolversTypes['OperatorsPage']>, ParentType, ContextType, Partial<QueryOperatorsArgs>>;
  roles?: Resolver<Maybe<Array<ResolversTypes['RoleType']>>, ParentType, ContextType>;
  route?: Resolver<Array<ResolversTypes['Stop']>, ParentType, ContextType, RequireFields<QueryRouteArgs, 'groupId'>>;
  serviceInfo?: Resolver<Maybe<ResolversTypes['ServiceInfoType']>, ParentType, ContextType, RequireFields<QueryServiceInfoArgs, 'serviceId'>>;
  user?: Resolver<Maybe<ResolversTypes['UserType']>, ParentType, ContextType, Partial<QueryUserArgs>>;
  userAlert?: Resolver<Maybe<ResolversTypes['AlertType']>, ParentType, ContextType, RequireFields<QueryUserAlertArgs, 'alertId'>>;
  userAlerts?: Resolver<Maybe<Array<ResolversTypes['AlertType']>>, ParentType, ContextType>;
  users?: Resolver<Maybe<Array<ResolversTypes['UserType']>>, ParentType, ContextType>;
  vehicleReplay?: Resolver<Maybe<ResolversTypes['VehicleReplayNamespace']>, ParentType, ContextType>;
}>;

export type RoleTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['RoleType'] = ResolversParentTypes['RoleType']> = ResolversObject<{
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scope?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ServiceInfoTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['ServiceInfoType'] = ResolversParentTypes['ServiceInfoType']> = ResolversObject<{
  serviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serviceName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serviceNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ServiceLinkTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['ServiceLinkType'] = ResolversParentTypes['ServiceLinkType']> = ResolversObject<{
  distance?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  fromStop?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  linkRoute?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  routeValidity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  toStop?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ServicePatternTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['ServicePatternType'] = ResolversParentTypes['ServicePatternType']> = ResolversObject<{
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serviceLinks?: Resolver<Maybe<Array<ResolversTypes['ServiceLinkType']>>, ParentType, ContextType>;
  servicePatternId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stops?: Resolver<Maybe<Array<ResolversTypes['StopType']>>, ParentType, ContextType>;
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
  operatorInfo?: Resolver<Maybe<ResolversTypes['OperatorInfoType']>, ParentType, ContextType>;
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
  operatorId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rank?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  trend?: Resolver<Maybe<ResolversTypes['ServicePunctualityType']>, ParentType, ContextType, RequireFields<ServicePunctualityTypeTrendArgs, 'fromTimestamp' | 'toTimestamp'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StopResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['Stop'] = ResolversParentTypes['Stop']> = ResolversObject<{
  actualDepartureUtc?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isTimingPoint?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  latitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  lineName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  longitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  operatorName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  operatorNoc?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  otp?: Resolver<Maybe<ResolversTypes['OtpEnum']>, ParentType, ContextType>;
  scheduledDepartureUtc?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serviceName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stopId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stopIndex?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stopName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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
  stopIndex?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  stopInfo?: Resolver<ResolversTypes['StopInfoType'], ParentType, ContextType>;
  timingPoint?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StopTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['StopType'] = ResolversParentTypes['StopType']> = ResolversObject<{
  adminAreaId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  adminAreaName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lat?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  localityId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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

export type TransitModelTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['TransitModelType'] = ResolversParentTypes['TransitModelType']> = ResolversObject<{
  lines?: Resolver<Maybe<ResolversTypes['PaginatedLineType']>, ParentType, ContextType, Partial<TransitModelTypeLinesArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UniqueJourneyTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['UniqueJourneyType'] = ResolversParentTypes['UniqueJourneyType']> = ResolversObject<{
  serviceInfo?: Resolver<ResolversTypes['ServiceInfoType'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  vehicleJourneyId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

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

export type VehicleReplayNamespaceResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['VehicleReplayNamespace'] = ResolversParentTypes['VehicleReplayNamespace']> = ResolversObject<{
  findJourneys?: Resolver<Maybe<Array<Maybe<ResolversTypes['UniqueJourneyType']>>>, ParentType, ContextType, RequireFields<VehicleReplayNamespaceFindJourneysArgs, 'inputs'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VehicleStatsTypeResolvers<ContextType = RequestContext, ParentType extends ResolversParentTypes['VehicleStatsType'] = ResolversParentTypes['VehicleStatsType']> = ResolversObject<{
  actual?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  expected?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  timestamp?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = RequestContext> = ResolversObject<{
  AdminAreaInfoType?: AdminAreaInfoTypeResolvers<ContextType>;
  AdminAreasType?: AdminAreasTypeResolvers<ContextType>;
  AlertType?: AlertTypeResolvers<ContextType>;
  ApiInfoType?: ApiInfoTypeResolvers<ContextType>;
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
  Date?: GraphQLScalarType;
  DateTime?: GraphQLScalarType;
  DelayFrequencyType?: DelayFrequencyTypeResolvers<ContextType>;
  EventData?: EventDataResolvers<ContextType>;
  EventResponse?: EventResponseResolvers<ContextType>;
  EventStatsType?: EventStatsTypeResolvers<ContextType>;
  EventType?: EventTypeResolvers<ContextType>;
  FeatureFlagType?: FeatureFlagTypeResolvers<ContextType>;
  FeedMonitoringType?: FeedMonitoringTypeResolvers<ContextType>;
  FrequentServiceInfoType?: FrequentServiceInfoTypeResolvers<ContextType>;
  FrequentServiceType?: FrequentServiceTypeResolvers<ContextType>;
  GpsPointType?: GpsPointTypeResolvers<ContextType>;
  HeadwayDayOfWeekType?: HeadwayDayOfWeekTypeResolvers<ContextType>;
  HeadwayMetricsType?: HeadwayMetricsTypeResolvers<ContextType>;
  HeadwayOverviewType?: HeadwayOverviewTypeResolvers<ContextType>;
  HeadwayTimeOfDayType?: HeadwayTimeOfDayTypeResolvers<ContextType>;
  HeadwayTimeSeriesType?: HeadwayTimeSeriesTypeResolvers<ContextType>;
  HistoricalStatsType?: HistoricalStatsTypeResolvers<ContextType>;
  InvitationResponseType?: InvitationResponseTypeResolvers<ContextType>;
  InvitationType?: InvitationTypeResolvers<ContextType>;
  JourneyScheduledStartTimes?: JourneyScheduledStartTimesResolvers<ContextType>;
  LineType?: LineTypeResolvers<ContextType>;
  LiveStatsType?: LiveStatsTypeResolvers<ContextType>;
  LocalityType?: LocalityTypeResolvers<ContextType>;
  LoginResponse?: LoginResponseResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  MutationResponseType?: MutationResponseTypeResolvers<ContextType>;
  OnTimePerformanceType?: OnTimePerformanceTypeResolvers<ContextType>;
  OperatorInfoType?: OperatorInfoTypeResolvers<ContextType>;
  OperatorPerformancePage?: OperatorPerformancePageResolvers<ContextType>;
  OperatorPerformanceType?: OperatorPerformanceTypeResolvers<ContextType>;
  OperatorType?: OperatorTypeResolvers<ContextType>;
  OperatorsPage?: OperatorsPageResolvers<ContextType>;
  OrganisationType?: OrganisationTypeResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  PaginatedLineType?: PaginatedLineTypeResolvers<ContextType>;
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
  StopInfoType?: StopInfoTypeResolvers<ContextType>;
  StopPerformanceType?: StopPerformanceTypeResolvers<ContextType>;
  StopType?: StopTypeResolvers<ContextType>;
  Time?: GraphQLScalarType;
  TransitModelType?: TransitModelTypeResolvers<ContextType>;
  UniqueJourneyType?: UniqueJourneyTypeResolvers<ContextType>;
  UserType?: UserTypeResolvers<ContextType>;
  UserUpdateResponseType?: UserUpdateResponseTypeResolvers<ContextType>;
  VehicleReplayNamespace?: VehicleReplayNamespaceResolvers<ContextType>;
  VehicleStatsType?: VehicleStatsTypeResolvers<ContextType>;
}>;

