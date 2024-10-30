import { gql } from 'apollo-angular';
import { Injectable } from '@angular/core';
import * as Apollo from 'apollo-angular';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: any;
  DateTime: any;
  Time: any;
};



export type AddFirstStopInputType = {
  adminAreaIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  boundingBox?: Maybe<BoundingBoxInputType>;
  searchString?: Maybe<Scalars['String']>;
};

export type AdminAreaInfoType = {
  __typename?: 'AdminAreaInfoType';
  adminAreaId: Scalars['String'];
};

export type AdminAreasType = {
  __typename?: 'AdminAreasType';
  adminAreaId: Scalars['String'];
  adminAreaName: Scalars['String'];
  shape: Scalars['String'];
};

export type AlertInputType = {
  alertType?: Maybe<AlertTypeEnum>;
  eventHysterisis?: Maybe<Scalars['Int']>;
  eventThreshold?: Maybe<Scalars['Int']>;
  sendTo: AlertReferenceInput;
};

export type AlertReferenceInput = {
  id: Scalars['String'];
};

export type AlertType = {
  __typename?: 'AlertType';
  alertId: Scalars['String'];
  alertType?: Maybe<AlertTypeEnum>;
  createdBy?: Maybe<UserType>;
  eventHysterisis?: Maybe<Scalars['Int']>;
  eventThreshold?: Maybe<Scalars['Int']>;
  sendTo?: Maybe<UserType>;
};

export enum AlertTypeEnum {
  FeedComplianceFailure = 'FeedComplianceFailure',
  FeedFailure = 'FeedFailure',
  VehicleCountDisparity = 'VehicleCountDisparity'
}

export type ApiInfoType = {
  __typename?: 'ApiInfoType';
  buildNumber: Scalars['String'];
  version: Scalars['String'];
};

export type AvlFiltersInput = {
  lineName?: Maybe<Scalars['String']>;
  operatorNoc?: Maybe<Scalars['String']>;
};

export type AvlLineLevelStatus = {
  __typename?: 'AvlLineLevelStatus';
  lastRecordedAtTime: Scalars['DateTime'];
  lineName: Scalars['String'];
  operatorNoc: Scalars['String'];
};

export type AvlPoint = {
  __typename?: 'AvlPoint';
  latitude: Scalars['Float'];
  longitude: Scalars['Float'];
  recordedAtTimeUtc: Scalars['String'];
  vehicleRef: Scalars['String'];
};

export type BoundingBoxInputType = {
  maxLatitude?: Maybe<Scalars['Float']>;
  maxLongitude?: Maybe<Scalars['Float']>;
  minLatitude?: Maybe<Scalars['Float']>;
  minLongitude?: Maybe<Scalars['Float']>;
};

export enum CorridorGranularity {
  Day = 'day',
  Hour = 'hour',
  Minute = 'minute'
}

export type CorridorHistogramType = {
  __typename?: 'CorridorHistogramType';
  bin?: Maybe<Scalars['Int']>;
  freq?: Maybe<Scalars['Int']>;
};

