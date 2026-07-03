import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl, { Map, LngLatBoundsLike, GeoJSONSource } from "mapbox-gl";
import type {
  FeatureCollection,
  Feature,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
} from "geojson";
import bboxClip from "@turf/bbox-clip";
import pointOnFeature from "@turf/point-on-feature";
import { MapDisplayOptions } from "@/components/shared/MapDisplayOptions";
import { Spinner } from "@/components/shared/Spinner";
import { registerTimingPointIcons } from "@/components/icons/timingPointIcons";
import { BoundingBoxInputType as BoundingBox } from "@/src/generated/graphql";

import { StopStatistics } from "@/src/generated/graphql";

// British Isles default bounds
const BRITISH_ISLES_BBOX: LngLatBoundsLike = [-10.5, 49.5, 2.0, 61.0];

const ADMIN_AREA_HIDDEN_ZOOM = 12;

const RED_THRESHOLD = 0.6;
const GREEN_THRESHOLD = 0.8;

const POINT_COLOURS = [
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
] as NonNullable<mapboxgl.CirclePaint>["circle-color"];

const CLUSTER_PROPERTIES = {
  early: ["+", ["get", "early"]] as [string, mapboxgl.ExpressionSpecification],
  onTime: ["+", ["get", "onTime"]] as [
    string,
    mapboxgl.ExpressionSpecification,
  ],
  late: ["+", ["get", "late"]] as [string, mapboxgl.ExpressionSpecification],
  completedDepartures: ["+", ["get", "completedDepartures"]] as [
    string,
    mapboxgl.ExpressionSpecification,
  ],
  scheduledDepartures: ["+", ["get", "scheduledDepartures"]] as [
    string,
    mapboxgl.ExpressionSpecification,
  ],
};

type ClipableGeometry = LineString | MultiLineString | Polygon | MultiPolygon;
type ClipableFeature = Feature<ClipableGeometry>;

const isClipableFeature = (feature: Feature): feature is ClipableFeature => {
  const geometryType = feature.geometry?.type;
  return (
    geometryType === "LineString" ||
    geometryType === "MultiLineString" ||
    geometryType === "Polygon" ||
    geometryType === "MultiPolygon"
  );
};

interface StopAnalysisMapProps {
  mapboxToken: string;
  mapboxStyle: string;
  mapboxSatelliteStyle?: string;
  loading?: boolean;
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
  loading = false,
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
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;
  const [mapLoaded, setMapLoaded] = useState(false);
  const [styleRevision, setStyleRevision] = useState(0);
  const [activeStyle, setActiveStyle] = useState<"default" | "satellite">(
    "default",
  );
  const lastAutoFitBoundsKeyRef = useRef<string | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredAdminAreaRef = useRef<ClipableFeature | null>(null);

  const clearPopup = useCallback(() => {
    popupRef.current?.remove();
    popupRef.current = null;
  }, []);

  const updateAdminAreaPopup = useCallback(
    (map: Map) => {
      if (!map) {
        return;
      }
      const hoveredAdminArea = hoveredAdminAreaRef.current;
      if (!hoveredAdminArea) return;
      if (map.getZoom() >= 11) {
        clearPopup();
        return;
      }

      const bounds = map.getBounds();
      if (!bounds) return;

      const clippedFeature = bboxClip(hoveredAdminArea, [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]);

      let coordinates: [number, number] | null = null;
      try {
        const labelPoint = pointOnFeature(clippedFeature);
        const rawCoordinates = labelPoint.geometry?.coordinates;
        if (
          Array.isArray(rawCoordinates) &&
          rawCoordinates.length >= 2 &&
          Number.isFinite(rawCoordinates[0]) &&
          Number.isFinite(rawCoordinates[1])
        ) {
          coordinates = [rawCoordinates[0], rawCoordinates[1]];
        }
      } catch {
        clearPopup();
        return;
      }

      if (!coordinates) {
        clearPopup();
        return;
      }

      const properties = hoveredAdminArea.properties as
        | {
            id?: string;
            name?: string;
          }
        | undefined;

      if (!properties?.name || !properties?.id) {
        clearPopup();
        return;
      }

      clearPopup();

      const content = document.createElement("div");
      const name = document.createElement("div");
      name.className =
        "govuk-body-small govuk-!-font-weight-bold govuk-!-margin-bottom-1";
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
    },
    [clearPopup],
  );

  useEffect(() => {
    mapboxStyleRef.current = mapboxStyle;
  }, [mapboxStyle]);

