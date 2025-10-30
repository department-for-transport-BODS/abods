import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import {
  OnTimeService,
  PerformanceParams,
  StopPerformance,
} from "../on-time.service";
import { of, ReplaySubject, Subject } from "rxjs";
import { catchError, map, switchMap, takeUntil, tap } from "rxjs/operators";
import { DateTime } from "luxon";
import { removeAdminAreaIds } from "../view-service/view-service.component";
import { Direction } from "../../../generated/graphql";

@Component({
  selector: "app-stops-grid",
  template: `<app-stops-grid-display
    [errored]="errored"
    [loading]="loading"
    [data]="data"
    [csvFilename]="csvFilename"
    [preSelectedDirections]="preSelectedDirections"
    (directionsChanged)="onDirectionChange($event)"
  />`,
  standalone: false,
})
export class StopsGridComponent implements OnInit, OnChanges, OnDestroy {
  data?: StopPerformance[];
  backupData: StopPerformance[] = [];
  aggDataPerStop: StopPerformance[] = [];
  loading = true;
  errored = false;
  csvFilename = "Stop_Performance";
  destroy$ = new Subject<void>();

  @Input() preSelectedDirections: Direction[] = [];
  private _params: PerformanceParams | null = null;
  @Input()
  get params() {
    return this._params;
  }
  set params(params: PerformanceParams | null) {
    if (params) {
      this._params = params ?? null;
      this.params$.next(params);
    }
  }
  private params$ = new ReplaySubject<PerformanceParams>(1);

  @Output() directionsChanged = new EventEmitter<Direction[]>();

  constructor(private onTimeService: OnTimeService) {}

