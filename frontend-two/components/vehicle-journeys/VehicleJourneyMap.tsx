import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { DateTime } from "luxon";
import mapboxgl from "mapbox-gl";
import { ReCentreIcon } from "@/components/icons/ReCentreIcon";
import { MapDisplayOptions } from "@/components/shared/MapDisplayOptions";
import { Spinner } from "@/components/shared/Spinner";
import { useConfig } from "@/contexts/ConfigContext";
import { MatchType, OtpEnum } from "@/src/generated/graphql";
import {
  VehicleJourneyAvl,
  VehicleJourneyStop,
} from "@/types/vehicle-journeys";
import { getStopOtp } from "@/components/vehicle-journeys/vehicleJourneysUtils";

interface VehicleJourneyMapProps {
  stops: VehicleJourneyStop[];
  avls: VehicleJourneyAvl[];
  rawAvls: VehicleJourneyAvl[];
  scheduledRoute: [number, number][] | null;
  directionRef: string | null;
  matchType: MatchType;
  loading?: boolean;
  selectedStop?: VehicleJourneyStop | null;
  hoveredStop?: VehicleJourneyStop | null;
}

type MapStyle = "default" | "satellite";

const OTP_EARLY = OtpEnum.Early;
const OTP_ON_TIME = OtpEnum.OnTime;
const OTP_LATE = OtpEnum.Late;

const EARLY_COLOR = "#d53880";
const ON_TIME_COLOR = "#4c2c92";
const LATE_COLOR = "#e5c700";
const NO_DATA_COLOR = "#b1b4b6";

const otpPaintExpression: mapboxgl.Expression = [
  "case",
  ["==", ["get", "onTimePerformance"], OTP_EARLY],
  EARLY_COLOR,
  ["==", ["get", "onTimePerformance"], OTP_ON_TIME],
  ON_TIME_COLOR,
  ["==", ["get", "onTimePerformance"], OTP_LATE],
  LATE_COLOR,
  NO_DATA_COLOR,
];

const hasPoint = (point: { latitude: number; longitude: number }) =>
  Number.isFinite(point.latitude) && Number.isFinite(point.longitude);

const pairwise = <T,>(items: T[]): [T, T][] => {
  const pairs: [T, T][] = [];
  for (let index = 0; index < items.length - 1; index += 1) {
    pairs.push([items[index], items[index + 1]]);
  }
  return pairs;
};

const loadMapImage = (map: mapboxgl.Map, url: string) =>
  new Promise<HTMLImageElement | ImageBitmap | ImageData>((resolve, reject) => {
    map.loadImage(url, (error, image) => {
      if (error || !image) {
        reject(error ?? new Error(`Unable to load map image: ${url}`));
        return;
      }
      resolve(image);
    });
  });

const ensureImage = async (map: mapboxgl.Map, id: string, url: string) => {
  if (map.hasImage(id)) return;
  map.addImage(id, await loadMapImage(map, url));
};

const registerJourneyMapImages = async (map: mapboxgl.Map) => {
  await Promise.all([
    ensureImage(map, "map-chevron-early", "/assets/icons/map-chevron-early.svg"),
    ensureImage(
      map,
      "map-chevron-on-time",
      "/assets/icons/map-chevron-on-time.svg",
    ),
    ensureImage(map, "map-chevron-late", "/assets/icons/map-chevron-late.svg"),
    ensureImage(
      map,
      "map-chevron-no-data",
      "/assets/icons/map-chevron-no-data.svg",
    ),
    ensureImage(
      map,
      "timing-early",
      "/assets/icons/timing-early-map-solid.svg",
    ),
    ensureImage(
      map,
      "timing-on-time",
      "/assets/icons/timing-on-time-map-solid.svg",
    ),
    ensureImage(map, "timing-late", "/assets/icons/timing-late-map-solid.svg"),
    ensureImage(
      map,
      "timing-no-data",
      "/assets/icons/timing-no-data-map-solid.svg",
    ),
  ]);
};

type VehiclePing = {
  id: string;
  lat: number;
  lon: number;
  ts: string;
  onTimePerformance: OtpEnum | null;
};

type VehiclePingStop = {
  id: string;
  stopName: string;
  isTimingPoint: boolean;
  lat: number;
  lon: number;
  onTimePerformance: OtpEnum | null;
};

const createStopModel = (
  stop: VehicleJourneyStop,
  matchType: MatchType,
): VehiclePingStop => ({
  id: stop.stopId.toString(),
  stopName: stop.stopName,
  isTimingPoint: stop.isTimingPoint,
  lat: stop.latitude,
  lon: stop.longitude,
  onTimePerformance: getStopOtp(stop, matchType),
});

