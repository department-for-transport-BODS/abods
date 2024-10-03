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
  EventData: any;
  Time: any;
};



export type AddFirstStopInputType = {
  adminAreaIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  boundingBox?: Maybe<BoundingBoxInputType>;
  /** Type for add first stop inputs. */
  searchString?: Maybe<Scalars['String']>;
};

export type AdminAreaInfoType = {
  __typename?: 'AdminAreaInfoType';
  adminAreaId: Scalars['String'];
  adminAreaName: Scalars['String'];
};

export type AdminAreasType = {
  __typename?: 'AdminAreasType';
  adminAreaId: Scalars['String'];
  adminAreaName: Scalars['String'];
  shape: Scalars['String'];
};

export type AlertInputType = {
  /** The type of the alert. */
  alertType?: Maybe<AlertTypeEnum>;
  /** How many minutes that an event must perist before alert is sent. */
  eventHysterisis?: Maybe<Scalars['Int']>;
  /** How many events must be generated before an alert is sent. */
  eventThreshold?: Maybe<Scalars['Int']>;
  /** User that the alert will send an email to. */
  sendTo?: Maybe<ObjectReferenceType>;
};

export type AlertType = {
  __typename?: 'AlertType';
  /** The id of the alert. */
  alertId?: Maybe<Scalars['String']>;
  /** The type of the alert. */
  alertType?: Maybe<AlertTypeEnum>;
  /** User that created the alert. */
  createdBy?: Maybe<UserType>;
  /** How many minutes that an event must perist before alert is sent. */
  eventHysterisis?: Maybe<Scalars['Int']>;
  /** How many events must be generated before an alert is sent. */
  eventThreshold?: Maybe<Scalars['Int']>;
  /** User that the alert will send an email to. */
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
  featureFlags: FeatureFlagType;
  timezone: Scalars['String'];
  version: Scalars['String'];
};

export type BoundingBoxInputType = {
  maxLatitude: Scalars['Float'];
  maxLongitude: Scalars['Float'];
  minLatitude: Scalars['Float'];
  /** Type for a bounded area. */
  minLongitude: Scalars['Float'];
};

export enum CorridorGranularity {
  Day = 'day',
  Hour = 'hour',
  Month = 'month'
}

export type CorridorHistogramType = {
  __typename?: 'CorridorHistogramType';
  /** Histogram type. */
  bin?: Maybe<Scalars['Int']>;
  freq?: Maybe<Scalars['Int']>;
};

export type CorridorInputType = {
  /** Input type for corridor creation. */
  name: Scalars['String'];
  stopIds: Array<Maybe<Scalars['String']>>;
};

export type CorridorJourneyTimeStatsType = ICorridorJourneyTimeStats & {
  __typename?: 'CorridorJourneyTimeStatsType';
  avgTransitTime?: Maybe<Scalars['Float']>;
  maxTransitTime: Scalars['Int'];
  minTransitTime: Scalars['Int'];
  percentile25?: Maybe<Scalars['Float']>;
  percentile5?: Maybe<Scalars['Float']>;
  percentile75?: Maybe<Scalars['Float']>;
  percentile95?: Maybe<Scalars['Float']>;
  /** Response for corridor journey time stats. */
  ts: Scalars['DateTime'];
};

export type CorridorNamespace = {
  __typename?: 'CorridorNamespace';
  /** Add first stop in corridor. */
  addFirstStop: Array<Maybe<StopType>>;
  /** Add subsequent stops in corridor. */
  addSubsequentStops: Array<Maybe<StopType>>;
  /** List corridors. */
  corridorList?: Maybe<Array<Maybe<CorridorType>>>;
  /** Get a corridor by id. */
  getCorridor: CorridorType;
  /** Add subsequent stops in corridor. */
  stats?: Maybe<CorridorStatsType>;
};


export type CorridorNamespaceAddFirstStopArgs = {
  inputs?: Maybe<AddFirstStopInputType>;
};


export type CorridorNamespaceAddSubsequentStopsArgs = {
  stopList: Array<Maybe<Scalars['String']>>;
};


export type CorridorNamespaceGetCorridorArgs = {
  corridorId: Scalars['Int'];
};


export type CorridorNamespaceStatsArgs = {
  inputs: CorridorStatsInputType;
};

export type CorridorStatsDayOfWeekType = ICorridorJourneyTimeStats & {
  __typename?: 'CorridorStatsDayOfWeekType';
  avgTransitTime?: Maybe<Scalars['Float']>;
  /** Response for corridor journey time stats grouped by day of week. */
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
  /** Response for corridor journey time histogram stats. */
  ts?: Maybe<Scalars['DateTime']>;
};

export type CorridorStatsInputType = {
  /** Input type for corridor stats queries. */
  corridorId: Scalars['String'];
  fromTimestamp: Scalars['DateTime'];
  granularity?: Maybe<CorridorGranularity>;
  stopList?: Maybe<Array<Maybe<Scalars['String']>>>;
  toTimestamp: Scalars['DateTime'];
};

export type CorridorStatsPerServiceType = {
  __typename?: 'CorridorStatsPerServiceType';
  /** Response for corridor journey time stats grouped by noc code, line and service pattern. */
  lineName: Scalars['String'];
  noc?: Maybe<Scalars['String']>;
  operatorName?: Maybe<Scalars['String']>;
  recordedTransits?: Maybe<Scalars['Int']>;
  scheduledTransits?: Maybe<Scalars['Int']>;
  servicePatternName: Scalars['String'];
  totalJourneyTime?: Maybe<Scalars['Int']>;
};

export type CorridorStatsTimeOfDayType = ICorridorJourneyTimeStats & {
  __typename?: 'CorridorStatsTimeOfDayType';
  avgTransitTime?: Maybe<Scalars['Float']>;
  /** Response for corridor journey time stats grouped by time of day. */
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
  /** Journey time stats grouped by day of week. */
  journeyTimeDayOfWeekStats: Array<Maybe<CorridorStatsDayOfWeekType>>;
  /** Journey time histogram. */
  journeyTimeHistogram: Array<Maybe<CorridorStatsHistogramType>>;
  /** Journey time stats grouped by noc_code, service pattern and line. */
  journeyTimePerServiceStats: Array<Maybe<CorridorStatsPerServiceType>>;
  /**
   * Overview stats for a corridor.
   * This includes min/max/percentiles journey time
   */
  journeyTimeStats: Array<Maybe<CorridorJourneyTimeStatsType>>;
  /** Journey time stats grouped by time of day. */
  journeyTimeTimeOfDayStats: Array<Maybe<CorridorStatsTimeOfDayType>>;
  /** Service link data */
  serviceLinks: Array<Maybe<ServiceLinkType>>;
  /** Summary stats for a corridor. */
  summaryStats?: Maybe<CorridorSummaryStatsType>;
};

export type CorridorSummaryStatsType = {
  __typename?: 'CorridorSummaryStatsType';
  averageJourneyTime?: Maybe<Scalars['Int']>;
  numberOfServices?: Maybe<Scalars['Int']>;
  operatorName?: Maybe<Scalars['String']>;
  percentile95?: Maybe<Scalars['Float']>;
  scheduledJourneyTime?: Maybe<Scalars['Int']>;
  scheduledTransits?: Maybe<Scalars['Int']>;
  /** Response for corridor summary stats. */
  totalTransits?: Maybe<Scalars['Int']>;
};

export type CorridorType = {
  __typename?: 'CorridorType';
  createdBy: UserType;
  /** Response type for corridor queries. */
  id: Scalars['Int'];
  name: Scalars['String'];
  organisation?: Maybe<OrganisationType>;
  stops: Array<Maybe<StopInfoType>>;
};

export type CorridorUpdateInputType = {
  /** Input type for updating a corridor. */
  id: Scalars['Int'];
  name: Scalars['String'];
  stopList: Array<Maybe<Scalars['String']>>;
};