  calculateInputData(): void {
    if (this.aggDataPerStop.length === 0) {
      const mapOfStops: Record<string, StopPerformance[]> = {};
      this.backupData.map((stopWithDirection) => {
        const stops = mapOfStops[stopWithDirection.stopId] ?? [];
        stops.push(stopWithDirection);
        mapOfStops[stopWithDirection.stopId] = stops;
      });

      for (const stops of Object.values(mapOfStops)) {
        const aggregate: StopPerformance = stops.reduce((acc, cur) => {
          const actualDepartures =
            (acc.actualDepartures ?? 0) + cur.actualDepartures;
          let averageDelay = undefined;
          let countDelayed = undefined;

          if (acc.countDelayed != undefined || cur.countDelayed != undefined) {
            countDelayed = (acc.countDelayed ?? 0) + (cur.countDelayed ?? 0);
            averageDelay = countDelayed
              ? ((acc.averageDelay ?? 0) * (acc.countDelayed ?? 0) +
                  (cur.averageDelay ?? 0) * (cur.countDelayed ?? 0)) /
                countDelayed
              : undefined;
          }

          const early = (acc.early ?? 0) + cur.early;
          const late = (acc.late ?? 0) + cur.late;
          const onTime = (acc.onTime ?? 0) + cur.onTime;
          const scheduledDepartures =
            (acc.scheduledDepartures ?? 0) + cur.scheduledDepartures;

          let earlyInSeconds = undefined;
          if (acc.earlyInSeconds || cur.earlyInSeconds) {
            earlyInSeconds =
              (acc.earlyInSeconds ?? 0) + (cur.earlyInSeconds ?? 0);
          }

          let lateInSeconds = undefined;
          if (acc.lateInSeconds || cur.lateInSeconds) {
            lateInSeconds = (acc.lateInSeconds ?? 0) + (cur.lateInSeconds ?? 0);
          }

          let onTimeInSeconds = undefined;
          if (acc.onTimeInSeconds || cur.onTimeInSeconds) {
            onTimeInSeconds =
              (acc.onTimeInSeconds ?? 0) + (cur.onTimeInSeconds ?? 0);
          }

          const total = (acc.total ?? 0) + cur.total;

          let onTimeRatio = null;
          if (acc.onTimeRatio != null || cur.onTimeRatio != null) {
            onTimeRatio = (acc.onTimeRatio ?? 0) + (cur.onTimeRatio ?? 0);
          }

          let earlyRatio = null;
          if (acc.earlyRatio != null || cur.earlyRatio != null) {
            earlyRatio = (acc.earlyRatio ?? 0) + (cur.earlyRatio ?? 0);
          }

          let lateRatio = null;
          if (acc.lateRatio != null || cur.lateRatio != null) {
            lateRatio = (acc.lateRatio ?? 0) + (cur.lateRatio ?? 0);
          }

          let averageScheduled = undefined;
          if (acc.averageScheduled || cur.averageScheduled) {
            averageScheduled =
              (acc.averageScheduled ?? 0) + (cur.averageScheduled ?? 0);
          }

          let averageActual = undefined;
          if (acc.averageActual || cur.averageActual) {
            averageActual = (acc.averageActual ?? 0) + (cur.averageActual ?? 0);
          }

          return {
            actualDepartures,
            averageDelay,
            countDelayed,
            early,
            late,
            onTime,
            earlyInSeconds,
            lateInSeconds,
            onTimeInSeconds,
            scheduledDepartures,
            total,
            onTimeRatio,
            earlyRatio,
            lateRatio,
            averageScheduled,
            averageActual,
            direction: undefined,
            lineId: cur.lineId,
            stopId: cur.stopId,
            stopInfo: cur.stopInfo,
            timingPoint: cur.timingPoint,
            completedRatio: 0,
          };
        }, {} as StopPerformance);

        const totalRatio =
          (aggregate.onTimeRatio ?? 0) +
          (aggregate.earlyRatio ?? 0) +
          (aggregate.lateRatio ?? 0);

        this.aggDataPerStop.push({
          ...aggregate,
          earlyInSeconds: aggregate.earlyInSeconds
            ? aggregate.earlyInSeconds / stops.length
            : aggregate.earlyInSeconds,
          lateInSeconds: aggregate.lateInSeconds
            ? aggregate.lateInSeconds / stops.length
            : aggregate.lateInSeconds,
          onTimeInSeconds: aggregate.onTimeInSeconds
            ? aggregate.onTimeInSeconds / stops.length
            : aggregate.onTimeInSeconds,
          onTimeRatio: aggregate.onTimeRatio
            ? aggregate.onTimeRatio / totalRatio
            : aggregate.onTimeRatio,
          earlyRatio: aggregate.earlyRatio
            ? aggregate.earlyRatio / totalRatio
            : aggregate.earlyRatio,
          lateRatio: aggregate.lateRatio
            ? aggregate.lateRatio / totalRatio
            : aggregate.lateRatio,
          averageScheduled: aggregate.averageScheduled
            ? aggregate.averageScheduled / stops.length
            : aggregate.averageScheduled,
          averageActual: aggregate.averageActual
            ? aggregate.averageActual / stops.length
            : aggregate.averageActual,
        });
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.preSelectedDirections &&
      !changes.preSelectedDirections.firstChange
    ) {
      const currentDirections = changes.preSelectedDirections
        .currentValue as Direction[];
      const previousDirections = changes.preSelectedDirections
        .previousValue as Direction[];

      if (currentDirections.includes(Direction.All)) {
        this.calculateInputData();
        this.data = this.aggDataPerStop;
        return;
      }

      if (previousDirections.includes(Direction.All))
        this.data = this.backupData;
    }
  }

  ngOnInit() {
    this.params$
      .pipe(
        tap((ps) => {
          this.loading = true;
          this.errored = false;
          this.csvFilename = this.calcCsvFilename(ps);
          this.aggDataPerStop = [];
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
        this.backupData = this.data;
        if (this.preSelectedDirections.includes(Direction.All)) {
          this.calculateInputData();
          this.data = this.aggDataPerStop;
        }
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

  onDirectionChange($event: Direction[]) {
    this.directionsChanged.emit($event);
  }
}