export type CorridorInputType = {
  name?: Maybe<Scalars['String']>;
  stopIds?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type CorridorJourneyTimeStatsType = {
  __typename?: 'CorridorJourneyTimeStatsType';
  avgTransitTime?: Maybe<Scalars['Float']>;
  maxTransitTime: Scalars['Int'];
  minTransitTime: Scalars['Int'];
  percentile25?: Maybe<Scalars['Float']>;
  percentile5?: Maybe<Scalars['Float']>;
  percentile75?: Maybe<Scalars['Float']>;
  percentile95?: Maybe<Scalars['Float']>;
  ts?: Maybe<Scalars['String']>;
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
  inputs?: Maybe<AddFirstStopInputType>;
};


export type CorridorNamespaceAddSubsequentStopsArgs = {
  stopList?: Maybe<Array<Maybe<Scalars['String']>>>;
};


export type CorridorNamespaceGetCorridorArgs = {
  corridorId: Scalars['Int'];
};


export type CorridorNamespaceStatsArgs = {
  inputs?: Maybe<CorridorStatsInputType>;
};

export type CorridorStatsDayOfWeekType = {
  __typename?: 'CorridorStatsDayOfWeekType';
  avgTransitTime?: Maybe<Scalars['Float']>;
  dow: Scalars['Int'];
  maxTransitTime: Scalars['Int'];
  minTransitTime: Scalars['Int'];
  percentile25?: Maybe<Scalars['Float']>;
  percentile5?: Maybe<Scalars['Float']>;
  percentile75?: Maybe<Scalars['Float']>;
  percentile95?: Maybe<Scalars['Float']>;
};

export type CorridorStatsHistogramType = {
  __typename?: 'CorridorStatsHistogramType';
  hist?: Maybe<Array<Maybe<CorridorHistogramType>>>;
  ts?: Maybe<Scalars['String']>;
};

export type CorridorStatsInputType = {
  corridorId: Scalars['String'];
  fromTimestamp: Scalars['DateTime'];
  granularity: CorridorGranularity;
  stopList?: Maybe<Array<Maybe<Scalars['String']>>>;
  toTimestamp: Scalars['DateTime'];
};

export type CorridorStatsPerServiceType = {
  __typename?: 'CorridorStatsPerServiceType';
  lineName: Scalars['String'];
  noc?: Maybe<Scalars['String']>;
  operatorName?: Maybe<Scalars['String']>;
  recordedTransits?: Maybe<Scalars['Int']>;
  scheduledTransits?: Maybe<Scalars['Int']>;
  servicePatternName: Scalars['String'];
  totalJourneyTime?: Maybe<Scalars['Int']>;
};

export type CorridorStatsTimeOfDayType = {
  __typename?: 'CorridorStatsTimeOfDayType';
  avgTransitTime?: Maybe<Scalars['Float']>;
  hour: Scalars['Int'];
  maxTransitTime: Scalars['Int'];
  minTransitTime: Scalars['Int'];
  percentile25?: Maybe<Scalars['Float']>;
  percentile5?: Maybe<Scalars['Float']>;
  percentile75?: Maybe<Scalars['Float']>;
  percentile95?: Maybe<Scalars['Float']>;
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
  averageJourneyTime?: Maybe<Scalars['Int']>;
  numberOfServices?: Maybe<Scalars['Int']>;
  operatorName?: Maybe<Scalars['Int']>;
  percentile95?: Maybe<Scalars['Float']>;
  scheduledJourneyTime?: Maybe<Scalars['Int']>;
  scheduledTransits?: Maybe<Scalars['Int']>;
  totalTransits?: Maybe<Scalars['Int']>;
};

export type CorridorType = {
  __typename?: 'CorridorType';
  createdBy?: Maybe<UserType>;
  id: Scalars['Int'];
  name: Scalars['String'];
  organisation?: Maybe<OrganisationType>;
  stops?: Maybe<Array<Maybe<StopInfoType>>>;
};

export type CorridorUpdateInputType = {
  id?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  stopList?: Maybe<Array<Maybe<Scalars['String']>>>;
};



export type DayOfWeekFlagsInputType = {
  friday: Scalars['Boolean'];
  monday: Scalars['Boolean'];
  saturday: Scalars['Boolean'];
  sunday: Scalars['Boolean'];
  thursday: Scalars['Boolean'];
  tuesday: Scalars['Boolean'];
  wednesday: Scalars['Boolean'];
};

export type DelayFrequencyType = {
  __typename?: 'DelayFrequencyType';
  bucket: Scalars['Int'];
  frequency?: Maybe<Scalars['Int']>;
};

export type EventData = {
  __typename?: 'EventData';
  message: Scalars['String'];
};

export type EventResponse = {
  __typename?: 'EventResponse';
  items?: Maybe<Array<EventType>>;
};

export type EventStatsType = {
  __typename?: 'EventStatsType';
  count: Scalars['Int'];
  day: Scalars['Date'];
};

export type EventType = {
  __typename?: 'EventType';
  data: EventData;
  timestamp: Scalars['String'];
  type: Scalars['String'];
};

export type FeatureFlagType = {
  __typename?: 'FeatureFlagType';
  consolidateHistogram?: Maybe<Scalars['Boolean']>;
  corridorStatsTimezoneEnabled?: Maybe<Scalars['Boolean']>;
  freshdeskEnabled?: Maybe<Scalars['Boolean']>;
  lineDirectionFiltering?: Maybe<Scalars['Boolean']>;
  ssoEnabled?: Maybe<Scalars['Boolean']>;
  stopIndexFiltering?: Maybe<Scalars['Boolean']>;
  taggingIncludeBankHolidays?: Maybe<Scalars['Boolean']>;
  vehicleReplayFromTimestream?: Maybe<Scalars['Boolean']>;
};

export type FeedMonitoringType = {
  __typename?: 'FeedMonitoringType';
  availability?: Maybe<Scalars['Float']>;
  feedStatus?: Maybe<Scalars['Boolean']>;
  historicalStats?: Maybe<HistoricalStatsType>;
  lastOutage?: Maybe<Scalars['DateTime']>;
  liveStats?: Maybe<LiveStatsType>;
  unavailableSince?: Maybe<Scalars['DateTime']>;
  vehicleStats?: Maybe<Array<Maybe<VehicleStatsType>>>;
};


export type FeedMonitoringTypeHistoricalStatsArgs = {
  date: Scalars['Date'];
};


export type FeedMonitoringTypeVehicleStatsArgs = {
  end: Scalars['DateTime'];
  granularity?: Maybe<Granularity>;
  start: Scalars['DateTime'];
};

export type FrequentServiceInfoFilterType = {
  dayOfWeekFlags?: Maybe<DayOfWeekFlagsInputType>;
  endTime?: Maybe<Scalars['String']>;
  lineId?: Maybe<Scalars['String']>;
  noc?: Maybe<Scalars['String']>;
  operatorId?: Maybe<Scalars['String']>;
  startTime?: Maybe<Scalars['String']>;
};

export type FrequentServiceInfoInputType = {
  filters?: Maybe<FrequentServiceInfoFilterType>;
  fromTimestamp: Scalars['DateTime'];
  toTimestamp: Scalars['DateTime'];
};

export type FrequentServiceInfoType = {
  __typename?: 'FrequentServiceInfoType';
  numHours?: Maybe<Scalars['Int']>;
  totalHours?: Maybe<Scalars['Int']>;
};

export type FrequentServiceType = {
  __typename?: 'FrequentServiceType';
  serviceId: Scalars['String'];
  serviceInfo?: Maybe<ServiceInfoType>;
};

export type GpsPointType = {
  __typename?: 'GpsPointType';
  latitude: Scalars['Float'];
  longitude: Scalars['Float'];
};

export enum Granularity {
  Day = 'day',
  Hour = 'hour',
  Minute = 'minute',
  Month = 'month'
}

export type HeadwayDayOfWeekType = {
  __typename?: 'HeadwayDayOfWeekType';
  actualWaitTime?: Maybe<Scalars['Float']>;
  dayOfWeek?: Maybe<Scalars['Int']>;
  excessWaitTime?: Maybe<Scalars['Float']>;
  scheduledWaitTime?: Maybe<Scalars['Float']>;
};

export type HeadwayFiltersInputType = {
  dayOfWeekFlags?: Maybe<DayOfWeekFlagsInputType>;
  endTime?: Maybe<Scalars['String']>;
  granularity?: Maybe<Granularity>;
  lineIds?: Maybe<Array<Scalars['String']>>;
  nocCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  operatorIds?: Maybe<Array<Scalars['String']>>;
  startTime?: Maybe<Scalars['String']>;
};

export type HeadwayInputType = {
  filters?: Maybe<HeadwayFiltersInputType>;
  fromTimestamp: Scalars['DateTime'];
  toTimestamp: Scalars['DateTime'];
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
  inputs?: Maybe<FrequentServiceInfoInputType>;
};


export type HeadwayMetricsTypeFrequentServicesArgs = {
  fromTimestamp: Scalars['DateTime'];
  operatorId: Scalars['String'];
  toTimestamp: Scalars['DateTime'];
};


export type HeadwayMetricsTypeHeadwayDayOfWeekArgs = {
  lineId: Scalars['String'];
};


export type HeadwayMetricsTypeHeadwayOverviewArgs = {
  inputs: HeadwayInputType;
};


export type HeadwayMetricsTypeHeadwayTimeOfDayArgs = {
  lineId: Scalars['String'];
};


export type HeadwayMetricsTypeHeadwayTimeSeriesArgs = {
  inputs: HeadwayInputType;
};

export type HeadwayOverviewType = {
  __typename?: 'HeadwayOverviewType';
  actualWaitTime: Scalars['Float'];
  excessWaitTime: Scalars['Float'];
  scheduledWaitTime: Scalars['Float'];
};

export enum HeadwaySortEnum {
  ActualWaitTime = 'ActualWaitTime',
  ExcessWaitTime = 'ExcessWaitTime',
  ScheduledWaitTime = 'ScheduledWaitTime'
}

export type HeadwaySortType = {
  field?: Maybe<HeadwaySortEnum>;
  order?: Maybe<SortOrderEnum>;
};

export type HeadwayTimeOfDayType = {
  __typename?: 'HeadwayTimeOfDayType';
  actualWaitTime?: Maybe<Scalars['Float']>;
  excessWaitTime?: Maybe<Scalars['Float']>;
  scheduledWaitTime?: Maybe<Scalars['Float']>;
  timeOfDay?: Maybe<Scalars['Time']>;
};

export type HeadwayTimeSeriesType = {
  __typename?: 'HeadwayTimeSeriesType';
  actualWaitTime: Scalars['Float'];
  excessWaitTime: Scalars['Float'];
  scheduledWaitTime: Scalars['Float'];
  ts: Scalars['String'];
};

export type HistoricalStatsType = {
  __typename?: 'HistoricalStatsType';
  availability?: Maybe<Scalars['Float']>;
  compliance?: Maybe<Scalars['Float']>;
  updateFrequency?: Maybe<Scalars['Int']>;
  vehicleStats?: Maybe<Array<Maybe<VehicleStatsType>>>;
};

export type InvitationInput = {
  email: Scalars['String'];
  organisation?: Maybe<OrganisationReferenceInput>;
  role: RoleReferenceInput;
};

export type InvitationResponseType = {
  __typename?: 'InvitationResponseType';
  error?: Maybe<Scalars['String']>;
  invitation?: Maybe<InvitationType>;
};

export type InvitationType = {
  __typename?: 'InvitationType';
  accepted: Scalars['Boolean'];
  email: Scalars['String'];
  organisation?: Maybe<OrganisationType>;
  role?: Maybe<RoleType>;
};

export type JourneyScheduledStartTimes = {
  __typename?: 'JourneyScheduledStartTimes';
  days?: Maybe<Array<Maybe<ShortCodeDayOfWeek>>>;
  fromDate?: Maybe<Scalars['DateTime']>;
  startTimes?: Maybe<Array<Maybe<Scalars['Time']>>>;
  toDate?: Maybe<Scalars['DateTime']>;
};

export enum LineDirection {
  All = 'All',
  Inbound = 'Inbound',
  Outbound = 'Outbound'
}

export type LineFilterType = {
  inputDate?: Maybe<Scalars['DateTime']>;
  lineIds?: Maybe<Array<Scalars['String']>>;
};

export type LineType = {
  __typename?: 'LineType';
  lineId: Scalars['String'];
  lineName: Scalars['String'];
  lineNumber: Scalars['String'];
  servicePatterns?: Maybe<Array<Maybe<ServicePatternType>>>;
};

export type LiveStatsType = {
  __typename?: 'LiveStatsType';
  currentVehicles?: Maybe<Scalars['Int']>;
  expectedVehicles?: Maybe<Scalars['Int']>;
  feedAlerts?: Maybe<Scalars['Int']>;
  feedErrors?: Maybe<Scalars['Int']>;
  last20Minutes?: Maybe<Array<Maybe<VehicleStatsType>>>;
  last24Hours?: Maybe<Array<Maybe<VehicleStatsType>>>;
  updateFrequency?: Maybe<Scalars['Int']>;
};

export type LocalityType = {
  __typename?: 'LocalityType';
  localityAreaId?: Maybe<Scalars['String']>;
  localityAreaName?: Maybe<Scalars['String']>;
  localityId?: Maybe<Scalars['String']>;
  localityName?: Maybe<Scalars['String']>;
};

export type LoginResponse = {
  __typename?: 'LoginResponse';
  expiresAt?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
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
  logout: Scalars['Boolean'];
  requestResetPassword: MutationResponseType;
  resetPassword: MutationResponseType;
  signUp: MutationResponseType;
  updateCorridor: MutationResponseType;
  updateUser: UserUpdateResponseType;
  updateUserAlert: MutationResponseType;
  verifyResetPasswordToken: Scalars['Boolean'];
};


export type MutationAddUserAlertArgs = {
  payload: AlertInputType;
};


export type MutationCreateCorridorArgs = {
  payload?: Maybe<CorridorInputType>;
};


export type MutationDeleteCorridorArgs = {
  corridorId?: Maybe<Scalars['Int']>;
};


export type MutationDeleteUserArgs = {
  username: Scalars['String'];
};


export type MutationDeleteUserAlertArgs = {
  alertId: Scalars['String'];
};


export type MutationInviteUserArgs = {
  payload: InvitationInput;
};


export type MutationLoginArgs = {
  password: Scalars['String'];
  username: Scalars['String'];
};


export type MutationRequestResetPasswordArgs = {
  email: Scalars['String'];
};


export type MutationResetPasswordArgs = {
  confirmPassword: Scalars['String'];
  password: Scalars['String'];
  token: Scalars['String'];
  uid: Scalars['String'];
};


export type MutationSignUpArgs = {
  payload: SignupPayloadType;
};


export type MutationUpdateCorridorArgs = {
  inputs?: Maybe<CorridorUpdateInputType>;
};


export type MutationUpdateUserArgs = {
  payload?: Maybe<UserUpdateInput>;
  username: Scalars['String'];
};


export type MutationUpdateUserAlertArgs = {
  alertId: Scalars['String'];
  payload: AlertInputType;
};


export type MutationVerifyResetPasswordTokenArgs = {
  token: Scalars['String'];
  uid: Scalars['String'];
};

export type MutationResponseType = {
  __typename?: 'MutationResponseType';
  error?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
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
  operatorIds?: Maybe<Array<Scalars['String']>>;
};

export type OperatorInfoType = {
  __typename?: 'OperatorInfoType';
  nocCode?: Maybe<Scalars['String']>;
  operatorId?: Maybe<Scalars['String']>;
  operatorName?: Maybe<Scalars['String']>;
};

export type OperatorPerformancePage = {
  __typename?: 'OperatorPerformancePage';
  items?: Maybe<Array<OperatorPerformanceType>>;
  pageInfo?: Maybe<PageInfo>;
};

export type OperatorPerformanceType = {
  __typename?: 'OperatorPerformanceType';
  actualDepartures?: Maybe<Scalars['Int']>;
  averageDelay?: Maybe<Scalars['Float']>;
  early: Scalars['Int'];
  late: Scalars['Int'];
  name?: Maybe<Scalars['String']>;
  nocCode?: Maybe<Scalars['String']>;
  onTime: Scalars['Int'];
  operatorId?: Maybe<Scalars['String']>;
  scheduledDepartures?: Maybe<Scalars['Int']>;
};

export type OperatorsPage = {
  __typename?: 'OperatorsPage';
  items?: Maybe<Array<Maybe<OperatorType>>>;
  pageInfo?: Maybe<PageInfo>;
};

export type OperatorType = {
  __typename?: 'OperatorType';
  adminAreas?: Maybe<Array<Maybe<AdminAreaInfoType>>>;
  feedMonitoring?: Maybe<FeedMonitoringType>;
  name?: Maybe<Scalars['String']>;
  nocCode?: Maybe<Scalars['String']>;
  operatorId?: Maybe<Scalars['String']>;
  transitModel?: Maybe<TransitModelType>;
};

export type OrganisationReferenceInput = {
  id: Scalars['String'];
};

export type OrganisationType = {
  __typename?: 'OrganisationType';
  id: Scalars['String'];
  name: Scalars['String'];
};

export enum OtpEnum {
  Early = 'Early',
  Late = 'Late',
  OnTime = 'OnTime'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  next?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type PaginatedLineType = {
  __typename?: 'PaginatedLineType';
  items?: Maybe<Array<Maybe<LineType>>>;
};

export type PagingInputType = {
  after?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
};

export type PerformanceFiltersInputType = {
  addNonTagged?: Maybe<Scalars['Boolean']>;
  adminAreaIds?: Maybe<Array<Scalars['String']>>;
  dayOfWeekFlags?: Maybe<DayOfWeekFlagsInputType>;
  endTime?: Maybe<Scalars['String']>;
  excludedDates?: Maybe<Array<Maybe<Scalars['Date']>>>;
  excludeItoLineId?: Maybe<Scalars['String']>;
  granularity?: Maybe<Granularity>;
  lineDirection?: Maybe<LineDirection>;
  lineIds?: Maybe<Array<Scalars['String']>>;
  maxDelay?: Maybe<Scalars['Int']>;
  minDelay?: Maybe<Scalars['Int']>;
  nocCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  onTimeMaxMinutes?: Maybe<Scalars['Int']>;
  onTimeMinMinutes?: Maybe<Scalars['Int']>;
  operatorIds?: Maybe<Array<Scalars['String']>>;
  startTime?: Maybe<Scalars['String']>;
  startTimes?: Maybe<Array<Maybe<Scalars['Time']>>>;
  stopsSegment?: Maybe<StopsSegment>;
  tagIds?: Maybe<Array<Maybe<Scalars['Int']>>>;
  timingPointsOnly?: Maybe<Scalars['Boolean']>;
};

export type PerformanceInputType = {
  filters?: Maybe<PerformanceFiltersInputType>;
  fromTimestamp: Scalars['DateTime'];
  paging?: Maybe<PagingInputType>;
  toTimestamp: Scalars['DateTime'];
};

export type PunctualityDayOfWeekType = {
  __typename?: 'PunctualityDayOfWeekType';
  dayOfWeek: Scalars['Int'];
  early: Scalars['Int'];
  late: Scalars['Int'];
  onTime: Scalars['Int'];
};

export enum PunctualitySortEnum {
  Early = 'Early',
  Late = 'Late',
  OnTime = 'OnTime'
}

export type PunctualitySortType = {
  field?: Maybe<PunctualitySortEnum>;
  order?: Maybe<SortOrderEnum>;
};

export type PunctualityTimeOfDayType = {
  __typename?: 'PunctualityTimeOfDayType';
  early: Scalars['Int'];
  late: Scalars['Int'];
  onTime: Scalars['Int'];
  timeOfDay: Scalars['String'];
};

export type PunctualityTimeSeriesType = {
  __typename?: 'PunctualityTimeSeriesType';
  early: Scalars['Int'];
  late: Scalars['Int'];
  onTime: Scalars['Int'];
  ts: Scalars['String'];
};

export type PunctualityTotalsType = {
  __typename?: 'PunctualityTotalsType';
  averageDeviation?: Maybe<Scalars['Float']>;
  completed: Scalars['Int'];
  early: Scalars['Int'];
  late: Scalars['Int'];
  onTime: Scalars['Int'];
  scheduled: Scalars['Int'];
};

export type Query = {
  __typename?: 'Query';
  adminAreas?: Maybe<Array<Maybe<AdminAreasType>>>;
  apiInfo?: Maybe<ApiInfoType>;
  avlLineLevelStatus: Array<AvlLineLevelStatus>;
  avls: Array<AvlPoint>;
  corridor?: Maybe<CorridorNamespace>;
  events?: Maybe<EventResponse>;
  eventStats?: Maybe<Array<Maybe<EventStatsType>>>;
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
  adminAreaIds?: Maybe<Array<Scalars['String']>>;
};


export type QueryAvlLineLevelStatusArgs = {
  filters?: Maybe<AvlFiltersInput>;
};


export type QueryAvlsArgs = {
  groupId: Scalars['String'];
};


export type QueryEventsArgs = {
  end: Scalars['DateTime'];
  operatorId: Scalars['String'];
  start: Scalars['DateTime'];
};


export type QueryEventStatsArgs = {
  end: Scalars['Date'];
  operatorId: Scalars['String'];
  start: Scalars['Date'];
};


export type QueryInvitationArgs = {
  key: Scalars['String'];
};


export type QueryOperatorArgs = {
  operatorId: Scalars['String'];
};


export type QueryOperatorsArgs = {
  filterBy?: Maybe<OperatorFilterInput>;
};


export type QueryRouteArgs = {
  groupId: Scalars['String'];
};


export type QueryServiceInfoArgs = {
  serviceId: Scalars['String'];
};


export type QueryUserArgs = {
  id?: Maybe<Scalars['String']>;
};


export type QueryUserAlertArgs = {
  alertId: Scalars['String'];
};

export enum RankingOrder {
  Ascending = 'ascending',
  Descending = 'descending'
}

export type RoleReferenceInput = {
  id: Scalars['String'];
};

export type RoleType = {
  __typename?: 'RoleType';
  id: Scalars['String'];
  name: Scalars['String'];
  scope: Scalars['String'];
};

export enum ScopeEnum {
  Organisation = 'organisation',
  System = 'system'
}

export type ServiceInfoType = {
  __typename?: 'ServiceInfoType';
  serviceId: Scalars['String'];
  serviceName: Scalars['String'];
  serviceNumber: Scalars['String'];
};

export type ServiceLinkType = {
  __typename?: 'ServiceLinkType';
  distance: Scalars['Int'];
  fromStop?: Maybe<Scalars['String']>;
  linkRoute?: Maybe<Scalars['String']>;
  routeValidity?: Maybe<Scalars['String']>;
  toStop?: Maybe<Scalars['String']>;
};

export type ServicePatternType = {
  __typename?: 'ServicePatternType';
  name: Scalars['String'];
  serviceLinks?: Maybe<Array<ServiceLinkType>>;
  servicePatternId: Scalars['String'];
  stops?: Maybe<Array<StopType>>;
};

export type ServicePerformanceFiltersInputType = {
  operatorIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  timingPointsOnly?: Maybe<Scalars['Boolean']>;
};

export type ServicePerformanceInputType = {
  filters?: Maybe<ServicePerformanceFiltersInputType>;
  fromTimestamp?: Maybe<Scalars['DateTime']>;
  order?: Maybe<RankingOrder>;
  toTimestamp?: Maybe<Scalars['DateTime']>;
};

export type ServicePerformanceType = {
  __typename?: 'ServicePerformanceType';
  actualDepartures: Scalars['Int'];
  averageDelay: Scalars['Float'];
  early: Scalars['Int'];
  late: Scalars['Int'];
  lineId?: Maybe<Scalars['String']>;
  lineInfo: ServiceInfoType;
  onTime: Scalars['Int'];
  operatorInfo?: Maybe<OperatorInfoType>;
  scheduledDepartures: Scalars['Int'];
};

export type ServicePunctualityType = {
  __typename?: 'ServicePunctualityType';
  early?: Maybe<Scalars['Int']>;
  late?: Maybe<Scalars['Int']>;
  lineId?: Maybe<Scalars['String']>;
  lineInfo?: Maybe<ServiceInfoType>;
  nocCode?: Maybe<Scalars['String']>;
  onTime?: Maybe<Scalars['Int']>;
  operatorId?: Maybe<Scalars['String']>;
  rank?: Maybe<Scalars['Float']>;
  trend?: Maybe<ServicePunctualityType>;
};


export type ServicePunctualityTypeTrendArgs = {
  fromTimestamp: Scalars['DateTime'];
  toTimestamp: Scalars['DateTime'];
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
  firstName: Scalars['String'];
  key: Scalars['String'];
  lastName: Scalars['String'];
  password: Scalars['String'];
};

export enum SortOrderEnum {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Stop = {
  __typename?: 'Stop';
  actualDepartureUtc?: Maybe<Scalars['String']>;
  isTimingPoint: Scalars['Boolean'];
  latitude: Scalars['Float'];
  lineName: Scalars['String'];
  longitude: Scalars['Float'];
  operatorName: Scalars['String'];
  operatorNoc: Scalars['String'];
  otp?: Maybe<OtpEnum>;
  scheduledDepartureUtc: Scalars['String'];
  serviceId: Scalars['String'];
  serviceName: Scalars['String'];
  startTime: Scalars['String'];
  stopId: Scalars['Int'];
  stopIndex: Scalars['Int'];
  stopName: Scalars['String'];
};

export type StopInfoType = {
  __typename?: 'StopInfoType';
  sourceId?: Maybe<Scalars['String']>;
  stopId: Scalars['String'];
  stopLocality: LocalityType;
  stopLocation: GpsPointType;
  stopName: Scalars['String'];
};

export type StopPerformanceType = {
  __typename?: 'StopPerformanceType';
  actualDepartures: Scalars['Int'];
  averageDelay: Scalars['Float'];
  early: Scalars['Int'];
  late: Scalars['Int'];
  lineId?: Maybe<Scalars['String']>;
  onTime: Scalars['Int'];
  scheduledDepartures: Scalars['Int'];
  stopId: Scalars['String'];
  stopIndex?: Maybe<Scalars['Int']>;
  stopInfo: StopInfoType;
  timingPoint?: Maybe<Scalars['Boolean']>;
};

export enum StopsSegment {
  First = 'First',
  Intermediate = 'Intermediate'
}

export type StopType = {
  __typename?: 'StopType';
  adminAreaId?: Maybe<Scalars['String']>;
  adminAreaName?: Maybe<Scalars['String']>;
  lat: Scalars['Float'];
  localityId?: Maybe<Scalars['String']>;
  localityName?: Maybe<Scalars['String']>;
  lon: Scalars['Float'];
  sourceId?: Maybe<Scalars['String']>;
  stopId: Scalars['String'];
  stopName: Scalars['String'];
};


export type TransitModelType = {
  __typename?: 'TransitModelType';
  lines?: Maybe<PaginatedLineType>;
};


export type TransitModelTypeLinesArgs = {
  filterBy?: Maybe<LineFilterType>;
};

export type UniqueJourneyType = {
  __typename?: 'UniqueJourneyType';
  serviceInfo: ServiceInfoType;
  startTime: Scalars['String'];
  vehicleJourneyId?: Maybe<Scalars['String']>;
};

export type UserType = {
  __typename?: 'UserType';
  email: Scalars['String'];
  firstName?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  lastName?: Maybe<Scalars['String']>;
  organisation?: Maybe<OrganisationType>;
  roles?: Maybe<Array<RoleType>>;
  username: Scalars['String'];
};

export type UserUpdateInput = {
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  role?: Maybe<RoleReferenceInput>;
};

export type UserUpdateResponseType = {
  __typename?: 'UserUpdateResponseType';
  error?: Maybe<Scalars['String']>;
  user?: Maybe<UserType>;
};

export type VehicleReplayFilterInputType = {
  filterOnStartTime?: Maybe<Scalars['Boolean']>;
  lineIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  stopIds?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type VehicleReplayInputType = {
  filters?: Maybe<VehicleReplayFilterInputType>;
  fromTimestamp: Scalars['DateTime'];
  toTimestamp: Scalars['DateTime'];
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
  actual?: Maybe<Scalars['Int']>;
  expected?: Maybe<Scalars['Int']>;
  timestamp?: Maybe<Scalars['DateTime']>;
};

export type LoginMutationVariables = Exact<{
  username: Scalars['String'];
  password: Scalars['String'];
}>;


export type LoginMutation = (
  { __typename?: 'Mutation' }
  & { login?: Maybe<(
    { __typename?: 'LoginResponse' }
    & Pick<LoginResponse, 'success' | 'expiresAt'>
  )> }
);

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'logout'>
);

export type UserQueryVariables = Exact<{ [key: string]: never; }>;


export type UserQuery = (
  { __typename?: 'Query' }
  & { user?: Maybe<(
    { __typename?: 'UserType' }
    & UserFragment
  )> }
);

export type CorridorsStopSearchQueryVariables = Exact<{
  inputs?: Maybe<AddFirstStopInputType>;
}>;


export type CorridorsStopSearchQuery = (
  { __typename?: 'Query' }
  & { corridor?: Maybe<(
    { __typename?: 'CorridorNamespace' }
    & { addFirstStop?: Maybe<Array<Maybe<(
      { __typename?: 'StopType' }
      & Pick<StopType, 'stopId' | 'stopName' | 'lat' | 'lon' | 'localityName' | 'adminAreaId' | 'sourceId'>
    )>>> }
  )> }
);

export type CorridorsSubsequentStopsQueryVariables = Exact<{
  stopList: Array<Scalars['String']>;
}>;


export type CorridorsSubsequentStopsQuery = (
  { __typename?: 'Query' }
  & { corridor?: Maybe<(
    { __typename?: 'CorridorNamespace' }
    & { addSubsequentStops?: Maybe<Array<Maybe<(
      { __typename?: 'StopType' }
      & Pick<StopType, 'stopId' | 'stopName' | 'lon' | 'lat' | 'localityName' | 'adminAreaId' | 'sourceId'>
    )>>> }
  )> }
);

export type CorridorsListQueryVariables = Exact<{ [key: string]: never; }>;


export type CorridorsListQuery = (
  { __typename?: 'Query' }
  & { corridor?: Maybe<(
    { __typename?: 'CorridorNamespace' }
    & { corridorList?: Maybe<Array<Maybe<(
      { __typename?: 'CorridorType' }
      & Pick<CorridorType, 'id' | 'name'>
      & { stops?: Maybe<Array<Maybe<(
        { __typename?: 'StopInfoType' }
        & Pick<StopInfoType, 'stopId'>
      )>>> }
    )>>> }
  )> }
);

export type GetCorridorQueryVariables = Exact<{
  corridorId: Scalars['Int'];
}>;


export type GetCorridorQuery = (
  { __typename?: 'Query' }
  & { corridor?: Maybe<(
    { __typename?: 'CorridorNamespace' }
    & { getCorridor?: Maybe<(
      { __typename?: 'CorridorType' }
      & Pick<CorridorType, 'id' | 'name'>
      & { stops?: Maybe<Array<Maybe<(
        { __typename?: 'StopInfoType' }
        & Pick<StopInfoType, 'stopId' | 'sourceId' | 'stopName'>
        & { stopLocation: (
          { __typename?: 'GpsPointType' }
          & Pick<GpsPointType, 'latitude' | 'longitude'>
        ), stopLocality: (
          { __typename?: 'LocalityType' }
          & Pick<LocalityType, 'localityId' | 'localityName' | 'localityAreaId' | 'localityAreaName'>
        ) }
      )>>> }
    )> }
  )> }
);

export type CorridorStatsQueryVariables = Exact<{
  params: CorridorStatsInputType;
}>;


export type CorridorStatsQuery = (
  { __typename?: 'Query' }
  & { corridor?: Maybe<(
    { __typename?: 'CorridorNamespace' }
    & { stats?: Maybe<(
      { __typename?: 'CorridorStatsType' }
      & { summaryStats?: Maybe<(
        { __typename?: 'CorridorSummaryStatsType' }
        & Pick<CorridorSummaryStatsType, 'totalTransits' | 'numberOfServices' | 'averageJourneyTime' | 'scheduledTransits'>
      )>, journeyTimeStats?: Maybe<Array<Maybe<(
        { __typename?: 'CorridorJourneyTimeStatsType' }
        & Pick<CorridorJourneyTimeStatsType, 'ts' | 'minTransitTime' | 'maxTransitTime' | 'avgTransitTime' | 'percentile25' | 'percentile75'>
      )>>>, journeyTimeTimeOfDayStats?: Maybe<Array<Maybe<(
        { __typename?: 'CorridorStatsTimeOfDayType' }
        & Pick<CorridorStatsTimeOfDayType, 'hour' | 'minTransitTime' | 'maxTransitTime' | 'avgTransitTime' | 'percentile25' | 'percentile75'>
      )>>>, journeyTimeDayOfWeekStats?: Maybe<Array<Maybe<(
        { __typename?: 'CorridorStatsDayOfWeekType' }
        & Pick<CorridorStatsDayOfWeekType, 'dow' | 'minTransitTime' | 'maxTransitTime' | 'avgTransitTime' | 'percentile25' | 'percentile75'>
      )>>>, journeyTimePerServiceStats?: Maybe<Array<Maybe<(
        { __typename?: 'CorridorStatsPerServiceType' }
        & Pick<CorridorStatsPerServiceType, 'lineName' | 'servicePatternName' | 'noc' | 'operatorName' | 'totalJourneyTime' | 'recordedTransits' | 'scheduledTransits'>
      )>>>, journeyTimeHistogram?: Maybe<Array<Maybe<(
        { __typename?: 'CorridorStatsHistogramType' }
        & Pick<CorridorStatsHistogramType, 'ts'>
        & { hist?: Maybe<Array<Maybe<(
          { __typename?: 'CorridorHistogramType' }
          & Pick<CorridorHistogramType, 'bin' | 'freq'>
        )>>> }
      )>>>, serviceLinks?: Maybe<Array<Maybe<(
        { __typename?: 'ServiceLinkType' }
        & Pick<ServiceLinkType, 'fromStop' | 'toStop' | 'distance' | 'routeValidity' | 'linkRoute'>
      )>>> }
    )> }
  )> }
);

export type CreateCorridorMutationVariables = Exact<{
  name: Scalars['String'];
  stopIds: Array<Maybe<Scalars['String']>>;
}>;


export type CreateCorridorMutation = (
  { __typename?: 'Mutation' }
  & { createCorridor: (
    { __typename?: 'MutationResponseType' }
    & Pick<MutationResponseType, 'success' | 'error'>
  ) }
);

export type DeleteCorridorMutationVariables = Exact<{
  corridorId: Scalars['Int'];
}>;


export type DeleteCorridorMutation = (
  { __typename?: 'Mutation' }
  & { deleteCorridor: (
    { __typename?: 'MutationResponseType' }
    & Pick<MutationResponseType, 'success' | 'error'>
  ) }
);

export type UpdateCorridorMutationVariables = Exact<{
  inputs: CorridorUpdateInputType;
}>;


export type UpdateCorridorMutation = (
  { __typename?: 'Mutation' }
  & { updateCorridor: (
    { __typename?: 'MutationResponseType' }
    & Pick<MutationResponseType, 'error' | 'success'>
  ) }
);

export type OperatorDashboardFragment = (
  { __typename?: 'OperatorType' }
  & Pick<OperatorType, 'name' | 'nocCode' | 'operatorId'>
  & { feedMonitoring?: Maybe<(
    { __typename?: 'FeedMonitoringType' }
    & Pick<FeedMonitoringType, 'feedStatus'>
    & { liveStats?: Maybe<(
      { __typename?: 'LiveStatsType' }
      & Pick<LiveStatsType, 'feedErrors' | 'feedAlerts'>
    )> }
  )> }
);

export type OperatorDashboardVehicleCountsFragment = (
  { __typename?: 'OperatorType' }
  & Pick<OperatorType, 'nocCode' | 'operatorId'>
  & { feedMonitoring?: Maybe<(
    { __typename?: 'FeedMonitoringType' }
    & { liveStats?: Maybe<(
      { __typename?: 'LiveStatsType' }
      & Pick<LiveStatsType, 'currentVehicles' | 'expectedVehicles'>
    )> }
  )> }
);

export type DashboardOperatorListQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardOperatorListQuery = (
  { __typename?: 'Query' }
  & { operators?: Maybe<(
    { __typename?: 'OperatorsPage' }
    & { items?: Maybe<Array<Maybe<(
      { __typename?: 'OperatorType' }
      & OperatorDashboardFragment
    )>>> }
  )> }
);

export type DashboardOperatorVehicleCountsListQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardOperatorVehicleCountsListQuery = (
  { __typename?: 'Query' }
  & { operators?: Maybe<(
    { __typename?: 'OperatorsPage' }
    & { items?: Maybe<Array<Maybe<(
      { __typename?: 'OperatorType' }
      & OperatorDashboardVehicleCountsFragment
    )>>> }
  )> }
);

export type DashboardPerformanceStatsQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type DashboardPerformanceStatsQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance?: Maybe<(
    { __typename?: 'OnTimePerformanceType' }
    & { punctualityOverview?: Maybe<(
      { __typename?: 'PunctualityTotalsType' }
      & Pick<PunctualityTotalsType, 'onTime' | 'late' | 'early'>
    )> }
  )> }
);

export type DashboardServiceRankingQueryVariables = Exact<{
  params: ServicePerformanceInputType;
  trendFrom: Scalars['DateTime'];
  trendTo: Scalars['DateTime'];
}>;


export type DashboardServiceRankingQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance?: Maybe<(
    { __typename?: 'OnTimePerformanceType' }
    & { servicePunctuality?: Maybe<Array<Maybe<(
      { __typename?: 'ServicePunctualityType' }
      & Pick<ServicePunctualityType, 'nocCode' | 'lineId' | 'onTime' | 'early' | 'late'>
      & { lineInfo?: Maybe<(
        { __typename?: 'ServiceInfoType' }
        & Pick<ServiceInfoType, 'serviceId' | 'serviceName' | 'serviceNumber'>
      )>, trend?: Maybe<(
        { __typename?: 'ServicePunctualityType' }
        & Pick<ServicePunctualityType, 'onTime' | 'early' | 'late'>
      )> }
    )>>> }
  )> }
);

