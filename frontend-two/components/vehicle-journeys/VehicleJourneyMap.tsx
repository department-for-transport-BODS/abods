import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MapDisplayOptions } from "@/components/shared/MapDisplayOptions";
import { useConfig } from "@/contexts/ConfigContext";
import {
  VehicleJourneyAvl,
  VehicleJourneyStop,
} from "@/types/vehicle-journeys";

interface VehicleJourneyMapProps {
  stops: VehicleJourneyStop[];
  avls: VehicleJourneyAvl[];
  rawAvls: VehicleJourneyAvl[];
  scheduledRoute: [number, number][] | null;
  directionRef: string | null;
}

type MapStyle = "default" | "satellite";

const hasPoint = (point: { latitude: number; longitude: number }) =>
  Number.isFinite(point.latitude) && Number.isFinite(point.longitude);

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

const addJourneyLayers = (
  map: mapboxgl.Map,
  stops: VehicleJourneyStop[],
  avls: VehicleJourneyAvl[],
  scheduledRoute: [number, number][] | null,
) => {
  const routeCoordinates = scheduledRoute ?? [];
  const avlCoordinates = avls
    .filter(hasPoint)
    .map((avl) => [avl.longitude, avl.latitude]);

  map.addSource("vehicle-journey-scheduled-route", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: routeCoordinates },
    },
  });
  map.addSource("vehicle-journey-avl-route", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: avlCoordinates },
    },
  });
  map.addSource("vehicle-journey-stops", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: stops.filter(hasPoint).map((stop) => ({
        type: "Feature",
        properties: {
          name: stop.stopName,
          timingPoint: stop.isTimingPoint,
        },
        geometry: {
          type: "Point",
          coordinates: [stop.longitude, stop.latitude],
        },
      })),
    },
  });

  map.addLayer({
    id: "vehicle-journey-scheduled-route",
    type: "line",
    source: "vehicle-journey-scheduled-route",
    paint: {
      "line-color": "#1d70b8",
      "line-width": 4,
      "line-opacity": 0.7,
    },
  });
  map.addLayer({
    id: "vehicle-journey-avl-route",
    type: "line",
    source: "vehicle-journey-avl-route",
    paint: {
      "line-color": "#00703c",
      "line-width": 3,
      "line-opacity": 0.85,
    },
  });
  map.addLayer({
    id: "vehicle-journey-stops",
    type: "circle",
    source: "vehicle-journey-stops",
    paint: {
      "circle-radius": ["case", ["get", "timingPoint"], 6, 4],
      "circle-color": ["case", ["get", "timingPoint"], "#d4351c", "#0b0c0c"],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });
};

export const VehicleJourneyMap = ({
  stops,
  avls,
  rawAvls,
  scheduledRoute,
  directionRef,
}: VehicleJourneyMapProps) => {
  const { config } = useConfig();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [activeStyle, setActiveStyle] = useState<MapStyle>("default");

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

    map.on("load", () => {
      addJourneyLayers(map, stops, avls, scheduledRoute);
      const bounds = buildBounds(stops, avls, scheduledRoute);
      if (bounds) {
        map.fitBounds(bounds, { padding: 40, maxZoom: 15, duration: 0 });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapboxToken, mapStyle, stops, avls, scheduledRoute]);

  const hasMapData = stops.length > 0 || avls.length > 0 || (scheduledRoute?.length ?? 0) > 0;

  return (
    <div className="vehicle-journeys__map-wrapper">
      <div className="vehicle-journeys__map-controls">
        <MapDisplayOptions
          activeStyle={activeStyle}
          mapboxSatelliteStyle={config?.mapboxSatelliteStyle}
          onStyleChange={setActiveStyle}
        />
      </div>
      <div ref={mapContainerRef} className="vehicle-journeys__map" aria-label="Journey map" />
      {!hasMapData ? (
        <p className="govuk-body vehicle-journeys__map-empty">No map data available</p>
      ) : null}
      {rawAvls.length > avls.length ? (
        <p className="govuk-body-s govuk-!-margin-top-2">
          Showing location data for {directionRef ?? "the selected direction"}.
        </p>
      ) : null}
    </div>
  );
};
