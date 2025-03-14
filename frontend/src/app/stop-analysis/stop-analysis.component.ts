import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { FeatureCollection, Point } from "geojson";
import { CirclePaint, LngLat, Map, SymbolLayout } from "mapbox-gl";
import { ConfigService } from "../config/config.service";
import { BRITISH_ISLES_BBOX } from "../shared/geo";
import {
  BoundingBoxInputType,
  DayOfWeekFlagsInputType,
  MatchType,
  StopAnalysisGQL,
  StopStatistics,
} from "../../generated/graphql";
import { combineLatest, Subject, takeUntil } from "rxjs";
import { debounceTime, map, tap, filter, mergeMap } from "rxjs/operators";
import { DateTime } from "luxon";
import { StopPerformance } from "../on-time/on-time.service";
import { Preset } from "../shared/components/date-range/date-range.types";
import { DateRangeService } from "../shared/services/date-range.service";
import { GeocodingFeature } from "../shared/mapbox/geocoding.types";
import { getDefaultDayOfWeekFlags } from "../shared/components/day-of-week-select/day-of-week-utils";

const MAX_ZOOM_LEVEL = 12;

@Component({
  selector: "app-stop-analysis",
  templateUrl: "./stop-analysis.component.html",
  styleUrls: ["./stop-analysis.component.scss"],
})
export class StopAnalysisComponent implements OnInit, OnDestroy {
  stopPoints: FeatureCollection<Point, StopStatistics> = {
    type: "FeatureCollection",
    features: [],
  };

  isLoading = false;
  errored = false;

  matchType: MatchType = MatchType.Evidenced;
  timingPointsOption = "timing-points";
  operatorIds: string[] = [];
  to: DateTime;
  from: DateTime;
  private apiFiltersChanged = new Subject();

  private map: Map | undefined = undefined;
  mapboxStyle = this.config.mapboxStyle;
  initialBounds = BRITISH_ISLES_BBOX;
  private boundsChanged = new Subject();
  private lastBounds: BoundingBoxInputType | undefined = undefined;
  private destroy$ = new Subject<void>();

  clusterProperties = {
    early: ["+", ["get", "early"]],
    onTime: ["+", ["get", "onTime"]],
    late: ["+", ["get", "late"]],
    completedDepartures: ["+", ["get", "completedDepartures"]],
    scheduledDepartures: ["+", ["get", "scheduledDepartures"]],
  };
  redThreshold = 0.6;
  greenThreshold = 0.8;
  pointColours: CirclePaint["circle-color"] = [
    "case",
    ["==", ["get", "completedDepartures"], 0],
    "#b1b4b6",
    [
      "step",
      ["/", ["get", "onTime"], ["get", "completedDepartures"]],
      "#d4351c",
      this.redThreshold,
      "#ffdd00",
      this.greenThreshold,
      "#28a197",
    ],
  ];
  timingPointIcons: SymbolLayout["icon-image"] = [
    "case",
    ["==", ["get", "completedDepartures"], 0],
    "timing-no-data-map",
    [
      "step",
      ["/", ["get", "onTime"], ["get", "completedDepartures"]],
      "otp-timing-map-red",
      this.redThreshold,
      "otp-timing-map-yellow",
      this.greenThreshold,
      "otp-timing-map-turquoise",
    ],
  ];
  zoomLevel = 0;
  visibleBounds: BoundingBoxInputType = {
    maxLatitude: this.initialBounds[3],
    minLatitude: this.initialBounds[1],
    maxLongitude: this.initialBounds[2],
    minLongitude: this.initialBounds[0],
  };
  private rawStopData: StopStatistics[] = [];
  filteredStopData: StopPerformance[] = [];
  selectedStop: StopStatistics | undefined;
  selectedCluster:
    | Record<keyof typeof this.clusterProperties | "point_count", number>
    | undefined = undefined;
  selectedClusterCoordinates: [number, number] = [0, 0];
  center: LngLat | undefined;
  dayOfWeekFlags = getDefaultDayOfWeekFlags();

  _startTime = "00:00";
  get startTime() {
    return this._startTime;
  }
  set startTime(val: string) {
    this._startTime = val;
    this.onFilterChanged();
  }
  _endTime = "23:59";
  get endTime() {
    return this._endTime;
  }
  set endTime(val: string) {
    this._endTime = val;
    this.onFilterChanged();
  }

  get boundingBoxTooBig() {
    return this.zoomLevel < MAX_ZOOM_LEVEL;
  }