export type EventFragment = (
  { __typename?: 'EventType' }
  & Pick<EventType, 'timestamp' | 'type'>
  & { data: (
    { __typename?: 'EventData' }
    & Pick<EventData, 'message'>
  ) }
);

export type EventsQueryVariables = Exact<{
  operatorId: Scalars['String'];
  start: Scalars['DateTime'];
  end: Scalars['DateTime'];
}>;


export type EventsQuery = (
  { __typename?: 'Query' }
  & { events?: Maybe<(
    { __typename?: 'EventResponse' }
    & { items?: Maybe<Array<(
      { __typename?: 'EventType' }
      & EventFragment
    )>> }
  )> }
);

export type EventStatsQueryVariables = Exact<{
  operatorId: Scalars['String'];
  start: Scalars['Date'];
  end: Scalars['Date'];
}>;


export type EventStatsQuery = (
  { __typename?: 'Query' }
  & { eventStats?: Maybe<Array<Maybe<(
    { __typename?: 'EventStatsType' }
    & Pick<EventStatsType, 'count' | 'day'>
  )>>> }
);

export type VehicleStatFragment = (
  { __typename?: 'VehicleStatsType' }
  & Pick<VehicleStatsType, 'actual' | 'expected' | 'timestamp'>
);

export type BasicOperatorFragment = (
  { __typename?: 'OperatorType' }
  & Pick<OperatorType, 'name' | 'nocCode' | 'operatorId'>
  & { feedMonitoring?: Maybe<(
    { __typename?: 'FeedMonitoringType' }
    & Pick<FeedMonitoringType, 'feedStatus' | 'availability' | 'lastOutage' | 'unavailableSince'>
    & { liveStats?: Maybe<(
      { __typename?: 'LiveStatsType' }
      & Pick<LiveStatsType, 'updateFrequency'>
    )> }
  )> }
);

