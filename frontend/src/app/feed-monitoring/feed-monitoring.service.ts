import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  BasicOperatorFragment,
  EventsGQL,
  EventStatsGQL,
  EventStatsType,
  EventType,
  FeedMonitoringListGQL,
  OperatorFeedHistoryFragment,
  OperatorHistoricStatsGQL,
  OperatorListGQL,
  OperatorLiveStatusFragment,
  OperatorLiveStatusGQL,
  OperatorSparklineStatsGQL,
  VehicleStatsType,
} from 'src/generated/graphql';
import { nonNullishArray } from '../shared/array-operators';

export type EventStats = Pick<EventStatsType, 'count' | 'day'>;

@Injectable({
  providedIn: 'root',
})
export class FeedMonitoringService {
  constructor(
    private feedMonitoringListQuery: FeedMonitoringListGQL,
    private operatorSparklineStatsQuery: OperatorSparklineStatsGQL,
    private operatorLiveStatusQuery: OperatorLiveStatusGQL,
    private operatorHistoricStatsQuery: OperatorHistoricStatsGQL,
    private operatorListQuery: OperatorListGQL,
    private eventsQuery: EventsGQL,
    private eventStatsQuery: EventStatsGQL
  ) {}

  get listOperators(): Observable<{ nocCode: string; operatorId: string; name?: string | null }[]> {
    return this.operatorListQuery
      .fetch()
      .pipe(
        map(
          ({ data }) =>
            data?.operators?.items?.map((x) => x as { nocCode: string; operatorId: string; name?: string | null }) ?? []
        )
      );
  }

  fetchFeedMonitoringList(): Observable<BasicOperatorFragment[] | null> {
    return this.feedMonitoringListQuery.fetch().pipe(
      map(({ data }) => {
        if (!data?.operators?.items?.length) {
          console.warn('No operators configured for user.');
          return [];
        } else {
          return data?.operators.items?.map((x) => x as BasicOperatorFragment);
        }
      }),
      catchError(() => of(null))
    );
  }

  fetchOperatorSparklines(
    operatorIds: string[]
  ): Observable<{ operatorId?: string | null; last24Hours: VehicleStatsType[] }[] | null> {
    return this.operatorSparklineStatsQuery.fetch({ operatorIds }).pipe(
      map(({ data }) => {
        if (!data?.operators?.items) {
          console.warn('Failed to fetch sparkline stats', operatorIds);
          return null;
        } else {
          return data.operators.items.map((item) => ({
            operatorId: item?.operatorId,
            last24Hours: item?.feedMonitoring?.liveStats?.last24Hours?.map((x) => x as VehicleStatsType) ?? [],
          }));
        }
      })
    );
  }

  fetchOperator(operatorId: string): Observable<OperatorLiveStatusFragment | null> {
    return this.operatorLiveStatusQuery.fetch({ operatorId }).pipe(
      map((res) => {
        const operator = res?.data?.operator ?? null;
        if (!operator && res?.errors) {
          throw new Error(res.errors.map(({ message }) => message).join(', '));
        }
        return operator;
      })
    );
  }

  fetchOperatorHistory(operatorId: string, date: DateTime): Observable<OperatorFeedHistoryFragment | null> {
    return this.operatorHistoricStatsQuery
      .fetch({
        operatorId,
        date: date.toISODate(),
        start: date.startOf('day').toUTC().toISO(),
        end: date.endOf('day').toUTC().toISO(),
      })
      .pipe(
        map((res) => {
          const operator = res?.data?.operator ?? null;
          if (!operator && res?.errors) {
            throw new Error(res.errors.map(({ message }) => message).join(', '));
          }
          return operator;
        })
      );
  }

  fetchAlerts(operatorId: string, start: DateTime, end: DateTime): Observable<EventType[] | null> {
    return this.eventsQuery.fetch({ operatorId, start: start.toUTC().toJSDate(), end: end.toUTC().toJSDate() }).pipe(
      map((res) => res?.data?.events?.items ?? null),
      catchError(() => of(null))
    );
  }

  fetchAlertStats(operatorId: string, end: DateTime, days = 90): Observable<EventStats[]> {
    return this.eventStatsQuery
      .fetch({
        operatorId,
        start: end.minus({ days }).startOf('day').toUTC().toJSDate(),
        end: end.startOf('day').toUTC().toJSDate(),
      })
      .pipe(map((res) => nonNullishArray(res?.data?.eventStats)));
  }
}
