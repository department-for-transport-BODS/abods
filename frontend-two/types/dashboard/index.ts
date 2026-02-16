export interface OperatorDashboard {
  name: string;
  operatorId: string;
  nocCode?: string | null;
  feedMonitoring?: {
    feedStatus?: string | null;
    liveStats?: {
      feedErrors?: number | null;
      feedAlerts?: number | null;
    } | null;
  } | null;
}

export interface DashboardVehicles {
  operatorId: string;
  expected: number;
  actual: number;
}

export type StopTypeOption = "TimingPoints" | "AllStops";

export type PerformanceCategories = "OnTime" | "Late" | "Early";

export type RankingOrder = "ascending" | "descending";

export interface PerformanceFiltersInputType {
  timingPointsOnly?: boolean;
  operatorIds?: string[];
  matchType?: string;
}

export interface PunctualityOverview {
  onTime?: number | null;
  early?: number | null;
  late?: number | null;
}

export interface ServicePunctualityTrend {
  onTime?: number | null;
  early?: number | null;
  late?: number | null;
}

export interface ServicePunctuality {
  nocCode?: string | null;
  lineId?: string | null;
  lineInfo?: {
    serviceId?: string | null;
    serviceName?: string | null;
    serviceNumber?: string | null;
  } | null;
  onTime?: number | null;
  early?: number | null;
  late?: number | null;
  trend?: ServicePunctualityTrend | null;
}
