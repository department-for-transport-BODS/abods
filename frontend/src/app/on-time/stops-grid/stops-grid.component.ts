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
  loading = true;
  errored = false;
  csvFilename = "Stop_Performance";
  destroy$ = new Subject<void>();

  backupData: StopPerformance[] = [];

  @Input() preSelectedDirections: Direction[] = [];
  @Input()
  set params(params: PerformanceParams | null) {
    if (params) {
      this.params$.next(params);
    }
  }
  private params$ = new ReplaySubject<PerformanceParams>(1);

  @Output() directionsChanged = new EventEmitter<Direction[]>();

  constructor(private onTimeService: OnTimeService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.preSelectedDirections) {
      const currentDirections = changes.preSelectedDirections.currentValue;
      console.log("this.currentDirections---", currentDirections);
      // this.data = this.backupData.filter(
      //   (stop) =>
      //     stop.direction &&
      //     currentDirections.includes(stop.direction)
      // );
    }
  }

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
        this.backupData = this.data;

        // if (
        //   this.preSelectedDirections.length === 0 &&
        //   this.data.some(
        //     (stop) =>
        //       stop.direction && stop.direction === Direction.Inbound
        //   )
        // ) {
        //   this.data = this.data.filter(
        //     (stop) =>
        //       stop.direction && stop.direction === Direction.Inbound
        //   );
        // }

        console.log(
          "this.preSelectedDirections---",
          this.preSelectedDirections,
        );

        // if(this.preSelectedDirections.length > 0){
        //   this.data = this.data.filter(
        //     (stop) =>
        //       stop.direction && this.preSelectedDirections.includes(stop.direction)
        //   )
        // }
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
