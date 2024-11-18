import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { combineLatest, map, Subject, switchMap, takeUntil, tap } from "rxjs";
import { VehicleJourneyView } from "./vehicle-journey-view.model";
import { VehicleJourneyNotFoundView } from "./vehicle-journey-not-found-view.model";
import { StopHoverEvent } from "./stop-list/stop-item/stop-item.component";
import {
  VehicleJourney,
  VehicleJourneysSearchService,
} from "../vehicle-journeys-search/vehicle-journeys-search.service";
import { DateTime } from "luxon";
import { Stop } from "../../../generated/graphql";

type TimingPointsOption = "timing-points" | "all-stops";

@Component({
  selector: "app-vehicle-journeys-view",
  templateUrl: "./vehicle-journeys-view.component.html",
  styleUrls: ["./vehicle-journeys-view.component.scss"],
})
export class VehicleJourneysViewComponent implements OnInit, OnDestroy {
  view?: VehicleJourneyView;
  errorView?: VehicleJourneyNotFoundView;
  loading = false;
  estimated: "true" | "false" = "false";
  timingPointsOption: TimingPointsOption = "timing-points";
  prevNextJourneys: [VehicleJourney | undefined, VehicleJourney | undefined] = [
    undefined,
    undefined,
  ];

  selectedStop?: Stop;
  hoveredStop?: StopHoverEvent;

  returnRoute = "/vehicle-journeys";
  returnQueryParams: Params | null = null;

  get journeyTitle(): string {
    return `${this.view?.journeyInfo.serviceInfo?.serviceNumber}: ${this.view?.journeyInfo.serviceInfo?.serviceName}`;
  }

  constructor(
    private route: ActivatedRoute,
    private service: VehicleJourneysSearchService,
    private router: Router,
  ) {}

  private onDestroy$ = new Subject<void>();

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map((queryParams) => ({
          date: DateTime.fromISO(queryParams.get("startTime") as string)
            .startOf("day")
            .toUTC()
            ?.toISO({ format: "basic", suppressSeconds: true }),
          operator: queryParams.get("operator"),
          service: queryParams.get("service"),
        })),
        takeUntil(this.onDestroy$),
      )
      .subscribe((params) => (this.returnQueryParams = params));

    const journeyId$ = this.route.paramMap.pipe(
      map((paramMap) => paramMap.get("journeyId") as string),
      takeUntil(this.onDestroy$),
    );

    const startTime$ = this.route.queryParamMap.pipe(
      map((queryParamMap) =>
        DateTime.fromISO(queryParamMap.get("startTime") as string),
      ),
      takeUntil(this.onDestroy$),
    );

    this.route.queryParamMap
      .pipe(
        map((params) => params.get("estimated") === "true"),
        takeUntil(this.onDestroy$),
      )
      .subscribe((estimated) => {
        this.estimated = estimated ? "true" : "false";
      });

    this.route.queryParamMap
      .pipe(
        map((params) => {
          return (
            params.get("timingPointsOnly") === "true" ||
            params.get("allStops") !== "true"
          );
        }),
        takeUntil(this.onDestroy$),
      )
      .subscribe((timingPointsOnly) => {
        this.timingPointsOption = timingPointsOnly
          ? "timing-points"
          : "all-stops";
      });

    combineLatest([journeyId$, startTime$])
      .pipe(
        tap(() => (this.loading = true)),
        switchMap(([journeyId, startTime]) =>
          this.service.getJourney(journeyId, startTime),
        ),
        takeUntil(this.onDestroy$),
      )
      .subscribe({
        next: (view) => {
          this.view = view;
          this.prevNextJourneys = view.prevNextJourneys;
          this.loading = false;
        },
        error: (err) => {
          console.log(err);
          return (this.errorView = new VehicleJourneyNotFoundView());
        },
      });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  onTimingPointsToggleChange() {
    const allStops = this.timingPointsOption === "all-stops" ? true : null;
    this.router.navigate([], {
      queryParams: { allStops },
      queryParamsHandling: "merge",
    });
  }

  onEstimatedToggleChange() {
    this.router.navigate([], {
      queryParams: { estimated: this.estimated === "true" ? true : null },
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