export type OperatorLiveStatusFragment = (
  { __typename?: 'OperatorType' }
  & Pick<OperatorType, 'name' | 'nocCode' | 'operatorId'>
  & { feedMonitoring?: Maybe<(
    { __typename?: 'FeedMonitoringType' }
    & Pick<FeedMonitoringType, 'feedStatus' | 'availability' | 'lastOutage' | 'unavailableSince'>
    & { liveStats?: Maybe<(
      { __typename?: 'LiveStatsType' }
      & Pick<LiveStatsType, 'updateFrequency' | 'currentVehicles' | 'expectedVehicles'>
      & { last24Hours?: Maybe<Array<Maybe<(
        { __typename?: 'VehicleStatsType' }
        & VehicleStatFragment
      )>>>, last20Minutes?: Maybe<Array<Maybe<(
        { __typename?: 'VehicleStatsType' }
        & VehicleStatFragment
      )>>> }
    )> }
  )> }
);

export type OperatorFeedHistoryFragment = (
  { __typename?: 'OperatorType' }
  & Pick<OperatorType, 'name' | 'nocCode' | 'operatorId'>
  & { feedMonitoring?: Maybe<(
    { __typename?: 'FeedMonitoringType' }
    & { historicalStats?: Maybe<(
      { __typename?: 'HistoricalStatsType' }
      & Pick<HistoricalStatsType, 'updateFrequency' | 'availability'>
    )>, vehicleStats?: Maybe<Array<Maybe<(
      { __typename?: 'VehicleStatsType' }
      & VehicleStatFragment
    )>>> }
  )> }
);