export type DateTimeRangeInput = {
  fromTimestamp: Scalars['DateTime'];
  toTimestamp: Scalars['DateTime'];
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

/** Type to represent frequence of services in delay buckets. */
export type DelayFrequencyType = {
  __typename?: 'DelayFrequencyType';
  bucket: Scalars['Int'];
  frequency: Scalars['Int'];
};


export type EventsPage = {
  __typename?: 'EventsPage';
  items?: Maybe<Array<EventType>>;
  pageInfo?: Maybe<PageInfo>;
};

export type EventStatsType = {
  __typename?: 'EventStatsType';
  /** Total count of events for a day. */
  count?: Maybe<Scalars['Int']>;
  /** The day for the event count. */
  day?: Maybe<Scalars['Date']>;
};

export type EventType = {
  __typename?: 'EventType';
  /** If the feed status is Active, then when was it last down. */
  data?: Maybe<Scalars['EventData']>;
  /** Timestamp when the event was generated. */
  timestamp?: Maybe<Scalars['DateTime']>;
  /** Type of the event. */
  type?: Maybe<Scalars['String']>;
};

export type FeatureFlagType = {
  __typename?: 'FeatureFlagType';
  consolidateHistogram: Scalars['Boolean'];
  corridorStatsTimezoneEnabled: Scalars['Boolean'];
  freshdeskEnabled: Scalars['Boolean'];
  lineDirectionFiltering: Scalars['Boolean'];
  ssoEnabled: Scalars['Boolean'];
  stopIndexFiltering: Scalars['Boolean'];
  taggingIncludeBankHolidays: Scalars['Boolean'];
  vehicleReplayFromTimestream: Scalars['Boolean'];
};

export type FeedMonitoringType = {
  __typename?: 'FeedMonitoringType';
  /** This is percentage of availability of the feed in the last 24 hours. */
  availability?: Maybe<Scalars['Float']>;
  feedStatus: Scalars['Boolean'];
  /** Feed monitoring vehicle stats - Historical feed stats for a given day. */
  historicalStats: HistoricalStatsType;
  /** If the feed status is Active, then when was it last down. */
  lastOutage?: Maybe<Scalars['DateTime']>;
  /** Feed monitoring vehicles stats - over last 24 hours. */
  liveStats: LiveStatsType;
  /** If the feed status is Down, then since when was it unavailable. */
  unavailableSince?: Maybe<Scalars['DateTime']>;
  /** Feed monitoring vehicle stats over a custom time range. */
  vehicleStats: Array<VehicleStatsType>;
};


export type FeedMonitoringTypeHistoricalStatsArgs = {
  date: Scalars['Date'];
};


export type FeedMonitoringTypeVehicleStatsArgs = {
  end: Scalars['DateTime'];
  granularity: Granularity;
  start: Scalars['DateTime'];
};

export enum FeedStatusEnum {
  Down = 'DOWN',
  Up = 'UP'
}

export type FrequentServiceInfoFilterType = {
  dayOfWeekFlags?: Maybe<DayOfWeekFlagsInputType>;
  endTime?: Maybe<Scalars['Time']>;
  lineId: Scalars['String'];
  /** Inputs for frequentServiceInfo. */
  noc?: Maybe<Scalars['String']>;
  operatorId?: Maybe<Scalars['String']>;
  startTime?: Maybe<Scalars['Time']>;
};

export type FrequentServiceInfoInputType = {
  filters: FrequentServiceInfoFilterType;
  fromTimestamp: Scalars['DateTime'];
  toTimestamp: Scalars['DateTime'];
};

/** Type to represent info about a particular frequent service. */
export type FrequentServiceInfoType = {
  __typename?: 'FrequentServiceInfoType';
  /** Number of hours that the service runs frequently. */
  numHours: Scalars['Int'];
  /** Total number of hours the services has actually run. */
  totalHours: Scalars['Int'];
};

/** Type to represent a frequent service. */
export type FrequentServiceType = {
  __typename?: 'FrequentServiceType';
  serviceId: Scalars['String'];
  serviceInfo: ServiceInfoType;
};

/** Filters for GPS feed. */
export type GpsFeedFilterInputType = {
  journeyIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  lineIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  nocCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  operatorIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** The vehicleIds filters is only used with getUnmatchedJourneys. */
  vehicleIds?: Maybe<Array<Maybe<Scalars['String']>>>;
};

/** Type to represent input paramweters to get real-time gps feeds. */
export type GpsFeedInputType = {
  filters?: Maybe<GpsFeedFilterInputType>;
  /**
   * Whether to load all events for each journey. By default this is false
   * where the API returns the latest GPS position of each ongoing journey.
   */
  loadTrails?: Maybe<Scalars['Boolean']>;
  /**
   * A string contains a past interval suffixed with the time-unit. Examples are
   * - 1h: Gets GPS feed for the last 1 hour
   * - 10m: Gets GPS feed for the last 10 minutes.
   * This string must adhere to TimeStream timeAgo specifications.
   */
  timeAgo: Scalars['String'];
};

/**
 * Vehicle journey status.
 * 
 * Started - This feed event is for a journey that's supposed to be running.
 * Completed - This feed event is for a journey that's supposed to have been completed.
 */
export enum GpsFeedJourneyStatus {
  Completed = 'Completed',
  Started = 'Started',
  Unknown = 'Unknown'
}

/** Type to represent all queries related to GPS feeds. */
export type GpsFeedNamespace = {
  __typename?: 'GpsFeedNamespace';
  /** Get gps feed for a specific journey. */
  getJourney: Array<Maybe<GpsFeedType>>;
  /** Get all journeys from the gps feed. */
  getJourneys: Array<Maybe<GpsFeedType>>;
  /** Get all missing journeys from the non tracked journey table. */
  getMissingJourneys: Array<Maybe<MissingJourneyType>>;
  /**
   * Get stale journeys, journeys that have a matched vehicle journey
   * but haven't sent a GPS feed for more than a minute.
   */
  getStaleJourneys: Array<Maybe<GpsFeedType>>;
  /** Get all unmatched journeys from the gps feed. */
  getUnmatchedJourneys: Array<Maybe<GpsFeedType>>;
  /**
   * Get count of matched vehicles.
   * 
   * You can filter counts for a set of noc codes.
   * Note that unmatched count are for all unmatched vehicles
   * running on lines that were being operated by operators
   * that were either filtered by nocCodes filter or all
   * operators that the organisation of the user is
   * configured with.
   */
  getVehicleCounts: VehicleCountType;
};


/** Type to represent all queries related to GPS feeds. */
export type GpsFeedNamespaceGetJourneyArgs = {
  journeyId: Scalars['String'];
  startTime: Scalars['DateTime'];
};


/** Type to represent all queries related to GPS feeds. */
export type GpsFeedNamespaceGetJourneysArgs = {
  inputs: GpsFeedInputType;
};


/** Type to represent all queries related to GPS feeds. */
export type GpsFeedNamespaceGetMissingJourneysArgs = {
  inputs: GpsFeedInputType;
};


/** Type to represent all queries related to GPS feeds. */
export type GpsFeedNamespaceGetStaleJourneysArgs = {
  timeAgo: Scalars['String'];
};


/** Type to represent all queries related to GPS feeds. */
export type GpsFeedNamespaceGetUnmatchedJourneysArgs = {
  inputs: GpsFeedInputType;
};


/** Type to represent all queries related to GPS feeds. */
export type GpsFeedNamespaceGetVehicleCountsArgs = {
  nocCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  operatorIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  timeAgo: Scalars['String'];
};

export type GpsFeedShadowNamespace = {
  __typename?: 'GpsFeedShadowNamespace';
  /** Get gps feed for a specific journey. */
  getJourney: Array<Maybe<GpsFeedType>>;
  /** Get all journeys from the gps feed. */
  getJourneys: Array<Maybe<GpsFeedType>>;
  /**
   * Get stale journeys, journeys that have a matched vehicle journey
   * but haven't sent a GPS feed for more than a minute.
   */
  getStaleJourneys: Array<Maybe<GpsFeedType>>;
  /** Get all unmatched journeys from the gps feed. */
  getUnmatchedJourneys: Array<Maybe<GpsFeedType>>;
  /**
   * Get count of matched vehicles.
   * 
   * You can filter counts for a set of noc codes.
   * Note that unmatched count are for all unmatched vehicles
   * running on lines that were being operated by operators
   * that were either filtered by nocCodes filter or all
   * operators that the organisation of the user is
   * configured with.
   */
  getVehicleCounts: VehicleCountType;
};


export type GpsFeedShadowNamespaceGetJourneyArgs = {
  journeyId: Scalars['String'];
  startTime: Scalars['DateTime'];
};


export type GpsFeedShadowNamespaceGetJourneysArgs = {
  inputs: GpsFeedInputType;
};


export type GpsFeedShadowNamespaceGetStaleJourneysArgs = {
  timeAgo: Scalars['String'];
};


export type GpsFeedShadowNamespaceGetUnmatchedJourneysArgs = {
  inputs: GpsFeedInputType;
};


export type GpsFeedShadowNamespaceGetVehicleCountsArgs = {
  nocCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  operatorIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  timeAgo: Scalars['String'];
};

/**
 * GPS feed status for each feed event.
 * 
 * Stale - Latest feed event is more than a minute old.
 * Active - Latest feed event is a not stale.
 */
export enum GpsFeedStatus {
  Active = 'Active',
  Stale = 'Stale'
}

/** Type to represent a GPS feed response. */
export type GpsFeedType = {
  __typename?: 'GpsFeedType';
  delay?: Maybe<Scalars['Int']>;
  feedStatus?: Maybe<GpsFeedStatus>;
  isTimingPoint?: Maybe<Scalars['Boolean']>;
  journeyStatus?: Maybe<GpsFeedJourneyStatus>;
  lat: Scalars['Float'];
  lon: Scalars['Float'];
  operatorInfo?: Maybe<OperatorInfoType>;
  previousStopInfo?: Maybe<StopInfoType>;
  scheduledDeparture?: Maybe<Scalars['DateTime']>;
  serviceInfo: ServiceInfoType;
  servicePatternId?: Maybe<Scalars['String']>;
  startTime?: Maybe<Scalars['DateTime']>;
  ts: Scalars['DateTime'];
  vehicleId: Scalars['String'];
  vehicleJourneyId?: Maybe<Scalars['String']>;
};

export type GpsPointType = {
  __typename?: 'GpsPointType';
  /** Represents a GPS location */
  latitude: Scalars['Float'];
  longitude: Scalars['Float'];
};

export enum Granularity {
  Day = 'day',
  Hour = 'hour',
  Minute = 'minute',
  Month = 'month'
}

/** Type to represent headway metrics per-day-of-week. */
export type HeadwayDayOfWeekType = IHeadwayType & {
  __typename?: 'HeadwayDayOfWeekType';
  actualWaitTime: Scalars['Float'];
  dayOfWeek: Scalars['Int'];
  excessWaitTime: Scalars['Float'];
  scheduledWaitTime: Scalars['Float'];
};

export type HeadwayFiltersInputType = {
  dayOfWeekFlags?: Maybe<DayOfWeekFlagsInputType>;
  endTime?: Maybe<Scalars['Time']>;
  granularity?: Maybe<Granularity>;
  lineIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  nocCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  operatorIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  startTime?: Maybe<Scalars['Time']>;
};

export type HeadwayInputType = {
  filters?: Maybe<HeadwayFiltersInputType>;
  fromTimestamp: Scalars['DateTime'];
  sortBy?: Maybe<HeadwaySortType>;
  toTimestamp: Scalars['DateTime'];
};

export type HeadwayMetricsType = {
  __typename?: 'HeadwayMetricsType';
  /** Get information about a frequent service. */
  frequentServiceInfo: FrequentServiceInfoType;
  /** Get a list of frequent services. */
  frequentServices?: Maybe<Array<FrequentServiceType>>;
  /** Headway histogram per day of week for a single line. */
  headwayDayOfWeek?: Maybe<Array<HeadwayDayOfWeekType>>;
  /** Returns summary headway metrics like excess-wait times. */
  headwayOverview: HeadwayOverviewType;
  /** Headway histogram per hour of day for a single line. */
  headwayTimeOfDay?: Maybe<Array<HeadwayTimeOfDayType>>;
  /** Headway for a single line as a time-series. */
  headwayTimeSeries?: Maybe<Array<HeadwayTimeSeriesType>>;
};


export type HeadwayMetricsTypeFrequentServiceInfoArgs = {
  inputs?: Maybe<FrequentServiceInfoInputType>;
};


export type HeadwayMetricsTypeFrequentServicesArgs = {
  fromTimestamp: Scalars['DateTime'];
  noc?: Maybe<Scalars['String']>;
  operatorId?: Maybe<Scalars['String']>;
  toTimestamp: Scalars['DateTime'];
};


export type HeadwayMetricsTypeHeadwayDayOfWeekArgs = {
  inputs: HeadwayInputType;
};


export type HeadwayMetricsTypeHeadwayOverviewArgs = {
  inputs: HeadwayInputType;
};


export type HeadwayMetricsTypeHeadwayTimeOfDayArgs = {
  inputs: HeadwayInputType;
};


export type HeadwayMetricsTypeHeadwayTimeSeriesArgs = {
  inputs: HeadwayInputType;
};

/** Type to represent headway overview. */
export type HeadwayOverviewType = IHeadwayType & {
  __typename?: 'HeadwayOverviewType';
  actualWaitTime: Scalars['Float'];
  excessWaitTime: Scalars['Float'];
  scheduledWaitTime: Scalars['Float'];
};

export enum HeadwaySortEnum {
  ActualWaitTime = 'actualWaitTime',
  ExcessWaitTime = 'excessWaitTime',
  ScheduledWaitTime = 'scheduledWaitTime'
}

/** Represents a sorting type for list of operators. */
export type HeadwaySortType = {
  field?: Maybe<HeadwaySortEnum>;
  order?: Maybe<SortOrderEnum>;
};

/** Type to represent headway metrics per time-of-day. */
export type HeadwayTimeOfDayType = IHeadwayType & {
  __typename?: 'HeadwayTimeOfDayType';
  actualWaitTime: Scalars['Float'];
  excessWaitTime: Scalars['Float'];
  scheduledWaitTime: Scalars['Float'];
  timeOfDay: Scalars['Time'];
};

/** Type to represent headway metrics in a time-series. */
export type HeadwayTimeSeriesType = IHeadwayType & {
  __typename?: 'HeadwayTimeSeriesType';
  actualWaitTime: Scalars['Float'];
  excessWaitTime: Scalars['Float'];
  scheduledWaitTime: Scalars['Float'];
  ts: Scalars['DateTime'];
};

export type HistogramInfoType = {
  __typename?: 'HistogramInfoType';
  maxHistogramBin: Scalars['Int'];
  minHistogramBin: Scalars['Int'];
};

export type HistoricalStatsType = {
  __typename?: 'HistoricalStatsType';
  availability?: Maybe<Scalars['Float']>;
  compliance?: Maybe<Scalars['Float']>;
  updateFrequency?: Maybe<Scalars['Int']>;
  vehicleStats: Array<Maybe<VehicleStatsType>>;
};

export type ICorridorJourneyTimeStats = {
  avgTransitTime?: Maybe<Scalars['Float']>;
  maxTransitTime: Scalars['Int'];
  minTransitTime: Scalars['Int'];
  percentile25?: Maybe<Scalars['Float']>;
  percentile5?: Maybe<Scalars['Float']>;
  percentile75?: Maybe<Scalars['Float']>;
  percentile95?: Maybe<Scalars['Float']>;
};

/** Interface for headway response. */
export type IHeadwayType = {
  actualWaitTime: Scalars['Float'];
  excessWaitTime: Scalars['Float'];
  scheduledWaitTime: Scalars['Float'];
};

export type InvitationInput = {
  email: Scalars['String'];
  organisation?: Maybe<ObjectReferenceType>;
  role: ObjectReferenceType;
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

/** Interface for punctuality response. */
export type IPunctualityType = {
  early: Scalars['Int'];
  late: Scalars['Int'];
  onTime: Scalars['Int'];
};

export type JourneyScheduledStartTimes = {
  __typename?: 'JourneyScheduledStartTimes';
  days: Array<Maybe<ShortCodeDayOfWeek>>;
  fromDate: Scalars['Date'];
  startTimes: Array<Maybe<Scalars['Time']>>;
  toDate: Scalars['Date'];
};

export type JourneyScheduledStartTimesInputType = {
  fromTimestamp: Scalars['DateTime'];
  lineId?: Maybe<Scalars['String']>;
  nocCode?: Maybe<Scalars['String']>;
  operatorId?: Maybe<Scalars['String']>;
  toTimestamp: Scalars['DateTime'];
};

export enum Level {
  Line = 'line',
  Operator = 'operator',
  Stop = 'stop'
}

export enum LineDirection {
  All = 'all',
  Inbound = 'inbound',
  Outbound = 'outbound'
}

export type LineFilterType = {
  /** Filter by a set of line ids. */
  lineIds?: Maybe<Array<Scalars['String']>>;
};

export type LineInfoType = {
  __typename?: 'LineInfoType';
  lineName: Scalars['String'];
  lineNumber: Scalars['String'];
};

export type LineType = {
  __typename?: 'LineType';
  /** Line id's for list of operators. */
  lineId: Scalars['String'];
  lineName: Scalars['String'];
  lineNumber: Scalars['String'];
  onTimePerformance: Array<Maybe<OnTimePerformanceType>>;
  servicePatterns: Array<Maybe<ServicePatternType>>;
};

export type LiveStatsType = {
  __typename?: 'LiveStatsType';
  /** Number  of vehicles running today. */
  currentVehicles?: Maybe<Scalars['Int']>;
  /** Number of expected vehicles to be running today. */
  expectedVehicles?: Maybe<Scalars['Int']>;
  /** Number of warning in the feed for today. */
  feedAlerts?: Maybe<Scalars['Int']>;
  /** Number of errors in the feed for today. */
  feedErrors?: Maybe<Scalars['Int']>;
  /** Vehicle counts per minute for the last 20 minutes. */
  last20Minutes: Array<Maybe<VehicleStatsType>>;
  /** Hourly vehicle counts for today. */
  last24Hours: Array<Maybe<VehicleStatsType>>;
  updateFrequency?: Maybe<Scalars['Int']>;
};

/** Represents information about stop locality */
export type LocalityType = {
  __typename?: 'LocalityType';
  localityAreaId: Scalars['String'];
  localityAreaName: Scalars['String'];
  localityId: Scalars['String'];
  localityName: Scalars['String'];
};

export type LoginResponseType = {
  __typename?: 'LoginResponseType';
  expiresAt?: Maybe<Scalars['DateTime']>;
  success: Scalars['Boolean'];
};

/** Type to represent a missing journey */
export type MissingJourneyType = {
  __typename?: 'MissingJourneyType';
  journeyStatus?: Maybe<GpsFeedJourneyStatus>;
  minuteBeginning?: Maybe<Scalars['Int']>;
  operatorInfo?: Maybe<OperatorInfoType>;
  secondsTracked?: Maybe<Scalars['Int']>;
  serviceInfo: ServiceInfoType;
  servicePatternId?: Maybe<Scalars['String']>;
  startTime?: Maybe<Scalars['DateTime']>;
  ts: Scalars['DateTime'];
  vehicleJourneyId?: Maybe<Scalars['String']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Create an user alert. */
  addUserAlert: MutationResponseType;
  /** Create a corridor. */
  createCorridor: MutationResponseType;
  /** Delete a corridor. */
  deleteCorridor: MutationResponseType;
  /** Delete a user. */
  deleteUser: MutationResponseType;
  /** Delete an user alert. */
  deleteUserAlert: MutationResponseType;
  /** Invite a user to signup to the system. */
  inviteUser: InvitationResponseType;
  login: LoginResponseType;
  logout: Scalars['Boolean'];
  /**
   * Initiate a reset password request. This sends an email to the user
   * to reset the password.
   */
  requestResetPassword: MutationResponseType;
  /**
   * Resets users password once the user follows the reset password link
   * sent to his or her mailbox.
   */
  resetPassword: MutationResponseType;
  /** Adds a user to the system when user signs up by following the invitation link. */
  signUp: SignUpResponseType;
  /** Update a corridor. */
  updateCorridor: MutationResponseType;
  /** Update an organisation config. */
  updateOrganisationConfig: OrganisationConfigUpdateResponseType;
  /** Update a user. */
  updateUser: UserUpdateResponseType;
  /** Edit an user alert. */
  updateUserAlert: MutationResponseType;
  /** Check if the reset password token is valid. */
  verifyResetPasswordToken?: Maybe<Scalars['Boolean']>;
};


export type MutationAddUserAlertArgs = {
  payload: AlertInputType;
};


export type MutationCreateCorridorArgs = {
  payload: CorridorInputType;
};


export type MutationDeleteCorridorArgs = {
  corridorId: Scalars['Int'];
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
  payload: SignUpInput;
};


export type MutationUpdateCorridorArgs = {
  inputs: CorridorUpdateInputType;
};


export type MutationUpdateOrganisationConfigArgs = {
  payload: OrganisationConfigInputType;
};


export type MutationUpdateUserArgs = {
  payload: UserInput;
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

/** This input object is used to refer to related objects like foreign keys. */
export type ObjectReferenceType = {
  id: Scalars['String'];
};

export type OnTimePerformanceType = {
  __typename?: 'OnTimePerformanceType';
  /** Delay histogram for services of a given operator. */
  delayFrequency?: Maybe<Array<DelayFrequencyType>>;
  /** Trip Level OTP */
  journeyScheduledStartTimes: Array<Maybe<JourneyScheduledStartTimes>>;
  /** Performance for list of operators */
  operatorPerformance: OperatorPerformancePage;
  /** Punctuality histogram per day of week for a single operator. */
  punctualityDayOfWeek?: Maybe<Array<PunctualityDayOfWeekType>>;
  /** Punctuality overview for operators */
  punctualityOverview?: Maybe<PunctualityTotalsType>;
  /** Punctuality histogram per hour of day for a single operator. */
  punctualityTimeOfDay?: Maybe<Array<PunctualityTimeOfDayType>>;
  /** Punctuality for a single operator as a time-series. */
  punctualityTimeSeries?: Maybe<Array<PunctualityTimeSeriesType>>;
  /** Detailed performance per service for an operator. */
  servicePerformance?: Maybe<Array<ServicePerformanceType>>;
  /** Punctuality per service for an operator. */
  servicePunctuality?: Maybe<Array<ServicePunctualityType>>;
  /** Per-stop punctuality for a service. */
  stopPerformance?: Maybe<Array<StopPerformanceType>>;
};


export type OnTimePerformanceTypeDelayFrequencyArgs = {
  inputs: PerformanceInputType;
};


export type OnTimePerformanceTypeJourneyScheduledStartTimesArgs = {
  inputs: JourneyScheduledStartTimesInputType;
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

export type OperatorFilterType = {
  /** Filter by feed status. */
  feedStatus?: Maybe<FeedStatusEnum>;
  /** Filter by operator name, does a exact search. */
  name?: Maybe<Scalars['String']>;
  /** Filter by operator name containing the search term. */
  name__icontains?: Maybe<Scalars['String']>;
  /** Filter by a set of noc codes. */
  nocCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Filter by a set of operator IDs. */
  operatorIds?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type OperatorInfoType = {
  __typename?: 'OperatorInfoType';
  nocCode?: Maybe<Scalars['String']>;
  /** Information about an operator. */
  operatorId?: Maybe<Scalars['String']>;
  operatorName: Scalars['String'];
};

/** Represents a single page in a paginated response for operator performance results. */
export type OperatorPerformancePage = {
  __typename?: 'OperatorPerformancePage';
  items: Array<Maybe<OperatorPerformanceType>>;
  pageInfo?: Maybe<PageInfo>;
};

/** Type to represent performance metrics for operators. */
export type OperatorPerformanceType = IPunctualityType & {
  __typename?: 'OperatorPerformanceType';
  actualDepartures: Scalars['Int'];
  averageDelay: Scalars['Float'];
  early: Scalars['Int'];
  late: Scalars['Int'];
  name?: Maybe<Scalars['String']>;
  nocCode?: Maybe<Scalars['String']>;
  onTime: Scalars['Int'];
  operatorId?: Maybe<Scalars['String']>;
  scheduledDepartures: Scalars['Int'];
};

export enum OperatorSortEnum {
  FeedAvailability = 'feed_availability'
}

export type OperatorSortType = {
  field?: Maybe<OperatorSortEnum>;
  order?: Maybe<SortOrderEnum>;
};

export type OperatorsPage = {
  __typename?: 'OperatorsPage';
  items: Array<Maybe<OperatorType>>;
  pageInfo?: Maybe<PageInfo>;
};

export type OperatorType = {
  __typename?: 'OperatorType';
  adminAreas?: Maybe<Array<AdminAreaInfoType>>;
  feedMonitoring: FeedMonitoringType;
  name?: Maybe<Scalars['String']>;
  nocCode?: Maybe<Scalars['String']>;
  operatorId?: Maybe<Scalars['String']>;
  transitModel: TransitModelType;
};

export type OrganisationConfigDefaultFiltersType = {
  __typename?: 'OrganisationConfigDefaultFiltersType';
  timingPoints?: Maybe<Scalars['Boolean']>;
};

export type OrganisationConfigErrorResponseType = {
  __typename?: 'OrganisationConfigErrorResponseType';
  onTimeMaxMinutes?: Maybe<Array<Maybe<Scalars['String']>>>;
  onTimeMinMinutes?: Maybe<Array<Maybe<Scalars['String']>>>;
  permissionDenied?: Maybe<Array<Maybe<Scalars['String']>>>;
  timingPoints?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type OrganisationConfigInputType = {
  onTimeMaxMinutes?: Maybe<Scalars['Int']>;
  onTimeMinMinutes?: Maybe<Scalars['Int']>;
  timingPoints?: Maybe<Scalars['Boolean']>;
};

export type OrganisationConfigOnTimePerformanceType = {
  __typename?: 'OrganisationConfigOnTimePerformanceType';
  onTimeMaxMinutes?: Maybe<Scalars['Int']>;
  onTimeMinMinutes?: Maybe<Scalars['Int']>;
};

export type OrganisationConfigType = {
  __typename?: 'OrganisationConfigType';
  canBeUpdated?: Maybe<Scalars['Boolean']>;
  defaultFilters?: Maybe<OrganisationConfigDefaultFiltersType>;
  onTimePerformance?: Maybe<OrganisationConfigOnTimePerformanceType>;
};

export type OrganisationConfigUpdateResponseType = {
  __typename?: 'OrganisationConfigUpdateResponseType';
  error?: Maybe<OrganisationConfigErrorResponseType>;
  organisationConfig?: Maybe<OrganisationConfigType>;
};

export type OrganisationType = {
  __typename?: 'OrganisationType';
  id: Scalars['String'];
  name: Scalars['String'];
  operators?: Maybe<Array<OperatorType>>;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  next?: Maybe<Scalars['Int']>;
  totalCount: Scalars['Int'];
};

export type PaginatedLineType = {
  __typename?: 'PaginatedLineType';
  items?: Maybe<Array<LineType>>;
  /** Paginated type for a list of lines. */
  pageInfo?: Maybe<PageInfo>;
};

export type PagingInputType = {
  after?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
};

export type PerformanceFiltersInputType = {
  addNonTagged?: Maybe<Scalars['Boolean']>;
  adminAreaIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  dayOfWeekFlags?: Maybe<DayOfWeekFlagsInputType>;
  endTime?: Maybe<Scalars['Time']>;
  excludedDates?: Maybe<Array<Maybe<Scalars['Date']>>>;
  excludeItoLineId?: Maybe<Scalars['String']>;
  granularity?: Maybe<Granularity>;
  lineDirection?: Maybe<LineDirection>;
  lineIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  maxDelay?: Maybe<Scalars['Int']>;
  minDelay?: Maybe<Scalars['Int']>;
  nocCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  onTimeMaxMinutes?: Maybe<Scalars['Int']>;
  onTimeMinMinutes?: Maybe<Scalars['Int']>;
  operatorIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  startTime?: Maybe<Scalars['Time']>;
  startTimes?: Maybe<Array<Maybe<Scalars['Time']>>>;
  stopsSegment?: Maybe<StopsSegment>;
  tagIds?: Maybe<Array<Maybe<Scalars['Int']>>>;
  timingPointsOnly?: Maybe<Scalars['Boolean']>;
};

export type PerformanceInputType = {
  filters?: Maybe<PerformanceFiltersInputType>;
  fromTimestamp: Scalars['DateTime'];
  paging?: Maybe<PagingInputType>;
  sortBy?: Maybe<PunctualitySortType>;
  toTimestamp: Scalars['DateTime'];
};

/** Type to represent punctuality histogram per-day-of-week in a day. */
export type PunctualityDayOfWeekType = IPunctualityType & {
  __typename?: 'PunctualityDayOfWeekType';
  dayOfWeek: Scalars['Int'];
  early: Scalars['Int'];
  late: Scalars['Int'];
  onTime: Scalars['Int'];
};

export enum PunctualitySortEnum {
  Early = 'early',
  Late = 'late',
  OnTime = 'on_time'
}

/** Represents a sorting type for list of operators. */
export type PunctualitySortType = {
  field?: Maybe<PunctualitySortEnum>;
  order?: Maybe<SortOrderEnum>;
};

/** Type to represent punctuality histogram per-hour in a day. */
export type PunctualityTimeOfDayType = IPunctualityType & {
  __typename?: 'PunctualityTimeOfDayType';
  early: Scalars['Int'];
  late: Scalars['Int'];
  onTime: Scalars['Int'];
  timeOfDay: Scalars['Time'];
};

/** Type to represent punctuality numbers in a time-series. */
export type PunctualityTimeSeriesType = IPunctualityType & {
  __typename?: 'PunctualityTimeSeriesType';
  early: Scalars['Int'];
  late: Scalars['Int'];
  onTime: Scalars['Int'];
  ts: Scalars['DateTime'];
};

/** Type to represent punctuality of a service. */
export type PunctualityTotalsType = IPunctualityType & {
  __typename?: 'PunctualityTotalsType';
  averageDeviation: Scalars['Float'];
  completed: Scalars['Int'];
  early: Scalars['Int'];
  late: Scalars['Int'];
  onTime: Scalars['Int'];
  scheduled: Scalars['Int'];
};

export type Query = {
  __typename?: 'Query';
  adminAreas?: Maybe<Array<AdminAreasType>>;
  /** Gets info about the API */
  apiInfo: ApiInfoType;
  /** Resolve corridor queries. */
  corridor: CorridorNamespace;
  /** Get events list. */
  events: EventsPage;
  /**
   * Get event stats, get the total number of events
   * broken down per day for a given date range.
   */
  eventStats: Array<EventStatsType>;
  /** Namespace for GpsFeed queries. */
  gpsFeed: GpsFeedNamespace;
  /**
   * Namespace for gpsFeedShadow queries.
   * 
   * This namespace only exists for aiding QA to test
   * migration from Timestream to Postgres as a data
   * backend. Please deprecate this once that testing
   * is finished.
   */
  gpsFeedShadow: GpsFeedShadowNamespace;
  /** Resolve headway metrics */
  headwayMetrics: HeadwayMetricsType;
  /** Thresholds for the OTP histogram */
  histogramInfo: HistogramInfoType;
  /** Get user invitation details for a given key. */
  invitation?: Maybe<InvitationType>;
  /** Resolve an on-time performance query */
  onTimePerformance: OnTimePerformanceType;
  operator?: Maybe<OperatorType>;
  operators: OperatorsPage;
  organisationConfig: OrganisationConfigType;
  /** Real-time performance metrics. */
  realTimeMetrics: OnTimePerformanceType;
  /** Resolve all user roles configured in the system. */
  roles: Array<RoleType>;
  /** Get meta-data about a service. */
  serviceInfo: ServiceInfoType;
  /** Resolve service pattern data */
  servicePatternsInfo: Array<Maybe<ServicePatternType>>;
  /** Tag for a journey. */
  tags?: Maybe<Array<TagType>>;
  /** Resolve timing pattern detail */
  timingPatternDetail: Array<Maybe<TimingPatternDetailType>>;
  /** Resolve transit model data. */
  transitModel?: Maybe<TransitModelType>;
  user: UserType;
  /** Resolve a single user alert by id. */
  userAlert?: Maybe<AlertType>;
  /** Resolve all alerts configured for a system. */
  userAlerts: Array<AlertType>;
  users: Array<UserType>;
  /** Resolve VehicleJourney */
  vehicleJourney: Array<Maybe<VehicleJourneyType>>;
  /** Namespace for VehicleReplay queries. */
  vehicleReplay: VehicleReplayNamespace;
  /**
   * Namespace for VehicleReplayShadow queries.
   * 
   * This namespace only exists for aiding QA to test
   * migration from Timestream to Postgres as a data
   * backend. Please deprecate this once that testing
   * is finished.
   */
  vehicleReplayShadow: VehicleReplayShadowNamespace;
};


export type QueryAdminAreasArgs = {
  adminAreaIds?: Maybe<Array<Maybe<Scalars['String']>>>;
};


export type QueryEventsArgs = {
  after?: Maybe<Scalars['Int']>;
  end: Scalars['DateTime'];
  first?: Maybe<Scalars['Int']>;
  nocCode?: Maybe<Scalars['String']>;
  operatorId?: Maybe<Scalars['String']>;
  start: Scalars['DateTime'];
};


export type QueryEventStatsArgs = {
  end: Scalars['Date'];
  nocCode?: Maybe<Scalars['String']>;
  operatorId?: Maybe<Scalars['String']>;
  start: Scalars['Date'];
};


export type QueryInvitationArgs = {
  key?: Maybe<Scalars['String']>;
};


export type QueryOperatorArgs = {
  nocCode?: Maybe<Scalars['String']>;
  operatorId?: Maybe<Scalars['String']>;
};


export type QueryOperatorsArgs = {
  after?: Maybe<Scalars['Int']>;
  filterBy?: Maybe<OperatorFilterType>;
  first?: Maybe<Scalars['Int']>;
  sortBy?: Maybe<OperatorSortType>;
};


export type QueryServiceInfoArgs = {
  serviceId: Scalars['String'];
};


export type QueryServicePatternsInfoArgs = {
  servicePatternIds?: Maybe<Array<Scalars['String']>>;
};


export type QueryTimingPatternDetailArgs = {
  timingPatternId: Scalars['String'];
};


export type QueryUserAlertArgs = {
  alertId?: Maybe<Scalars['String']>;
};


export type QueryVehicleJourneyArgs = {
  vehicleJourneyId: Scalars['String'];
};

export enum RankingOrder {
  Ascending = 'ascending',
  Descending = 'descending'
}

export type RoleType = {
  __typename?: 'RoleType';
  id: Scalars['String'];
  name: Scalars['String'];
  scope: ScopeEnum;
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
  fromStop: Scalars['String'];
  linkRoute?: Maybe<Scalars['String']>;
  routeValidity: Scalars['String'];
  toStop: Scalars['String'];
};

/** Represents service patterns and stops along a service. */
export type ServicePatternType = {
  __typename?: 'ServicePatternType';
  direction?: Maybe<Scalars['String']>;
  direction_id?: Maybe<Scalars['Int']>;
  name: Scalars['String'];
  serviceLinks: Array<Maybe<ServiceLinkType>>;
  servicePatternId: Scalars['String'];
  stops: Array<Maybe<StopType>>;
};

export type ServicePerformanceFiltersInputType = {
  addNonTagged?: Maybe<Scalars['Boolean']>;
  adminAreaIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  dayOfWeekFlags?: Maybe<DayOfWeekFlagsInputType>;
  endTime?: Maybe<Scalars['Time']>;
  excludedDates?: Maybe<Array<Maybe<Scalars['Date']>>>;
  excludeItoLineId?: Maybe<Scalars['String']>;
  granularity?: Maybe<Granularity>;
  lineDirection?: Maybe<LineDirection>;
  lineIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  nocCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  onTimeMaxMinutes?: Maybe<Scalars['Int']>;
  onTimeMinMinutes?: Maybe<Scalars['Int']>;
  operatorIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  startTime?: Maybe<Scalars['Time']>;
  startTimes?: Maybe<Array<Maybe<Scalars['Time']>>>;
  stopsSegment?: Maybe<StopsSegment>;
  tagIds?: Maybe<Array<Maybe<Scalars['Int']>>>;
  timingPointsOnly?: Maybe<Scalars['Boolean']>;
};

export type ServicePerformanceInputType = {
  filters?: Maybe<ServicePerformanceFiltersInputType>;
  fromTimestamp: Scalars['DateTime'];
  limit?: Maybe<Scalars['Int']>;
  order?: Maybe<RankingOrder>;
  toTimestamp: Scalars['DateTime'];
};

/**
 * Type to represent performance metrics for services.
 * This may be merged with ServicePunctualityType in the future.
 */
export type ServicePerformanceType = IPunctualityType & {
  __typename?: 'ServicePerformanceType';
  actualDepartures: Scalars['Int'];
  averageDelay: Scalars['Float'];
  early: Scalars['Int'];
  late: Scalars['Int'];
  lineId: Scalars['String'];
  lineInfo: ServiceInfoType;
  onTime: Scalars['Int'];
  operatorInfo: OperatorInfoType;
  scheduledDepartures: Scalars['Int'];
};

/** Type to represent puntuality of a service. */
export type ServicePunctualityType = IPunctualityType & {
  __typename?: 'ServicePunctualityType';
  early: Scalars['Int'];
  late: Scalars['Int'];
  lineId: Scalars['String'];
  lineInfo: ServiceInfoType;
  nocCode?: Maybe<Scalars['String']>;
  onTime: Scalars['Int'];
  operatorId?: Maybe<Scalars['String']>;
  rank: Scalars['Float'];
  /**
   * Get the performance numbers for a previous period
   * for comparison with current period.
   */
  trend?: Maybe<ServicePunctualityType>;
};


/** Type to represent puntuality of a service. */
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

export type SignUpInput = {
  firstName?: Maybe<Scalars['String']>;
  key: Scalars['String'];
  lastName?: Maybe<Scalars['String']>;
  password: Scalars['String'];
};

export type SignUpResponseType = {
  __typename?: 'SignUpResponseType';
  error?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export enum SortOrderEnum {
  Asc = 'ASC',
  Desc = 'DESC'
}

/** Represents information about stops. */
export type StopInfoType = {
  __typename?: 'StopInfoType';
  sourceId: Scalars['String'];
  stopId: Scalars['String'];
  stopLocality: LocalityType;
  stopLocation: GpsPointType;
  stopName: Scalars['String'];
};

/** Type to represent performance metrics for stops for a service. */
export type StopPerformanceType = IPunctualityType & {
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
  timingPoint: Scalars['Boolean'];
};

export enum StopsSegment {
  First = 'first',
  Intermediate = 'intermediate'
}

/** Represents stops along a service pattern. */
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

export type TagType = {
  __typename?: 'TagType';
  id?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
};


export type TimingPatternDetailType = {
  __typename?: 'TimingPatternDetailType';
  arrivalTimeOffset: Scalars['Int'];
  createdAt: Scalars['DateTime'];
  deletedAt?: Maybe<Scalars['DateTime']>;
  departureTimeOffset: Scalars['Int'];
  noPickup: Scalars['Boolean'];
  noSetdown: Scalars['Boolean'];
  requestStop: Scalars['Boolean'];
  stopIndex: Scalars['Int'];
  timingPatternId: Scalars['String'];
  timingPoint: Scalars['Boolean'];
  updatedAt: Scalars['DateTime'];
  version: Scalars['String'];
};

export type TransitModelType = {
  __typename?: 'TransitModelType';
  /** Transit data to fetch lines for an operator. */
  lines: PaginatedLineType;
};


export type TransitModelTypeLinesArgs = {
  after?: Maybe<Scalars['Int']>;
  filterBy?: Maybe<LineFilterType>;
  first?: Maybe<Scalars['Int']>;
};

/** Return type when searching for unique journeys. */
export type UniqueJourneyType = {
  __typename?: 'UniqueJourneyType';
  serviceInfo: ServiceInfoType;
  startTime: Scalars['DateTime'];
  vehicleJourneyId: Scalars['String'];
};

export type UserInput = {
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
  role?: Maybe<ObjectReferenceType>;
};

export type UserType = {
  __typename?: 'UserType';
  email: Scalars['String'];
  firstName?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  lastName?: Maybe<Scalars['String']>;
  organisation?: Maybe<OrganisationType>;
  roles: Array<RoleType>;
  username: Scalars['String'];
};

export type UserUpdateResponseType = {
  __typename?: 'UserUpdateResponseType';
  error?: Maybe<Scalars['String']>;
  user?: Maybe<UserType>;
};

/** Type to represent vehicle counts. */
export type VehicleCountType = {
  __typename?: 'VehicleCountType';
  matched: Scalars['Int'];
  unmatched: Scalars['Int'];
};

export type VehicleJourneyType = {
  __typename?: 'VehicleJourneyType';
  mode: Scalars['String'];
  operatorId: Scalars['String'];
  servicePatternId: Scalars['String'];
  timingPatternId: Scalars['String'];
  vehicleJourneyId: Scalars['String'];
};

/** Filters for vehicle replay API. */
export type VehicleReplayFilterInputType = {
  filterOnStartTime?: Maybe<Scalars['Boolean']>;
  lineIds?: Maybe<Array<Maybe<Scalars['String']>>>;
  stopIds?: Maybe<Array<Maybe<Scalars['String']>>>;
};

/** Type to represent input paramweters to get vehicle replay data. */
export type VehicleReplayInputType = {
  filters?: Maybe<VehicleReplayFilterInputType>;
  fromTimestamp: Scalars['DateTime'];
  toTimestamp: Scalars['DateTime'];
};

export type VehicleReplayNamespace = {
  __typename?: 'VehicleReplayNamespace';
  /** Find distinct vehicle journeys (distinct vj_id and start_time) */
  findJourneys: Array<Maybe<UniqueJourneyType>>;
  /** Get vehicle replay for a single journey. */
  getJourney: Array<Maybe<GpsFeedType>>;
  /** Vehicle replay API. */
  getJourneys: Array<Maybe<GpsFeedType>>;
};


export type VehicleReplayNamespaceFindJourneysArgs = {
  inputs: VehicleReplayInputType;
};


export type VehicleReplayNamespaceGetJourneyArgs = {
  journeyId: Scalars['String'];
  startTime: Scalars['DateTime'];
};


export type VehicleReplayNamespaceGetJourneysArgs = {
  inputs: VehicleReplayInputType;
};

export type VehicleReplayShadowNamespace = {
  __typename?: 'VehicleReplayShadowNamespace';
  /** Find distinct vehicle journeys (distinct vj_id and start_time) */
  findJourneys: Array<Maybe<UniqueJourneyType>>;
  /** Get vehicle replay for a single journey. */
  getJourney: Array<Maybe<GpsFeedType>>;
  /** Vehicle replay API. */
  getJourneys: Array<Maybe<GpsFeedType>>;
};


export type VehicleReplayShadowNamespaceFindJourneysArgs = {
  inputs: VehicleReplayInputType;
};


export type VehicleReplayShadowNamespaceGetJourneyArgs = {
  journeyId: Scalars['String'];
  startTime: Scalars['DateTime'];
};


export type VehicleReplayShadowNamespaceGetJourneysArgs = {
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
  & { login: (
    { __typename?: 'LoginResponseType' }
    & Pick<LoginResponseType, 'success' | 'expiresAt'>
  ) }
);

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'logout'>
);

export type UserQueryVariables = Exact<{ [key: string]: never; }>;


export type UserQuery = (
  { __typename?: 'Query' }
  & { user: (
    { __typename?: 'UserType' }
    & UserFragment
  ) }
);

export type CorridorsStopSearchQueryVariables = Exact<{
  inputs?: Maybe<AddFirstStopInputType>;
}>;


export type CorridorsStopSearchQuery = (
  { __typename?: 'Query' }
  & { corridor: (
    { __typename?: 'CorridorNamespace' }
    & { addFirstStop: Array<Maybe<(
      { __typename?: 'StopType' }
      & Pick<StopType, 'stopId' | 'stopName' | 'lat' | 'lon' | 'localityName' | 'adminAreaId'>
    )>> }
  ) }
);

export type CorridorsSubsequentStopsQueryVariables = Exact<{
  stopList: Array<Maybe<Scalars['String']>>;
}>;


export type CorridorsSubsequentStopsQuery = (
  { __typename?: 'Query' }
  & { corridor: (
    { __typename?: 'CorridorNamespace' }
    & { addSubsequentStops: Array<Maybe<(
      { __typename?: 'StopType' }
      & Pick<StopType, 'stopId' | 'stopName' | 'lon' | 'lat' | 'localityName' | 'adminAreaId'>
    )>> }
  ) }
);

export type CorridorsListQueryVariables = Exact<{ [key: string]: never; }>;


export type CorridorsListQuery = (
  { __typename?: 'Query' }
  & { corridor: (
    { __typename?: 'CorridorNamespace' }
    & { corridorList?: Maybe<Array<Maybe<(
      { __typename?: 'CorridorType' }
      & Pick<CorridorType, 'id' | 'name'>
      & { stops: Array<Maybe<(
        { __typename?: 'StopInfoType' }
        & Pick<StopInfoType, 'stopId'>
      )>> }
    )>>> }
  ) }
);

export type GetCorridorQueryVariables = Exact<{
  corridorId: Scalars['Int'];
}>;


export type GetCorridorQuery = (
  { __typename?: 'Query' }
  & { corridor: (
    { __typename?: 'CorridorNamespace' }
    & { getCorridor: (
      { __typename?: 'CorridorType' }
      & Pick<CorridorType, 'id' | 'name'>
      & { stops: Array<Maybe<(
        { __typename?: 'StopInfoType' }
        & Pick<StopInfoType, 'stopId' | 'sourceId' | 'stopName'>
        & { stopLocation: (
          { __typename?: 'GpsPointType' }
          & Pick<GpsPointType, 'latitude' | 'longitude'>
        ), stopLocality: (
          { __typename?: 'LocalityType' }
          & Pick<LocalityType, 'localityId' | 'localityName' | 'localityAreaId' | 'localityAreaName'>
        ) }
      )>> }
    ) }
  ) }
);

export type CorridorStatsQueryVariables = Exact<{
  params: CorridorStatsInputType;
}>;


export type CorridorStatsQuery = (
  { __typename?: 'Query' }
  & { corridor: (
    { __typename?: 'CorridorNamespace' }
    & { stats?: Maybe<(
      { __typename?: 'CorridorStatsType' }
      & { summaryStats?: Maybe<(
        { __typename?: 'CorridorSummaryStatsType' }
        & Pick<CorridorSummaryStatsType, 'totalTransits' | 'numberOfServices' | 'averageJourneyTime' | 'scheduledTransits'>
      )>, journeyTimeStats: Array<Maybe<(
        { __typename?: 'CorridorJourneyTimeStatsType' }
        & Pick<CorridorJourneyTimeStatsType, 'ts' | 'minTransitTime' | 'maxTransitTime' | 'avgTransitTime' | 'percentile25' | 'percentile75'>
      )>>, journeyTimeTimeOfDayStats: Array<Maybe<(
        { __typename?: 'CorridorStatsTimeOfDayType' }
        & Pick<CorridorStatsTimeOfDayType, 'hour' | 'minTransitTime' | 'maxTransitTime' | 'avgTransitTime' | 'percentile25' | 'percentile75'>
      )>>, journeyTimeDayOfWeekStats: Array<Maybe<(
        { __typename?: 'CorridorStatsDayOfWeekType' }
        & Pick<CorridorStatsDayOfWeekType, 'dow' | 'minTransitTime' | 'maxTransitTime' | 'avgTransitTime' | 'percentile25' | 'percentile75'>
      )>>, journeyTimePerServiceStats: Array<Maybe<(
        { __typename?: 'CorridorStatsPerServiceType' }
        & Pick<CorridorStatsPerServiceType, 'lineName' | 'servicePatternName' | 'noc' | 'operatorName' | 'totalJourneyTime' | 'recordedTransits' | 'scheduledTransits'>
      )>>, journeyTimeHistogram: Array<Maybe<(
        { __typename?: 'CorridorStatsHistogramType' }
        & Pick<CorridorStatsHistogramType, 'ts'>
        & { hist?: Maybe<Array<Maybe<(
          { __typename?: 'CorridorHistogramType' }
          & Pick<CorridorHistogramType, 'bin' | 'freq'>
        )>>> }
      )>>, serviceLinks: Array<Maybe<(
        { __typename?: 'ServiceLinkType' }
        & Pick<ServiceLinkType, 'fromStop' | 'toStop' | 'distance' | 'routeValidity' | 'linkRoute'>
      )>> }
    )> }
  ) }
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
  & { feedMonitoring: (
    { __typename?: 'FeedMonitoringType' }
    & Pick<FeedMonitoringType, 'feedStatus'>
    & { liveStats: (
      { __typename?: 'LiveStatsType' }
      & Pick<LiveStatsType, 'feedErrors' | 'feedAlerts'>
    ) }
  ) }
);

export type OperatorDashboardVehicleCountsFragment = (
  { __typename?: 'OperatorType' }
  & Pick<OperatorType, 'nocCode' | 'operatorId'>
  & { feedMonitoring: (
    { __typename?: 'FeedMonitoringType' }
    & { liveStats: (
      { __typename?: 'LiveStatsType' }
      & Pick<LiveStatsType, 'currentVehicles' | 'expectedVehicles'>
    ) }
  ) }
);

export type DashboardOperatorListQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardOperatorListQuery = (
  { __typename?: 'Query' }
  & { operators: (
    { __typename?: 'OperatorsPage' }
    & { items: Array<Maybe<(
      { __typename?: 'OperatorType' }
      & OperatorDashboardFragment
    )>> }
  ) }
);

export type DashboardOperatorVehicleCountsListQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardOperatorVehicleCountsListQuery = (
  { __typename?: 'Query' }
  & { operators: (
    { __typename?: 'OperatorsPage' }
    & { items: Array<Maybe<(
      { __typename?: 'OperatorType' }
      & OperatorDashboardVehicleCountsFragment
    )>> }
  ) }
);

export type DashboardPerformanceStatsQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type DashboardPerformanceStatsQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance: (
    { __typename?: 'OnTimePerformanceType' }
    & { punctualityOverview?: Maybe<(
      { __typename?: 'PunctualityTotalsType' }
      & Pick<PunctualityTotalsType, 'onTime' | 'late' | 'early'>
    )> }
  ) }
);

export type DashboardServiceRankingQueryVariables = Exact<{
  params: ServicePerformanceInputType;
  trendFrom: Scalars['DateTime'];
  trendTo: Scalars['DateTime'];
}>;


export type DashboardServiceRankingQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance: (
    { __typename?: 'OnTimePerformanceType' }
    & { servicePunctuality?: Maybe<Array<(
      { __typename?: 'ServicePunctualityType' }
      & Pick<ServicePunctualityType, 'nocCode' | 'lineId' | 'onTime' | 'early' | 'late'>
      & { lineInfo: (
        { __typename?: 'ServiceInfoType' }
        & Pick<ServiceInfoType, 'serviceId' | 'serviceName' | 'serviceNumber'>
      ), trend?: Maybe<(
        { __typename?: 'ServicePunctualityType' }
        & Pick<ServicePunctualityType, 'onTime' | 'early' | 'late'>
      )> }
    )>> }
  ) }
);

export type EventFragment = (
  { __typename?: 'EventType' }
  & Pick<EventType, 'timestamp' | 'type' | 'data'>
);

export type EventsQueryVariables = Exact<{
  operatorId: Scalars['String'];
  start: Scalars['DateTime'];
  end: Scalars['DateTime'];
}>;


export type EventsQuery = (
  { __typename?: 'Query' }
  & { events: (
    { __typename?: 'EventsPage' }
    & { items?: Maybe<Array<(
      { __typename?: 'EventType' }
      & EventFragment
    )>> }
  ) }
);

export type EventStatsQueryVariables = Exact<{
  operatorId: Scalars['String'];
  start: Scalars['Date'];
  end: Scalars['Date'];
}>;


export type EventStatsQuery = (
  { __typename?: 'Query' }
  & { eventStats: Array<(
    { __typename?: 'EventStatsType' }
    & Pick<EventStatsType, 'count' | 'day'>
  )> }
);

export type VehicleStatFragment = (
  { __typename?: 'VehicleStatsType' }
  & Pick<VehicleStatsType, 'actual' | 'expected' | 'timestamp'>
);

export type BasicOperatorFragment = (
  { __typename?: 'OperatorType' }
  & Pick<OperatorType, 'name' | 'nocCode' | 'operatorId'>
  & { feedMonitoring: (
    { __typename?: 'FeedMonitoringType' }
    & Pick<FeedMonitoringType, 'feedStatus' | 'availability' | 'lastOutage' | 'unavailableSince'>
    & { liveStats: (
      { __typename?: 'LiveStatsType' }
      & Pick<LiveStatsType, 'updateFrequency'>
    ) }
  ) }
);

export type OperatorLiveStatusFragment = (
  { __typename?: 'OperatorType' }
  & Pick<OperatorType, 'name' | 'nocCode' | 'operatorId'>
  & { feedMonitoring: (
    { __typename?: 'FeedMonitoringType' }
    & Pick<FeedMonitoringType, 'feedStatus' | 'availability' | 'lastOutage' | 'unavailableSince'>
    & { liveStats: (
      { __typename?: 'LiveStatsType' }
      & Pick<LiveStatsType, 'updateFrequency' | 'currentVehicles' | 'expectedVehicles'>
      & { last24Hours: Array<Maybe<(
        { __typename?: 'VehicleStatsType' }
        & VehicleStatFragment
      )>>, last20Minutes: Array<Maybe<(
        { __typename?: 'VehicleStatsType' }
        & VehicleStatFragment
      )>> }
    ) }
  ) }
);

export type OperatorFeedHistoryFragment = (
  { __typename?: 'OperatorType' }
  & Pick<OperatorType, 'name' | 'nocCode' | 'operatorId'>
  & { feedMonitoring: (
    { __typename?: 'FeedMonitoringType' }
    & { historicalStats: (
      { __typename?: 'HistoricalStatsType' }
      & Pick<HistoricalStatsType, 'updateFrequency' | 'availability'>
    ), vehicleStats: Array<(
      { __typename?: 'VehicleStatsType' }
      & VehicleStatFragment
    )> }
  ) }
);

export type FeedMonitoringListQueryVariables = Exact<{ [key: string]: never; }>;


export type FeedMonitoringListQuery = (
  { __typename?: 'Query' }
  & { operators: (
    { __typename?: 'OperatorsPage' }
    & { items: Array<Maybe<(
      { __typename?: 'OperatorType' }
      & BasicOperatorFragment
    )>> }
  ) }
);

export type OperatorSparklineStatsQueryVariables = Exact<{
  operatorIds?: Maybe<Array<Scalars['String']>>;
}>;


export type OperatorSparklineStatsQuery = (
  { __typename?: 'Query' }
  & { operators: (
    { __typename?: 'OperatorsPage' }
    & { items: Array<Maybe<(
      { __typename?: 'OperatorType' }
      & Pick<OperatorType, 'nocCode' | 'operatorId'>
      & { feedMonitoring: (
        { __typename?: 'FeedMonitoringType' }
        & { liveStats: (
          { __typename?: 'LiveStatsType' }
          & { last24Hours: Array<Maybe<(
            { __typename?: 'VehicleStatsType' }
            & VehicleStatFragment
          )>> }
        ) }
      ) }
    )>> }
  ) }
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
  & { adminAreas?: Maybe<Array<(
    { __typename?: 'AdminAreasType' }
    & Pick<AdminAreasType, 'shape'>
    & { id: AdminAreasType['adminAreaId'], name: AdminAreasType['adminAreaName'] }
  )>> }
);

export type HeadwayTimeSeriesQueryVariables = Exact<{
  params: HeadwayInputType;
}>;


export type HeadwayTimeSeriesQuery = (
  { __typename?: 'Query' }
  & { headwayMetrics: (
    { __typename?: 'HeadwayMetricsType' }
    & { headwayTimeSeries?: Maybe<Array<(
      { __typename?: 'HeadwayTimeSeriesType' }
      & Pick<HeadwayTimeSeriesType, 'ts'>
      & { actual: HeadwayTimeSeriesType['actualWaitTime'], scheduled: HeadwayTimeSeriesType['scheduledWaitTime'], excess: HeadwayTimeSeriesType['excessWaitTime'] }
    )>> }
  ) }
);

export type HeadwayOverviewQueryVariables = Exact<{
  params: HeadwayInputType;
}>;


export type HeadwayOverviewQuery = (
  { __typename?: 'Query' }
  & { headwayMetrics: (
    { __typename?: 'HeadwayMetricsType' }
    & { headwayOverview: (
      { __typename?: 'HeadwayOverviewType' }
      & { actual: HeadwayOverviewType['actualWaitTime'], scheduled: HeadwayOverviewType['scheduledWaitTime'], excess: HeadwayOverviewType['excessWaitTime'] }
    ) }
  ) }
);

export type HeadwayFrequentServicesQueryVariables = Exact<{
  operatorId: Scalars['String'];
  fromTimestamp: Scalars['DateTime'];
  toTimestamp: Scalars['DateTime'];
}>;


export type HeadwayFrequentServicesQuery = (
  { __typename?: 'Query' }
  & { headwayMetrics: (
    { __typename?: 'HeadwayMetricsType' }
    & { frequentServices?: Maybe<Array<(
      { __typename?: 'FrequentServiceType' }
      & Pick<FrequentServiceType, 'serviceId'>
    )>> }
  ) }
);

export type HeadwayFrequentServiceInfoQueryVariables = Exact<{
  inputs?: Maybe<FrequentServiceInfoInputType>;
}>;


export type HeadwayFrequentServiceInfoQuery = (
  { __typename?: 'Query' }
  & { headwayMetrics: (
    { __typename?: 'HeadwayMetricsType' }
    & { frequentServiceInfo: (
      { __typename?: 'FrequentServiceInfoType' }
      & Pick<FrequentServiceInfoType, 'numHours' | 'totalHours'>
    ) }
  ) }
);

export type OnTimeDelayFrequencyQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeDelayFrequencyQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance: (
    { __typename?: 'OnTimePerformanceType' }
    & { delayFrequency?: Maybe<Array<(
      { __typename?: 'DelayFrequencyType' }
      & Pick<DelayFrequencyType, 'bucket' | 'frequency'>
    )>> }
  ) }
);

export type OnTimeTimeSeriesQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeTimeSeriesQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance: (
    { __typename?: 'OnTimePerformanceType' }
    & { punctualityTimeSeries?: Maybe<Array<(
      { __typename?: 'PunctualityTimeSeriesType' }
      & Pick<PunctualityTimeSeriesType, 'ts' | 'onTime' | 'early' | 'late'>
    )>> }
  ) }
);

export type OnTimeStatsQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeStatsQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance: (
    { __typename?: 'OnTimePerformanceType' }
    & { punctualityOverview?: Maybe<(
      { __typename?: 'PunctualityTotalsType' }
      & Pick<PunctualityTotalsType, 'early' | 'late' | 'onTime' | 'scheduled' | 'completed' | 'averageDeviation'>
    )> }
  ) }
);

export type OnTimePunctualityTimeOfDayQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimePunctualityTimeOfDayQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance: (
    { __typename?: 'OnTimePerformanceType' }
    & { punctualityTimeOfDay?: Maybe<Array<(
      { __typename?: 'PunctualityTimeOfDayType' }
      & Pick<PunctualityTimeOfDayType, 'timeOfDay' | 'onTime' | 'early' | 'late'>
    )>> }
  ) }
);

export type OnTimePunctualityDayOfWeekQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimePunctualityDayOfWeekQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance: (
    { __typename?: 'OnTimePerformanceType' }
    & { punctualityDayOfWeek?: Maybe<Array<(
      { __typename?: 'PunctualityDayOfWeekType' }
      & Pick<PunctualityDayOfWeekType, 'dayOfWeek' | 'onTime' | 'early' | 'late'>
    )>> }
  ) }
);

