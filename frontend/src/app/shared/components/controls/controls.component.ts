import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import {
  DayOfWeekFlagsInputType,
  MatchType,
  PerformanceFiltersInputType,
} from "../../../../generated/graphql";
import { PerformanceParams } from "../../../on-time/on-time.service";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  Subject,
  takeUntil,
  tap,
} from "rxjs";
import { FormControl } from "@angular/forms";
import { TimingPoints } from "../../../on-time/on-time-controls/on-time-controls.component";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { DateRangeService } from "../../services/date-range.service";
import { PanelService } from "../panel/panel.service";
import { OnTimePanelService } from "../../../on-time/on-time-controls/on-time-panel.service";
import { FromToPreset, Period, Preset } from "../date-range/date-range.types";
import { DateTime } from "luxon";
import { isEqual as _isEqual } from "lodash-es";

@Component({
  selector: "app-controls",
  templateUrl: "./controls.component.html",
  styleUrls: ["./controls.component.scss"],
})
export class ControlsComponent implements OnInit, OnDestroy {
  @Output() params = new EventEmitter<PerformanceParams>();
  @Output() filtersChange = new EventEmitter<PerformanceFiltersInputType>();

  filtersSubject = new BehaviorSubject<PerformanceFiltersInputType>({});

  showAdminAreas = true;
  dateRange = new FormControl(
    this.getDateTimeParams(this.route.snapshot.queryParamMap),
    {
      nonNullable: true,
    },
  );

  onDestroy$ = new Subject<void>();

  get timingPointsOption(): TimingPoints {
    return this.filtersSubject.value.timingPointsOnly
      ? "timing-points"
      : "all-stops";
  }

  set timingPointsOption(timingPointsOption: TimingPoints) {
    const allStops = timingPointsOption === "all-stops" || null;
    this.router
      .navigate([], {
        queryParams: { allStops, timingPointsOnly: null },
        queryParamsHandling: "merge",
      })
      .catch(console.log);
  }

  get matchType(): MatchType {
    return this.filtersSubject.value.matchType ?? MatchType.Evidenced;
  }

  set matchType(match_type: MatchType) {
    this.router
      .navigate([], {
        queryParams: { match_type },
        queryParamsHandling: "merge",
      })
      .catch(console.log);
  }

