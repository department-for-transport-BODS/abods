import { Component, OnInit, OnDestroy } from "@angular/core";
import mapboxgl from "mapbox-gl";
import { Subject } from "rxjs";
import { debounceTime, takeUntil } from "rxjs/operators";
import { StopAnalysisGQL, StopAnalysisType } from "../../../generated/graphql";
import { BRITISH_ISLES_BBOX } from "../../shared/geo";

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

@Component({
  selector: "app-view-stops",
  templateUrl: "./view-stops.component.html",
  styleUrls: ["./view-stops.component.scss"],
})
export class ViewStopsComponent implements OnInit, OnDestroy {
  private map!: mapboxgl.Map;
  private delayPoints: StopAnalysisType[] = [];
  private boundsChanged = new Subject<MapBounds>();
  private destroy$ = new Subject<void>();
  isLoading = false;

  // Tracking the last fetched bounds to optimize API calls
  private lastFetchedBounds = BRITISH_ISLES_BBOX;

  // Configuration options
  private initialZoom = 9;
  private initialCenter: [number, number] = [-74.5, 40]; // Default center - adjust as needed
  private boundsChangeDebounceTime = 500; // ms to wait after bounds change before fetching
  private bufferPercentage = 0.1; // 10% buffer around the viewport for prefetching

  constructor(private query: StopAnalysisGQL) {}

  ngOnInit(): void {
    this.initializeMap();
    this.setupBoundsChangeListener();

    // Initial data fetch will happen when map loads and fires moveend
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up map instance if needed
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap(): void {
    // Replace with your Mapbox access token
    mapboxgl.accessToken = "your-mapbox-access-token";

    this.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/light-v10",
      center: this.initialCenter,
      zoom: this.initialZoom,
    });

    this.map.on("load", () => {
      // Add source and layers once map is loaded
      this.map.addSource("delay-points", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterRadius: 50, // Adjust clustering radius as needed
        clusterProperties: {
          // Calculate average delay for each cluster
          avg_delay: [
            "+",
            ["/", ["get", "averageDelay"], ["get", "point_count"]],
          ],
        },
      });

      // Add a layer for the clusters
      this.map.addLayer({
        id: "clusters",
        type: "circle",
        source: "delay-points",
        filter: ["has", "point_count"],
        paint: {
          // Size circles based on the number of points in the cluster
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            5, // 20px circle for clusters with < 5 points
            30,
            20, // 30px circle for clusters with < 20 points
            40, // 40px circle for clusters with >= 20 points
          ],
          // Color circles based on average delay
          "circle-color": [
            "step",
            ["get", "avg_delay"],
            "#4caf50",
            15, // green for delays 0-15 mins
            "#ffeb3b",
            30, // yellow for delays 16-30 mins
            "#ff9800",
            60, // orange for delays 31-60 mins
            "#f44336", // red for delays > 60 mins
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      // Add a layer for the cluster count labels
      this.map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "delay-points",
        filter: ["has", "point_count"],
        layout: {
          "text-field": [
            "concat",
            ["to-string", ["round", ["get", "avg_delay"]]],
            "m",
          ],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Add a layer for unclustered points
      this.map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "delay-points",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 10,
          "circle-color": [
            "step",
            ["get", "averageDelay"],
            "#4caf50",
            15,
            "#ffeb3b",
            30,
            "#ff9800",
            60,
            "#f44336",
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
        },
      });

      // Add a click handler for clusters
      this.map.on("click", "clusters", (e) => {
        const [{ geometry, properties }] = this.map.queryRenderedFeatures(
          e.point,
          {
            layers: ["clusters"],
          },
        );
        const clusterId = properties!.cluster_id;

        (
          this.map.getSource("delay-points") as mapboxgl.GeoJSONSource
        ).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;

          this.map.easeTo({
            center: (geometry as any).coordinates,
            zoom: zoom,
          });
        });
      });

      // Change cursor on hover
      this.map.on("mouseenter", "clusters", () => {
        this.map.getCanvas().style.cursor = "pointer";
      });

      this.map.on("mouseleave", "clusters", () => {
        this.map.getCanvas().style.cursor = "";
      });

      // Trigger initial data fetch after map is fully loaded
      this.fetchForCurrentBounds();

      // Set up the move end event to fetch new data
      this.map.on("moveend", () => {
        this.handleMapBoundsChanged();
      });
    });
  }

  private setupBoundsChangeListener(): void {
    this.boundsChanged
      .pipe(
        debounceTime(this.boundsChangeDebounceTime), // Debounce to avoid too many API calls
        takeUntil(this.destroy$),
      )
      .subscribe((bounds) => this.fetchDelayPoints(bounds));
  }

  private handleMapBoundsChanged(): void {
    if (!this.map) return;

    const currentBounds = this.getCurrentBoundsWithBuffer();

    // Skip fetch if current view is completely within the previously fetched area
    if (this.isBoundsWithinLastFetched(currentBounds)) {
      console.log(
        "Skipping fetch: current view within previously fetched bounds",
      );
      return;
    }

    this.boundsChanged.next(currentBounds);
  }

  private getCurrentBoundsWithBuffer(): MapBounds {
    const bounds = this.map.getBounds();

    // Calculate the width and height of the bounds in degrees
    const width = bounds.getEast() - bounds.getWest();
    const height = bounds.getNorth() - bounds.getSouth();

    // Add buffer around the current viewport for smoother experience
    // This prevents fetching when user pans slightly
    const bufferWidth = width * this.bufferPercentage;
    const bufferHeight = height * this.bufferPercentage;

    return {
      north: bounds.getNorth() + bufferHeight,
      south: bounds.getSouth() - bufferHeight,
      east: bounds.getEast() + bufferWidth,
      west: bounds.getWest() - bufferWidth,
    };
  }

  private isBoundsWithinLastFetched(currentBounds: MapBounds): boolean {
    // If no previous fetch, must fetch
    if (!this.lastFetchedBounds) {
      return false;
    }

    // Check if current bounds are completely within the last fetched bounds
    return (
      currentBounds.north <= this.lastFetchedBounds.north &&
      currentBounds.south >= this.lastFetchedBounds.south &&
      currentBounds.east <= this.lastFetchedBounds.east &&
      currentBounds.west >= this.lastFetchedBounds.west
    );
  }

  private fetchForCurrentBounds(): void {
    const currentBounds = this.getCurrentBoundsWithBuffer();
    this.boundsChanged.next(currentBounds);
  }

  private fetchDelayPoints(bounds: MapBounds): void {
    this.isLoading = true;

    this.query
      .fetch({
        //TODO: add more params
        boundingBox: {
          maxLatitude: bounds.north,
          maxLongitude: bounds.east,
          minLatitude: bounds.south,
          minLongitude: bounds.west,
        },
      })
      .subscribe((response) => {
        this.delayPoints = response.data.stopAnalysis;
        this.updateMapData();
        this.isLoading = false;

        // Store these bounds as last fetched
        this.lastFetchedBounds = bounds;
      });
  }

  private updateMapData(): void {
    if (!this.map?.getSource("delay-points")) {
      // Map not initialized yet, retry after a short delay
      setTimeout(() => this.updateMapData(), 100);
      return;
    }

    // Convert points to GeoJSON format
    const features = this.delayPoints.map((point) => ({
      type: "Feature" as const,
      properties: {
        id: point.id,
        delay: point.delay,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [point.longitude, point.latitude],
      },
    }));

    // Update the source with new data
    (this.map.getSource("delay-points") as mapboxgl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features,
    });
  }
}