  constructor(
    private config: ConfigService,
    private query: StopAnalysisGQL,
    private cdr: ChangeDetectorRef,
    dateRangeService: DateRangeService,
  ) {
    const { from, to } = dateRangeService.calculatePresetPeriod(
      Preset.Last7,
      DateTime.local(),
    );
    this.from = from;
    this.to = to;
  }

  ngOnInit(): void {
    // TODO: parse query params
    const boundsChanged = this.boundsChanged.pipe(
      takeUntil(this.destroy$),
      map(() => {
        if (!this.map) return undefined;
        if (this.boundingBoxTooBig) return undefined;
        return this.getNewBounds(this.map);
      }),
      tap((bounds) => {
        if (!bounds) return;

        this.visibleBounds = bounds;

        if (!this.lastBounds) return;
        if (!this.withinBounds(bounds, this.lastBounds)) return;

        // Update map points whenever the user moves the map, if we have the data already
        this.processStopData(bounds);
      }),
      filter((bounds) => {
        if (!bounds) return false;
        return !this.lastBounds || !this.withinBounds(bounds, this.lastBounds);
      }),
    );

    combineLatest([boundsChanged, this.apiFiltersChanged])
      .pipe(
        // Don't fetch too quickly if there's a lot of map movement happening
        debounceTime(500),
        // Don't run requests concurrently, and only run the latest when completed again
        mergeMap(([bounds]) => {
          // TODO: Might be best to expand the bounds here to that of the max zoom level to minimise fetching more
          // TODO: limit date range

          /**
           *     TODO: Add filters:
           *      Service (select multiple) (only show services in selected NOCs if selected)
           * **/
          const query = {
            boundingBox: bounds!,
            adminAreaIds: [],
            fromTimestamp: this.from.toISO(),
            toTimestamp: this.to.toISO(),
            operatorIds: this.operatorIds,
            lineIds: [],
            matchType: this.matchType,
            dayOfWeekFlags: this.dayOfWeekFlags,
            startTime: this.startTime,
            endTime: this.endTime,
          };
          this.isLoading = true;
          return this.query
            .fetch(query)
            .pipe(map((response) => [query, response] as const));
        }, 1),
      )
      .subscribe(([query, response]) => {
        this.lastBounds = query.boundingBox;
        this.rawStopData = response.data.stopAnalysis;
        this.processStopData(this.visibleBounds);
        this.isLoading = false;
      });
    this.onFilterChanged();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onMapLoad(map: Map): void {
    this.map = map;
    this.onMapZoomEnd();
    this.onMapMoveEnd();

    // For some reason this doesn't work passing a method to the map layer props
    map.on("mouseenter", "clusters", (e) => {
      map.getCanvas().style.cursor = "pointer";
      if (!e.features || e.features.length <= 0 || !e.features[0].properties)
        return;

      const feature = e.features[0];
      if (feature.geometry.type !== "Point") return;

      this.selectedStop = undefined;
      this.selectedCluster = feature.properties as Record<
        keyof typeof this.clusterProperties | "point_count",
        number
      >;
      this.selectedClusterCoordinates =
        feature.geometry.coordinates.slice() as [number, number];

      this.cdr.detectChanges();
    });

    map.on("mouseleave", "clusters", () => {
      map.getCanvas().style.cursor = "";
      this.selectedCluster = undefined;
      this.cdr.detectChanges();
    });

    map.on("mouseenter", ["timing-stops", "other-stops"], (e) => {
      if (!e.features || e.features.length <= 0 || !e.features[0].properties)
        return;
      this.selectedStop = e.features[0].properties as StopStatistics;
      this.selectedCluster = undefined;
      this.cdr.detectChanges();
    });

    map.on("mouseleave", ["timing-stops", "other-stops"], () => {
      this.selectedStop = undefined;
      this.selectedCluster = undefined;
      this.cdr.detectChanges();
    });
  }

  onMapMoveEnd() {
    if (!this.map) return;
    this.boundsChanged.next(undefined);
  }

  onMapStyleChanged(style: string) {
    this.mapboxStyle = style;
  }

  onMapZoomEnd() {
    if (!this.map) return;
    this.zoomLevel = this.map.getZoom();
  }

  onClusterClick(event: { lngLat: { lng: number; lat: number } }): void {
    this.zoomToPoint([event.lngLat.lng, event.lngLat.lat]);
  }

  onTableStopNameClicked($event: StopPerformance) {
    this.zoomToPoint([
      $event.stopInfo.stopLocation.longitude,
      $event.stopInfo.stopLocation.latitude,
    ]);
  }

  onFilterChanged() {
    // TODO: update query params
    console.log("Filters changed");
    this.apiFiltersChanged.next(undefined);
  }

  onDatePickerChanged($event: { from: DateTime; to: DateTime }) {
    this.from = $event.from;
    this.to = $event.to;
    this.onFilterChanged();
  }

  onLocationSearchSelection(location?: GeocodingFeature) {
    if (!this.map) return;
    if (!location) return;
    this.map.easeTo({ center: location.center, zoom: MAX_ZOOM_LEVEL });
  }

  zoomToPoint(center: [number, number]) {
    if (!this.map) return;
    const zoom = this.map.getZoom() + 1;
    this.map.easeTo({ center, zoom });
  }

  processStopData(bounds: BoundingBoxInputType): void {
    const filtered = this.rawStopData.filter(
      (n) =>
        (this.timingPointsOption !== "timing-points" || n.timingPoint) &&
        n.latitude >= bounds.minLatitude &&
        n.latitude <= bounds.maxLatitude &&
        n.longitude >= bounds.minLongitude &&
        n.longitude <= bounds.maxLongitude,
    );
    this.filteredStopData = filtered
      .map(
        (x): StopPerformance => ({
          stopId: x.atcoCode,
          stopInfo: {
            stopId: x.atcoCode,
            stopName: x.stopName,
            stopLocality: {
              localityName: x.localityName,
              localityAreaName: x.adminAreaName,
            },
            stopLocation: {
              latitude: x.latitude,
              longitude: x.longitude,
            },
            sourceId: x.atcoCode,
          },
          timingPoint: x.timingPoint,
          scheduledDepartures: x.scheduledDepartures,
          late: x.late,
          actualDepartures: x.completedDepartures,
          early: x.early,
          onTime: x.onTime,
          averageDelay: x.totalDelay / x.completedDepartures || 0,
          total: x.completedDepartures,
          onTimeRatio: x.onTime / x.completedDepartures || 0,
          earlyRatio: x.early / x.completedDepartures || 0,
          lateRatio: x.late / x.completedDepartures || 0,
          completedRatio: x.completedDepartures / x.scheduledDepartures || 0,
        }),
      )
      .sort((a, b) => a.stopInfo.stopName.localeCompare(b.stopInfo.stopName));

    this.stopPoints = {
      type: "FeatureCollection",
      features: Object.values(
        // Combine points where the stop is used as a timing point and a non timing point
        filtered.reduce(
          (acc, cur) => {
            if (!acc[cur.atcoCode]) {
              acc[cur.atcoCode] = cur;
              return acc;
            }
            acc[cur.atcoCode] = {
              stopName: cur.stopName,
              atcoCode: cur.atcoCode,
              latitude: cur.latitude,
              longitude: cur.longitude,
              localityName: cur.localityName,
              adminAreaName: cur.adminAreaName,
              timingPoint: cur.timingPoint || acc[cur.atcoCode].timingPoint,
              totalDelay: cur.totalDelay || acc[cur.atcoCode].totalDelay,
              onTime: cur.onTime || acc[cur.atcoCode].onTime,
              completedDepartures:
                cur.completedDepartures ||
                acc[cur.atcoCode].completedDepartures,
              scheduledDepartures:
                cur.scheduledDepartures ||
                acc[cur.atcoCode].scheduledDepartures,
              late: cur.late || acc[cur.atcoCode].late,
              early: cur.early || acc[cur.atcoCode].early,
            };
            return acc;
          },
          {} as Record<string, StopStatistics>,
        ),
      ).map((point) => ({
        type: "Feature",
        properties: point,
        geometry: {
          type: "Point",
          coordinates: [point.longitude, point.latitude],
        },
      })),
    };
  }

  getNewBounds(map: Map): BoundingBoxInputType {
    const bounds = map.getBounds();
    return {
      maxLatitude: bounds.getNorth(),
      minLatitude: bounds.getSouth(),
      maxLongitude: bounds.getEast(),
      minLongitude: bounds.getWest(),
    };
  }

  withinBounds(
    newBounds: BoundingBoxInputType,
    bounds: BoundingBoxInputType,
  ): boolean {
    return (
      newBounds.minLongitude >= bounds.minLongitude &&
      newBounds.minLatitude >= bounds.minLatitude &&
      newBounds.maxLongitude <= bounds.maxLongitude &&
      newBounds.maxLatitude <= bounds.maxLatitude
    );
  }

  onOperatorsChanged($event: string[]) {
    this.operatorIds = $event;
    this.onFilterChanged();
  }

  onDayOfWeekFlagsChanged($event: DayOfWeekFlagsInputType) {
    this.dayOfWeekFlags = $event;
    this.onFilterChanged();
  }
}
