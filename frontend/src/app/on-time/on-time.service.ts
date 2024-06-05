import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DelayFrequencyType,
  IPunctualityType,
  OnTimeDelayFrequencyGQL,
  OnTimeOperatorPerformanceListGQL,
  OnTimePunctualityDayOfWeekGQL,
  OnTimePunctualityTimeOfDayGQL,
  OnTimeServicePerformanceListGQL,
  OnTimeStatsGQL,
  OnTimeStopPerformanceListGQL,
  OnTimeTimeSeriesGQL,
  OperatorPerformanceType,
  PerformanceFiltersInputType,
  PerformanceInputType,
  PunctualityDayOfWeekType,
  PunctualityTimeOfDayType,
  PunctualityTimeSeriesType,
  PunctualityTotalsType,
  ServiceInfoGQL,
  ServiceInfoType,
  ServicePerformanceType,
  StopPerformanceType,
} from 'src/generated/graphql';
import { keyBy as _keyBy, range as _range, sum, sumBy } from 'lodash-es';
import { isNotNullOrUndefined, nonNullOrUndefined } from '../shared/rxjs-operators';

export type PerformanceParams = Omit<PerformanceInputType, 'filters'> & { filters: PerformanceFiltersInputType };

export type TimeSeriesData = PunctualityTimeSeriesType & OnTimeRatios;
export type TimeOfDayData = Partial<PunctualityTimeOfDayType> & OnTimeRatios;
export type DayOfWeekData = Partial<Omit<PunctualityDayOfWeekType, 'dayOfWeek'>> & {
  dayOfWeek: string;
} & OnTimeRatios;

export type OperatorPerformance = Pick<
  OperatorPerformanceType,
  'name' | 'nocCode' | 'onTime' | 'late' | 'early' | 'operatorId'
> &
  OnTimeRatios;
export type ServicePerformance = Omit<ServicePerformanceType, 'operatorInfo'> & OnTimeRatios;
export type StopPerformance = StopPerformanceType & OnTimeRatios;
export type AbstractPerformance = IPunctualityType &
  OnTimeRatios &
  Pick<ServicePerformanceType & StopPerformanceType, 'scheduledDepartures' | 'actualDepartures' | 'averageDelay'>;

export type PunctualityOverview = Pick<
  PunctualityTotalsType,
  'early' | 'onTime' | 'late' | 'completed' | 'scheduled'
> & {
  noData: number;
};

// RAA has 1-based days of week starting on Sunday, ISO is 1-based and starts on Monday
const formatDayOfWeek = (dow: number, format = 'ccc') =>
  DateTime.fromObject({ weekday: dow === 1 ? 7 : dow - 1 }).toFormat(format);

const assert = <T>(value?: T | null): T => {
  if (!value) {
    throw new Error();
  }
  return value;
};

export interface OnTimeRatios {
  total: number;
  onTimeRatio: number | null;
  earlyRatio: number | null;
  lateRatio: number | null;
  completedRatio: number | null;
  noData?: number;
}

@Injectable({
  providedIn: 'root',
})
export class OnTimeService {
  constructor(
    private delayFrequencyDataQuery: OnTimeDelayFrequencyGQL,
    private timeSeriesQuery: OnTimeTimeSeriesGQL,
    private onTimeStatsQuery: OnTimeStatsGQL,
    private onTimePunctualityTimeOfDayQuery: OnTimePunctualityTimeOfDayGQL,
    private onTimePunctualityDayOfWeekQuery: OnTimePunctualityDayOfWeekGQL,
    private onTimeServicePerformanceListQuery: OnTimeServicePerformanceListGQL,
    private onTimeStopPerformanceListQuery: OnTimeStopPerformanceListGQL,
    private onTimeOperatorPerformanceListQuery: OnTimeOperatorPerformanceListGQL,
    private serviceInfoQuery: ServiceInfoGQL
  ) {}