const createVehiclePing = (
  ping: VehicleJourneyAvl,
  otp: OtpEnum | null,
): VehiclePing => ({
  lat: ping.latitude,
  lon: ping.longitude,
  ts: ping.recordedAtTimeUtc,
  onTimePerformance: otp,
  id: `${ping.latitude}${ping.longitude}${ping.recordedAtTimeUtc}`,
});

const getStopSourceId = (stop: { isTimingPoint: boolean }) =>
  stop.isTimingPoint ? "journey-timing-points" : "journey-stops";

const createPopupContent = (rows: { text: string; className: string }[]) => {
  const content = document.createElement("div");

  rows.forEach(({ text, className }) => {
    const row = document.createElement("div");
    row.className = className;
    row.textContent = text;
    content.appendChild(row);
  });

  return content;
};

const createStopPopupContent = (stopName: string) =>
  createPopupContent([
    {
      text: stopName,
      className: "govuk-body-small govuk-!-font-weight-bold govuk-!-margin-bottom-1",
    },
  ]);

const createPingPopupContent = (receivedAt: string) =>
  createPopupContent([
    {
      text: `Received at: ${receivedAt}`,
      className: "govuk-body-small govuk-!-font-weight-bold govuk-!-margin-bottom-1",
    },
  ]);

const buildJourneyGeoJson = (
  stops: VehicleJourneyStop[],
  avls: VehicleJourneyAvl[],
  scheduledRoute: [number, number][] | null,
  matchType: MatchType,
) => {
  const estimated = matchType === MatchType.Estimated;
  const stopModels = stops.filter(hasPoint).map((stop) => createStopModel(stop, matchType));
  const stopFeatures = stopModels
    .filter((stop) => !stop.isTimingPoint)
    .map((stop) => ({
      type: "Feature" as const,
      id: stop.id,
      properties: stop,
      geometry: {
        type: "Point" as const,
        coordinates: [stop.lon, stop.lat],
      },
    }));
  const timingFeatures = stopModels
    .filter((stop) => stop.isTimingPoint)
    .map((stop) => ({
      type: "Feature" as const,
      id: stop.id,
      properties: stop,
      geometry: {
        type: "Point" as const,
        coordinates: [stop.lon, stop.lat],
      },
    }));

  const pings = avls.filter(hasPoint).map((ping) => {
    const lastMatchedStop = stops
      .filter(
        (stop) =>
          (stop.actualDepartureUtc &&
            stop.actualDepartureUtc <= ping.recordedAtTimeUtc) ||
          (estimated &&
            stop.estimatedDepartureUtc &&
            stop.estimatedDepartureUtc <= ping.recordedAtTimeUtc),
      )
      .at(-1);
    return createVehiclePing(ping, lastMatchedStop?.otp ?? null);
  });

  const lineFeatures = pairwise(pings).map(([start, end]) => ({
    type: "Feature" as const,
    properties: {
      id: `${start.id}${end.id}`,
      onTimePerformance: start.onTimePerformance,
    },
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [start.lon, start.lat],
        [end.lon, end.lat],
      ],
    },
  }));

  const pingFeatures = pings.map((ping) => ({
    type: "Feature" as const,
    id: ping.id,
    properties: ping,
    geometry: {
      type: "Point" as const,
      coordinates: [ping.lon, ping.lat],
    },
  }));

  return {
    stops: { type: "FeatureCollection" as const, features: stopFeatures },
    timingPoints: {
      type: "FeatureCollection" as const,
      features: timingFeatures,
    },
    line: { type: "FeatureCollection" as const, features: lineFeatures },
    pings: { type: "FeatureCollection" as const, features: pingFeatures },
    scheduledRoute: {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: scheduledRoute ?? [],
      },
    },
  };
};

const buildBounds = (
  stops: VehicleJourneyStop[],
  avls: VehicleJourneyAvl[],
  scheduledRoute: [number, number][] | null,
) => {
  const bounds = new mapboxgl.LngLatBounds();

  stops.filter(hasPoint).forEach((stop) => {
    bounds.extend([stop.longitude, stop.latitude]);
  });
  avls.filter(hasPoint).forEach((avl) => {
    bounds.extend([avl.longitude, avl.latitude]);
  });
  scheduledRoute?.forEach((point) => bounds.extend(point));

  return bounds.isEmpty() ? null : bounds;
};

const SOURCE_IDS = [
  "journey-line",
  "journey-stops",
  "journey-timing-points",
  "journey-pings",
  "scheduled-route-source",
] as const;

