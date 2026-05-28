export interface StopStatistics {
  atcoCode: string;
  stopName: string;
  localityName: string;
  adminAreaName: string;
  timingPoint: boolean;
  latitude: number;
  longitude: number;
  early: number;
  late: number;
  onTime: number;
  scheduledDepartures: number;
  completedDepartures: number;
  totalDelay: number;
  earlyInSeconds: number | null;
  lateInSeconds: number | null;
  onTimeInSeconds: number | null;
  averageDelay: number | null;
  direction: string | null;
  countDelayed: number | null;
  averageScheduled: number | null;
  averageScheduledTimingPoint: number | null;
  averageActual: number | null;
  averageActualTimingPoint: number | null;
}

export interface BoundingBox {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
}

export interface DayOfWeekFlags {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export type MatchType = "estimated" | "evidenced";

export type StopTypeOption = "TimingPoints" | "AllStops";

export type Direction = "Inbound" | "Outbound";

export interface StopAnalysisFilters {
  adminAreaIds: string[];
  boundingBox: BoundingBox;
  fromTimestamp: string;
  toTimestamp: string;
  operatorIds: string[];
  lineIds: string[];
  matchType: MatchType;
  dayOfWeekFlags?: DayOfWeekFlags;
  startTime?: string;
  endTime?: string;
}

export interface AdminArea {
  id: string;
  name: string;
  shape: string;
}

export interface Operator {
  name: string;
  nocCode: string;
  operatorId: string;
  adminAreaIds: string[];
}

export interface Line {
  id: string;
  name: string;
  number: string;
  adminAreaIds: number[];
}

export interface StopPerformanceRow {
  stopId: string;
  stopName: string;
  localityName: string;
  adminAreaName: string;
  timingPoint: boolean;
  latitude: number;
  longitude: number;
  direction: string | null;
  scheduledDepartures: number;
  actualDepartures: number;
  onTime: number;
  early: number;
  late: number;
  onTimeRatio: number;
  earlyRatio: number;
  lateRatio: number;
  completedRatio: number;
  averageDelay: number | undefined;
  averageScheduled: number | null | undefined;
  averageActual: number | null | undefined;
  onTimeInSeconds: number | undefined;
  earlyInSeconds: number | undefined;
  lateInSeconds: number | undefined;
}
