import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DashboardOperatorListGQL,
  DashboardOperatorVehicleCountsListGQL,
  DashboardPerformanceStatsGQL,
  DashboardServiceRankingGQL,
  OperatorDashboardFragment,
  OperatorDashboardVehicleCountsFragment,
  PerformanceFiltersInputType,
  RankingOrder,
  ServicePerformanceInputType,
} from '../../generated/graphql';
import { PerformanceCategories } from './dashboard.types';
import { PerformanceParams } from '../on-time/on-time.service';

export interface PunctualityQueryResult {
  result: { [key in PerformanceCategories]: number } | null;
  success: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(
    private operatorListQuery: DashboardOperatorListGQL,
    private operatorVehicleCountsListQuery: DashboardOperatorVehicleCountsListGQL,
    private dashboardPerformanceStatsQuery: DashboardPerformanceStatsGQL,
    private dashboardServiceRankingQuery: DashboardServiceRankingGQL
  ) {}

  get listOperators(): Observable<OperatorDashboardFragment[]> {
    return this.operatorListQuery
      .fetch()
      .pipe(map(({ data }) => data?.operators?.items?.map((x) => x as OperatorDashboardFragment) ?? []));
  }

  get listOperatorVehicleCounts(): Observable<OperatorDashboardVehicleCountsFragment[]> {
    return this.operatorVehicleCountsListQuery
      .fetch()
      .pipe(map(({ data }) => data?.operators?.items?.map((x) => x as OperatorDashboardVehicleCountsFragment) ?? []));
  }

  getPunctualityStats(
    filters: PerformanceFiltersInputType,
    from: DateTime,
    to: DateTime
  ): Observable<PunctualityQueryResult> {
    const params: PerformanceParams = { fromTimestamp: from.toJSDate(), toTimestamp: to.toJSDate(), filters };
    return this.dashboardPerformanceStatsQuery
      .fetch(
        { params },
        // Currently there's no way for Apollo to cache this without an id field, so disable the cache
        { fetchPolicy: 'no-cache' }
      )
      .pipe(
        map(({ data, errors }) => ({ result: data?.onTimePerformance?.punctualityOverview ?? null, success: !errors }))
      );
  }

  getServiceRanking(
    filters: PerformanceFiltersInputType,
    from: DateTime,
    to: DateTime,
    order: RankingOrder,
    trendFrom: DateTime,
    trendTo: DateTime
  ) {
    const params: ServicePerformanceInputType = {
      fromTimestamp: from.toJSDate(),
      toTimestamp: to.toJSDate(),
      order,
      filters,
    };
    return this.dashboardServiceRankingQuery
      .fetch(
        {
          params,
          trendFrom: trendFrom.toJSDate(),
          trendTo: trendTo.toJSDate(),
        },
        // Currently there's no way for Apollo to cache this without an id field, so disable the cache
        { fetchPolicy: 'no-cache' }
      )
      .pipe(map(({ data }) => data?.onTimePerformance?.servicePunctuality));
  }
}