export type FeedMonitoringListQueryVariables = Exact<{ [key: string]: never; }>;


export type FeedMonitoringListQuery = (
  { __typename?: 'Query' }
  & { operators?: Maybe<(
    { __typename?: 'OperatorsPage' }
    & { items?: Maybe<Array<Maybe<(
      { __typename?: 'OperatorType' }
      & BasicOperatorFragment
    )>>> }
  )> }
);

export type OperatorSparklineStatsQueryVariables = Exact<{
  operatorIds?: Maybe<Array<Scalars['String']>>;
}>;


export type OperatorSparklineStatsQuery = (
  { __typename?: 'Query' }
  & { operators?: Maybe<(
    { __typename?: 'OperatorsPage' }
    & { items?: Maybe<Array<Maybe<(
      { __typename?: 'OperatorType' }
      & Pick<OperatorType, 'nocCode' | 'operatorId'>
      & { feedMonitoring?: Maybe<(
        { __typename?: 'FeedMonitoringType' }
        & { liveStats?: Maybe<(
          { __typename?: 'LiveStatsType' }
          & { last24Hours?: Maybe<Array<Maybe<(
            { __typename?: 'VehicleStatsType' }
            & VehicleStatFragment
          )>>> }
        )> }
      )> }
    )>>> }
  )> }
);

