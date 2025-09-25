import { Injectable } from "@angular/core";
import { Maybe } from "graphql/jsutils/Maybe";
import {
  max as _max,
  min as _min,
  range as _range,
  cloneDeep,
} from "lodash-es";
import {
  CorridorHistogramType,
  CorridorStatsDayOfWeekType,
  CorridorStatsTimeOfDayType,
  CorridorTransitTimeStatsType,
  ServiceLinkType,
} from "../../generated/graphql";
import { isNotNullOrUndefined } from "../shared/rxjs-operators";
import {
  fillGaps,
  filterServiceLinksByStopsOrReturnServiceLinks,
} from "./corridors.service";
import {
  CorridorStats,
  CorridorStatsViewParams,
  ICorridortransitTimeStats,
} from "./types";
import { BoxPlotChartDataItem } from "./view/box-plot-chart/box-plot-chart.component";
import { HistogramChartDataItem } from "./view/histogram-chart/histogram-chart.component";

export interface SpeedStats {
  averageSpeed: string;
  transitSpeedStats: (ICorridortransitTimeStats & BoxPlotChartDataItem)[];
  transitSpeedHistogram: HistogramChartDataItem[];
  transitSpeedTimeOfDay: (ICorridortransitTimeStats & BoxPlotChartDataItem)[];
  transitSpeedDayOfWeek: (ICorridortransitTimeStats & BoxPlotChartDataItem)[];
}

export type CorridorStatsType =
  | CorridorTransitTimeStatsType
  | CorridorStatsTimeOfDayType
  | CorridorStatsDayOfWeekType;

@Injectable({
  providedIn: "root",
})
export class CorridorsSpeedMetricService {
  private totalDistance = 0;
  private readonly MS_TO_MPH_FACTOR = 2.237;
  private readonly MIN_TO_SEC_FACTOR = 60;
  private readonly EMPTY_STATS = {
    averageSpeed: "0mph",
    transitSpeedStats: [],
    transitSpeedHistogram: [],
    transitSpeedTimeOfDay: [],
    transitSpeedDayOfWeek: [],
  } as SpeedStats;

  setTotalDistance(serviceLinks: ServiceLinkType[]) {
    this.totalDistance = this.calculateTotalServiceLinkDistance(serviceLinks);
  }

  getTotalDistance(): number {
    return this.totalDistance;
  }

  generateSpeedStats(
    stats: CorridorStats | undefined,
    params: CorridorStatsViewParams | undefined,
  ): SpeedStats {
    const speedStats = this.EMPTY_STATS;
    if (stats) {
      this.setTotalDistance(
        filterServiceLinksByStopsOrReturnServiceLinks(
          stats.serviceLinks,
          params?.stops,
        ),
      );
      speedStats.averageSpeed = this.calculateAverageCorridorSpeedMph(
        stats.summaryStats.averageTransitTime,
      );
      speedStats.transitSpeedStats = this.calculateTransitSpeedBoxPlotStats(
        stats.transitTimeStats,
      );
      speedStats.transitSpeedHistogram = this.calculateTransitSpeedHistogram(
        stats.transitTimeHistogram,
      );
      speedStats.transitSpeedTimeOfDay = this.calculateTransitSpeedBoxPlotStats(
        stats.transitTimeTimeOfDayStats,
      );
      speedStats.transitSpeedDayOfWeek = this.calculateTransitSpeedBoxPlotStats(
        stats.transitTimeDayOfWeekStats,
      );
    }
    return speedStats;
  }

  calculateTotalServiceLinkDistance(serviceLinks: ServiceLinkType[]): number {
    return serviceLinks.reduce((acc, val) => acc + val.distance, 0);
  }

  calculateAverageCorridorSpeedMph(seconds: Maybe<number>): string {
    const speed = this.calculateAvergeSpeedInMph(this.totalDistance, seconds);
    return speed === undefined ? "0mph" : speed + "mph";
  }

  calculateTransitSpeedBoxPlotStats(
    transitTimeStats: (CorridorStatsType & BoxPlotChartDataItem)[],
  ): (CorridorStatsType & BoxPlotChartDataItem)[] {
    const transitSpeeds: (CorridorStatsType & BoxPlotChartDataItem)[] =
      cloneDeep(transitTimeStats);
    transitSpeeds.forEach((item) => {
      item.yAxisMeanValue = this.calculateAvergeSpeedInMph(
        this.totalDistance,
        item.avgTransitTime,
      );
      item.yAxisMaxValue = this.calculateAvergeSpeedInMph(
        this.totalDistance,
        item.minTransitTime,
      );
      item.yAxisMinValue = this.calculateAvergeSpeedInMph(
        this.totalDistance,
        item.maxTransitTime,
      );
      item.minTransitTime = item.yAxisMinValue!;
      item.maxTransitTime = item.yAxisMaxValue!;
      const per25 = item.percentile25;
      item.percentile25 = this.calculateAvergeSpeedInMph(
        this.totalDistance,
        item.percentile75,
      );
      item.percentile75 = this.calculateAvergeSpeedInMph(
        this.totalDistance,
        per25,
      );
    });
    return transitSpeeds;
  }

  calculateTransitSpeedHistogram(
    journeyTimeHist: CorridorHistogramType[],
  ): HistogramChartDataItem[] {
    let transitSpeedHist: CorridorHistogramType[] = cloneDeep(journeyTimeHist);
    // Remove empty bins
    transitSpeedHist = transitSpeedHist.filter(
      (item) => item.freq && item.freq > 0,
    );
    // Calculate speed for each journey time bin
    transitSpeedHist.forEach((item) => {
      // Adjust journey time by 30 seconds so that mid point of the time bin is used
      const timeBin = isNotNullOrUndefined(item.bin) ? item.bin + 0.5 : 0;
      // Calculate the average speed
      item.bin = this.calculateAvergeSpeedInMph(
        this.totalDistance,
        timeBin ? timeBin * this.MIN_TO_SEC_FACTOR : 0,
      );
    });
    // Remove dublicate bins and sum freq
    const bins = new Map<number, CorridorHistogramType>();
    transitSpeedHist.forEach((item) => {
      if (item.bin) {
        const bin = bins.get(item.bin);
        if (bin && typeof bin.freq === "number") {
          bin.freq += typeof item.freq === "number" ? item.freq : 0;
          bins.set(item.bin, bin);
        } else {
          bins.set(item.bin, item);
        }
      }
    });
    transitSpeedHist = Array.from(bins.values());

    const histBins = transitSpeedHist.map((h) => h.bin);
    const histRange = _range(_min(histBins) ?? 0, (_max(histBins) ?? 0) + 2);

    return fillGaps("bin", transitSpeedHist, histRange, (bin) => ({
      xAxisCategory: bin + "",
      xAxisLabel: bin + " mph",
    }));
  }

  calculateAvergeSpeedInMph(
    meters: number,
    seconds: Maybe<number>,
  ): number | undefined {
    if (seconds && seconds > 0) {
      const sum = (meters / seconds) * this.MS_TO_MPH_FACTOR;
      return Math.round(sum);
    }
    return undefined;
  }
}
