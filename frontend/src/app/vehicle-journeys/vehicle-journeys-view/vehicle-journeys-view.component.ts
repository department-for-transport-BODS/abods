import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import {
  combineLatest,
  distinctUntilChanged,
  map,
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
  MatchType,
  RouteGQL,
  Stop,
} from "../../../generated/graphql";
import { DateTime } from "luxon";

export interface JourneyInfo {
  stops: Stop[];
  avls: AvlPoint[];
}
const getDistinct = <T, U>(container: T[], accessor: (item: T) => U): U[] =>
  container
    .map(accessor)
    .filter((value, index, array) => array.indexOf(value) === index);

const getInitialVehicleRef = (stops: Stop[], avl_list: AvlPoint[]) => {
  const firstEvidencedMatch = stops.find((n) => n.actualDepartureUtc);
  const matchedAvl = avl_list.find(
    (n) => n.recordedAtTimeUtc === firstEvidencedMatch?.actualDepartureUtc,
  );
  if (matchedAvl) return matchedAvl.vehicleRef;
  return avl_list[0]?.vehicleRef;
};

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

  matchType: MatchType = MatchType.Evidenced;
  timingPointsOption: "timing-points" | "all-stops" = "timing-points";

  selectedStop?: Stop;
  hoveredStop?: StopHoverEvent;

  returnRoute = "/vehicle-journeys";
  returnQueryParams: Params | null = null;
  groupId = "";
  vehicles: string[] = [];
  rawAvls: AvlPoint[] = [];
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
        matchType: queryParams.get("match_type") as MatchType | undefined,
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
        this.matchType = urlData.matchType ?? MatchType.Evidenced;
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
          const direction = this.directionRef?.toLowerCase();
          const stopData = [...routeResult.data.route];
          const stops = stopData
            .filter(
              (n) => !direction || n.directionRef.toLowerCase() === direction,
            )
            .sort((a, b) => a.stopIndex - b.stopIndex);

          // If there are multiple directions in the timetable, then filter to just avls for the direction query param.
          // The other direction's data will be on another screen.
          // If there's only one in the timetable, then we can display all
          const directions = getDistinct(stopData, (n) => n.directionRef);
          this.rawAvls = [...avlsResult.data.avls]
            .filter(
              (n) =>
                directions.length <= 1 ||
                n.directionRef.toLowerCase() === direction,
            )
            .sort((a, b) =>
              a.recordedAtTimeUtc.localeCompare(b.recordedAtTimeUtc),
            );

          // Sometimes we can have multiple vehicles matching the same group id,
          // so we filter to the most interesting one first and then let them toggle
          this.vehicles = getDistinct(this.rawAvls, (n) => n.vehicleRef);
          this.vehicleRef =
            this.vehicles.length > 1
              ? getInitialVehicleRef(stops, this.rawAvls)
              : this.vehicles[0];
          const vehicleAvls = this.rawAvls.filter(
            (n) => n.vehicleRef === this.vehicleRef,
          );
          if (this.vehicles.length > 1) {
            // TODO: remove in BODS-7974. No need to do this once we have solved that problem
            const journeyStartTime = DateTime.fromISO(
              this.rawAvls[0].recordedAtTimeUtc,
            );
            const journeyEndTime = DateTime.fromISO(
              this.rawAvls.slice(-1)[0].recordedAtTimeUtc,
            );
            const hoursDifference = journeyEndTime
              .diff(journeyStartTime)
              .as("hours");
            if (hoursDifference > 23.75) {
              this.vehicles = [this.vehicleRef];
            }
          }

          this.journeyInfo = { avls: vehicleAvls, stops: stops };
          this.journeyInfoLoading = false;
        },
        error: (err) => {
          console.log(err);
          this.errorView = new VehicleJourneyNotFoundView();
          this.vehicleRef = null;
          this.rawAvls = [];
          this.vehicles = [];
          this.journeyInfo = null;
          this.journeyInfoLoading = false;
        },
      });

    urlData$
      .pipe(
        tap(() => (this.journeysLoading = true)),
        switchMap(({ journeyStart, lineId }) =>
          this.service.fetchDayJourneys(
            DateTime.fromISO(journeyStart)
              .setZone("Europe/London")
              .startOf("day")
              .toISO(),
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
    return this.router
      .navigate([], {
        queryParams: { allStops },
        queryParamsHandling: "merge",
      })
      .catch(console.log);
  }

  onMatchTypeChange() {
    const matchType = this.matchType;
    return this.router
      .navigate([], {
        queryParams: { match_type: matchType },
        queryParamsHandling: "merge",
      })
      .catch(console.log);
  }

  onVehicleChange() {
    const vehicleRef = this.vehicleRef;
    if (this.journeyInfo) {
      this.journeyInfo = {
        ...this.journeyInfo,
        avls: this.rawAvls.filter((n) => n.vehicleRef === vehicleRef),
      };
    }
  }

  onStopSelected(stop: Stop) {
    this.selectedStop = stop;
  }

  onStopHovered(stop: StopHoverEvent) {
    this.hoveredStop = stop;
  }
}
