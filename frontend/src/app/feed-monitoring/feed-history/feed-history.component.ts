import { ViewportScroller } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DateTime } from 'luxon';
import { combineLatest, of, Subject } from 'rxjs';
import { catchError, delay, distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { OperatorFeedHistoryFragment, VehicleStatsType } from 'src/generated/graphql';
import { nonNullishArray } from '../../shared/array-operators';
import { AlertListViewModel, AlertMode, AlertType } from '../alert-list/alert-list-view-model';
import { EventStats, FeedMonitoringService } from '../feed-monitoring.service';
import { IHeatmap } from './datenav/datenav.component';

@Component({
  selector: 'app-history',
  templateUrl: './feed-history.component.html',
  styleUrls: ['./feed-history.component.scss'],
})
export class FeedHistoryComponent implements OnInit, OnDestroy {
  constructor(
    private fmService: FeedMonitoringService,
    private route: ActivatedRoute,
    private router: Router,
    private viewportScroller: ViewportScroller,
    private change: ChangeDetectorRef
  ) {}

  loading = true;
  chartErrored = false;
  notFound = false;
  noData = false;

  operator: OperatorFeedHistoryFragment | null = null;
  operatorId = '';
  allOperators?: { name?: string | null; nocCode: string; operatorId: string }[];

  date?: DateTime;

  alertStats?: IHeatmap[];
  alertMode = AlertMode;
  selectedAlert = new Subject<string | null>();

  vehicleStats?: VehicleStatsType[];

  alerts: { timestamp: DateTime; type: AlertType; id: string }[] = [];

  private destroy$ = new Subject<void>();

  ngOnInit() {
    const noc$ = this.route.paramMap.pipe(
      filter((pm) => pm.has('nocCode')),
      map((pm) => pm.get('nocCode') as string),
      distinctUntilChanged()
    );

    const date$ = this.route.queryParamMap.pipe(
      tap((qpm) => {
        if (!qpm.has('date')) {
          this.router.navigate(['.'], {
            relativeTo: this.route,
            queryParams: { date: DateTime.local().minus({ day: 1 }).toFormat('yyyy-MM-dd') },
            replaceUrl: true,
            queryParamsHandling: 'merge',
          });
        }
      }),
      filter((qpm) => qpm.has('date')),
      map((qpm) => DateTime.fromISO(qpm.get('date') as string)),
      distinctUntilChanged()
    );

    date$.pipe(takeUntil(this.destroy$)).subscribe((date) => (this.date = date));

    const operatorData$ = noc$.pipe(
      switchMap((noc) =>
        this.fmService.listOperators.pipe(
          map((allOperators) => {
            const operatorId = allOperators?.find((operator) => operator.nocCode === noc)?.operatorId || '';
            return { allOperators: allOperators, noc: noc, operatorId: operatorId };
          })
        )
      )
    );

    operatorData$
      .pipe(
        switchMap((opData) =>
          this.fmService
            .fetchAlertStats(opData.operatorId as string, DateTime.local().toUTC().minus({ day: 1 }))
            .pipe(map((data) => ({ ...opData, stats: this.cleanUpAlertStats(data) })))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(({ operatorId, allOperators, stats }) => {
        this.operatorId = operatorId;
        this.allOperators = allOperators;
        this.alertStats = stats;
      });

    combineLatest([operatorData$, date$])
      .pipe(
        filter(([_, date]) => !!date),
        tap(() => {
          this.chartErrored = false;
          this.notFound = false;
          this.noData = false;
          this.loading = true;
        }),
        switchMap(([{ operatorId }, date]) => this.fmService.fetchOperatorHistory(operatorId, date)),
        catchError(() => {
          this.chartErrored = true;
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((operator) => {
        this.loading = false;
        this.operator = operator;

        if (!operator) {
          this.notFound = true;
        } else if (operator.feedMonitoring.vehicleStats?.length > 0) {
          this.chartErrored = false;
          this.vehicleStats = nonNullishArray(operator.feedMonitoring.vehicleStats);
        } else {
          this.noData = true;
        }
      });

    this.selectedAlert
      .pipe(
        filter((alert) => alert !== null),
        delay(5000),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.selectedAlert.next(null));
  }

  private cleanUpAlertStats(stats: EventStats[]): { heat: number; date: DateTime }[] {
    const max: number = Math.max(...stats.map(({ count }) => count ?? 0));

    return stats.map(({ count, day }) => ({
      heat: count ? Math.ceil((count / max) * 6) : 0,
      date: DateTime.fromISO(day),
    }));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeOperator({ nocCode }: { nocCode: string }) {
    this.router.navigate(['/', 'feed-monitoring', nocCode, 'feed-history']);
  }

  changeDate(date: DateTime) {
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: { date: date.toISODate() },
      queryParamsHandling: 'merge',
    });
  }

  formatUpdateFrequency(f?: number) {
    return f ? `${f}s` : '-';
  }

  formatAvailability(f?: number) {
    return `${f}%`;
  }

  newAlerts(alerts: AlertListViewModel[]) {
    this.alerts = alerts ?? [];
  }

  alertSelected(id: string) {
    this.selectedAlert.next(id);
    // this will be called from outside the angular zone (in amCharts) so manually invoke change detection:
    this.change.detectChanges();
    this.viewportScroller.scrollToAnchor(id);
  }
}