const LAYER_IDS = [
  "scheduled-route-line",
  "journey-line-layer",
  "journey-line-chevrons",
  "journey-ping-layer",
  "journey-stop-layer",
  "journey-timing-point-layer",
] as const;

const removeJourneyLayers = (map: mapboxgl.Map) => {
  LAYER_IDS.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  });
  SOURCE_IDS.forEach((sourceId) => {
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  });
};

const addJourneyLayers = (
  map: mapboxgl.Map,
  geojson: ReturnType<typeof buildJourneyGeoJson>,
  showScheduledRoute: boolean,
) => {
  removeJourneyLayers(map);

  map.addSource("journey-line", {
    type: "geojson",
    promoteId: "id",
    data: geojson.line,
  });
  map.addSource("journey-stops", {
    type: "geojson",
    promoteId: "id",
    data: geojson.stops,
  });
  map.addSource("journey-timing-points", {
    type: "geojson",
    promoteId: "id",
    data: geojson.timingPoints,
  });
  map.addSource("journey-pings", {
    type: "geojson",
    promoteId: "id",
    data: geojson.pings,
  });
  map.addSource("scheduled-route-source", {
    type: "geojson",
    data: geojson.scheduledRoute,
  });

  if (showScheduledRoute && geojson.scheduledRoute.geometry.coordinates.length >= 2) {
    map.addLayer({
      id: "scheduled-route-line",
      type: "line",
      source: "scheduled-route-source",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#999999",
        "line-width": 2,
        "line-dasharray": [0.5, 2],
        "line-opacity": 0.8,
      },
    });
  }

  map.addLayer({
    id: "journey-line-layer",
    type: "line",
    source: "journey-line",
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": otpPaintExpression,
      "line-width": 3,
      "line-opacity": [
        "interpolate",
        ["exponential", 0.5],
        ["zoom"],
        12,
        1,
        14,
        0.5,
      ],
    },
  });

  map.addLayer({
    id: "journey-line-chevrons",
    type: "symbol",
    source: "journey-line",
    minzoom: 12,
    layout: {
      "icon-image": [
        "case",
        ["==", ["get", "onTimePerformance"], OTP_EARLY],
        "map-chevron-early",
        ["==", ["get", "onTimePerformance"], OTP_ON_TIME],
        "map-chevron-on-time",
        ["==", ["get", "onTimePerformance"], OTP_LATE],
        "map-chevron-late",
        "map-chevron-no-data",
      ],
      "symbol-placement": "line",
      "symbol-spacing": 500,
    },
    paint: {
      "icon-opacity": [
        "interpolate",
        ["exponential", 0.5],
        ["zoom"],
        12,
        1,
        14,
        0.5,
      ],
    },
  });

  map.addLayer({
    id: "journey-ping-layer",
    type: "circle",
    source: "journey-pings",
    minzoom: 14,
    paint: {
      "circle-color": "#505a5f",
      "circle-radius": 3.5,
      "circle-stroke-width": 0,
    },
  });

  map.addLayer({
    id: "journey-stop-layer",
    type: "circle",
    source: "journey-stops",
    paint: {
      "circle-color": "#ffffff",
      "circle-radius": [
        "interpolate",
        ["exponential", 0.8],
        ["zoom"],
        11,
        2,
        14,
        6,
      ],
      "circle-stroke-width": [
        "interpolate",
        ["exponential", 0.5],
        ["zoom"],
        11,
        1,
        14,
        3,
      ],
      "circle-stroke-color": otpPaintExpression,
    },
  });

  map.addLayer({
    id: "journey-timing-point-layer",
    type: "symbol",
    source: "journey-timing-points",
    layout: {
      "icon-size": [
        "interpolate",
        ["exponential", 0.5],
        ["zoom"],
        11,
        0.8,
        14,
        1,
      ],
      "icon-image": [
        "case",
        ["==", ["get", "onTimePerformance"], OTP_EARLY],
        "timing-early",
        ["==", ["get", "onTimePerformance"], OTP_ON_TIME],
        "timing-on-time",
        ["==", ["get", "onTimePerformance"], OTP_LATE],
        "timing-late",
        "timing-no-data",
      ],
      "symbol-placement": "point",
      "icon-allow-overlap": true,
    },
  });
};

