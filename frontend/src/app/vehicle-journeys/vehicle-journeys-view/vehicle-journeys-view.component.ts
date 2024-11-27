import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import {
  combineLatest,
  distinctUntilKeyChanged,
  Subject,
  switchMap,
  takeUntil,
  tap,
  zip,
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
import { distinctUntilChanged, map } from "rxjs/operators";
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

  get currentJourneyIndex() {
    return this.journeys.findIndex((v) => v.groupId === this.groupId);
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
      }),
    );
    urlData$
      .pipe(
        distinctUntilKeyChanged("groupId"),
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
          this.journeyInfoLoading = false;
        },
        error: (err) => {
          console.log(err);
          this.errorView = new VehicleJourneyNotFoundView();
          this.journeyInfo = null;
          this.journeyInfoLoading = false;
        },
      });
    urlData$
      .pipe(
        distinctUntilChanged(
          (prev, curr) =>
            DateTime.fromISO(prev.journeyStart).startOf("day").toISO() ===
              DateTime.fromISO(curr.journeyStart).startOf("day").toISO() &&
            prev.lineId === curr.lineId,
        ),
        tap(() => (this.journeysLoading = true)),
        switchMap(({ journeyStart, lineId }) => {
          // fetch more data
          return this.service.fetchDayJourneys(journeyStart, lineId);
        }),
        takeUntil(this.onDestroy$),
      )
      .subscribe({
        next: (journeys) => {
          this.journeys = journeys;
          this.journeysLoading = false;
        },
        error: (err) => {
          console.log(err);
          this.errorView = new VehicleJourneyNotFoundView();
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
