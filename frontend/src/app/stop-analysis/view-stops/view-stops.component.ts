import { Component, OnDestroy, OnInit } from "@angular/core";
import { FeatureCollection, Point } from "geojson";
import { Map } from "mapbox-gl";
import { ConfigService } from "../../config/config.service";
import { BRITISH_ISLES_BBOX } from "../../shared/geo";
import {
  BoundingBoxInputType,
  StopAnalysisGQL,
  StopStatistics,
} from "../../../generated/graphql";
import { Subject, takeUntil } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { DateTime } from "luxon";
import { StopPerformance } from "../../on-time/on-time.service";

@Component({
  selector: "app-view-stops",
  templateUrl: "./view-stops.component.html",
  styleUrls: ["./view-stops.component.scss"],
})
export class ViewStopsComponent implements OnInit, OnDestroy {
  points: FeatureCollection<Point, StopStatistics> = {
    type: "FeatureCollection",
    features: [],
  };

  isLoading = false;
  errored = false;
  /**
   * TODO: When hovering on the stop show:
   *     Common name
   *     atco code
   *     On time
   *     Early
   *     Late
   *     Incomplete
   * **/
  timingPointsOption = "timing-points";
  private map: Map | undefined = undefined;
  mapboxStyle = this.config.mapboxStyle;
  initialBounds = BRITISH_ISLES_BBOX;
  private boundsChanged = new Subject();
  private lastBounds: BoundingBoxInputType | undefined = undefined;
  private destroy$ = new Subject<void>();

  /**
   * TODO: Here when hovering over the stop show:
   *  Count: 32
   *  On-time: 78%
   *  Early: 2%
   *  Late: 20%
   *  Incomplete: 12%
   * **/
  clusterProperties = {
    early: ["+", ["get", "early"]],
    onTime: ["+", ["get", "onTime"]],
    late: ["+", ["get", "late"]],
    completedDepartures: ["+", ["get", "completedDepartures"]],
    scheduledDepartures: ["+", ["get", "scheduledDepartures"]],
  };

  zoomLevel = 0;
  private visibleBounds: BoundingBoxInputType = {
    maxLatitude: this.initialBounds[3],
    minLatitude: this.initialBounds[1],
    maxLongitude: this.initialBounds[2],
    minLongitude: this.initialBounds[0],
  };
  private rawPointData: StopStatistics[] = [];
  filteredPointData: StopPerformance[] = [];

  get boundingBoxTooBig() {
    return this.zoomLevel < 12;
  }

  constructor(
    private config: ConfigService,
    private query: StopAnalysisGQL,
  ) {}

  ngOnInit(): void {
    this.boundsChanged
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.map) return;
        if (this.boundingBoxTooBig) return;
        const bounds = this.getNewBounds(this.map);
        this.visibleBounds = bounds;

        if (this.withinLastBounds(bounds)) {
          this.processPointData();
          return;
        }

        // TODO: Might be best to expand the bounds here to that of the max zoom level to minimise fetching more

        const yesterday = DateTime.now().minus({ day: 1 }).startOf("day");
        const oneWeekAgo = yesterday.minus({ day: 6 }).startOf("day");
        /**
         *     TODO: Add filters:
         *      Postcode/area as per corridors
         *      Timing Points
         *      Estimated
         *      NOC (select multiple)
         *      Service (select multiple) (only show services in selected NOCs if selected)
         *      Start date
         *      End date
         *      Refine Results
         *          Day e.g. Monday (select multiple)
         *          Time range
         * **/
        this.isLoading = true;
        this.query
          .fetch({
            boundingBox: bounds,
            adminAreaIds: null,
            fromTimestamp: oneWeekAgo.toISO(),
            toTimestamp: yesterday.toISO(),
            operatorId: null,
            lineId: null,
          })
          .subscribe((response) => {
            this.lastBounds = bounds;
            this.rawPointData = response.data.stopAnalysis;
            this.processPointData();
            this.isLoading = false;
          });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onMapLoad(map: Map): void {
    this.map = map;
    this.onMapZoomEnd();
    this.onMapMoveEnd();
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

  onLayerMouseEnter(): void {
    if (!this.map) return;
    this.map.getCanvas().style.cursor = "pointer";
  }

  onLayerMouseLeave(): void {
    if (!this.map) return;
    this.map.getCanvas().style.cursor = "";
  }

  onClusterClick(event: { lngLat: { lng: number; lat: number } }): void {
    console.log(event);
    if (!this.map) return;
    const center: [number, number] = [event.lngLat.lng, event.lngLat.lat];
    this.map.easeTo({
      center,
      zoom: this.map.getZoom() + 1,
    });
  }

  processPointData(): void {
    const filtered = this.rawPointData.filter(
      (n) =>
        (this.timingPointsOption !== "timing-points" || n.timingPoint) &&
        n.latitude >= this.visibleBounds.minLatitude &&
        n.latitude <= this.visibleBounds.maxLatitude &&
        n.longitude >= this.visibleBounds.minLongitude &&
        n.longitude <= this.visibleBounds.maxLongitude,
    );
    // TODO: Fix hover state on stop list
    // TODO: Fix percentages on stop list
    // TODO: Zoom in on stop when clicked
    this.filteredPointData = filtered
      .map((x) => ({
        stopId: x.stopId.toString(),
        stopInfo: {
          stopId: x.stopId.toString(),
          stopName: x.stopName,
          stopLocality: {},
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
        total: 0, // ?
        onTimeRatio: x.onTime / x.completedDepartures || 0,
        earlyRatio: x.early / x.completedDepartures || 0,
        lateRatio: x.late / x.completedDepartures || 0,
        completedRatio: x.completedDepartures / x.scheduledDepartures || 0,
      }))
      .sort((a, b) => a.stopInfo.stopName.localeCompare(b.stopInfo.stopName));

    this.points = {
      type: "FeatureCollection",
      features: Object.values(
        // Combine points where the stop is used as a timing point and a non timing point
        filtered.reduce(
          (acc, cur) => {
            if (!acc[cur.stopId]) {
              acc[cur.stopId] = cur;
              return acc;
            }
            acc[cur.stopId] = {
              stopId: cur.stopId,
              stopName: cur.stopName,
              atcoCode: cur.atcoCode,
              latitude: cur.latitude,
              longitude: cur.longitude,
              timingPoint: cur.timingPoint || acc[cur.stopId].timingPoint,
              totalDelay: cur.totalDelay || acc[cur.stopId].totalDelay,
              onTime: cur.onTime || acc[cur.stopId].onTime,
              completedDepartures:
                cur.completedDepartures || acc[cur.stopId].completedDepartures,
              scheduledDepartures:
                cur.scheduledDepartures || acc[cur.stopId].scheduledDepartures,
              late: cur.late || acc[cur.stopId].late,
              early: cur.early || acc[cur.stopId].early,
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

  withinLastBounds(bounds: BoundingBoxInputType): boolean {
    if (!this.lastBounds) return false;
    return (
      bounds.minLongitude >= this.lastBounds.minLongitude &&
      bounds.minLatitude >= this.lastBounds.minLatitude &&
      bounds.maxLongitude <= this.lastBounds.maxLongitude &&
      bounds.maxLatitude <= this.lastBounds.maxLatitude
    );
  }
}
