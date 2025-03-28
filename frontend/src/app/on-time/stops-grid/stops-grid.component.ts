import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import {
  OnTimeService,
  PerformanceParams,
  StopPerformance,
} from "../on-time.service";
import { of, ReplaySubject, Subject } from "rxjs";
import { catchError, map, switchMap, takeUntil, tap } from "rxjs/operators";
import { DateTime } from "luxon";
import { removeAdminAreaIds } from "../view-service/view-service.component";

@Component({
  selector: "app-stops-grid",
  template: `<app-stops-grid-display
    [errored]="errored"
    [loading]="loading"
    [data]="data"
    [csvFilename]="csvFilename"
  />`,
  standalone: false,
})
export class StopsGridComponent implements OnInit, OnDestroy {
  data?: StopPerformance[];
  loading = true;
  errored = false;
  csvFilename = "Stop_Performance";
  destroy$ = new Subject<void>();

  @Input()
  set params(params: PerformanceParams | null) {
    if (params) {
      this.params$.next(params);
    }
  }
  private params$ = new ReplaySubject<PerformanceParams>(1);

  constructor(private onTimeService: OnTimeService) {}

  ngOnInit() {
    this.params$
      .pipe(
        tap((ps) => {
          this.loading = true;
          this.errored = false;
          this.csvFilename = this.calcCsvFilename(ps);
        }),
        map((params) => removeAdminAreaIds(params)),
        switchMap((params) =>
          this.onTimeService.fetchStopPerformanceList(params).pipe(
            catchError(() => {
              this.errored = true;
              return of([]); // Swallow the error, allowing the outer pipeline to continue
            }),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((data) => {
        this.data = data;
        this.loading = false;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  calcCsvFilename({
    fromTimestamp,
    toTimestamp,
    filters: { lineIds },
  }: PerformanceParams) {
    const inclusiveTo = DateTime.fromISO(toTimestamp).minus({ minute: 1 });
    return `Stop_Performance_${lineIds?.[0]}_${DateTime.fromISO(
      fromTimestamp,
    ).toFormat("yy-MM-dd")}_-_${inclusiveTo.toFormat("yy-MM-dd")}`;
  }
}
