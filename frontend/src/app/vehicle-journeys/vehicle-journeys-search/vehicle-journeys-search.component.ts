import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  Validators,
} from "@angular/forms";
import { DateTime, Duration, Interval } from "luxon";
import {
  Operator,
  OperatorService,
} from "../../shared/services/operator.service";
import { CustomValidators } from "../../shared/validators/custom-validators";
import { combineLatest, Observable, of, Subject, switchMap } from "rxjs";
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  startWith,
  take,
  takeUntil,
  tap,
} from "rxjs/operators";
import { ConfigService } from "../../config/config.service";
import { ActivatedRoute, Router } from "@angular/router";
import { isEqual as _isEqual } from "lodash-es";
import { Journey, JourneysGQL, LineType } from "../../../generated/graphql";

@Component({
  selector: "app-vehicle-journeys-search",
  templateUrl: "./vehicle-journeys-search.component.html",
  styleUrls: ["./vehicle-journeys-search.component.scss"],
})
export class VehicleJourneysSearchComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  validDateRange = Interval.before(
    DateTime.local().endOf("day").minus(Duration.fromISO(this.offsetISO)),
    Duration.fromISO(this.durationISO),
  );

  form = this.formBuilder.group({
    date: new FormControl<DateTime>(
      DateTime.local().startOf("day").minus(Duration.fromISO(this.offsetISO)),
      [
        Validators.required,
        CustomValidators.dateWithinRange(this.validDateRange),
      ],
    ),
    operator: new FormControl<string | null>(null, Validators.required),
    service: new FormControl<string | null>(
      { value: null, disabled: true },
      Validators.required,
    ),
  });

  get journeysLoading(): boolean {
    return this._journeysLoading && this.service.value !== null;
  }
  set journeysLoading(val: boolean) {
    this._journeysLoading = val;
  }
  private _journeysLoading = false;

  operatorsLoading = false;
  servicesLoading = false;
  errored = false;

  operatorInputTerm$ = new Subject<string>();

  operators$?: Observable<Operator[]>;
  services$?: Observable<LineType[]>;

  vehicleJourneys: Journey[] = [];

  private destroy$ = new Subject<void>();

  get date(): AbstractControl<DateTime> {
    return this.form.get("date") as AbstractControl<DateTime>;
  }

  get operator(): AbstractControl<string> {
    return this.form.get("operator") as AbstractControl<string>;
  }

  get service(): AbstractControl<string> {
    return this.form.get("service") as AbstractControl<string>;
  }

  get offsetISO(): string {
    return this.configService.vehicleJourneys.validDateRange.offsetISO;
  }

  get durationISO(): string {
    return this.configService.vehicleJourneys.validDateRange.durationISO;
  }

  get noJourneysFound(): boolean {
    return (
      !this.journeysLoading &&
      this.vehicleJourneys.length === 0 &&
      this.service.value !== null
    );
  }

  get pevDisabled(): boolean {
    return !this.validDateRange.contains(this.date.value.minus({ days: 1 }));
  }

  get nextDisabled(): boolean {
    return !this.validDateRange.contains(this.date.value.plus({ days: 1 }));
  }

  constructor(
    private formBuilder: FormBuilder,
    private operatorService: OperatorService,
    private journeysGQL: JourneysGQL,
    private configService: ConfigService,
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.date.valueChanges
      .pipe(
        distinctUntilChanged((a: DateTime, b: DateTime) => a.equals(b)),
        map((date) =>
          date.toUTC().toISO({ format: "basic", suppressSeconds: true }),
        ),
        tap(() => {
          if (this.operator.value) {
            this.servicesLoading = true;
            this.service.reset();
          }
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((date) => {
        this.router
          .navigate([], {
            queryParams: { date: date },
            queryParamsHandling: "merge",
          })
          .catch(console.log);
      });

    this.operator.valueChanges
      .pipe(
        distinctUntilChanged(),
        tap((operator) => {
          if (operator) {
            this.servicesLoading = true;
            this.service.enable();
          } else {
            this.service.disable();
          }
          this.service.reset();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((operator) => {
        this.router
          .navigate([], {
            queryParams: { operator: operator, service: null },
            queryParamsHandling: "merge",
          })
          .catch(console.log);
      });

    this.service.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((service) => {
        this.router
          .navigate([], {
            queryParams: { service: service },
            queryParamsHandling: "merge",
          })
          .catch(console.log);
      });

    this.route.queryParamMap
      .pipe(
        distinctUntilChanged(),
        map((queryParams) => DateTime.fromISO(String(queryParams.get("date")))),
        filter((date) => date.isValid),
        takeUntil(this.destroy$),
      )
      .subscribe((date) => this.date.setValue(date));

    const service$ = this.route.queryParamMap.pipe(
      distinctUntilChanged(),
      map((queryParams) => queryParams.get("service")!),
      takeUntil(this.destroy$),
    );

    const date$: Observable<string> = this.route.queryParamMap.pipe(
      distinctUntilChanged(),
      map((queryParams) => queryParams.get("date")!),
      takeUntil(this.destroy$),
    );

    const operator$: Observable<string> = this.route.queryParamMap.pipe(
      distinctUntilChanged(),
      map((queryParams) => queryParams.get("operator")!),
      takeUntil(this.destroy$),
    );
    operator$.subscribe((operator) => this.operator.setValue(operator));

    combineLatest({ operator: operator$, service: service$ })
      .pipe(
        filter(({ operator }) => operator !== null),
        takeUntil(this.destroy$),
      )
      .subscribe(({ service }) => this.service.setValue(service));

    this.operators$ = this.operatorInputTerm$.pipe(
      startWith(""),
      tap(() => (this.operatorsLoading = true)),
      switchMap((term: string) =>
        this.operatorService
          .searchOperators(term)
          .pipe(finalize(() => (this.operatorsLoading = false))),
      ),
      takeUntil(this.destroy$),
    );

    this.services$ = combineLatest([operator$, date$]).pipe(
      filter(([operatorId, _]) => operatorId !== null),
      distinctUntilChanged(
        ([prevOperatorId, prevDate], [currOperatorId, currDate]) => {
          return prevOperatorId === currOperatorId && prevDate === currDate;
        },
      ),
      switchMap(([operatorId, _]) =>
        this.operatorService.fetchLines(operatorId, this.date.value).pipe(
          take(1),
          startWith([]),
          finalize(() => (this.servicesLoading = false)),
        ),
      ),
      takeUntil(this.destroy$),
    );

    this.form.valueChanges
      .pipe(
        startWith(this.form.value),
        distinctUntilChanged(_isEqual),
        tap(() => {
          this.errored = false;
          this.vehicleJourneys = [];
          this.journeysLoading = true;
        }),
        debounceTime(200),
        switchMap(({ date, service }) => {
          if (!date?.isValid || !service) {
            return of([]);
          }
          return this.journeysGQL
            .fetch({ dateOfJourney: date.toISO(), lineId: service })
            .pipe(
              map((journeys) => {
                const now = DateTime.now();
                return journeys.data.findJourneys.filter(
                  (n) => DateTime.fromISO(n.startTime) <= now,
                );
              }),
              take(1),
              catchError(() => {
                this.errored = true;
                return of([]);
              }),
            );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((journeys) => {
        this.vehicleJourneys = journeys;
        this.journeysLoading = false;
      });
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