export type OperatorLiveStatusQueryVariables = Exact<{
  operatorId: Scalars['String'];
}>;


export type OperatorLiveStatusQuery = (
  { __typename?: 'Query' }
  & { operator?: Maybe<(
    { __typename?: 'OperatorType' }
    & OperatorLiveStatusFragment
  )> }
);

export type OperatorHistoricStatsQueryVariables = Exact<{
  operatorId: Scalars['String'];
  date: Scalars['Date'];
  start: Scalars['DateTime'];
  end: Scalars['DateTime'];
}>;


export type OperatorHistoricStatsQuery = (
  { __typename?: 'Query' }
  & { operator?: Maybe<(
    { __typename?: 'OperatorType' }
    & OperatorFeedHistoryFragment
  )> }
);

export type GetAdminAreasQueryVariables = Exact<{
  adminAreaIds?: Maybe<Array<Scalars['String']>>;
}>;


export type GetAdminAreasQuery = (
  { __typename?: 'Query' }
  & { adminAreas?: Maybe<Array<Maybe<(
    { __typename?: 'AdminAreasType' }
    & Pick<AdminAreasType, 'shape'>
    & { id: AdminAreasType['adminAreaId'], name: AdminAreasType['adminAreaName'] }
  )>>> }
);

export type HeadwayTimeSeriesQueryVariables = Exact<{
  params: HeadwayInputType;
}>;


export type HeadwayTimeSeriesQuery = (
  { __typename?: 'Query' }
  & { headwayMetrics?: Maybe<(
    { __typename?: 'HeadwayMetricsType' }
    & { headwayTimeSeries?: Maybe<Array<Maybe<(
      { __typename?: 'HeadwayTimeSeriesType' }
      & Pick<HeadwayTimeSeriesType, 'ts'>
      & { actual: HeadwayTimeSeriesType['actualWaitTime'], scheduled: HeadwayTimeSeriesType['scheduledWaitTime'], excess: HeadwayTimeSeriesType['excessWaitTime'] }
    )>>> }
  )> }
);

export type HeadwayOverviewQueryVariables = Exact<{
  params: HeadwayInputType;
}>;


export type HeadwayOverviewQuery = (
  { __typename?: 'Query' }
  & { headwayMetrics?: Maybe<(
    { __typename?: 'HeadwayMetricsType' }
    & { headwayOverview?: Maybe<(
      { __typename?: 'HeadwayOverviewType' }
      & { actual: HeadwayOverviewType['actualWaitTime'], scheduled: HeadwayOverviewType['scheduledWaitTime'], excess: HeadwayOverviewType['excessWaitTime'] }
    )> }
  )> }
);

export type HeadwayFrequentServicesQueryVariables = Exact<{
  operatorId: Scalars['String'];
  fromTimestamp: Scalars['DateTime'];
  toTimestamp: Scalars['DateTime'];
}>;


export type HeadwayFrequentServicesQuery = (
  { __typename?: 'Query' }
  & { headwayMetrics?: Maybe<(
    { __typename?: 'HeadwayMetricsType' }
    & { frequentServices?: Maybe<Array<Maybe<(
      { __typename?: 'FrequentServiceType' }
      & Pick<FrequentServiceType, 'serviceId'>
    )>>> }
  )> }
);

export type HeadwayFrequentServiceInfoQueryVariables = Exact<{
  inputs?: Maybe<FrequentServiceInfoInputType>;
}>;


export type HeadwayFrequentServiceInfoQuery = (
  { __typename?: 'Query' }
  & { headwayMetrics?: Maybe<(
    { __typename?: 'HeadwayMetricsType' }
    & { frequentServiceInfo?: Maybe<(
      { __typename?: 'FrequentServiceInfoType' }
      & Pick<FrequentServiceInfoType, 'numHours' | 'totalHours'>
    )> }
  )> }
);

export type OnTimeDelayFrequencyQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeDelayFrequencyQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance?: Maybe<(
    { __typename?: 'OnTimePerformanceType' }
    & { delayFrequency?: Maybe<Array<(
      { __typename?: 'DelayFrequencyType' }
      & Pick<DelayFrequencyType, 'bucket' | 'frequency'>
    )>> }
  )> }
);

export type OnTimeTimeSeriesQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeTimeSeriesQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance?: Maybe<(
    { __typename?: 'OnTimePerformanceType' }
    & { punctualityTimeSeries?: Maybe<Array<(
      { __typename?: 'PunctualityTimeSeriesType' }
      & Pick<PunctualityTimeSeriesType, 'ts' | 'onTime' | 'early' | 'late'>
    )>> }
  )> }
);

export type OnTimeStatsQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeStatsQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance?: Maybe<(
    { __typename?: 'OnTimePerformanceType' }
    & { punctualityOverview?: Maybe<(
      { __typename?: 'PunctualityTotalsType' }
      & Pick<PunctualityTotalsType, 'early' | 'late' | 'onTime' | 'scheduled' | 'completed' | 'averageDeviation'>
    )> }
  )> }
);

export type OnTimePunctualityTimeOfDayQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimePunctualityTimeOfDayQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance?: Maybe<(
    { __typename?: 'OnTimePerformanceType' }
    & { punctualityTimeOfDay?: Maybe<Array<(
      { __typename?: 'PunctualityTimeOfDayType' }
      & Pick<PunctualityTimeOfDayType, 'timeOfDay' | 'onTime' | 'early' | 'late'>
    )>> }
  )> }
);

export type OnTimePunctualityDayOfWeekQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimePunctualityDayOfWeekQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance?: Maybe<(
    { __typename?: 'OnTimePerformanceType' }
    & { punctualityDayOfWeek?: Maybe<Array<(
      { __typename?: 'PunctualityDayOfWeekType' }
      & Pick<PunctualityDayOfWeekType, 'dayOfWeek' | 'onTime' | 'early' | 'late'>
    )>> }
  )> }
);

export type OnTimeServicePerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeServicePerformanceListQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance?: Maybe<(
    { __typename?: 'OnTimePerformanceType' }
    & { servicePerformance?: Maybe<Array<(
      { __typename?: 'ServicePerformanceType' }
      & Pick<ServicePerformanceType, 'lineId' | 'early' | 'onTime' | 'late' | 'averageDelay' | 'scheduledDepartures' | 'actualDepartures'>
      & { lineInfo: (
        { __typename?: 'ServiceInfoType' }
        & Pick<ServiceInfoType, 'serviceId' | 'serviceName' | 'serviceNumber'>
      ) }
    )>> }
  )> }
);

