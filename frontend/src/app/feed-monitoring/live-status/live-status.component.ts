import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DateTime, Duration, Interval } from 'luxon';
import { of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Granularity, OperatorLiveStatusFragment } from 'src/generated/graphql';
import { AlertMode } from '../alert-list/alert-list-view-model';
import { FeedMonitoringService } from '../feed-monitoring.service';

@Component({
  selector: 'app-live-status',
  templateUrl: './live-status.component.html',
  styleUrls: ['./live-status.component.scss'],
})
export class LiveStatusComponent implements OnInit, OnDestroy {
  constructor(private fmService: FeedMonitoringService, private route: ActivatedRoute, private router: Router) {}
  private destroy$ = new Subject<void>();

  nocCode: string | null = null;

  operator?: OperatorLiveStatusFragment;
  operatorId?: string;
  allOperators?: { name?: string | null; nocCode: string; operatorId: string }[];
  lastCheck?: DateTime;

  hour = Granularity.Hour;
  minute = Granularity.Minute;

  alertMode = AlertMode;

  chartsLoading = true;
  notFound = false;
  operatorLoading = true;
  chartsErrored = false;

  intervalLast24Hours = Interval.invalid('no value');
  intervalLast20Minutes = Interval.invalid('no value');

  get bodsLink(): string {
    return `https://data.bus-data.dft.gov.uk/timetable/?q=${this.operator?.nocCode}`;
  }

  get showBodsLink(): boolean {
    return this.operator?.feedMonitoring?.liveStats?.expectedVehicles === 0;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((pm) => pm.get('nocCode')),
        filter((nocCode) => !!nocCode),
        distinctUntilChanged(),
        tap((nocCode) => {
          this.nocCode = nocCode;
          this.operatorLoading = true;
          this.notFound = false;
          this.chartsErrored = false;
        }),
        switchMap(() => this.fmService.listOperators),
        tap((allOperators) => {
          this.allOperators = allOperators;
          this.operatorId = this.allOperators?.find((operator) => operator.nocCode === this.nocCode)?.operatorId;
        }),
        switchMap(() => {
          return this.fmService.fetchOperator(this.operatorId as string);
        }),
        catchError(() => {
          this.chartsErrored = true;
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((operatorLiveStatus) => {
        if (operatorLiveStatus) {
          this.chartsLoading = false;
          this.operatorLoading = false;
          this.operator = operatorLiveStatus;
          this.lastCheck = DateTime.local();
          this.intervalLast24Hours = Interval.before(this.lastCheck, Duration.fromObject({ hours: 24 }));
          this.intervalLast20Minutes = Interval.before(this.lastCheck, Duration.fromObject({ minutes: 20 }));
        } else {
          this.notFound = true;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatUpdateFrequency(f?: number) {
    return f ? `${f}s` : '-';
  }

  changeOperator({ nocCode }: { nocCode: string }) {
    this.router.navigate([nocCode], { relativeTo: this.route.parent });
  }
}
