import { Component, OnDestroy, OnInit } from "@angular/core";
import { FeatureCollection, Point } from "geojson";
import { Map } from "mapbox-gl";
import { ConfigService } from "../../config/config.service";
import { BRITISH_ISLES_BBOX } from "../../shared/geo";
import {
  BoundingBoxInputType,
  StopAnalysisGQL,
  StopAnalysisType,
} from "../../../generated/graphql";
import { Subject, takeUntil } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { DateTime } from "luxon";

@Component({
  selector: "app-view-stops",
  templateUrl: "./view-stops.component.html",
  styleUrls: ["./view-stops.component.scss"],
})
export class ViewStopsComponent implements OnInit, OnDestroy {
  points: FeatureCollection<Point, StopAnalysisType> = {
    type: "FeatureCollection",
    features: [],
  };

  isLoading = false;
  private map: Map | undefined = undefined;
  mapboxStyle = this.config.mapboxStyle;
  initialBounds = BRITISH_ISLES_BBOX;
  private boundsChanged = new Subject();
  private lastBounds: BoundingBoxInputType | undefined = undefined;
  private destroy$ = new Subject<void>();

  clusterProperties = {
    totalDelay: [
      "+",
      ["*", ["get", "averageDelay"], ["get", "completedDepartures"]],
    ],
    totalDepartures: ["+", ["get", "completedDepartures"]],
  };

  zoomLevel = 0;
  get boundingBoxTooBig() {
    return this.zoomLevel < 12;
  }

  constructor(
    private config: ConfigService,
    private query: StopAnalysisGQL,
  ) {}

  ngOnInit(): void {
    this.boundsChanged
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.map) return;
        if (this.boundingBoxTooBig) return;
        const bounds = this.getNewBounds(this.map);

        if (this.withinLastBounds(bounds)) {
          console.log("Within last fetched bounds. Skipping");
          return;
        }

        const yesterday = DateTime.now().minus({ day: 1 }).startOf("day");
        const oneWeekAgo = yesterday.minus({ day: 6 }).startOf("day");

        this.isLoading = true;
        this.query
          .fetch({
            //TODO: add more params
            boundingBox: bounds,
            adminAreaIds: null,
            fromTimestamp: oneWeekAgo.toISO(),
            toTimestamp: yesterday.toISO(),
            operatorId: null,
            lineId: null,
          })
          .subscribe((response) => {
            this.lastBounds = bounds;
            this.processPointData(response.data.stopAnalysis);
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

  processPointData(points: StopAnalysisType[]): void {
    this.points = {
      type: "FeatureCollection",
      features: points.map((point) => ({
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
