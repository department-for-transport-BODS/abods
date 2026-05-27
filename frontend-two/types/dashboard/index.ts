export type StopTypeOption = "TimingPoints" | "AllStops";

export type PerformanceCategories = "onTime" | "late" | "early";

export interface PunctualityOverview {
  onTime?: number | null;
  early?: number | null;
  late?: number | null;
}
