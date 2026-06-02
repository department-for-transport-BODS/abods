import { sumBy, stdDeviation } from "@/utils/maths";
import { StopType } from "../../src/generated/graphql";
import { StopPerformance } from "./on-time.service";
import { ServicePattern } from "./transit-model.service";

export type NormalizedStopPerformance = StopPerformance & {
  earlyNorm: number;
  lateNorm: number;
  delayNorm: number;
};

export type NormalizedStop = Omit<NormalizedStopPerformance, "noData"> &
  Omit<StopType, "__typename"> & {
    naptan: string;
    noData: boolean;
    stopLocality?: string;
  };

const uniqueStopsById = (
  patterns: ServicePattern[],
): ServicePattern["stops"] => {
  const map = new Map<string, ServicePattern["stops"][number]>();
  for (const pattern of patterns) {
    for (const stop of pattern.stops ?? []) {
      if (stop && !map.has(stop.stopId)) {
        map.set(stop.stopId, stop);
      }
    }
  }
  return Array.from(map.values());
};

const normalize = (stops: StopPerformance[]): NormalizedStopPerformance[] => {
  const early = sumBy(stops, "early");
  const late = sumBy(stops, "late");
  const total = sumBy(stops, "total");
  const delay = stops.reduce(
    (acc, stop) => acc + stop.actualDepartures * (stop.averageDelay ?? 0),
    0,
  );

  const earlyMean = total ? early / total : 0;
  const earlySigma = stdDeviation(
    stops.map((s) => s.earlyRatio ?? null),
    earlyMean,
  );

  const lateMean = total ? late / total : 0;
  const lateSigma = stdDeviation(
    stops.map((s) => s.lateRatio ?? null),
    lateMean,
  );

  const delayMean = total ? delay / total : 0;
  const delaySigma = stdDeviation(
    stops.map((s) => s.averageDelay ?? null),
    delayMean,
  );

  return stops.map((stop) => ({
    ...stop,
    earlyNorm:
      early === total
        ? 1
        : early <= 0
          ? 0
          : earlySigma
            ? ((stop.earlyRatio ?? 0) - earlyMean) / earlySigma
            : 0,
    lateNorm:
      late === total
        ? 1
        : late <= 0
          ? 0
          : lateSigma
            ? ((stop.lateRatio ?? 0) - lateMean) / lateSigma
            : 0,
    delayNorm: delaySigma
      ? ((stop.averageDelay ?? 0) - delayMean) / delaySigma
      : 0,
  }));
};

const mergeStops = (
  stopPerformance: StopPerformance[],
  servicePatterns: ServicePattern[],
): NormalizedStop[] => {
  const tmStops = uniqueStopsById(servicePatterns);
  const otpStops = normalize(
    stopPerformance.filter(
      (stop) => stop.early + stop.onTime + stop.late > 0 || stop.timingPoint,
    ),
  );

  const merged: Record<string, Record<string, unknown>> = {};
  for (const stop of tmStops) {
    merged[stop.stopId] = { ...stop } as Record<string, unknown>;
  }
  for (const stop of otpStops) {
    merged[stop.stopId] = { ...merged[stop.stopId], ...stop };
  }

  return Object.values(merged).map((stop) => {
    const typed = stop as unknown as NormalizedStop;
    return {
      ...typed,
      naptan: typed.stopId,
      stopLocality: typed.stopInfo
        ? `${typed.stopInfo.stopLocality.localityName}, ${typed.stopInfo.stopLocality.localityAreaName}`
        : undefined,
      noData:
        (typed.onTime ?? 0) + (typed.early ?? 0) + (typed.late ?? 0) === 0,
    };
  });
};

export const stopPerformanceService = {
  mergeStops,
  normalize,
};
