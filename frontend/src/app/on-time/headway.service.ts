import { Injectable } from '@angular/core';
import {
  FrequentServiceInfoType,
  HeadwayFrequentServiceInfoGQL,
  HeadwayFrequentServicesGQL,
  HeadwayInputType,
  HeadwayOverviewGQL,
  HeadwayTimeSeriesGQL,
} from '../../generated/graphql';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { nonNullishArray, NullishArray } from '../shared/array-operators';
import { assertNonNullish } from '../shared/rxjs-operators';
import { pick } from 'lodash-es';
import { PerformanceParams } from './on-time.service';

export interface Headway {
  actual: number;
  scheduled: number;
  excess: number;
}

export interface HeadwayTimeSeries extends Headway {
  ts: string;
}

export interface FrequentService {
  serviceId: string;
}

export type HeadwayParams = Omit<HeadwayInputType, 'sortBy'>;

const assertHasOneElement: (arr: NullishArray<string>) => asserts arr is [string] = (arr) => {
  if (!arr?.length || arr[0] === null || arr[0] === undefined) {
    throw new Error('Array must have one element'); // This should never happen
  }
};

/**
 * ABOD-487 Exclude properties that the headway queries don't support. Typescript's excess property checking doesn't
 * raise an error when types overlap sufficiently, and exact types have yet to be implemented.
 * @see https://github.com/microsoft/TypeScript/issues/12936
 */
const pickHeadwayFilters = ({ filters, ...params }: PerformanceParams | HeadwayParams): HeadwayParams => ({
  ...params,
  filters: pick(filters, ['dayOfWeekFlags', 'endTime', 'granularity', 'lineIds', 'operatorIds', 'startTime']),
});

@Injectable({
  providedIn: 'root',
})
export class HeadwayService {
  constructor(
    private timeSeriesGQL: HeadwayTimeSeriesGQL,
    private overviewGQL: HeadwayOverviewGQL,
    private frequentServicesGQL: HeadwayFrequentServicesGQL,
    private frequentServiceInfoGQL: HeadwayFrequentServiceInfoGQL
  ) {}

  fetchTimeSeries(params: HeadwayParams): Observable<HeadwayTimeSeries[]> {
    return this.timeSeriesGQL
      .fetch({ params: pickHeadwayFilters(params) }, { fetchPolicy: 'no-cache' })
      .pipe(map((result) => nonNullishArray(result.data?.headwayMetrics?.headwayTimeSeries)));
  }

  fetchOverview(params: HeadwayParams): Observable<Headway> {
    return this.overviewGQL
      .watch({ params: pickHeadwayFilters(params) }, { fetchPolicy: 'no-cache' })
      .valueChanges.pipe(
        map((result) => result.data?.headwayMetrics.headwayOverview),
        assertNonNullish()
      );
  }

  fetchFrequentServices({ filters, fromTimestamp, toTimestamp }: HeadwayParams): Observable<FrequentService[]> {
    assertHasOneElement(filters?.operatorIds);
    const [operatorId] = filters?.operatorIds ?? [''];

    return this.frequentServicesGQL
      .fetch(
        {
          operatorId,
          fromTimestamp,
          toTimestamp,
        },
        { fetchPolicy: 'no-cache' }
      )
      .pipe(map((result) => nonNullishArray(result.data?.headwayMetrics.frequentServices)));
  }

  fetchFrequentServiceInfo({
    filters,
    fromTimestamp,
    toTimestamp,
  }: HeadwayParams): Observable<FrequentServiceInfoType> {
    assertHasOneElement(filters?.operatorIds);
    assertHasOneElement(filters?.lineIds);
    const [operatorId] = filters?.operatorIds ?? [''];
    const [lineId] = filters?.lineIds ?? [''];
    const dayOfWeekFlags = filters?.dayOfWeekFlags;
    const startTime = filters?.startTime;
    const endTime = filters?.endTime;

    return this.frequentServiceInfoGQL
      .watch(
        {
          inputs: {
            filters: {
              operatorId,
              lineId,
              dayOfWeekFlags,
              startTime,
              endTime,
            },
            fromTimestamp,
            toTimestamp,
          },
        },
        { fetchPolicy: 'no-cache' }
      )
      .valueChanges.pipe(
        map((result) => result.data?.headwayMetrics.frequentServiceInfo),
        assertNonNullish()
      );
  }
}