export type OnTimeStopPerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeStopPerformanceListQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance?: Maybe<(
    { __typename?: 'OnTimePerformanceType' }
    & { stopPerformance?: Maybe<Array<(
      { __typename?: 'StopPerformanceType' }
      & Pick<StopPerformanceType, 'lineId' | 'stopId' | 'early' | 'onTime' | 'late' | 'averageDelay' | 'scheduledDepartures' | 'actualDepartures' | 'timingPoint'>
      & { stopInfo: (
        { __typename?: 'StopInfoType' }
        & Pick<StopInfoType, 'stopId' | 'sourceId' | 'stopName'>
        & { stopLocation: (
          { __typename?: 'GpsPointType' }
          & Pick<GpsPointType, 'latitude' | 'longitude'>
        ), stopLocality: (
          { __typename?: 'LocalityType' }
          & Pick<LocalityType, 'localityId' | 'localityName' | 'localityAreaId' | 'localityAreaName'>
        ) }
      ) }
    )>> }
  )> }
);

export type OnTimeOperatorPerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeOperatorPerformanceListQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance?: Maybe<(
    { __typename?: 'OnTimePerformanceType' }
    & { operatorPerformance?: Maybe<(
      { __typename?: 'OperatorPerformancePage' }
      & { pageInfo?: Maybe<(
        { __typename?: 'PageInfo' }
        & Pick<PageInfo, 'totalCount' | 'next'>
      )>, items?: Maybe<Array<(
        { __typename?: 'OperatorPerformanceType' }
        & Pick<OperatorPerformanceType, 'nocCode' | 'operatorId' | 'name' | 'early' | 'onTime' | 'late'>
      )>> }
    )> }
  )> }
);

export type ServiceInfoQueryVariables = Exact<{
  lineId: Scalars['String'];
}>;


export type ServiceInfoQuery = (
  { __typename?: 'Query' }
  & { serviceInfo?: Maybe<(
    { __typename?: 'ServiceInfoType' }
    & Pick<ServiceInfoType, 'serviceId' | 'serviceNumber' | 'serviceName'>
  )> }
);

export type TransitModelServicePatternStopsQueryVariables = Exact<{
  operatorId: Scalars['String'];
  lineId: Scalars['String'];
}>;


export type TransitModelServicePatternStopsQuery = (
  { __typename?: 'Query' }
  & { operator?: Maybe<(
    { __typename?: 'OperatorType' }
    & { transitModel?: Maybe<(
      { __typename?: 'TransitModelType' }
      & { lines?: Maybe<(
        { __typename?: 'PaginatedLineType' }
        & { items?: Maybe<Array<Maybe<(
          { __typename?: 'LineType' }
          & Pick<LineType, 'lineId' | 'lineName'>
          & { servicePatterns?: Maybe<Array<Maybe<(
            { __typename?: 'ServicePatternType' }
            & Pick<ServicePatternType, 'servicePatternId' | 'name'>
            & { stops?: Maybe<Array<(
              { __typename?: 'StopType' }
              & Pick<StopType, 'stopId' | 'stopName' | 'lon' | 'lat'>
            )>>, serviceLinks?: Maybe<Array<(
              { __typename?: 'ServiceLinkType' }
              & Pick<ServiceLinkType, 'fromStop' | 'toStop' | 'distance' | 'routeValidity' | 'linkRoute'>
            )>> }
          )>>> }
        )>>> }
      )> }
    )> }
  )> }
);

export type UserFragment = (
  { __typename?: 'UserType' }
  & Pick<UserType, 'id' | 'email' | 'username' | 'firstName' | 'lastName'>
  & { organisation?: Maybe<(
    { __typename?: 'OrganisationType' }
    & Pick<OrganisationType, 'id' | 'name'>
  )>, roles?: Maybe<Array<(
    { __typename?: 'RoleType' }
    & RoleFragment
  )>> }
);

export type RoleFragment = (
  { __typename?: 'RoleType' }
  & Pick<RoleType, 'id' | 'name' | 'scope'>
);

export type AlertFragment = (
  { __typename?: 'AlertType' }
  & Pick<AlertType, 'alertId' | 'alertType' | 'eventHysterisis' | 'eventThreshold'>
  & { createdBy?: Maybe<(
    { __typename?: 'UserType' }
    & Pick<UserType, 'firstName' | 'lastName' | 'username'>
  )>, sendTo?: Maybe<(
    { __typename?: 'UserType' }
    & Pick<UserType, 'id' | 'firstName' | 'lastName' | 'username'>
  )> }
);

export type ListUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type ListUsersQuery = (
  { __typename?: 'Query' }
  & { users?: Maybe<Array<(
    { __typename?: 'UserType' }
    & UserFragment
  )>> }
);

export type ListRolesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListRolesQuery = (
  { __typename?: 'Query' }
  & { roles?: Maybe<Array<(
    { __typename?: 'RoleType' }
    & RoleFragment
  )>> }
);

export type ListUserAlertsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListUserAlertsQuery = (
  { __typename?: 'Query' }
  & { userAlerts?: Maybe<Array<(
    { __typename?: 'AlertType' }
    & AlertFragment
  )>> }
);

export type FetchUserAlertQueryVariables = Exact<{
  alertId: Scalars['String'];
}>;


export type FetchUserAlertQuery = (
  { __typename?: 'Query' }
  & { userAlert?: Maybe<(
    { __typename?: 'AlertType' }
    & AlertFragment
  )> }
);

export type EditUserMutationVariables = Exact<{
  username: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  role: Scalars['String'];
}>;


export type EditUserMutation = (
  { __typename?: 'Mutation' }
  & { updateUser: (
    { __typename?: 'UserUpdateResponseType' }
    & Pick<UserUpdateResponseType, 'error'>
    & { user?: Maybe<(
      { __typename?: 'UserType' }
      & UserFragment
    )> }
  ) }
);

export type RemoveUserMutationVariables = Exact<{
  username: Scalars['String'];
}>;


export type RemoveUserMutation = (
  { __typename?: 'Mutation' }
  & { deleteUser: (
    { __typename?: 'MutationResponseType' }
    & Pick<MutationResponseType, 'success' | 'error'>
  ) }
);

export type InviteUserMutationVariables = Exact<{
  email: Scalars['String'];
  organisationId: Scalars['String'];
  roleId: Scalars['String'];
}>;


export type InviteUserMutation = (
  { __typename?: 'Mutation' }
  & { inviteUser: (
    { __typename?: 'InvitationResponseType' }
    & Pick<InvitationResponseType, 'error'>
    & { invitation?: Maybe<(
      { __typename?: 'InvitationType' }
      & Pick<InvitationType, 'email' | 'accepted'>
    )> }
  ) }
);

export type UpdateUserAlertMutationVariables = Exact<{
  alertId: Scalars['String'];
  alertType?: Maybe<AlertTypeEnum>;
  sendToId: Scalars['String'];
  eventHysterisis?: Maybe<Scalars['Int']>;
  eventThreshold?: Maybe<Scalars['Int']>;
}>;


export type UpdateUserAlertMutation = (
  { __typename?: 'Mutation' }
  & { updateUserAlert: (
    { __typename?: 'MutationResponseType' }
    & Pick<MutationResponseType, 'success' | 'error'>
  ) }
);

export type CreateUserAlertMutationVariables = Exact<{
  alertType?: Maybe<AlertTypeEnum>;
  sendToId: Scalars['String'];
  eventHysterisis?: Maybe<Scalars['Int']>;
  eventThreshold?: Maybe<Scalars['Int']>;
}>;


export type CreateUserAlertMutation = (
  { __typename?: 'Mutation' }
  & { addUserAlert: (
    { __typename?: 'MutationResponseType' }
    & Pick<MutationResponseType, 'success' | 'error'>
  ) }
);

export type DeleteUserAlertMutationVariables = Exact<{
  alertId: Scalars['String'];
}>;


export type DeleteUserAlertMutation = (
  { __typename?: 'Mutation' }
  & { deleteUserAlert: (
    { __typename?: 'MutationResponseType' }
    & Pick<MutationResponseType, 'success' | 'error'>
  ) }
);

export type OperatorListQueryVariables = Exact<{ [key: string]: never; }>;


export type OperatorListQuery = (
  { __typename?: 'Query' }
  & { operators?: Maybe<(
    { __typename?: 'OperatorsPage' }
    & { items?: Maybe<Array<Maybe<(
      { __typename?: 'OperatorType' }
      & Pick<OperatorType, 'name' | 'nocCode' | 'operatorId'>
      & { adminAreas?: Maybe<Array<Maybe<(
        { __typename?: 'AdminAreaInfoType' }
        & Pick<AdminAreaInfoType, 'adminAreaId'>
      )>>> }
    )>>> }
  )> }
);

