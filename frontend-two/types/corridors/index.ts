export interface CorridorListItem {
  id: number;
  name: string;
  stops: Array<{ stopId: string } | null> | null;
}

export interface CorridorSummary {
  id: number;
  name: string;
  numStops: number;
}

export interface CorridorStop {
  stopId: string;
  stopName: string;
  naptan: string;
  localityName: string | null;
  adminAreaId: string | null;
  sourceId: string | null;
  lon: number;
  lat: number;
}

export interface Corridor {
  id: number;
  name: string;
  stops: CorridorStop[];
}

export interface StopLists {
  orgStops: CorridorStop[];
  nonOrgStops: CorridorStop[];
}

export interface CorridorUpdateInput {
  id: number;
  name: string;
  stopList: string[];
}

export type CorridorGranularity = "day" | "hour" | "minute";

export type MatchType = "estimated" | "evidenced";

export interface CorridorSummaryStats {
  averageTransitTime: number | null;
  numberOfServices: number | null;
  scheduledTransits: number | null;
  totalTransits: number | null;
}

export interface CorridorTransitTimeStat {
  ts?: string | null;
  hour?: number | null;
  dow?: number | null;
  minTransitTime: number;
  maxTransitTime: number;
  avgTransitTime: number | null;
  percentile25: number | null;
  percentile75: number | null;
  category?: string;
  binLabel?: string;
  xAxisCategory?: string;
  xAxisLabel?: string;
}

export interface CorridorHistogramBin {
  bin: number | null;
  freq: number | null;
  xAxisCategory?: string;
  xAxisLabel?: string;
}

export interface ServiceLink {
  fromStop: string;
  toStop: string;
  distance: number;
  routeValidity: string;
  linkRoute: string | null;
}

export interface CorridorServiceStat {
  lineName: string;
  servicePatternName: string;
  noc: string | null;
  operatorName: string | null;
  recordedTransits: number | null;
  scheduledTransits: number | null;
  totalTransitTime: number | null;
}

export interface CorridorStats {
  summaryStats: CorridorSummaryStats;
  transitTimeStats: CorridorTransitTimeStat[];
  transitTimeTimeOfDayStats: CorridorTransitTimeStat[];
  transitTimeDayOfWeekStats: CorridorTransitTimeStat[];
  transitTimeHistogram: CorridorHistogramBin[];
  transitTimePerServiceStats: CorridorServiceStat[];
  serviceLinks: ServiceLink[];
}

export interface CorridorStatsParams {
  corridorId: string;
  fromTimestamp: string;
  toTimestamp: string;
  stopList: string[];
  granularity: CorridorGranularity;
  matchType: MatchType;
}

export interface CorridorHideOutliers {
  journeyTime: boolean;
  timeOfDay: boolean;
  dayOfWeek: boolean;
}