  useEffect(() => {
    mapboxSatelliteStyleRef.current = mapboxSatelliteStyle;
  }, [mapboxSatelliteStyle]);

  const stopGeoJSON: FeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features: stops.map((stop) => ({
        type: "Feature",
        properties: stop,
        geometry: {
          type: "Point",
          coordinates: [stop.longitude, stop.latitude],
        },
      })),
    }),
    [stops],
  );

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
      void (async () => {
        try {
          await registerTimingPointIcons(map);
        } finally {
          setMapLoaded(true);
        }
      })();
    });

    map.on("style.load", () => {
      void (async () => {
        try {
          await registerTimingPointIcons(map);
        } finally {
          setStyleRevision((prev) => prev + 1);
        }
      })();
    });

    map.on("moveend", () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      onBoundsChangeRef.current({
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
          if (!hoveredFeature || !isClipableFeature(hoveredFeature)) return;

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

        // Admin area click — block clicks when areas are hidden at high zoom
        map.on("click", "admin-area-boundaries", (e) => {
          if (map.getZoom() >= ADMIN_AREA_HIDDEN_ZOOM) return;
          if (e.features && e.features[0]?.properties) {
            onAdminAreaClick?.(e.features[0].properties.id);
          }
        });
      }
    } catch {
      return;
    }
  }, [
    mapLoaded,
    adminAreaShapes,
    onAdminAreaClick,
    styleRevision,
    clearPopup,
    updateAdminAreaPopup,
  ]);

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

      // Non-timing-point stop markers
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

      // Timing-point stop markers
      map.addLayer({
        id: "timing-stops",
        type: "symbol",
        source: "stops",
        filter: ["all", ["!", ["has", "point_count"]], ["get", "timingPoint"]],
        layout: {
          "icon-size": 0.9,
          "icon-allow-overlap": true,
          "icon-image": [
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
          ] as NonNullable<mapboxgl.SymbolLayout>["icon-image"],
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
            : ([e.lngLat.lng, e.lngLat.lat] as [number, number]);

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
            : ([e.lngLat.lng, e.lngLat.lat] as [number, number]);

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
    if (!map || !mapLoaded) return;

    const targetBounds = selectedAdminAreaBounds
      ? [
          [
            selectedAdminAreaBounds.minLongitude,
            selectedAdminAreaBounds.minLatitude,
          ],
          [
            selectedAdminAreaBounds.maxLongitude,
            selectedAdminAreaBounds.maxLatitude,
          ],
        ]
      : initialBounds
        ? [
            [initialBounds.minLongitude, initialBounds.minLatitude],
            [initialBounds.maxLongitude, initialBounds.maxLatitude],
          ]
        : [
            [BRITISH_ISLES_BBOX[0], BRITISH_ISLES_BBOX[1]],
            [BRITISH_ISLES_BBOX[2], BRITISH_ISLES_BBOX[3]],
          ];

    const fitKey = selectedAdminAreaBounds
      ? `admin:${selectedAdminAreaBounds.minLongitude.toFixed(6)},${selectedAdminAreaBounds.minLatitude.toFixed(6)},${selectedAdminAreaBounds.maxLongitude.toFixed(6)},${selectedAdminAreaBounds.maxLatitude.toFixed(6)}`
      : initialBounds
        ? `initial:${initialBounds.minLongitude.toFixed(6)},${initialBounds.minLatitude.toFixed(6)},${initialBounds.maxLongitude.toFixed(6)},${initialBounds.maxLatitude.toFixed(6)}`
        : "default-british-isles";

    if (lastAutoFitBoundsKeyRef.current === fitKey) {
      return;
    }
    lastAutoFitBoundsKeyRef.current = fitKey;

    try {
      map.fitBounds(targetBounds as LngLatBoundsLike, {
        duration: 500,
        padding: 40,
      });
    } catch {
      return;
    }
  }, [selectedAdminAreaBounds, initialBounds, mapLoaded, styleRevision]);

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

  const switchStyle = useCallback((style: "default" | "satellite") => {
    const map = mapRef.current;
    if (!map) return;

    setActiveStyle(style);
    map.setStyle(
      style === "default"
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
          <p>Zoom in to show stops</p>
        </div>
      )}
      {loading && (
        <div
          className="stop-analysis-map__loading-overlay"
          role="status"
          aria-live="polite"
          aria-label="Loading stop analysis map"
        >
          <Spinner size="x-small" />
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