const OtpLegend = () => (
  <div className="otp-legend govuk-!-margin-top-4">
    <div className="otp-legend__item">
      <span className="otp-legend__icon otp-legend__icon--on-time" />
      <span className="otp-legend__value">
        <strong>On-time</strong>
      </span>
    </div>
    <div className="otp-legend__item">
      <span className="otp-legend__icon otp-legend__icon--late" />
      <span className="otp-legend__value">
        <strong>Late</strong>
      </span>
      <span className="otp-legend__value otp-legend__value--muted">
        (&gt; 5:59 minutes)
      </span>
    </div>
    <div className="otp-legend__item">
      <span className="otp-legend__icon otp-legend__icon--early" />
      <span className="otp-legend__value">
        <strong>Early</strong>
      </span>
      <span className="otp-legend__value otp-legend__value--muted">
        (&gt; 1 minute)
      </span>
    </div>
    <div className="otp-legend__item">
      <span className="otp-legend__icon otp-legend__icon--scheduled-route" />
      <span className="otp-legend__value">
        <strong>Scheduled Route</strong>
      </span>
    </div>
  </div>
);

export const VehicleJourneyMap = ({
  stops,
  avls,
  rawAvls,
  scheduledRoute,
  directionRef,
  matchType,
  loading = false,
  selectedStop = null,
  hoveredStop = null,
}: VehicleJourneyMapProps) => {
  const { config } = useConfig();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const activeStopHoverRef = useRef<{ sourceId: string; id: string } | null>(null);
  const journeyBoundsRef = useRef<mapboxgl.LngLatBounds | null>(null);
  const [activeStyle, setActiveStyle] = useState<MapStyle>("default");
  const [showScheduledRoute, setShowScheduledRoute] = useState(true);
  const [moveCounter, setMoveCounter] = useState(0);
  const [recentrePortal, setRecentrePortal] = useState<HTMLDivElement | null>(
    null,
  );

  const mapboxToken = config?.mapboxToken;
  const mapStyle =
    activeStyle === "satellite" && config?.mapboxSatelliteStyle
      ? config.mapboxSatelliteStyle
      : config?.mapboxStyle;

  useEffect(() => {
    if (!mapContainerRef.current || !mapboxToken || !mapStyle) return;

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-2.5, 54],
      zoom: 5,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 80, unit: "metric" }));

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: "200px",
      offset: 10,
      className: "gds-popup",
    });
    popupRef.current = popup;

    const recentreContainer = document.createElement("div");
    recentreContainer.className = "mapboxgl-ctrl";
    map.addControl(
      { onAdd: () => recentreContainer, onRemove: () => undefined },
      "bottom-left",
    );
    setRecentrePortal(recentreContainer);

    const onMoveStart = () => setMoveCounter((count) => count + 1);
    map.on("movestart", onMoveStart);

    let cancelled = false;

    const initialiseLayers = async () => {
      await registerJourneyMapImages(map);
      if (cancelled) return;

      const geojson = buildJourneyGeoJson(stops, avls, scheduledRoute, matchType);
      addJourneyLayers(map, geojson, showScheduledRoute);
      const bounds = buildBounds(stops, avls, scheduledRoute);
      journeyBoundsRef.current = bounds;
      if (bounds) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 16, duration: 0 });
      }
      setMoveCounter(0);
    };

    if (map.isStyleLoaded()) {
      void initialiseLayers();
    } else {
      map.once("load", () => {
        void initialiseLayers();
      });
    }

    return () => {
      cancelled = true;
      map.off("movestart", onMoveStart);
      setRecentrePortal(null);
      popup.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // Intentionally recreate map when style token/style changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken, mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    let cancelled = false;
    const update = async () => {
      await registerJourneyMapImages(map);
      if (cancelled) return;
      const geojson = buildJourneyGeoJson(stops, avls, scheduledRoute, matchType);
      addJourneyLayers(map, geojson, showScheduledRoute);
      const bounds = buildBounds(stops, avls, scheduledRoute);
      journeyBoundsRef.current = bounds;
      if (bounds) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 16, duration: 0 });
      }
      setMoveCounter(0);
    };

    void update();
    return () => {
      cancelled = true;
    };
  }, [stops, avls, scheduledRoute, matchType, showScheduledRoute]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedStop || !hasPoint(selectedStop)) return;

    map.fitBounds(
      new mapboxgl.LngLatBounds(
        [selectedStop.longitude, selectedStop.latitude],
        [selectedStop.longitude, selectedStop.latitude],
      ),
      { padding: 50, maxZoom: 16, duration: 400 },
    );
  }, [selectedStop]);

  useEffect(() => {
    const map = mapRef.current;
    const popup = popupRef.current;
    if (!map || !popup) return;

    const clearStopHoverState = () => {
      const activeStopHover = activeStopHoverRef.current;
      if (!activeStopHover) return;
      map.removeFeatureState(
        { source: activeStopHover.sourceId, id: activeStopHover.id },
        "hover",
      );
      activeStopHoverRef.current = null;
    };

    if (!hoveredStop || !hasPoint(hoveredStop)) {
      clearStopHoverState();
      popup.remove();
      return;
    }

    const sourceId = getStopSourceId(hoveredStop);
    const id = hoveredStop.stopId.toString();

    clearStopHoverState();
    map.setFeatureState({ source: sourceId, id }, { hover: true });
    activeStopHoverRef.current = { sourceId, id };

    popup
      .setLngLat([hoveredStop.longitude, hoveredStop.latitude])
      .setDOMContent(createStopPopupContent(hoveredStop.stopName))
      .addTo(map);

    return () => {
      clearStopHoverState();
    };
  }, [hoveredStop]);

  useEffect(() => {
    const map = mapRef.current;
    const popup = popupRef.current;
    if (!map || !popup) return;

    const onStopEnter = (
      event: mapboxgl.MapLayerMouseEvent,
    ) => {
      map.getCanvas().style.cursor = "pointer";
      const feature = event.features?.[0];
      if (!feature?.properties) return;
      const { stopName } = feature.properties as { stopName?: string };
      if (!stopName || !event.lngLat) return;
      popup
        .setLngLat(event.lngLat)
        .setDOMContent(createStopPopupContent(stopName))
        .addTo(map);
    };

    const onLeave = () => {
      map.getCanvas().style.cursor = "";
      if (!hoveredStop) {
        popup.remove();
      }
    };

    const onPingEnter = (event: mapboxgl.MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = "pointer";
      const feature = event.features?.[0];
      if (!feature?.properties) return;
      const { ts } = feature.properties as { ts?: string };
      if (!ts || !event.lngLat) return;
      const receivedAt = DateTime.fromISO(ts)
        .setZone("Europe/London")
        .toFormat("HH:mm:ss");
      popup
        .setLngLat(event.lngLat)
        .setDOMContent(createPingPopupContent(receivedAt))
        .addTo(map);
    };

    map.on("mousemove", "journey-stop-layer", onStopEnter);
    map.on("mouseleave", "journey-stop-layer", onLeave);
    map.on("mousemove", "journey-timing-point-layer", onStopEnter);
    map.on("mouseleave", "journey-timing-point-layer", onLeave);
    map.on("mousemove", "journey-ping-layer", onPingEnter);
    map.on("mouseleave", "journey-ping-layer", onLeave);

    return () => {
      map.off("mousemove", "journey-stop-layer", onStopEnter);
      map.off("mouseleave", "journey-stop-layer", onLeave);
      map.off("mousemove", "journey-timing-point-layer", onStopEnter);
      map.off("mouseleave", "journey-timing-point-layer", onLeave);
      map.off("mousemove", "journey-ping-layer", onPingEnter);
      map.off("mouseleave", "journey-ping-layer", onLeave);
    };
  }, [hoveredStop, stops, avls, matchType, showScheduledRoute]);

  const recentre = () => {
    const map = mapRef.current;
    const bounds = journeyBoundsRef.current;
    if (!map || !bounds) return;
    map.fitBounds(bounds, { padding: 50, maxZoom: 16, duration: 500 });
    setMoveCounter(0);
  };

  const hasMapData =
    stops.length > 0 || avls.length > 0 || (scheduledRoute?.length ?? 0) > 0;

  return (
    <div className="vehicle-journeys__map-wrapper">
      {loading ? (
        <div className="vehicle-journeys__map-loading">
          <Spinner size="small" />
        </div>
      ) : null}
      <div className="vehicle-journeys__map-controls">
        <MapDisplayOptions
          activeStyle={activeStyle}
          mapboxSatelliteStyle={config?.mapboxSatelliteStyle}
          onStyleChange={setActiveStyle}
          showScheduledRoute={showScheduledRoute}
          onScheduledRouteChange={setShowScheduledRoute}
        />
      </div>
      <div
        ref={mapContainerRef}
        className="vehicle-journeys__map"
        aria-label="Journey map"
      />
      {recentrePortal &&
        moveCounter > 1 &&
        createPortal(
          <button
            type="button"
            className="vehicle-journeys__map-recentre"
            onClick={recentre}
          >
            <ReCentreIcon className="vehicle-journeys__map-recentre-icon" />
            Re-centre
          </button>,
          recentrePortal,
        )}
      {!hasMapData && !loading ? (
        <p className="govuk-body vehicle-journeys__map-empty">
          No map data available
        </p>
      ) : null}
      {rawAvls.length > avls.length ? (
        <p className="govuk-body-s govuk-!-margin-top-2">
          Showing location data for {directionRef ?? "the selected direction"}.
        </p>
      ) : null}
      <OtpLegend />
    </div>
  );
};
