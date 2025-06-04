import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ReplaySubject, Subject } from "rxjs";
import { delay, filter, map, switchMap, takeUntil, tap } from "rxjs/operators";
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
        switchMap((params: PerformanceParams) =>
          this.performanceService.fetchOverviewStats(params),
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
      .pipe(map((paramMap) => paramMap.getAll("direction")))
      .subscribe((directions) => {
        this.preSelectedDirections = directions as Direction[];
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
