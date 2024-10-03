import { Injectable } from '@angular/core';
import { ServicePattern } from './transit-model.service';
import { StopPerformance } from './on-time.service';
import { flatMap, keyBy, map as _map, mean as _mean, merge, sum, sumBy, uniqWith, values } from 'lodash-es';
import { isNotNullOrUndefined } from '../shared/rxjs-operators';
import { StopType } from '../../generated/graphql';

export type NormalizedStopPerformance = StopPerformance & { earlyNorm: number; lateNorm: number; delayNorm: number };
export type NormalizedStop = Omit<NormalizedStopPerformance, 'noData'> &
  Omit<StopType, '__typename'> & { naptan: string; noData: boolean; stopLocality?: string };

const mutable = <T>(arr: T[]) => arr.map((x) => ({ ...x }));

@Injectable({ providedIn: 'root' })
export class StopPerformanceService {
  mergeStops(stopPerformance: StopPerformance[], servicePatterns: ServicePattern[]): NormalizedStop[] {
    // Get all unique stops from the transit model data
    const tmStops = uniqWith(
      flatMap(servicePatterns, (servicePattern) => servicePattern.stops),
      (a, b) => a.stopId === b.stopId
    );

    // Get on-time performance data and scale the values to fit a unit normal distribution
    const otpStops = this.normalize(
      stopPerformance.filter((stop) => stop.early + stop.onTime + stop.late > 0 || stop.timingPoint)
    );

    // Theres no guarantee that the transit model and OTP model have the same stops, so use both and merge by stopId
    const mergedStops = values(merge(keyBy(mutable(tmStops), 'stopId'), keyBy(otpStops, 'stopId')));

    // TODO strip redundant properties maybe?
    return mergedStops.map((stop) => ({
      ...stop,
      naptan: stop.stopId.substring(2),
      stopLocality:
        stop.stopInfo !== undefined
          ? `${stop.stopInfo.stopLocality.localityName}, ${stop.stopInfo.stopLocality.localityAreaName}`
          : undefined,
      noData: (stop.onTime ?? 0) + (stop.early ?? 0) + (stop.late ?? 0) === 0,
    }));
  }

  // Scale performance values to fit a normal distribution with mean zero and standard deviation one
  normalize(stops: StopPerformance[]): NormalizedStopPerformance[] {
    // TODO is this the correct way to calculate standard deviation for this data set? Its close enough for now!
    const stdDeviation = (arr: (number | null)[], mean: number) =>
      Math.sqrt(_mean(arr.filter(isNotNullOrUndefined).map((value) => Math.pow(value - mean, 2))));

    const early = sumBy(stops, 'early');
    const late = sumBy(stops, 'late');
    const total = sumBy(stops, 'total');
    const delay = sum(stops.map((stop) => stop.actualDepartures * stop.averageDelay));

    const earlyMean = early / total;
    const earlySigma = stdDeviation(_map(stops, 'earlyRatio'), earlyMean);

    const lateMean = late / total;
    const lateSigma = stdDeviation(_map(stops, 'lateRatio'), lateMean);

    const delayMean = delay / total;
    const delaySigma = stdDeviation(_map(stops, 'averageDelay'), delayMean);

    return stops.map((stop) => ({
      ...stop,
      earlyNorm: early === total ? 1 : early <= 0 ? 0 : ((stop.earlyRatio ?? 0) - earlyMean) / earlySigma,
      lateNorm: late === total ? 1 : late <= 0 ? 0 : ((stop.lateRatio ?? 0) - lateMean) / lateSigma,
      delayNorm: ((stop.averageDelay ?? 0) - delayMean) / delaySigma,
    }));
  }
}