export type OperatorLinesQueryVariables = Exact<{
  operatorId: Scalars['String'];
  inputDate?: Maybe<Scalars['DateTime']>;
}>;


export type OperatorLinesQuery = (
  { __typename?: 'Query' }
  & { operator?: Maybe<(
    { __typename?: 'OperatorType' }
    & { transitModel?: Maybe<(
      { __typename?: 'TransitModelType' }
      & { lines?: Maybe<(
        { __typename?: 'PaginatedLineType' }
        & { items?: Maybe<Array<Maybe<(
          { __typename?: 'LineType' }
          & { id: LineType['lineId'], name: LineType['lineName'], number: LineType['lineNumber'] }
        )>>> }
      )> }
    )> }
  )> }
);

export type RequestResetPasswordMutationVariables = Exact<{
  email: Scalars['String'];
}>;


export type RequestResetPasswordMutation = (
  { __typename?: 'Mutation' }
  & { requestResetPassword: (
    { __typename?: 'MutationResponseType' }
    & Pick<MutationResponseType, 'error' | 'success'>
  ) }
);

export type ResetPasswordMutationVariables = Exact<{
  uid: Scalars['String'];
  token: Scalars['String'];
  password: Scalars['String'];
  confirmPassword: Scalars['String'];
}>;


export type ResetPasswordMutation = (
  { __typename?: 'Mutation' }
  & { resetPassword: (
    { __typename?: 'MutationResponseType' }
    & Pick<MutationResponseType, 'error' | 'success'>
  ) }
);

export type VerifyResetPasswordTokenMutationVariables = Exact<{
  uid: Scalars['String'];
  token: Scalars['String'];
}>;


export type VerifyResetPasswordTokenMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'verifyResetPasswordToken'>
);

export type SignUpMutationVariables = Exact<{
  key: Scalars['String'];
  password: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
}>;


export type SignUpMutation = (
  { __typename?: 'Mutation' }
  & { signUp: (
    { __typename?: 'MutationResponseType' }
    & Pick<MutationResponseType, 'error' | 'success'>
  ) }
);

export type InvitationQueryVariables = Exact<{
  key: Scalars['String'];
}>;


export type InvitationQuery = (
  { __typename?: 'Query' }
  & { invitation?: Maybe<(
    { __typename?: 'InvitationType' }
    & Pick<InvitationType, 'email' | 'accepted'>
  )> }
);

export type AvlsQueryVariables = Exact<{
  groupId: Scalars['String'];
}>;


export type AvlsQuery = (
  { __typename?: 'Query' }
  & { avls: Array<(
    { __typename?: 'AvlPoint' }
    & Pick<AvlPoint, 'recordedAtTimeUtc' | 'latitude' | 'longitude' | 'vehicleRef'>
  )> }
);

export type RouteQueryVariables = Exact<{
  groupId: Scalars['String'];
}>;


export type RouteQuery = (
  { __typename?: 'Query' }
  & { route: Array<(
    { __typename?: 'Stop' }
    & Pick<Stop, 'actualDepartureUtc' | 'scheduledDepartureUtc' | 'latitude' | 'longitude' | 'stopIndex' | 'stopName' | 'stopId' | 'isTimingPoint' | 'operatorName' | 'operatorNoc' | 'lineName' | 'serviceId' | 'serviceName' | 'startTime' | 'otp'>
  )> }
);

export type JourneysQueryVariables = Exact<{
  fromTimestamp: Scalars['DateTime'];
  toTimestamp: Scalars['DateTime'];
  lineId: Scalars['String'];
  filterOnStartTime: Scalars['Boolean'];
}>;


export type JourneysQuery = (
  { __typename?: 'Query' }
  & { vehicleReplay?: Maybe<(
    { __typename?: 'VehicleReplayNamespace' }
    & { findJourneys?: Maybe<Array<Maybe<(
      { __typename?: 'UniqueJourneyType' }
      & Pick<UniqueJourneyType, 'vehicleJourneyId' | 'startTime'>
      & { serviceInfo: (
        { __typename?: 'ServiceInfoType' }
        & Pick<ServiceInfoType, 'serviceName' | 'serviceNumber'>
      ) }
    )>>> }
  )> }
);

export type GetVersionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetVersionQuery = (
  { __typename?: 'Query' }
  & { apiInfo?: Maybe<(
    { __typename?: 'ApiInfoType' }
    & Pick<ApiInfoType, 'version' | 'buildNumber'>
  )> }
);

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
export const OperatorDashboardVehicleCountsFragmentDoc = gql`
    fragment OperatorDashboardVehicleCounts on OperatorType {
  nocCode
  operatorId
  feedMonitoring {
    liveStats {
      currentVehicles
      expectedVehicles
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
    query corridorsStopSearch($inputs: AddFirstStopInputType) {
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
    mutation createCorridor($name: String!, $stopIds: [String]!) {
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
    query dashboardOperatorVehicleCountsList {
  operators {
    items {
      ...OperatorDashboardVehicleCounts
    }
  }
}
    ${OperatorDashboardVehicleCountsFragmentDoc}`;

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
    query eventStats($operatorId: String!, $start: Date!, $end: Date!) {
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
    query operatorSparklineStats($operatorIds: [String!]) {
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
    query getAdminAreas($adminAreaIds: [String!]) {
  adminAreas(adminAreaIds: $adminAreaIds) {
    id: adminAreaId
    name: adminAreaName
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
  export class HeadwayOverviewGQL extends Apollo.Query<HeadwayOverviewQuery, HeadwayOverviewQueryVariables> {
    document = HeadwayOverviewDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const HeadwayFrequentServicesDocument = gql`
    query headwayFrequentServices($operatorId: String!, $fromTimestamp: DateTime!, $toTimestamp: DateTime!) {
  headwayMetrics {
    frequentServices(operatorId: $operatorId, fromTimestamp: $fromTimestamp, toTimestamp: $toTimestamp) {
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
    query headwayFrequentServiceInfo($inputs: FrequentServiceInfoInputType) {
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
  operator(operatorId: $operatorId) {
    transitModel {
      lines(filterBy: {lineIds: [$lineId]}) {
        items {
          lineId
          lineName
          servicePatterns {
            servicePatternId
            name
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
      }
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
  updateUser(username: $username, payload: {firstName: $firstName, lastName: $lastName, role: {id: $role}}) {
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
  inviteUser(payload: {email: $email, organisation: {id: $organisationId}, role: {id: $roleId}}) {
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
    mutation updateUserAlert($alertId: String!, $alertType: AlertTypeEnum, $sendToId: String!, $eventHysterisis: Int, $eventThreshold: Int) {
  updateUserAlert(alertId: $alertId, payload: {alertType: $alertType, sendTo: {id: $sendToId}, eventHysterisis: $eventHysterisis, eventThreshold: $eventThreshold}) {
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
    mutation createUserAlert($alertType: AlertTypeEnum, $sendToId: String!, $eventHysterisis: Int, $eventThreshold: Int) {
  addUserAlert(payload: {alertType: $alertType, sendTo: {id: $sendToId}, eventHysterisis: $eventHysterisis, eventThreshold: $eventThreshold}) {
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
    query operatorLines($operatorId: String!, $inputDate: DateTime) {
  operator(operatorId: $operatorId) {
    transitModel {
      lines(filterBy: {inputDate: $inputDate}) {
        items {
          id: lineId
          name: lineName
          number: lineNumber
        }
      }
    }
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
  resetPassword(uid: $uid, token: $token, password: $password, confirmPassword: $confirmPassword) {
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
  signUp(payload: {key: $key, password: $password, firstName: $firstName, lastName: $lastName}) {
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
export const AvlsDocument = gql`
    query avls($groupId: String!) {
  avls(groupId: $groupId) {
    recordedAtTimeUtc
    latitude
    longitude
    vehicleRef
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class AvlsGQL extends Apollo.Query<AvlsQuery, AvlsQueryVariables> {
    document = AvlsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const RouteDocument = gql`
    query route($groupId: String!) {
  route(groupId: $groupId) {
    actualDepartureUtc
    scheduledDepartureUtc
    latitude
    longitude
    stopIndex
    stopName
    stopId
    isTimingPoint
    operatorName
    operatorNoc
    lineName
    serviceId
    serviceName
    startTime
    otp
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class RouteGQL extends Apollo.Query<RouteQuery, RouteQueryVariables> {
    document = RouteDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const JourneysDocument = gql`
    query journeys($fromTimestamp: DateTime!, $toTimestamp: DateTime!, $lineId: String!, $filterOnStartTime: Boolean!) {
  vehicleReplay {
    findJourneys(inputs: {fromTimestamp: $fromTimestamp, toTimestamp: $toTimestamp, filters: {lineIds: [$lineId], filterOnStartTime: $filterOnStartTime}}) {
      vehicleJourneyId
      startTime
      serviceInfo {
        serviceName
        serviceNumber
      }
    }
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