export type OnTimeServicePerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeServicePerformanceListQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance: (
    { __typename?: 'OnTimePerformanceType' }
    & { servicePerformance?: Maybe<Array<(
      { __typename?: 'ServicePerformanceType' }
      & Pick<ServicePerformanceType, 'lineId' | 'early' | 'onTime' | 'late' | 'averageDelay' | 'scheduledDepartures' | 'actualDepartures'>
      & { lineInfo: (
        { __typename?: 'ServiceInfoType' }
        & Pick<ServiceInfoType, 'serviceId' | 'serviceName' | 'serviceNumber'>
      ) }
    )>> }
  ) }
);

export type OnTimeStopPerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeStopPerformanceListQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance: (
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
  ) }
);

export type OnTimeOperatorPerformanceListQueryVariables = Exact<{
  params: PerformanceInputType;
}>;


export type OnTimeOperatorPerformanceListQuery = (
  { __typename?: 'Query' }
  & { onTimePerformance: (
    { __typename?: 'OnTimePerformanceType' }
    & { operatorPerformance: (
      { __typename?: 'OperatorPerformancePage' }
      & { pageInfo?: Maybe<(
        { __typename?: 'PageInfo' }
        & Pick<PageInfo, 'totalCount' | 'next'>
      )>, items: Array<Maybe<(
        { __typename?: 'OperatorPerformanceType' }
        & Pick<OperatorPerformanceType, 'nocCode' | 'operatorId' | 'name' | 'early' | 'onTime' | 'late'>
      )>> }
    ) }
  ) }
);

