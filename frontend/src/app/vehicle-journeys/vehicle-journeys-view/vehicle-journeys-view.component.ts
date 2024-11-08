import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import {
  combineLatest,
  map,
  mergeMap,
  Subject,
  switchMap,
  takeUntil,
  tap,
  zip,
} from "rxjs";
import { VehicleJourneyNotFoundView } from "./vehicle-journey-not-found-view.model";
import { StopHoverEvent } from "./stop-list/stop-item/stop-item.component";
import {
  VehicleJourney,
  VehicleJourneysSearchService,
} from "../vehicle-journeys-search/vehicle-journeys-search.service";
import { DateTime } from "luxon";
import { AvlPoint, AvlsGQL, RouteGQL, Stop } from "../../../generated/graphql";
import { distinctUntilChanged } from "rxjs/operators";

export interface JourneyInfo {
  stops: Stop[];
  avls: AvlPoint[];
}

@Component({
  selector: "app-vehicle-journeys-view",
  templateUrl: "./vehicle-journeys-view.component.html",
  styleUrls: ["./vehicle-journeys-view.component.scss"],
})
export class VehicleJourneysViewComponent implements OnInit, OnDestroy {
  journeyInfo: JourneyInfo | null = null;
  journeyInfoLoading = false;

  errorView?: VehicleJourneyNotFoundView;

  journeys: VehicleJourney[] = [];
  journeysLoading = false;

  estimated: "true" | "false" = "true";
  timingPointsOption: "timing-points" | "all-stops" = "timing-points";
  groupId = "";
  startTime = DateTime.fromSeconds(0);

  selectedStop?: Stop;
  hoveredStop?: StopHoverEvent;

  returnRoute = "/vehicle-journeys";
  returnQueryParams: Params | null = null;

  serviceId$ = new Subject<string>();

  constructor(
    private route: ActivatedRoute,
    private service: VehicleJourneysSearchService,
    private routeGQL: RouteGQL,
    private avlsGQL: AvlsGQL,
    private router: Router,
  ) {}

  private onDestroy$ = new Subject<void>();

  ngOnInit(): void {
    const groupId$ = this.route.paramMap.pipe(
      takeUntil(this.onDestroy$),
      map((params) => params.get("journeyId")!),
    );
    groupId$.subscribe((groupId) => (this.groupId = groupId));

    this.route.queryParamMap
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((params) => {
        this.startTime = DateTime.fromISO(params.get("startTime")!);
        this.returnQueryParams = {
          date: this.startTime
            .startOf("day")
            .toUTC()
            ?.toISO({ format: "basic", suppressSeconds: true }),
          operator: params.get("operator"),
          service: params.get("service"),
        };
        this.estimated = params.get("evidenced") !== "true" ? "true" : "false";
        this.timingPointsOption =
          params.get("timingPointsOnly") === "true" ||
          params.get("allStops") !== "true"
            ? "timing-points"
            : "all-stops";
      });

    const startTime$ = this.route.queryParamMap.pipe(
      map((params) =>
        DateTime.fromISO(params.get("startTime")!)
          .setZone("Europe/London")
          .startOf("day"),
      ),
      distinctUntilChanged(),
      takeUntil(this.onDestroy$),
    );

    combineLatest([groupId$])
      .pipe(
        tap(() => (this.journeyInfoLoading = true)),
        switchMap(([groupId]) =>
          zip(
            this.routeGQL.fetch({ groupId }),
            this.avlsGQL.fetch({ groupId }),
          ),
        ),
        takeUntil(this.onDestroy$),
      )
      .subscribe({
        next: ([routeResult, avlsResult]) => {
          if (!routeResult.data.route[0]) {
            return (this.errorView = new VehicleJourneyNotFoundView());
          }
          this.journeyInfo = {
            avls: [...avlsResult.data.avls].sort((a, b) =>
              a.recordedAtTimeUtc.localeCompare(b.recordedAtTimeUtc),
            ),
            stops: [...routeResult.data.route].sort(
              (a, b) => a.stopIndex - b.stopIndex,
            ),
          };
          this.serviceId$.next(this.journeyInfo.stops[0].serviceId);
          this.journeyInfoLoading = false;
        },
        error: (err) => {
          console.log(err);
          this.errorView = new VehicleJourneyNotFoundView();
          this.journeyInfoLoading = false;
        },
      });

    combineLatest([startTime$, this.serviceId$.pipe(distinctUntilChanged())])
      .pipe(
        tap(() => (this.journeysLoading = true)),
        mergeMap(([date, serviceId]) =>
          this.service.fetchDayJourneys(date, serviceId),
        ),
        takeUntil(this.onDestroy$),
      )
      .subscribe({
        next: (journeys) => {
          this.journeys = journeys;
          this.journeysLoading = false;
        },
        error: (err) => {
          console.log(err);
          this.journeys = [];
          this.journeysLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  onTimingPointsToggleChange() {
    const allStops = this.timingPointsOption === "all-stops" ? true : null;
    return this.router.navigate([], {
      queryParams: { allStops },
      queryParamsHandling: "merge",
    });
  }

  onEstimatedToggleChange() {
    const evidenced = this.estimated !== "true" ? true : null;
    return this.router.navigate([], {
      queryParams: { evidenced },
      queryParamsHandling: "merge",
    });
  }

  onStopSelected(stop: Stop) {
    this.selectedStop = stop;
  }

  onStopHovered(stop: StopHoverEvent) {
    this.hoveredStop = stop;
  }
}
