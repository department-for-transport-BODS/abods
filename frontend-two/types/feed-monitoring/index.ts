export interface VehicleStat {
  actual: number;
  expected: number;
  timestamp: string;
}

export interface FeedMonitoringOperator {
  name: string;
  nocCode: string;
  operatorId: string;
  feedMonitoring?: {
    feedStatus?: boolean | null;
    availability?: number | null;
    lastOutage?: string | null;
    unavailableSince?: string | null;
    liveStats?: {
      updateFrequency?: number | null;
    } | null;
  } | null;
}

export interface OperatorLiveStatus {
  name: string;
  nocCode: string;
  operatorId: string;
  feedMonitoring?: {
    feedStatus?: boolean | null;
    availability?: number | null;
    lastOutage?: string | null;
    unavailableSince?: string | null;
    liveStats?: {
      updateFrequency?: number | null;
      currentVehicles?: number | null;
      expectedVehicles?: number | null;
      last24Hours?: VehicleStat[] | null;
      last20Minutes?: VehicleStat[] | null;
    } | null;
  } | null;
}

export interface OperatorFeedHistory {
  name: string;
  nocCode: string;
  operatorId: string;
  feedMonitoring?: {
    historicalStats?: {
      updateFrequency?: number | null;
      availability?: number | null;
    } | null;
    vehicleStats?: VehicleStat[] | null;
  } | null;
}

export interface FeedEvent {
  timestamp: string;
  type: string;
  data?: { message?: string | null } | null;
}

export interface EventStat {
  count: number;
  day: string;
}