export type ServiceInfoQueryVariables = Exact<{
  lineId: Scalars['String'];
}>;


export type ServiceInfoQuery = (
  { __typename?: 'Query' }
  & { serviceInfo: (
    { __typename?: 'ServiceInfoType' }
    & Pick<ServiceInfoType, 'serviceId' | 'serviceNumber' | 'serviceName'>
  ) }
);

export type TransitModelServicePatternStopsQueryVariables = Exact<{
  operatorId: Scalars['String'];
  lineId: Scalars['String'];
}>;


export type TransitModelServicePatternStopsQuery = (
  { __typename?: 'Query' }
  & { operator?: Maybe<(
    { __typename?: 'OperatorType' }
    & { transitModel: (
      { __typename?: 'TransitModelType' }
      & { lines: (
        { __typename?: 'PaginatedLineType' }
        & { items?: Maybe<Array<(
          { __typename?: 'LineType' }
          & Pick<LineType, 'lineId' | 'lineName'>
          & { servicePatterns: Array<Maybe<(
            { __typename?: 'ServicePatternType' }
            & Pick<ServicePatternType, 'servicePatternId' | 'name'>
            & { stops: Array<Maybe<(
              { __typename?: 'StopType' }
              & Pick<StopType, 'stopId' | 'stopName' | 'lon' | 'lat'>
            )>>, serviceLinks: Array<Maybe<(
              { __typename?: 'ServiceLinkType' }
              & Pick<ServiceLinkType, 'fromStop' | 'toStop' | 'distance' | 'routeValidity' | 'linkRoute'>
            )>> }
          )>> }
        )>> }
      ) }
    ) }
  )> }
);