  /** @deprecated this will be removed in ABOD-350 */
  get filters(): PerformanceFiltersInputType {
    return this.filtersSubject.value;
  }

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected dateRangeService: DateRangeService,
    public panelService: PanelService,
    public onTimePanel: OnTimePanelService,
  ) {}

  getDateTimeParams(queryParams: ParamMap): FromToPreset {
    let from, to: DateTime;
    let preset: Preset;

    if (queryParams.get("from") && queryParams.get("to")) {
      from = DateTime.fromFormat(
        queryParams.get("from")!,
        "yyyy-MM-dd",
      ).toLocal();
      to = DateTime.fromFormat(queryParams.get("to")!, "yyyy-MM-dd")
        .toLocal()
        .plus({ days: 1 }); // date range is exclusive on the to date
      preset = Preset.Custom;
    } else {
      preset = (queryParams.get("preset") as Period) ?? Period.Last7;
      const presetRange = this.dateRangeService.calculatePresetPeriod(
        preset,
        DateTime.local(),
      );
      from = presetRange.from;
      to = presetRange.to;
    }

    return { from, to, preset };
  }

  getPerformanceFilters(
    paramMap: ParamMap,
    queryParams: ParamMap,
  ): PerformanceFiltersInputType {
    const filters: PerformanceFiltersInputType = {
      timingPointsOnly: true,
      matchType: MatchType.Evidenced,
    };

    const lineId = paramMap.get("lineId");
    if (lineId) {
      filters.lineIds = [lineId];
    }

    if (queryParams.get("dayOfWeek")) {
      const dayOfWeekFlags: DayOfWeekFlagsInputType = {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      };

      queryParams
        .get("dayOfWeek")
        ?.split(",")
        .map((day) => {
          if (day as keyof DayOfWeekFlagsInputType)
            dayOfWeekFlags[day as keyof DayOfWeekFlagsInputType] = true;
        });

      filters.dayOfWeekFlags = dayOfWeekFlags;
    }

    if (queryParams.get("startTime")) {
      filters.startTime = queryParams.get("startTime");
    }

    if (queryParams.get("endTime")) {
      filters.endTime = queryParams.get("endTime");
    }

    if (queryParams.get("minDelay")) {
      filters.minDelay = parseInt(queryParams.get("minDelay")!);
    }

    if (queryParams.get("maxDelay")) {
      filters.maxDelay = parseInt(queryParams.get("maxDelay")!);
    }

    if (queryParams.has("timingPointsOnly")) {
      filters.timingPointsOnly =
        queryParams.get("timingPointsOnly") === "true" || undefined;
    }

    if (queryParams.has("match_type")) {
      filters.matchType =
        (queryParams.get("match_type") as MatchType) || MatchType.Evidenced;
    }

    if (queryParams.has("allStops")) {
      filters.timingPointsOnly =
        queryParams.get("allStops") !== "true" || undefined;
    }

    return filters;
  }

  ngOnInit(): void {
    const paramMap$ = this.route.paramMap;
    const queryParamMap$ = this.route.queryParamMap;

    const fromTo$ = queryParamMap$.pipe(
      map((queryParams) => this.getDateTimeParams(queryParams)),
      distinctUntilChanged(
        (
          { from: from1, to: to1, preset: preset1 },
          { from: from2, to: to2, preset: preset2 },
        ) => preset1 === preset2 && from1.equals(from2) && to1.equals(to2),
      ),
      takeUntil(this.onDestroy$),
    );
    fromTo$.subscribe((fromTo) => this.dateRange.setValue(fromTo));

    combineLatest([paramMap$, queryParamMap$])
      .pipe(
        map(([paramMap, queryParamMap]) =>
          this.getPerformanceFilters(paramMap, queryParamMap),
        ),
        distinctUntilChanged(_isEqual),
        takeUntil(this.onDestroy$),
      )
      .subscribe(this.filtersSubject);

    combineLatest([this.filtersSubject, fromTo$])
      .pipe(
        map(([filters, { from, to }]) => ({
          fromTimestamp: from.toISO(),
          toTimestamp: to.toISO(),
          filters,
        })),
        tap(() => this.setFilterPanelComponent(paramMap$, queryParamMap$)),
      )
      .subscribe((params) => {
        this.params.emit(params);
      });

    this.dateRange.valueChanges.subscribe(({ from, to, preset }) => {
      if (preset === Preset.Custom) {
        this.router
          .navigate([], {
            queryParams: {
              from: from.toFormat("yyyy-MM-dd"),
              to: to.minus({ days: 1 }).toFormat("yyyy-MM-dd"),
              preset: undefined,
            },
            queryParamsHandling: "merge",
          })
          .catch(console.log);
      } else {
        this.router
          .navigate([], {
            queryParams: {
              from: undefined,
              to: undefined,
              preset: preset,
            },
            queryParamsHandling: "merge",
          })
          .catch(console.log);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyFilterPanel();
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  updateFilters(value: PerformanceFiltersInputType) {
    this.filtersChange.emit(value);
  }

  onMoreFiltersClick() {
    this.panelService.toggle();
  }

  setFilterPanelComponent(
    paramMap$: Observable<ParamMap>,
    queryParamMap$: Observable<ParamMap>,
  ) {
    this.panelService.setComponent({
      component: this.onTimePanel.getComponent(),
      inputs: [
        {
          name: "filters",
          value: this.filtersSubject,
        },
        {
          name: "paramMap",
          value: paramMap$,
        },
        {
          name: "queryParamMap",
          value: queryParamMap$,
        },
      ],
      outputs: [
        {
          name: "filtersChange",
          outputEvent: ($event: PerformanceFiltersInputType) =>
            this.updateFilters($event),
        },
        {
          name: "closeFilters",
          outputEvent: () => this.panelService.close(),
        },
      ],
    });
  }

  destroyFilterPanel() {
    this.panelService.destroy();
  }
}
