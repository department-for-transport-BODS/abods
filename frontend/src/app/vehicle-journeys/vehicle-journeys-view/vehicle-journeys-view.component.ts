import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import {
  combineLatest,
  map,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
  zip,
} from "rxjs";
import { VehicleJourneyNotFoundView } from "./vehicle-journey-not-found-view.model";
import { StopHoverEvent } from "./stop-list/stop-item/stop-item.component";
import { VehicleJourneysSearchService } from "../vehicle-journeys-search/vehicle-journeys-search.service";
import { DateTime } from "luxon";
import {
  AvlPoint,
  AvlsGQL,
  Journey,
  RouteGQL,
  Stop,
} from "../../../generated/graphql";

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

  journeys: Journey[] = [];
  journeysLoading = false;

  estimated: "true" | "false" = "true";
  timingPointsOption: "timing-points" | "all-stops" = "timing-points";

  selectedStop?: Stop;
  hoveredStop?: StopHoverEvent;

  returnRoute = "/vehicle-journeys";
  returnQueryParams: Params | null = null;

  routeDetails$ = new Subject<{
    groupId: string;
    journeyStart: string;
    lineId: string;
  }>();
  currentJourneyIndex = -1;

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
        this.returnQueryParams = {
          date: DateTime.fromISO(params.get("startTime")!)
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

    const groupId$ = this.route.paramMap.pipe(
      takeUntil(this.onDestroy$),
      map((params) => params.get("journeyId")!),
    );

    combineLatest([groupId$])
      .pipe(
        tap(() => (this.journeyInfoLoading = true)),
        switchMap(([groupId]) =>
          zip(
            this.routeGQL.fetch({ groupId }),
            this.avlsGQL.fetch({ groupId }),
            of(groupId),
          ),
        ),
        takeUntil(this.onDestroy$),
      )
      .subscribe({
        next: ([routeResult, avlsResult, groupId]) => {
          if (!routeResult.data.route[0]) {
            return (this.errorView = new VehicleJourneyNotFoundView());
          }
          const sortedAvls = [...avlsResult.data.avls].sort((a, b) =>
            a.recordedAtTimeUtc.localeCompare(b.recordedAtTimeUtc),
          );
          this.journeyInfo = {
            // Temporary workaround for two concurrent journeys having the same group id
            avls: sortedAvls.filter(
              (n) => n.vehicleRef === sortedAvls[0]?.vehicleRef,
            ),
            stops: [...routeResult.data.route].sort(
              (a, b) => a.stopIndex - b.stopIndex,
            ),
          };
          this.routeDetails$.next({
            journeyStart: this.journeyInfo.stops[0].scheduledDepartureUtc,
            groupId: groupId,
            lineId: this.journeyInfo.stops[0].lineId,
          });
          this.journeyInfoLoading = false;
        },
        error: (err) => {
          console.log(err);
          this.errorView = new VehicleJourneyNotFoundView();
          this.journeyInfoLoading = false;
        },
      });

    this.routeDetails$
      .pipe(
        tap(() => (this.journeysLoading = true)),
        switchMap((routeDetails) => {
          return zip(
            this.service.fetchDayJourneys(
              routeDetails.journeyStart,
              routeDetails.lineId,
            ),
            of(routeDetails),
          );
        }),
        takeUntil(this.onDestroy$),
      )
      .subscribe({
        next: ([journeys, routeDetails]) => {
          this.journeys = journeys;
          this.currentJourneyIndex = journeys.findIndex(
            (v) => v.groupId === routeDetails.groupId,
          );
          this.journeysLoading = false;
        },
        error: (err) => {
          console.log(err);
          this.journeys = [];
          this.currentJourneyIndex = -1;
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