  fetchOnTimeStats(params: PerformanceParams): Observable<PunctualityOverview> {
    return this.onTimeStatsQuery.watch({ params }, { fetchPolicy: 'no-cache' }).valueChanges.pipe(
      map(({ data }) => assert(data?.onTimePerformance?.punctualityOverview)),
      map((overview: PunctualityTotalsType) => {
        return {
          ...overview,
          // If maxEarly / maxLate filter set we don't receive scheduled or completed numbers, we can infer completed:
          completed: overview.completed || overview.early + overview.onTime + overview.late,
          noData: overview.scheduled || overview.completed ? Math.max(0, overview.scheduled - overview.completed) : NaN,
        };
      })
    );
  }

  fetchOnTimeDelayFrequencyData(params: PerformanceParams): Observable<DelayFrequencyType[]> {
    return this.delayFrequencyDataQuery
      .fetch(
        {
          params,
        },
        { fetchPolicy: 'no-cache', errorPolicy: 'none' }
      )
      .pipe(map(({ data }) => this.fillDelayFrequencyGaps(assert(data?.onTimePerformance?.delayFrequency))));
  }

  fetchOnTimeTimeSeriesData(params: PerformanceParams): Observable<TimeSeriesData[]> {
    return this.timeSeriesQuery
      .watch({ params }, { fetchPolicy: 'no-cache', errorPolicy: 'none' })
      .valueChanges.pipe(
        map(({ data }) => assert(data?.onTimePerformance?.punctualityTimeSeries).map(this.calculateOnTimePcts))
      );
  }

  fetchOnTimePunctualityTimeOfDayData(params: PerformanceParams): Observable<TimeOfDayData[]> {
    return this.onTimePunctualityTimeOfDayQuery
      .fetch({ params }, { fetchPolicy: 'no-cache', errorPolicy: 'none' })
      .pipe(
        map(({ data }) =>
          this.fillTimeOfDayGaps(
            assert(data?.onTimePerformance?.punctualityTimeOfDay).map((value) => {
              const time = DateTime.fromISO(value.timeOfDay, { zone: 'utc' });
              const timeOfDay = time.toFormat('HH:mm');
              return {
                ...this.calculateOnTimePcts(value),
                timeOfDay,
                tooltipLabel: `${timeOfDay} - ${time.plus({ hours: 1 }).toFormat('HH:mm')}`,
              };
            })
          )
        )
      );
  }

  fetchOnTimePunctualityDayOfWeekData(params: PerformanceParams): Observable<DayOfWeekData[]> {
    return this.onTimePunctualityDayOfWeekQuery
      .fetch({ params }, { fetchPolicy: 'no-cache', errorPolicy: 'none' })
      .pipe(
        map(({ data }) =>
          this.fillDayOfWeekGaps(
            assert(data?.onTimePerformance?.punctualityDayOfWeek).map((value) => {
              return {
                ...this.calculateOnTimePcts(value),
                dayOfWeek: formatDayOfWeek(value.dayOfWeek),
                tooltipLabel: formatDayOfWeek(value.dayOfWeek, 'cccc'),
              };
            })
          )
        )
      );
  }

  fetchOnTimePerformanceList(params: PerformanceParams): Observable<ServicePerformance[]> {
    return this.onTimeServicePerformanceListQuery
      .fetch({ params }, { fetchPolicy: 'no-cache', errorPolicy: 'none' })
      .pipe(map(({ data }) => (data?.onTimePerformance?.servicePerformance ?? []).map(this.calculateOnTimePcts)));
  }

  fetchStopPerformanceList(params: PerformanceInputType): Observable<StopPerformance[]> {
    return this.onTimeStopPerformanceListQuery
      .watch({ params }, { fetchPolicy: 'no-cache', errorPolicy: 'none' })
      .valueChanges.pipe(
        map(({ data }) =>
          (data?.onTimePerformance?.stopPerformance ?? [])
            .map(this.calculateOnTimePcts)
            .sort((a, b) => a.stopInfo.stopName.localeCompare(b.stopInfo.stopName))
        )
      );
  }

