import { Definitely } from "@/utils/array-operators";
import {
  CorridorGranularity,
  CorridorHistogramType,
  CorridorStatsDayOfWeekType,
  CorridorStatsQuery,
  CorridorStatsTimeOfDayType,
  CorridorStatsType,
  CorridorTransitTimeStatsType,
  CorridorType,
  MatchType,
  Maybe,
  ServiceLinkType,
  StopType,
} from "../../src/generated/graphql";
import { DateTime } from "luxon";

export type CorridorSummary = Definitely<Pick<CorridorType, "id" | "name">> & {
  numStops: number;
};

export type Corridor = Pick<CorridorType, "id" | "name"> & {
  stops: CorridorStop[];
};

export type CorridorStop = Pick<
  StopType,
  | "stopId"
  | "stopName"
  | "lon"
  | "lat"
  | "localityName"
  | "adminAreaId"
  | "sourceId"
> & {
  naptan: string;
  intId: number;
};

export interface StopLists {
  orgStops: CorridorStop[];
  nonOrgStops: CorridorStop[];
}

export interface BoxPlotChartDataItem {
  yAxisMinValue?: number;
  yAxisMaxValue?: number;
  yAxisMeanValue?: number;
  category?: any;
  binLabel?: any;
  isoDayOfWeek?: any;
}

export type HistogramChartDataItem = CorridorHistogramType & {
  xAxisCategory: string;
  xAxisLabel: string;
};

export type CorridorStats = Pick<
  Definitely<CorridorStatsType>,
  "summaryStats" | "transitTimePerServiceStats"
> & {
  transitTimeTimeOfDayStats: (CorridorStatsTimeOfDayType &
    BoxPlotChartDataItem)[];
  transitTimeDayOfWeekStats: (CorridorStatsDayOfWeekType &
    BoxPlotChartDataItem)[];
  transitTimeHistogram: HistogramChartDataItem[];
  transitTimeStats: (CorridorTransitTimeStatsType & BoxPlotChartDataItem)[];
  serviceLinks: ServiceLinkType[];
};

export interface CorridorHideOutliers {
  journeyTime: boolean;
  timeOfDay: boolean;
  dayOfWeek: boolean;
}

export interface CorridorStatsViewParams {
  corridorId: string;
  from: DateTime<true>;
  to: DateTime<true>;
  granularity: CorridorGranularity;
  stops: CorridorStop[];
  matchType: MatchType;
}

export type CorridorTimeStats =
  | CorridorTransitTimeStatsType
  | CorridorStatsTimeOfDayType
  | CorridorStatsDayOfWeekType;
