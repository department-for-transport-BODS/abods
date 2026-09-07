export type StopTypeOption = "TimingPoints" | "AllStops";

export type Direction = "Inbound" | "Outbound";

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
