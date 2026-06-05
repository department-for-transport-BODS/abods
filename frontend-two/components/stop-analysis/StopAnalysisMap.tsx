import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl, { Map, LngLatBoundsLike, GeoJSONSource, MapMouseEvent } from "mapbox-gl";
import type { FeatureCollection, Feature, Point } from "geojson";
import bboxClip from "@turf/bbox-clip";
import pointOnFeature from "@turf/point-on-feature";
import { MapDisplayOptions } from "@/components/shared/MapDisplayOptions";
import { BoundingBox, StopStatistics } from "@/types/stop-analysis";

// British Isles default bounds
const BRITISH_ISLES_BBOX: LngLatBoundsLike = [
  -10.5, 49.5, 2.0, 61.0,
];

const RED_THRESHOLD = 0.6;
const GREEN_THRESHOLD = 0.8;
const MAX_BOUND_WIDTH = 0.5;
const ADMIN_AREA_HIDDEN_ZOOM = 12;

const POINT_COLOURS: mapboxgl.Expression = [
  "case",
  ["==", ["get", "completedDepartures"], 0],
  "#b1b4b6",
  [
    "step",
    ["/", ["get", "onTime"], ["get", "completedDepartures"]],
    "#d4351c",
    RED_THRESHOLD,
    "#ffdd00",
    GREEN_THRESHOLD,
    "#28a197",
  ],
];

const TIMING_POINT_ICONS: mapboxgl.Expression = [
  "case",
  ["==", ["get", "completedDepartures"], 0],
  "timing-no-data-map",
  [
    "step",
    ["/", ["get", "onTime"], ["get", "completedDepartures"]],
    "otp-timing-map-red",
    RED_THRESHOLD,
    "otp-timing-map-yellow",
    GREEN_THRESHOLD,
    "otp-timing-map-turquoise",
  ],
];

const CLUSTER_PROPERTIES = {
  early: ["+", ["get", "early"]] as [string, mapboxgl.Expression],
  onTime: ["+", ["get", "onTime"]] as [string, mapboxgl.Expression],
  late: ["+", ["get", "late"]] as [string, mapboxgl.Expression],
  completedDepartures: ["+", ["get", "completedDepartures"]] as [string, mapboxgl.Expression],
  scheduledDepartures: ["+", ["get", "scheduledDepartures"]] as [string, mapboxgl.Expression],
};

interface StopAnalysisMapProps {
  mapboxToken: string;
  mapboxStyle: string;
  mapboxSatelliteStyle?: string;
  stops: StopStatistics[];
  adminAreaShapes: FeatureCollection;
  boundingBoxTooBig: boolean;
  initialBounds?: BoundingBox;
  focusStop?: { latitude: number; longitude: number } | null;
  selectedAdminAreaBounds?: BoundingBox | null;
  locationSelection?: {
    center?: [number, number];
    bbox?: [number, number, number, number];
  };
  locationSelectionRequest?: number;
  onBoundsChange: (bounds: BoundingBox) => void;
  onAdminAreaClick?: (adminAreaId: string) => void;
  onStopClick?: (stop: StopStatistics) => void;
}

