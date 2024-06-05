import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { DayOfWeekData, OnTimeService, PerformanceParams } from '../on-time.service';
import { switchMap, takeUntil } from 'rxjs/operators';
import { AsyncStatus, withStatus } from '../pending.model';

@Component({
  selector: 'app-day-of-week-chart',
  template: `<app-stacked-histogram-chart
    [data]="data$ | async"
    [status$]="status$.asObservable()"
    category="dayOfWeek"
    [centerAxis]="true"
  ></app-stacked-histogram-chart>`,
})
export class DayOfWeekChartComponent implements OnInit, OnDestroy {
  @Input()
  set params(value: PerformanceParams | null) {
    if (value) {
      this.params$.next(value);
    }
  }
  private params$ = new ReplaySubject<PerformanceParams>();

  data$!: Observable<DayOfWeekData[] | null>;
  status$ = new Subject<AsyncStatus>();
  destroy$ = new Subject<void>();

  constructor(private service: OnTimeService) {}

  ngOnInit() {
    this.data$ = this.params$.pipe(
      switchMap((params) => {
        return withStatus(() => this.service.fetchOnTimePunctualityDayOfWeekData(params), this.status$);
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
