import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import {
  combineLatest,
  Subject,
  switchMap,
  takeUntil,
  tap,
  zip,
  distinctUntilChanged,
  map,
} from "rxjs";
import { VehicleJourneyNotFoundView } from "./vehicle-journey-not-found-view.model";
import { StopHoverEvent } from "./stop-list/stop-item/stop-item.component";
import { VehicleJourneysSearchService } from "../vehicle-journeys-search/vehicle-journeys-search.service";
import {
  AvlPoint,
  AvlsGQL,
  Journey,
  RouteGQL,
  Stop,
} from "../../../generated/graphql";
import { DateTime } from "luxon";

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
  groupId = "";
  vehicleRef: string | null = null;
  directionRef: string | null = null;
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
    const urlData$ = combineLatest([
      this.route.paramMap,
      this.route.queryParamMap,
    ]).pipe(
      map(([params, queryParams]) => ({
        groupId: params.get("journeyId")!,
        journeyStart: queryParams.get("startTime")!,
        lineId: queryParams.get("service")!,
        operator: queryParams.get("operator"),
        evidenced: queryParams.get("evidenced"),
        timingPointsOnly: queryParams.get("timingPointsOnly"),
        allStops: queryParams.get("allStops"),
        direction: queryParams.get("direction"),
      })),
      tap((urlData) => {
        this.returnQueryParams = {
          date: urlData.journeyStart,
          operator: urlData.operator,
          service: urlData.lineId,
        };
        this.estimated = urlData.evidenced !== "true" ? "true" : "false";
        this.timingPointsOption =
          urlData.timingPointsOnly === "true" || urlData.allStops !== "true"
            ? "timing-points"
            : "all-stops";
        this.groupId = urlData.groupId;
        this.directionRef = urlData.direction;
      }),
    );
    urlData$
      .pipe(
        distinctUntilChanged(
          (prev, cur) =>
            prev.groupId == cur.groupId && prev.direction == cur.direction,
        ),
        tap(() => (this.journeyInfoLoading = true)),
        switchMap(({ groupId }) => {
          return zip(
            this.routeGQL.fetch({ groupId }),
            this.avlsGQL.fetch({ groupId }),
          );
        }),
        takeUntil(this.onDestroy$),
      )
      .subscribe({
        next: ([routeResult, avlsResult]) => {
          if (!routeResult.data.route[0]) {
            this.errorView = new VehicleJourneyNotFoundView();
            return;
          }
          // Multiple journeys can use the same group id. Use the direction query param to disambiguate
          const directionRefLower = this.directionRef?.toLowerCase();
          const stops = [...routeResult.data.route]
            .filter(
              (n) =>
                !directionRefLower ||
                n.directionRef.toLowerCase() === directionRefLower,
            )
            .sort((a, b) => a.stopIndex - b.stopIndex);
          const avls = [...avlsResult.data.avls].sort((a, b) =>
            a.recordedAtTimeUtc.localeCompare(b.recordedAtTimeUtc),
          );

          const firstEvidencedMatch = stops.find((n) => n.actualDepartureUtc);
          const firstMatchedAvl = avls.find(
            (n) =>
              n.recordedAtTimeUtc === firstEvidencedMatch?.actualDepartureUtc,
          );
          this.vehicleRef = (firstMatchedAvl ?? avls[0])?.vehicleRef;
          this.journeyInfo = {
            // Direction ref on the avls is subject to human error, so we can't rely on the data quality.
            // We use the vehicle ref of the first match to filter if possible, and fall back to direction if there isn't one.
            avls: avls.filter((n) =>
              firstMatchedAvl
                ? n.vehicleRef === firstMatchedAvl.vehicleRef
                : !directionRefLower ||
                  n.directionRef.toLowerCase() === directionRefLower,
            ),
            stops: stops,
          };
          this.journeyInfoLoading = false;
        },
        error: (err) => {
          console.log(err);
          this.errorView = new VehicleJourneyNotFoundView();
          this.vehicleRef = null;
          this.journeyInfo = null;
          this.journeyInfoLoading = false;
        },
      });

    urlData$
      .pipe(
        tap(() => (this.journeysLoading = true)),
        switchMap(({ journeyStart, lineId }) =>
          this.service.fetchDayJourneys(
            DateTime.fromISO(journeyStart).startOf("day").toISO(),
            lineId,
          ),
        ),
        takeUntil(this.onDestroy$),
      )
      .subscribe({
        next: (journeys) => {
          this.journeys = journeys;
          // Multiple journeys can use the same group id. Use the direction query param to disambiguate
          this.currentJourneyIndex = journeys.findIndex(
            (v) =>
              v.groupId === this.groupId && v.directionRef == this.directionRef,
          );
          this.journeysLoading = false;
        },
        error: (err) => {
          console.log(err);
          this.errorView = new VehicleJourneyNotFoundView();
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
