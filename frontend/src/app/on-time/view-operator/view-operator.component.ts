import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { of, ReplaySubject, Subject } from "rxjs";
import {
  delay,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  takeUntil,
  tap,
} from "rxjs/operators";
import {
  Direction,
  FrequentServiceInfoType,
  HeadwayOverviewType,
  OperatorType,
} from "src/generated/graphql";
import { PerformanceParams, PunctualityOverview } from "../on-time.service";
import { TabsComponent } from "../../shared/components/tabs/tabs.component";
import { TabComponent } from "../../shared/components/tabs/tab/tab.component";
import { PerformanceService } from "../performance.service";
import { OperatorService } from "../../shared/services/operator.service";
import { isEqual } from "lodash-es";

@Component({
  templateUrl: "view-operator.component.html",
  styleUrls: ["../on-time.component.scss"],
  standalone: false,
})
export class ViewOperatorComponent implements OnInit, OnDestroy {
  allOperators: OperatorType[] = [];
  operator?: OperatorType;
  singleOperator = false;

  destroy$ = new Subject<void>();
  params$ = new ReplaySubject<PerformanceParams>();

  overview?: PunctualityOverview;
  headwayOverview?: HeadwayOverviewType;
  overviewLoading = true;

  frequentServiceInfo?: FrequentServiceInfoType;
  frequentServiceInfoLoading = true;

  preSelectedDirections: Direction[] = [];
  backLinkParams: Params = {};
  performanceParams?: PerformanceParams;

  @ViewChild(TabsComponent) tabs?: TabsComponent;

  get noData() {
    return !!this.overview && this.overview.completed === 0;
  }

  get dataExpected() {
    return !!this.overview && this.overview.scheduled > 0;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private operatorService: OperatorService,
    private performanceService: PerformanceService,
  ) {}

  ngOnInit(): void {
    this.params$
      .pipe(
        tap(() => {
          this.overview = undefined;
          this.overviewLoading = true;
        }),
        // deep copy
        tap(
          (params) =>
            (this.performanceParams = JSON.parse(JSON.stringify(params))),
        ),
        map((params: PerformanceParams) => ({
          ...params,
          filters: { ...params.filters, direction: this.preSelectedDirections },
        })),
        tap(() => console.log("select----", this.preSelectedDirections)),
        switchMap((params: PerformanceParams) =>
          this.preSelectedDirections && this.preSelectedDirections.length > 0
            ? this.performanceService.fetchOverviewStats(params)
            : this.performanceService
                .fetchHeadwayOverviewStats(params)
                .pipe(
                  map((headway) => ({ onTime: undefined, headway: headway })),
                ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe(({ onTime, headway }) => {
        this.overview = onTime;
        this.headwayOverview = headway;
        this.overviewLoading = false;
      });

    this.route.paramMap
      .pipe(
        filter((paramMap) => paramMap.has("nocCode")),
        map((paramMap) => paramMap.get("nocCode")!),
        switchMap((nocCode) => this.operatorService.fetchOperator(nocCode)),
        takeUntil(this.destroy$),
      )
      .subscribe((operator) => {
        this.operator = operator;
      });

    this.operatorService.fetchOperators().subscribe((operators) => {
      this.allOperators = operators;
      this.singleOperator = operators.length === 1;
    });

    this.route.queryParamMap
      .pipe(
        filter((paramMap) => paramMap.has("tab")),
        map((paramMap) => paramMap.get("tab")!),
        // Add delay so that tabs is not undefined
        delay(0),
      )
      .subscribe((tab) => {
        this.tabs?.openTab(tab, { emit: false });
      });

    this.route.queryParamMap
      .pipe(
        map((paramMap) => paramMap.getAll("direction")),
        distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
        map((directions) => {
          return !directions || directions.length === 0
            ? [Direction.All]
            : directions;
        }),
        tap(
          (directions) =>
            (this.preSelectedDirections = directions as Direction[]),
        ),
        switchMap((directions) => {
          this.overview = undefined;
          this.overviewLoading = true;
          if (
            this.performanceParams !== undefined &&
            directions &&
            directions.length > 0
          ) {
            this.performanceParams.filters.direction =
              directions as Direction[];
            return this.performanceService.fetchOnTimeOverviewStats(
              this.performanceParams,
            );
          }
          return of(null);
        }),
      )
      .subscribe((overview) => {
        if (overview) this.overview = overview;
        this.overviewLoading = false;
      });

    this.route.queryParamMap.subscribe((paramMap) => {
      const params: Params = {};

      paramMap.keys.forEach((key) => {
        if (key !== "direction") {
          const value = paramMap.get(key);
          if (value !== null) {
            params[key] = value;
          }
        }
      });
      this.backLinkParams = params;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeOperator(operator: { name?: string | null; nocCode: string }) {
    this.router
      .navigate(["/on-time", operator.nocCode], {
        // Clear admin area filter on operator change
        queryParams: { adminAreaId: null },
        queryParamsHandling: "merge",
      })
      .catch(console.log);
  }

  tabChanged(tab: TabComponent) {
    this.router
      .navigate([], {
        queryParams: { tab: tab.id },
        queryParamsHandling: "merge",
      })
      .catch(console.log);
  }

  overviewModeChanged(overview: string) {
    this.router
      .navigate([], {
        queryParams: { overview },
        queryParamsHandling: "merge",
      })
      .catch(console.log);
  }

  onDirectionChange(direction: Direction[]) {
    this.router
      .navigate([], {
        queryParams: { direction },
        queryParamsHandling: "merge",
      })
      .catch(console.log);
  }
}