export type UserFragment = (
  { __typename?: 'UserType' }
  & Pick<UserType, 'id' | 'email' | 'username' | 'firstName' | 'lastName'>
  & { organisation?: Maybe<(
    { __typename?: 'OrganisationType' }
    & Pick<OrganisationType, 'id' | 'name'>
  )>, roles: Array<(
    { __typename?: 'RoleType' }
    & RoleFragment
  )> }
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
  & { users: Array<(
    { __typename?: 'UserType' }
    & UserFragment
  )> }
);

export type ListRolesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListRolesQuery = (
  { __typename?: 'Query' }
  & { roles: Array<(
    { __typename?: 'RoleType' }
    & RoleFragment
  )> }
);

export type ListUserAlertsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListUserAlertsQuery = (
  { __typename?: 'Query' }
  & { userAlerts: Array<(
    { __typename?: 'AlertType' }
    & AlertFragment
  )> }
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
  & { operators: (
    { __typename?: 'OperatorsPage' }
    & { items: Array<Maybe<(
      { __typename?: 'OperatorType' }
      & Pick<OperatorType, 'name' | 'nocCode' | 'operatorId'>
      & { adminAreas?: Maybe<Array<(
        { __typename?: 'AdminAreaInfoType' }
        & Pick<AdminAreaInfoType, 'adminAreaId'>
      )>> }
    )>> }
  ) }
);