  fetchOperatorPerformanceList(params: PerformanceInputType): Observable<OperatorPerformance[]> {
    return this.onTimeOperatorPerformanceListQuery
      .watch({ params }, { fetchPolicy: 'no-cache', errorPolicy: 'none' })
      .valueChanges.pipe(
        map(
          ({ data }) =>
            data?.onTimePerformance?.operatorPerformance?.items
              ?.filter(isNotNullOrUndefined)
              .map(this.calculateOnTimePcts) ?? []
        )
      );
  }

  fetchServiceInfo(lineId: string): Observable<ServiceInfoType> {
    return this.serviceInfoQuery.fetch({ lineId }, { fetchPolicy: 'no-cache', errorPolicy: 'none' }).pipe(
      map((result) => result.data?.serviceInfo),
      nonNullOrUndefined()
    );
  }

  calculateOnTimePcts<T extends { onTime?: number; late?: number; early?: number }>(val: T): T & OnTimeRatios {
    const { onTime, late, early } = val;

    let total = 0;
    if (onTime || early || late) {
      total = (onTime ?? 0) + (late ?? 0) + (early ?? 0);
    }

    return {
      ...val,
      total,
      onTimeRatio: (onTime ?? 0) / total || 0,
      lateRatio: (late ?? 0) / total || 0,
      earlyRatio: (early ?? 0) / total || 0,
      completedRatio: 0,
    };
  }

  fillDelayFrequencyGaps(data: DelayFrequencyType[]): DelayFrequencyType[] {
    const init = [...data]; // Prevent destruction of parameter
    if (init.length === 0) {
      return init;
    }
    return init.reduceRight(
      ([ahead, ...acc], value) => {
        const filler = _range(value.bucket + 1, ahead.bucket).map((bucket) => ({ bucket, frequency: 0 }));
        return [value, ...filler, ahead, ...acc];
      },
      [init.pop() as DelayFrequencyType]
    );
  }

  private fillGaps<T extends OnTimeRatios>(
    key: keyof T,
    range: number[],
    indexer: (n: number) => string | number,
    data: T[]
  ): T[] {
    if (data.length === 0) {
      // Don't fill gaps in empty data
      return [];
    }
    const defaults: T[] = range.map(
      (n) =>
        (({
          [key]: indexer(n),
          noData: 1,
          onTimeRatio: null,
          lateRatio: null,
          earlyRatio: null,
        } as unknown) as T)
    );

    return Object.values({ ..._keyBy(defaults, key), ..._keyBy(data, key) });
  }

  fillTimeOfDayGaps(data: TimeOfDayData[]): TimeOfDayData[] {
    return this.fillGaps('timeOfDay', _range(0, 24), (hour) => DateTime.fromObject({ hour }).toFormat('HH:mm'), data);
  }

  fillDayOfWeekGaps(data: DayOfWeekData[]): DayOfWeekData[] {
    return this.fillGaps('dayOfWeek', [..._range(2, 8), 1], formatDayOfWeek, data);
  }

  calculateTotals<T extends AbstractPerformance>(data: T[]): T[] {
    const early = sumBy(data, 'early');
    const late = sumBy(data, 'late');
    const onTime = sumBy(data, 'onTime');
    const total = sumBy(data, 'total');
    return [
      {
        early,
        late,
        onTime,
        earlyRatio: early / total || 0,
        lateRatio: late / total || 0,
        onTimeRatio: onTime / total || 0,
        scheduledDepartures: sumBy(data, 'scheduledDepartures'),
        actualDepartures: sumBy(data, 'actualDepartures'),
        averageDelay:
          sum(data.map((stop) => stop.actualDepartures * stop.averageDelay)) / sumBy(data, 'actualDepartures') || 0,
      } as T,
    ];
  }
}
