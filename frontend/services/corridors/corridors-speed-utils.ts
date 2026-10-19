import { max as _max, min as _min, range as _range } from "lodash-es";
import {
  CorridorStatsPerServiceType,
  RouteType,
  ServiceLinkType,
} from "../../src/generated/graphql";
import {
  BoxPlotChartDataItem,
  CorridorStats,
  CorridorStop,
  CorridorTimeStats,
  HistogramChartDataItem,
} from "@/types/corridors";

const MS_TO_MPH_FACTOR = 2.237;

export const isInvalidRouteLink = (link: ServiceLinkType): boolean =>
  link.routeValidity !== RouteType.Valid;

export const serviceLinksForStops = (
  serviceLinks: ServiceLinkType[],
  stops: Pick<CorridorStop, "naptan">[],
): ServiceLinkType[] => {
  const naptans = new Set(stops.map((stop) => stop.naptan));
  return serviceLinks.filter(
    (link) => naptans.has(link.fromStop) && naptans.has(link.toStop),
  );
};

export const calculateTotalServiceLinkDistance = (
  serviceLinks: ServiceLinkType[],
): number => serviceLinks.reduce((acc, link) => acc + link.distance, 0);

export const calculateAverageSpeedInMph = (
  meters: number,
  seconds: number | null | undefined,
): number | undefined => {
  if (seconds && seconds > 0) {
    return Math.round((meters / seconds) * MS_TO_MPH_FACTOR);
  }
  return undefined;
};

export const averageSpeedLabel = (
  serviceLinks: ServiceLinkType[],
  averageTransitTime: number | null | undefined,
): string => {
  const totalDistance = calculateTotalServiceLinkDistance(serviceLinks);
  const speed = calculateAverageSpeedInMph(totalDistance, averageTransitTime);
  return `${speed ?? 0}mph`;
};

export const averageServiceSpeedLabel = (
  serviceLinks: ServiceLinkType[],
  service: CorridorStatsPerServiceType,
): string => {
  const totalDistance = calculateTotalServiceLinkDistance(serviceLinks);
  const recorded = service.recordedTransits ?? 0;
  if (!recorded || !service.totalTransitTime) return "0mph";

  const avgJourneyTimeSeconds = service.totalTransitTime / recorded;
  const speed = calculateAverageSpeedInMph(
    totalDistance,
    avgJourneyTimeSeconds,
  );
  return `${speed ?? 0}mph`;
};

const SECONDS_PER_MINUTE = 60;

// A faster journey is a higher speed, so the time extremes and quartiles swap ends
const toSpeedBoxPlot = <T extends CorridorTimeStats & BoxPlotChartDataItem>(
  rows: T[],
  meters: number,
): T[] =>
  rows.map((row) => {
    const mph = (seconds: number | null | undefined) =>
      calculateAverageSpeedInMph(meters, seconds) ?? null;
    return {
      ...row,
      avgTransitTime: mph(row.avgTransitTime),
      minTransitTime: mph(row.maxTransitTime) ?? 0,
      maxTransitTime: mph(row.minTransitTime) ?? 0,
      percentile25: mph(row.percentile75),
      percentile75: mph(row.percentile25),
    };
  });

// Journey time bins are whole minutes; use each bin's midpoint and sum bins that round to the same mph
const toSpeedHistogram = (
  histogram: HistogramChartDataItem[],
  meters: number,
): HistogramChartDataItem[] => {
  const freqBySpeed = new Map<number, number>();
  histogram.forEach(({ bin, freq }) => {
    if (bin === null || bin === undefined || !freq) return;
    const speed = calculateAverageSpeedInMph(
      meters,
      (bin + 0.5) * SECONDS_PER_MINUTE,
    );
    if (!speed) return;
    freqBySpeed.set(speed, (freqBySpeed.get(speed) ?? 0) + freq);
  });

  const speeds = [...freqBySpeed.keys()];
  return _range(_min(speeds) ?? 0, (_max(speeds) ?? 0) + 2).map((speed) => ({
    bin: speed,
    freq: freqBySpeed.get(speed) ?? 0,
    xAxisCategory: `${speed}`,
    xAxisLabel: `${speed} mph`,
  }));
};

export const toSpeedStats = (
  stats: CorridorStats,
  meters: number,
): CorridorStats => ({
  ...stats,
  transitTimeStats: toSpeedBoxPlot(stats.transitTimeStats, meters),
  transitTimeTimeOfDayStats: toSpeedBoxPlot(
    stats.transitTimeTimeOfDayStats,
    meters,
  ),
  transitTimeDayOfWeekStats: toSpeedBoxPlot(
    stats.transitTimeDayOfWeekStats,
    meters,
  ),
  transitTimeHistogram: toSpeedHistogram(stats.transitTimeHistogram, meters),
});