export type OperatorLinesQueryVariables = Exact<{
  operatorId: Scalars['String'];
}>;


export type OperatorLinesQuery = (
  { __typename?: 'Query' }
  & { operator?: Maybe<(
    { __typename?: 'OperatorType' }
    & { transitModel: (
      { __typename?: 'TransitModelType' }
      & { lines: (
        { __typename?: 'PaginatedLineType' }
        & { items?: Maybe<Array<(
          { __typename?: 'LineType' }
          & { id: LineType['lineId'], name: LineType['lineName'], number: LineType['lineNumber'] }
        )>> }
      ) }
    ) }
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
    { __typename?: 'SignUpResponseType' }
    & Pick<SignUpResponseType, 'error' | 'success'>
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

export type ServicePatternsQueryVariables = Exact<{
  servicePatternIds?: Maybe<Array<Scalars['String']>>;
}>;


export type ServicePatternsQuery = (
  { __typename?: 'Query' }
  & { servicePatternsInfo: Array<Maybe<(
    { __typename?: 'ServicePatternType' }
    & { stops: Array<Maybe<(
      { __typename?: 'StopType' }
      & Pick<StopType, 'stopId' | 'stopName' | 'lon' | 'lat'>
    )>> }
  )>> }
);

export type VehicleJourneyQueryVariables = Exact<{
  journeyId: Scalars['String'];
  startTime: Scalars['DateTime'];
}>;


export type VehicleJourneyQuery = (
  { __typename?: 'Query' }
  & { vehicleReplay: (
    { __typename?: 'VehicleReplayNamespace' }
    & { getJourney: Array<Maybe<(
      { __typename?: 'GpsFeedType' }
      & Pick<GpsFeedType, 'ts' | 'lat' | 'lon' | 'vehicleId' | 'vehicleJourneyId' | 'servicePatternId' | 'delay' | 'startTime' | 'scheduledDeparture' | 'isTimingPoint' | 'feedStatus' | 'journeyStatus'>
      & { operatorInfo?: Maybe<(
        { __typename?: 'OperatorInfoType' }
        & Pick<OperatorInfoType, 'operatorId' | 'operatorName' | 'nocCode'>
      )>, serviceInfo: (
        { __typename?: 'ServiceInfoType' }
        & Pick<ServiceInfoType, 'serviceId' | 'serviceName' | 'serviceNumber'>
      ), previousStopInfo?: Maybe<(
        { __typename?: 'StopInfoType' }
        & Pick<StopInfoType, 'stopId' | 'stopName'>
      )> }
    )>> }
  ) }
);

export type JourneysQueryVariables = Exact<{
  fromTimestamp: Scalars['DateTime'];
  toTimestamp: Scalars['DateTime'];
  lineId: Scalars['String'];
  filterOnStartTime: Scalars['Boolean'];
}>;


export type JourneysQuery = (
  { __typename?: 'Query' }
  & { vehicleReplay: (
    { __typename?: 'VehicleReplayNamespace' }
    & { findJourneys: Array<Maybe<(
      { __typename?: 'UniqueJourneyType' }
      & Pick<UniqueJourneyType, 'vehicleJourneyId' | 'startTime'>
      & { serviceInfo: (
        { __typename?: 'ServiceInfoType' }
        & Pick<ServiceInfoType, 'serviceName' | 'serviceNumber'>
      ) }
    )>> }
  ) }
);

export type VehicleJourneyTimingPatternQueryVariables = Exact<{
  vehicleJourneyId: Scalars['String'];
}>;


export type VehicleJourneyTimingPatternQuery = (
  { __typename?: 'Query' }
  & { vehicleJourney: Array<Maybe<(
    { __typename?: 'VehicleJourneyType' }
    & Pick<VehicleJourneyType, 'vehicleJourneyId' | 'servicePatternId' | 'timingPatternId' | 'operatorId'>
  )>> }
);

export type TimingPatternDetailQueryVariables = Exact<{
  timingPatternId: Scalars['String'];
}>;


export type TimingPatternDetailQuery = (
  { __typename?: 'Query' }
  & { timingPatternDetail: Array<Maybe<(
    { __typename?: 'TimingPatternDetailType' }
    & Pick<TimingPatternDetailType, 'stopIndex' | 'timingPoint' | 'arrivalTimeOffset' | 'departureTimeOffset' | 'timingPatternId'>
  )>> }
);

export type GetVersionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetVersionQuery = (
  { __typename?: 'Query' }
  & { apiInfo: (
    { __typename?: 'ApiInfoType' }
    & Pick<ApiInfoType, 'version' | 'buildNumber'>
  ) }
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
  data
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
    query corridorsSubsequentStops($stopList: [String]!) {
  corridor {
    addSubsequentStops(stopList: $stopList) {
      stopId
      stopName
      lon
      lat
      localityName
      adminAreaId
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
    query operatorLines($operatorId: String!) {
  operator(operatorId: $operatorId) {
    transitModel {
      lines {
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
export const ServicePatternsDocument = gql`
    query servicePatterns($servicePatternIds: [String!]) {
  servicePatternsInfo(servicePatternIds: $servicePatternIds) {
    stops {
      stopId
      stopName
      lon
      lat
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class ServicePatternsGQL extends Apollo.Query<ServicePatternsQuery, ServicePatternsQueryVariables> {
    document = ServicePatternsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const VehicleJourneyDocument = gql`
    query vehicleJourney($journeyId: String!, $startTime: DateTime!) {
  vehicleReplay {
    getJourney(journeyId: $journeyId, startTime: $startTime) {
      ts
      lat
      lon
      vehicleId
      vehicleJourneyId
      servicePatternId
      delay
      startTime
      scheduledDeparture
      isTimingPoint
      operatorInfo {
        operatorId
        operatorName
        nocCode
      }
      serviceInfo {
        serviceId
        serviceName
        serviceNumber
      }
      previousStopInfo {
        stopId
        stopName
      }
      feedStatus
      journeyStatus
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class VehicleJourneyGQL extends Apollo.Query<VehicleJourneyQuery, VehicleJourneyQueryVariables> {
    document = VehicleJourneyDocument;
    
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
export const VehicleJourneyTimingPatternDocument = gql`
    query vehicleJourneyTimingPattern($vehicleJourneyId: String!) {
  vehicleJourney(vehicleJourneyId: $vehicleJourneyId) {
    vehicleJourneyId
    servicePatternId
    timingPatternId
    operatorId
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class VehicleJourneyTimingPatternGQL extends Apollo.Query<VehicleJourneyTimingPatternQuery, VehicleJourneyTimingPatternQueryVariables> {
    document = VehicleJourneyTimingPatternDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const TimingPatternDetailDocument = gql`
    query timingPatternDetail($timingPatternId: String!) {
  timingPatternDetail(timingPatternId: $timingPatternId) {
    stopIndex
    timingPoint
    arrivalTimeOffset
    departureTimeOffset
    timingPatternId
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class TimingPatternDetailGQL extends Apollo.Query<TimingPatternDetailQuery, TimingPatternDetailQueryVariables> {
    document = TimingPatternDetailDocument;
    
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