// Re-export generated types used by the stop analysis feature
export type {
  BoundingBoxInputType as BoundingBox,
  DayOfWeekFlagsInputType as DayOfWeekFlags,
  StopAnalysisQueryVariables as StopAnalysisFilters,
} from "../../src/generated/graphql";
export { MatchType } from "../../src/generated/graphql";

export type StopStatistics =
  import("../../src/generated/graphql").StopAnalysisQuery["stopAnalysis"][number];

export type AdminArea = NonNullable<
  import("../../src/generated/graphql").GetAdminAreasQuery["adminAreas"]
>[number];

export type Operator =
  import("../../src/generated/graphql").OperatorListQuery["operators"][number];

export type Line =
  import("../../src/generated/graphql").OperatorLinesQuery["lines"][number];

// UI-only types not present in the GraphQL schema
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
