import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { DateTime } from "luxon";
import { BehaviorSubject, combineLatest, Subject } from "rxjs";
import { distinctUntilChanged, map, takeUntil } from "rxjs/operators";
import {
  DayOfWeekFlagsInputType,
  MatchType,
  PerformanceFiltersInputType,
} from "src/generated/graphql";
import { FormControl } from "@angular/forms";
import { isEqual as _isEqual } from "lodash-es";
import { PerformanceParams } from "../on-time.service";
import { FiltersComponent } from "../filters/filters.component";
import { DateRangeService } from "../../shared/services/date-range.service";
import {
  FromToPreset,
  Period,
  Preset,
} from "../../shared/components/date-range/date-range.types";
import { PanelService } from "../../shared/components/panel/panel.service";
import { ifNullOrUndefinedReturnEmptyString } from "../../shared/rxjs-operators";
import { ControlsComponent } from "../../shared/components/controls/controls.component";

export type TimingPoints = "all-stops" | "timing-points";

@Component({
  selector: "app-controls",
  templateUrl: "controls.component.html",
  styleUrls: ["./controls.component.scss"],
})
export class OnTimeControlsComponent
  extends ControlsComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() showAdminAreas = true;
  @Input() operatorId: string | null | undefined = "";
  @Output() params = new EventEmitter<PerformanceParams>();

  filtersSubject = new BehaviorSubject<PerformanceFiltersInputType>({});

  onDestroy$ = new Subject<void>();

  @ViewChild(FiltersComponent) filtersComponent?: FiltersComponent;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    public panelService: PanelService,
    protected dateRangeService: DateRangeService,
  ) {
    super(router, route, dateRangeService);
    this.router = router;
    this.panelService = panelService;
  }

  getPerformanceFilters(
    paramMap: ParamMap,
    queryParams: ParamMap,
  ): PerformanceFiltersInputType {
    const filters: PerformanceFiltersInputType = {};

    if (paramMap.get("nocCode")) {
      const operatorId = ifNullOrUndefinedReturnEmptyString(this.operatorId);
      filters.operatorIds = [operatorId];
    }

    if (queryParams.has("adminAreaId")) {
      filters.adminAreaIds = queryParams.getAll("adminAreaId");
    }

    return filters;
  }

  ngOnInit(): void {
    this.setFilterPanelComponent();

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
      )
      .subscribe((params) => this.params.emit(params));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.operatorId?.currentValue) {
      this.filtersSubject.next({
        ...this.filtersSubject.value,
        operatorIds: [changes.operatorId.currentValue],
      });
    }
  }

  ngAfterViewInit(): void {
    this.dateRange.valueChanges.subscribe(({ from, to, preset }) => {
      if (preset === Preset.Custom) {
        this.router.navigate([], {
          queryParams: {
            from: from.toFormat("yyyy-MM-dd"),
            to: to.minus({ days: 1 }).toFormat("yyyy-MM-dd"),
            preset: undefined,
          },
          queryParamsHandling: "merge",
        });
      } else {
        this.router.navigate([], {
          queryParams: {
            from: undefined,
            to: undefined,
            preset: preset,
          },
          queryParamsHandling: "merge",
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyFilterPanel();
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  changeAdminAreaIds(adminAreaId: string[]) {
    this.router.navigate([], {
      queryParams: { adminAreaId },
      queryParamsHandling: "merge",
    });
  }

  changeOperator(operator: { name?: string | null; nocCode: string }) {
    this.router.navigate(["/on-time", operator.nocCode], {
      queryParamsHandling: "preserve",
    });
  }

  updateFilters(value: PerformanceFiltersInputType) {
    this.router.navigate([], {
      queryParams: {
        dayOfWeek: value.dayOfWeekFlags
          ? Object.entries(value.dayOfWeekFlags)
              .filter(([_s, v]) => v)
              .map(([s, _v]) => s)
              .join()
          : undefined,
        startTime: value.startTime,
        endTime: value.endTime,
        minDelay: value.minDelay,
        maxDelay: value.maxDelay,
        adminAreaId: value.adminAreaIds,
      },
      queryParamsHandling: "merge",
    });
  }

  resetFilters() {
    this.filtersComponent?.resetFilters();
  }

  overviewModeChanged(overview: string) {
    this.router.navigate([], {
      queryParams: { overview },
      queryParamsHandling: "merge",
    });
  }

  onMoreFiltersClick() {
    this.panelService.toggle();
  }

  setFilterPanelComponent() {
    this.panelService.setComponent({
      component: FiltersComponent,
      inputs: [
        {
          name: "filters",
          value: this.filtersSubject,
        },
        {
          name: "showAdminAreas",
          value: this.showAdminAreas,
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
