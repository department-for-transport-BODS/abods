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

type TimingPointsOption = "timing-points" | "all-stops";

const createStopDetails = (stop: Stop, estimated: boolean) => {
  const details = {
    id: stop.stopId.toString(),
    stopName: stop.stopName,
    scheduledDepartureUtc: stop.scheduledDepartureUtc,
    actualDepartureUtc: stop.actualDepartureUtc ?? stop.estimatedDepartureUtc,
    otp: stop.otp,
    isTimingPoint: stop.isTimingPoint,
    lat: stop.latitude,
    lon: stop.longitude,
    operatorName: stop.operatorName,
    operatorNoc: stop.operatorNoc,
    serviceName: stop.serviceName,
    startTime: stop.startTime,
  };
  // If we're only looking at evidenced, then act as if no match was made
  if (!estimated && stop.estimatedDepartureUtc) {
    details.otp = null;
    details.actualDepartureUtc = null;
  }
  return details;
};

export type StopDetails = ReturnType<typeof createStopDetails>;

@Component({
  selector: "app-vehicle-journeys-view",
  templateUrl: "./vehicle-journeys-view.component.html",
  styleUrls: ["./vehicle-journeys-view.component.scss"],
})
export class VehicleJourneysViewComponent implements OnInit, OnDestroy {
  errorView?: VehicleJourneyNotFoundView;

  routeDetails: Stop[] = [];
  routeLoading = false;

  avls: AvlPoint[] = [];
  avlsLoading = false;

  journeys: VehicleJourney[] = [];
  journeysLoading = false;

  estimated: "true" | "false" = "false";
  timingPointsOption: TimingPointsOption = "timing-points";
  groupId = "";
  startTime = DateTime.fromSeconds(0);

  selectedStop?: StopDetails;
  hoveredStop?: StopHoverEvent;

  returnRoute = "/vehicle-journeys";
  returnQueryParams: Params | null = null;

  serviceId$ = new Subject<string>();

  get journeyTitle(): string {
    const firstStop = this.routeDetails[0];
    if (!firstStop) {
      return "Loading...";
    }
    return `${firstStop.lineName}: ${firstStop.serviceName}`;
  }

  get stops(): StopDetails[] {
    return this.routeDetails.map((n) =>
      createStopDetails(n, this.estimated === "true"),
    );
  }

  constructor(
    private route: ActivatedRoute,
    private service: VehicleJourneysSearchService,
    private routeGQL: RouteGQL,
    private avlsGQL: AvlsGQL,
    private router: Router,
  ) {}

  private onDestroy$ = new Subject<void>();

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((params) => {
        this.startTime = DateTime.fromISO(params.get("startTime") as string);
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
      map((queryParamMap) =>
        DateTime.fromISO(queryParamMap.get("startTime") as string).setZone(
          "Europe/London",
        ),
      ),
      distinctUntilChanged(),
      takeUntil(this.onDestroy$),
    );

    const groupId$ = this.route.paramMap.pipe(
      takeUntil(this.onDestroy$),
      map((params) => params.get("journeyId") as string),
    );
    groupId$.subscribe((groupId) => (this.groupId = groupId));

    combineLatest([groupId$])
      .pipe(
        tap(() => (this.routeLoading = true)),
        switchMap(([groupId]) => this.routeGQL.fetch({ groupId })),
        takeUntil(this.onDestroy$),
      )
      .subscribe({
        next: (result) => {
          if (!result.data.route[0]) {
            return (this.errorView = new VehicleJourneyNotFoundView());
          }
          this.routeDetails = result.data.route;
          this.serviceId$.next(result.data.route[0].serviceId);
          this.routeLoading = false;
        },
        error: (err) => {
          console.log(err);
          this.errorView = new VehicleJourneyNotFoundView();
          this.routeLoading = false;
        },
      });

    combineLatest([groupId$])
      .pipe(
        tap(() => (this.avlsLoading = true)),
        switchMap(([groupId]) => this.avlsGQL.fetch({ groupId })),
        takeUntil(this.onDestroy$),
      )
      .subscribe({
        next: (result) => {
          this.avls = result.data.avls;
          this.avlsLoading = false;
        },
        error: (err) => {
          console.log(err);
          this.avls = [];
          this.avlsLoading = false;
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

  async onTimingPointsToggleChange() {
    const allStops = this.timingPointsOption === "all-stops" ? true : null;
    await this.router.navigate([], {
      queryParams: { allStops },
      queryParamsHandling: "merge",
    });
  }

  async onEstimatedToggleChange() {
    await this.router.navigate([], {
      queryParams: { evidenced: this.estimated !== "true" ? true : null },
      queryParamsHandling: "merge",
    });
  }

  onStopSelected(stop: StopDetails) {
    this.selectedStop = stop;
  }

  onStopHovered(stop: StopHoverEvent) {
    this.hoveredStop = stop;
  }
}