export const StopAnalysisMap = ({
  mapboxToken,
  mapboxStyle,
  mapboxSatelliteStyle,
  stops,
  adminAreaShapes,
  boundingBoxTooBig,
  initialBounds,
  focusStop,
  selectedAdminAreaBounds,
  locationSelection,
  locationSelectionRequest,
  onBoundsChange,
  onAdminAreaClick,
  onStopClick,
}: StopAnalysisMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const mapboxStyleRef = useRef(mapboxStyle);
  const mapboxSatelliteStyleRef = useRef(mapboxSatelliteStyle);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [styleRevision, setStyleRevision] = useState(0);
  const [activeStyle, setActiveStyle] = useState<"street" | "satellite">(
    "street",
  );
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredAdminAreaRef = useRef<Feature | null>(null);
  const getFeatureBounds = useCallback((features: Feature[]) => {
    const bounds = new mapboxgl.LngLatBounds();
    let hasCoordinates = false;

    const addCoordinate = (value: unknown) => {
      if (!Array.isArray(value) || value.length < 2) return;
      if (typeof value[0] === "number" && typeof value[1] === "number") {
        bounds.extend([value[0], value[1]] as [number, number]);
        hasCoordinates = true;
        return;
      }

      value.forEach(addCoordinate);
    };

    features.forEach((feature) => {
      addCoordinate((feature.geometry as { coordinates?: unknown })?.coordinates);
    });

    return hasCoordinates ? bounds : null;
  }, []);

  const clearPopup = useCallback(() => {
    popupRef.current?.remove();
    popupRef.current = null;
  }, []);

  const updateAdminAreaPopup = useCallback((map: Map) => {
    const hoveredAdminArea = hoveredAdminAreaRef.current;
    if (!hoveredAdminArea) return;
    if (map.getZoom() >= 11) {
      clearPopup();
      return;
    }

    const bounds = map.getBounds();
    const clippedFeature = bboxClip(hoveredAdminArea, [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]);
    const labelPoint = pointOnFeature(clippedFeature);
    const coordinates = labelPoint.geometry.coordinates as [number, number];
    const properties = hoveredAdminArea.properties as {
      id?: string;
      name?: string;
    } | undefined;

    if (!properties?.name || !properties?.id) {
      clearPopup();
      return;
    }

    clearPopup();

    const content = document.createElement("div");
    const name = document.createElement("div");
    name.className = "govuk-body-small govuk-!-font-weight-bold govuk-!-margin-bottom-1";
    name.textContent = properties.name;
    content.appendChild(name);

    const id = document.createElement("div");
    id.className = "govuk-body-small";
    id.textContent = properties.id;
    content.appendChild(id);

    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: "200px",
      className: "gds-popup",
    })
      .setLngLat(coordinates)
      .setDOMContent(content)
      .addTo(map);
  }, [clearPopup]);


  useEffect(() => {
    mapboxStyleRef.current = mapboxStyle;
  }, [mapboxStyle]);

  useEffect(() => {
    mapboxSatelliteStyleRef.current = mapboxSatelliteStyle;
  }, [mapboxSatelliteStyle]);

  const stopGeoJSON: FeatureCollection = {
    type: "FeatureCollection",
    features: stops.map((stop) => ({
      type: "Feature",
      properties: stop,
      geometry: {
        type: "Point",
        coordinates: [stop.longitude, stop.latitude],
      },
    })),
  };

  // Initialise map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapboxStyle,
      bounds: initialBounds
        ? [
            [initialBounds.minLongitude, initialBounds.minLatitude],
            [initialBounds.maxLongitude, initialBounds.maxLatitude],
          ]
        : BRITISH_ISLES_BBOX,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(
      new mapboxgl.GeolocateControl({ trackUserLocation: false }),
      "top-right",
    );

    map.on("load", () => {
      // Add timing point icons (placeholders — real app would load actual sprites)
      // For now, the symbol layer will degrade gracefully without custom icons
      setMapLoaded(true);
    });

    map.on("style.load", () => {
      // When style changes, all custom sources/layers are removed and must be re-added.
      setStyleRevision((prev) => prev + 1);
    });

    map.on("moveend", () => {
      const bounds = map.getBounds();
      onBoundsChange({
        minLatitude: bounds.getSouth(),
        maxLatitude: bounds.getNorth(),
        minLongitude: bounds.getWest(),
        maxLongitude: bounds.getEast(),
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken, mapboxStyle]);

  // Add/update sources and layers once map is loaded
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.isStyleLoaded()) return;

    try {
      // Admin area boundaries
      if (map.getSource("boundaries")) {
        (map.getSource("boundaries") as GeoJSONSource).setData(adminAreaShapes);
      } else {
        map.addSource("boundaries", {
          type: "geojson",
          data: adminAreaShapes,
          promoteId: "id",
        });

        map.addLayer({
          id: "admin-area-boundaries",
          source: "boundaries",
          type: "fill",
          paint: {
            "fill-color": "#28A197",
            "fill-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              9,
              [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                0.5,
                0.3,
              ],
              ADMIN_AREA_HIDDEN_ZOOM,
              0,
            ],
          },
        });

        // Admin area hover
        let hoveredId: string | number | null = null;
        map.on("mouseenter", "admin-area-boundaries", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mousemove", "admin-area-boundaries", (e) => {
          if (!e.features || e.features.length === 0) return;

          const hoveredFeature = e.features[0] as Feature | undefined;
          if (!hoveredFeature) return;

          if (hoveredId !== null) {
            map.setFeatureState(
              { source: "boundaries", id: hoveredId },
              { hover: false },
            );
          }
          hoveredId = hoveredFeature.id ?? null;
          if (hoveredId !== null) {
            map.setFeatureState(
              { source: "boundaries", id: hoveredId },
              { hover: true },
            );
          }

          hoveredAdminAreaRef.current = hoveredFeature;
          updateAdminAreaPopup(map);
        });
        map.on("mouseleave", "admin-area-boundaries", () => {
          map.getCanvas().style.cursor = "";
          if (hoveredId !== null) {
            map.setFeatureState(
              { source: "boundaries", id: hoveredId },
              { hover: false },
            );
            hoveredId = null;
          }
          hoveredAdminAreaRef.current = null;
          clearPopup();
        });

        map.on("moveend", () => {
          updateAdminAreaPopup(map);
        });

        // Admin area click
        map.on("click", "admin-area-boundaries", (e) => {
          if (e.features && e.features[0]?.properties) {
            onAdminAreaClick?.(e.features[0].properties.id);
          }
        });
      }
    } catch {
      return;
    }
  }, [mapLoaded, adminAreaShapes, onAdminAreaClick, styleRevision, clearPopup, updateAdminAreaPopup]);

  // Update stops data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getSource("stops")) {
      (map.getSource("stops") as GeoJSONSource).setData(
        boundingBoxTooBig
          ? { type: "FeatureCollection", features: [] }
          : stopGeoJSON,
      );
    } else {
      map.addSource("stops", {
        type: "geojson",
        data: boundingBoxTooBig
          ? { type: "FeatureCollection", features: [] }
          : stopGeoJSON,
        cluster: true,
        clusterRadius: 80,
        clusterProperties: CLUSTER_PROPERTIES,
      });

      // Cluster circles
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "stops",
        filter: ["has", "point_count"],
        paint: {
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            5,
            25,
            20,
            30,
            50,
            35,
            100,
            40,
          ],
          "circle-color": POINT_COLOURS,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Cluster count labels
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "stops",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["number-format", ["get", "point_count"], {}],
          "text-size": 16,
        },
        paint: {
          "text-color": "#000000",
        },
      });

      // Non-timing-point stops
      map.addLayer({
        id: "other-stops",
        type: "circle",
        source: "stops",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["!", ["get", "timingPoint"]],
        ],
        paint: {
          "circle-radius": 14,
          "circle-color": POINT_COLOURS,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Timing point stops (symbol layer)
      map.addLayer({
        id: "timing-stops",
        type: "symbol",
        source: "stops",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["get", "timingPoint"],
        ],
        layout: {
          "icon-size": 0.9,
          "icon-allow-overlap": true,
          "icon-image": TIMING_POINT_ICONS,
        },
      });

      // Cluster click to zoom
      map.on("click", "clusters", (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const clusterId = feature.properties?.cluster_id;
        if (feature.geometry.type !== "Point") return;
        const coordinates = feature.geometry.coordinates as [number, number];
        (map.getSource("stops") as GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return;
            map.easeTo({ center: coordinates, zoom: zoom ?? undefined });
          },
        );
      });

      // Stop hover popup
      map.on("mouseenter", ["timing-stops", "other-stops"], (e) => {
        map.getCanvas().style.cursor = "pointer";
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties;
        if (!props) return;

        const completedDepartures = props.completedDepartures ?? 0;
        const scheduledDepartures = props.scheduledDepartures ?? 0;
        const onTimeRatio =
          completedDepartures > 0
            ? ((props.onTime / completedDepartures) * 100).toFixed(1)
            : "N/A";
        const earlyRatio =
          completedDepartures > 0
            ? ((props.early / completedDepartures) * 100).toFixed(1)
            : "N/A";
        const lateRatio =
          completedDepartures > 0
            ? ((props.late / completedDepartures) * 100).toFixed(1)
            : "N/A";
        const incompleteRatio =
          scheduledDepartures > 0
            ? (
                ((scheduledDepartures - completedDepartures) /
                  scheduledDepartures) *
                100
              ).toFixed(1)
            : "N/A";

        const coords =
          e.features[0].geometry.type === "Point"
            ? (e.features[0].geometry.coordinates.slice() as [number, number])
            : [e.lngLat.lng, e.lngLat.lat] as [number, number];

        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
        })
          .setLngLat(coords)
          .setHTML(
            `<div>
              <h3 class="govuk-heading-s govuk-!-margin-bottom-1">${props.stopName}</h3>
              <p class="govuk-body-s govuk-!-margin-bottom-1"><strong>ATCO:</strong> ${props.atcoCode}</p>
              <p class="govuk-body-s govuk-!-margin-bottom-1"><strong>On time:</strong> ${onTimeRatio}%</p>
              <p class="govuk-body-s govuk-!-margin-bottom-1"><strong>Early:</strong> ${earlyRatio}%</p>
              <p class="govuk-body-s govuk-!-margin-bottom-1"><strong>Late:</strong> ${lateRatio}%</p>
              <p class="govuk-body-s govuk-!-margin-bottom-0"><strong>Incomplete:</strong> ${incompleteRatio}%</p>
            </div>`,
          )
          .addTo(map);
      });

      map.on("mouseleave", ["timing-stops", "other-stops"], () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
        popupRef.current = null;
      });

      // Cluster hover popup
      map.on("mouseenter", "clusters", (e) => {
        map.getCanvas().style.cursor = "pointer";
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties;
        if (!props) return;
        const completedDepartures = props.completedDepartures ?? 0;
        const scheduledDepartures = props.scheduledDepartures ?? 0;
        const onTimeRatio =
          completedDepartures > 0
            ? ((props.onTime / completedDepartures) * 100).toFixed(1)
            : "N/A";
        const earlyRatio =
          completedDepartures > 0
            ? ((props.early / completedDepartures) * 100).toFixed(1)
            : "N/A";
        const lateRatio =
          completedDepartures > 0
            ? ((props.late / completedDepartures) * 100).toFixed(1)
            : "N/A";
        const incompleteRatio =
          scheduledDepartures > 0
            ? (
                ((scheduledDepartures - completedDepartures) /
                  scheduledDepartures) *
                100
              ).toFixed(1)
            : "N/A";

        const coords =
          e.features[0].geometry.type === "Point"
            ? (e.features[0].geometry.coordinates.slice() as [number, number])
            : [e.lngLat.lng, e.lngLat.lat] as [number, number];

        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
        })
          .setLngLat(coords)
          .setHTML(
            `<div>
              <h3 class="govuk-heading-s govuk-!-margin-bottom-1">Cluster of ${props.point_count} stops</h3>
              <p class="govuk-body-s govuk-!-margin-bottom-1"><strong>On time:</strong> ${onTimeRatio}%</p>
              <p class="govuk-body-s govuk-!-margin-bottom-1"><strong>Early:</strong> ${earlyRatio}%</p>
              <p class="govuk-body-s govuk-!-margin-bottom-1"><strong>Late:</strong> ${lateRatio}%</p>
              <p class="govuk-body-s govuk-!-margin-bottom-0"><strong>Incomplete:</strong> ${incompleteRatio}%</p>
            </div>`,
          )
          .addTo(map);
      });

      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
        popupRef.current = null;
      });

      // Individual stop click
      map.on("click", ["timing-stops", "other-stops"], (e) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties;
        if (props) onStopClick?.(props as unknown as StopStatistics);
      });
    }
  }, [mapLoaded, boundingBoxTooBig, stopGeoJSON, onStopClick, styleRevision]);

  // Fit to bounds when initialBounds changes from URL params
  const fitBounds = useCallback(
    (bounds: BoundingBox) => {
      mapRef.current?.fitBounds(
        [
          [bounds.minLongitude, bounds.minLatitude],
          [bounds.maxLongitude, bounds.maxLatitude],
        ],
        { maxDuration: 500 },
      );
    },
    [],
  );

  useEffect(() => {
    if (!focusStop || !mapLoaded || !mapRef.current) return;

    const map = mapRef.current;
    map.easeTo({
      center: [focusStop.longitude, focusStop.latitude],
      zoom: map.getZoom() + 1,
    });
  }, [focusStop, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.isStyleLoaded()) return;
    if (!selectedAdminAreaBounds) {
      return;
    }

    try {
      map.fitBounds(
        [
          [selectedAdminAreaBounds.minLongitude, selectedAdminAreaBounds.minLatitude],
          [selectedAdminAreaBounds.maxLongitude, selectedAdminAreaBounds.maxLatitude],
        ],
        {
          duration: 500,
          padding: 40,
          maxZoom: ADMIN_AREA_HIDDEN_ZOOM,
        },
      );
    } catch {
      return;
    }
  }, [selectedAdminAreaBounds, mapLoaded, styleRevision]);

  useEffect(() => {
    if (!locationSelectionRequest || !mapLoaded || !mapRef.current) return;
    if (!locationSelection) return;

    const map = mapRef.current;
    if (locationSelection.bbox && locationSelection.bbox.length === 4) {
      const [minLongitude, minLatitude, maxLongitude, maxLatitude] =
        locationSelection.bbox;
      map.fitBounds(
        [
          [minLongitude, minLatitude],
          [maxLongitude, maxLatitude],
        ],
        { duration: 500, maxZoom: 15 },
      );
      return;
    }

    if (locationSelection.center && locationSelection.center.length === 2) {
      map.flyTo({ center: locationSelection.center, zoom: 15 });
    }
  }, [locationSelectionRequest, locationSelection, mapLoaded]);

  const switchStyle = useCallback((style: "street" | "satellite") => {
    const map = mapRef.current;
    if (!map) return;

    setActiveStyle(style);
    map.setStyle(
      style === "street"
        ? mapboxStyleRef.current
        : mapboxSatelliteStyleRef.current ?? mapboxStyleRef.current,
    );
  }, []);

  return (
    <div className="stop-analysis-map">
      <div ref={mapContainer} className="stop-analysis-map__container" />
      <MapDisplayOptions
        activeStyle={activeStyle}
        mapboxSatelliteStyle={mapboxSatelliteStyle}
        onStyleChange={switchStyle}
      />
      {boundingBoxTooBig && mapLoaded && (
        <div className="stop-analysis-map__overlay">
          <p className="govuk-body">Zoom in to show stops</p>
        </div>
      )}
      <StopAnalysisLegend />
    </div>
  );
};

const StopAnalysisLegend = () => (
  <div className="stop-analysis-map__legend">
    <span className="stop-analysis-map__dot stop-analysis-map__dot--high" />
    <span>&gt; 80% on-time</span>
    <span className="stop-analysis-map__dot stop-analysis-map__dot--med" />
    <span>60% - 80% on-time</span>
    <span className="stop-analysis-map__dot stop-analysis-map__dot--low" />
    <span>&lt; 60% on-time</span>
    <span className="stop-analysis-map__dot stop-analysis-map__dot--no-data" />
    <span>No data</span>
  </div>
);

export { StopAnalysisLegend };
