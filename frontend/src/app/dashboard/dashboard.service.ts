import { Injectable } from "@angular/core";
import { DateTime } from "luxon";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  DashboardOperatorListGQL,
  DashboardOperatorVehicleCountsListGQL,
  DashboardPerformanceStatsGQL,
  DashboardServiceRankingGQL,
  DashboardVehicles,
  OperatorDashboardFragment,
  PerformanceFiltersInputType,
  RankingOrder,
  ServicePerformanceInputType,
} from "../../generated/graphql";
import { PerformanceCategories } from "./dashboard.types";
import { PerformanceParams } from "../on-time/on-time.service";

export interface PunctualityQueryResult {
  result: Record<PerformanceCategories, number> | null;
  success: boolean;
}

@Injectable({
  providedIn: "root",
})
export class DashboardService {
  constructor(
    private operatorListQuery: DashboardOperatorListGQL,
    private operatorVehicleCountsListQuery: DashboardOperatorVehicleCountsListGQL,
    private dashboardPerformanceStatsQuery: DashboardPerformanceStatsGQL,
    private dashboardServiceRankingQuery: DashboardServiceRankingGQL,
  ) {}

  get listOperators(): Observable<OperatorDashboardFragment[]> {
    return this.operatorListQuery
      .fetch({})
      .pipe(
        map(
          ({ data }) =>
            data?.operators?.items?.map(
              (x) => x as OperatorDashboardFragment,
            ) ?? [],
        ),
      );
  }

  get listOperatorVehicleCounts(): Observable<DashboardVehicles[]> {
    return this.operatorVehicleCountsListQuery
      .fetch({})
      .pipe(map(({ data }) => data.dashboardVehicles));
  }

  getPunctualityStats(
    filters: PerformanceFiltersInputType,
    from: DateTime,
    to: DateTime,
  ): Observable<PunctualityQueryResult> {
    const params: PerformanceParams = {
      fromTimestamp: from.toISO(),
      toTimestamp: to.toISO(),
      filters,
    };
    return this.dashboardPerformanceStatsQuery
      .fetch(
        { params },
        // Currently there's no way for Apollo to cache this without an id field, so disable the cache
        { fetchPolicy: "no-cache" },
      )
      .pipe(
        map(({ data, errors }) => ({
          result: data?.onTimePerformance?.punctualityOverview ?? null,
          success: !errors,
        })),
      );
  }

  getServiceRanking(
    filters: PerformanceFiltersInputType,
    from: DateTime,
    to: DateTime,
    order: RankingOrder,
    trendFrom: DateTime,
    trendTo: DateTime,
  ) {
    const params: ServicePerformanceInputType = {
      fromTimestamp: from.toISO(),
      toTimestamp: to.toISO(),
      order,
      filters,
    };
    return this.dashboardServiceRankingQuery
      .fetch(
        {
          params,
          trendFrom: trendFrom.toISO(),
          trendTo: trendTo.toISO(),
        },
        // Currently there's no way for Apollo to cache this without an id field, so disable the cache
        { fetchPolicy: "no-cache" },
      )
      .pipe(map(({ data }) => data?.onTimePerformance?.servicePunctuality));
  }
}
