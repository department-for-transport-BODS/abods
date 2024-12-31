import { DateTime } from "luxon";
import {
  CorridorGranularity,
  CorridorJourneyTimeStatsType,
  CorridorStatsDayOfWeekType,
  CorridorStatsInputType,
  CorridorStatsTimeOfDayType,
  CorridorStatsType,
  CorridorType,
  MatchType,
  Maybe,
  Scalars,
  ServiceLinkType,
  StopType,
} from "../../generated/graphql";
import { Definitely } from "../shared/array-operators";
import { BoxPlotChartDataItem } from "./view/box-plot-chart/box-plot-chart.component";
import { HistogramChartDataItem } from "./view/histogram-chart/histogram-chart.component";

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

export type CorridorSummary = Definitely<Pick<CorridorType, "id" | "name">> & {
  numStops: number;
};

export type Corridor = Pick<CorridorType, "id" | "name"> & {
  stops: CorridorStop[];
};

export type CorridorStats = Pick<
  Definitely<CorridorStatsType>,
  "summaryStats" | "journeyTimePerServiceStats"
> & {
  journeyTimeTimeOfDayStats: (CorridorStatsTimeOfDayType &
    BoxPlotChartDataItem)[];
  journeyTimeDayOfWeekStats: (CorridorStatsDayOfWeekType &
    BoxPlotChartDataItem)[];
  journeyTimeHistogram: HistogramChartDataItem[];
  journeyTimeStats: (CorridorJourneyTimeStatsType & BoxPlotChartDataItem)[];
  serviceLinks: ServiceLinkType[];
};

export type CorridorStatsParams = Pick<
  CorridorStatsInputType,
  "corridorId" | "fromTimestamp" | "toTimestamp" | "stopList"
> &
  Definitely<Pick<CorridorStatsInputType, "granularity">>;

export interface CorridorStatsViewParams {
  corridorId: string;
  from: DateTime;
  to: DateTime;
  granularity: CorridorGranularity;
  stops: CorridorStop[];
  matchType: MatchType;
}

export interface ICorridorJourneyTimeStats {
  avgTransitTime?: Maybe<Scalars["Float"]["output"]>;
  maxTransitTime: Scalars["Int"]["output"];
  minTransitTime: Scalars["Int"]["output"];
  percentile25?: Maybe<Scalars["Float"]["output"]>;
  percentile5?: Maybe<Scalars["Float"]["output"]>;
  percentile75?: Maybe<Scalars["Float"]["output"]>;
}
