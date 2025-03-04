import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Subject } from "rxjs";
import { debounceTime, takeUntil } from "rxjs/operators";
import { GeoJSONSource, Map, MapboxGeoJSONFeature } from "mapbox-gl";
import { MapComponent } from "ngx-mapbox-gl";
import {
  BoundingBoxInputType,
  StopAnalysisGQL,
  StopAnalysisType,
} from "../../../generated/graphql";
import { FeatureCollection, Point } from "geojson";

@Component({
  selector: "app-view-stops",
  templateUrl: "./view-stops.component.html",
  styleUrls: ["./view-stops.component.scss"],
})
export class ViewStopsComponent implements OnInit, OnDestroy {
  @ViewChild(MapComponent) mapComponent!: MapComponent;

  initialZoom = 9;
  initialCenter = [-74.5, 40];

  geojsonData: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: [],
  };

  isLoading = false;
  private mapInstance!: Map;
  private boundsChanged = new Subject<BoundingBoxInputType>();
  private destroy$ = new Subject<void>();

  clusterProperties = {
    avg_delay: ["+", ["/", ["get", "averageDelay"], ["get", "point_count"]]],
  };

  constructor(private query: StopAnalysisGQL) {}

  ngOnInit(): void {
    this.setupBoundsChangeListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onMapLoad(map: Map): void {
    this.mapInstance = map;
    this.onMapMoveEnd();
  }

  onMapMoveEnd(): void {
    if (!this.mapInstance) return;

    const bounds = this.mapInstance.getBounds();
    this.boundsChanged.next({
      maxLatitude: bounds.getNorth(),
      minLatitude: bounds.getSouth(),
      maxLongitude: bounds.getEast(),
      minLongitude: bounds.getWest(),
    });
  }

  onClusterClick(event: { features: MapboxGeoJSONFeature[] }): void {
    if (!event.features.length || !this.mapInstance) return;

    const feature = event.features[0];
    console.log(feature);
    if (!feature.properties) return;
    const clusterId = feature.properties.cluster_id;

    if (!clusterId) return;

    const source = this.mapInstance.getSource("delay-points") as GeoJSONSource;

    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      if (feature.geometry.type !== "Point") return;
      if (feature.geometry.coordinates.length < 2) return;
      const [lat, long] = feature.geometry.coordinates;
      this.mapInstance.easeTo({ center: [lat, long], zoom: zoom });
    });
  }

  onLayerMouseEnter(): void {
    if (!this.mapInstance) return;
    this.mapInstance.getCanvas().style.cursor = "pointer";
  }

  onLayerMouseLeave(): void {
    if (!this.mapInstance) return;
    this.mapInstance.getCanvas().style.cursor = "";
  }

  private setupBoundsChangeListener(): void {
    this.boundsChanged
      .pipe(
        debounceTime(500), // 500ms debounce time
        takeUntil(this.destroy$),
      )
      .subscribe((bounds) => {
        this.fetchDelayPoints(bounds);
      });
  }

  private fetchDelayPoints(bounds: BoundingBoxInputType): void {
    this.isLoading = true;

    //TODO: add more params
    this.query.fetch({ boundingBox: bounds }).subscribe((response) => {
      this.updateMapData(response.data.stopAnalysis);
      this.isLoading = false;
    });
  }

  private updateMapData(points: StopAnalysisType[]): void {
    this.geojsonData = {
      type: "FeatureCollection",
      features: points.map((point) => ({
        type: "Feature",
        properties: {
          id: point.stopId,
          delay: point.averageDelay,
        },
        geometry: {
          type: "Point",
          coordinates: [point.longitude, point.latitude],
        },
      })),
    };
  }
}
