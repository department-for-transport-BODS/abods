import { Injectable } from '@angular/core';
import { OnTimeService, PerformanceParams, PunctualityOverview, ServicePerformance } from './on-time.service';
import { Headway, HeadwayService } from './headway.service';
import { catchError, map } from 'rxjs/operators';
import { combineLatest, forkJoin, iif, Observable, of } from 'rxjs';
import { map as _map } from 'lodash-es';

export interface FrequentServicePerformance extends ServicePerformance {
  frequent: boolean;
}

@Injectable({ providedIn: 'root' })
export class PerformanceService {
  constructor(private onTimeService: OnTimeService, private headwayService: HeadwayService) {}

  fetchServicePerformance(params: PerformanceParams): Observable<FrequentServicePerformance[]> {
    return forkJoin({
      onTime: this.onTimeService.fetchOnTimePerformanceList(params),
      headway: this.headwayService.fetchFrequentServices(params),
    }).pipe(
      map(({ onTime, headway }) => {
        const frequentServices = _map(headway, 'serviceId');
        return onTime.map((item) => ({ ...item, frequent: frequentServices.includes(item.lineInfo.serviceId) }));
      })
    );
  }

  fetchOverviewStats(params: PerformanceParams): Observable<{ onTime?: PunctualityOverview; headway?: Headway }> {
    return combineLatest({
      onTime: this.onTimeService.fetchOnTimeStats(params).pipe(catchError(() => of(undefined))),
      headway: iif(
        () => (params.filters?.lineIds?.length ?? 0) > 0,
        this.headwayService.fetchOverview(params).pipe(catchError(() => of(undefined))),
        of(undefined)
      ),
    });
  }
}
