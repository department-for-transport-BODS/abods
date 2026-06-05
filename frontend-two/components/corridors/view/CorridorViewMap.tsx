import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MapDisplayOptions } from "@/components/shared/MapDisplayOptions";
import ReCentreIcon from "@/assets/icons/re-centre.svg";
import { CorridorStop } from "@/types/corridors";
import { ServiceLinkType } from "../../../src/generated/graphql";

const BRITISH_ISLES_BOUNDS: [[number, number], [number, number]] = [
  [-7.57, 49.96],
  [1.68, 58.64],
];

const buildLineGeoJSON = (
  stops: CorridorStop[],
  serviceLinks: ServiceLinkType[],
  selectedSegmentIndex: number | null,
): GeoJSON.FeatureCollection<GeoJSON.LineString> => {
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    const link = serviceLinks.find(
      (l) => l.fromStop === from.naptan && l.toStop === to.naptan,
    );
    const coordinates: [number, number][] = link?.linkRoute
      ? (JSON.parse(link.linkRoute) as [number, number][])
      : [
          [from.lon, from.lat],
          [to.lon, to.lat],
        ];
    const selected =
      selectedSegmentIndex === null || selectedSegmentIndex === i;
    features.push({
      type: "Feature",
      id: i,
      geometry: { type: "LineString", coordinates },
      properties: { segmentId: String(i), selected },
    });
  }
  return { type: "FeatureCollection", features };
};

const buildStopsGeoJSON = (
  stops: CorridorStop[],
): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
  type: "FeatureCollection",
  features: stops.map((stop, i) => ({
    type: "Feature",
    id: stop.stopId ?? String(i),
    geometry: { type: "Point", coordinates: [stop.lon, stop.lat] },
    properties: { ...stop },
  })),
});

interface Props {
  stops: CorridorStop[];
  serviceLinks: ServiceLinkType[];
  selectedSegmentIndex: number | null;
  mapboxToken: string;
  mapboxStyle: string;
  mapboxSatelliteStyle: string;
}

export const CorridorViewMap = ({
  stops,
  serviceLinks,
  selectedSegmentIndex,
  mapboxToken,
  mapboxStyle,
  mapboxSatelliteStyle,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const stopsRef = useRef(stops);
  const serviceLinksRef = useRef(serviceLinks);
  const selectedSegmentIndexRef = useRef(selectedSegmentIndex);
  const [activeStyle, setActiveStyle] = useState<"street" | "satellite">(
    "street",
  );
  const [moveCounter, setMoveCounter] = useState(0);
  const mapboxStyleRef = useRef(mapboxStyle);
  const mapboxSatelliteStyleRef = useRef(mapboxSatelliteStyle);

  useEffect(() => {
    stopsRef.current = stops;
  });
  useEffect(() => {
    serviceLinksRef.current = serviceLinks;
  });
  useEffect(() => {
    selectedSegmentIndexRef.current = selectedSegmentIndex;
  });
  useEffect(() => {
    mapboxStyleRef.current = mapboxStyle;
  });
  useEffect(() => {
    mapboxSatelliteStyleRef.current = mapboxSatelliteStyle;
  });

  const addSourcesAndLayers = (map: mapboxgl.Map) => {
    // Clean up any existing layers/sources (needed after style change)
    ["corridor-markers", "corridor-line-layer"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    ["corridor-line", "corridor-stops"].forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });

    map.addSource("corridor-line", {
      type: "geojson",
      data: buildLineGeoJSON(
        stopsRef.current,
        serviceLinksRef.current,
        selectedSegmentIndexRef.current,
      ),
    });
    map.addSource("corridor-stops", {
      type: "geojson",
      data: buildStopsGeoJSON(stopsRef.current),
    });

    map.addLayer({
      id: "corridor-line-layer",
      type: "line",
      source: "corridor-line",
      paint: {
        "line-color": [
          "case",
          ["==", ["get", "selected"], true],
          "#1d70b8",
          "#77a9d4",
        ],
        "line-width": 5,
      },
      layout: { "line-cap": "round", "line-join": "round" },
    });

    map.addLayer({
      id: "corridor-markers",
      type: "circle",
      source: "corridor-stops",
      paint: {
        "circle-color": "#ffffff",
        "circle-radius": 6,
        "circle-stroke-width": 4,
        "circle-stroke-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "#0b0c0c",
          "#B1B4B6",
        ],
      },
    });
  };

  // Fit map bounds to the current stop list
  const fitToBounds = (map: mapboxgl.Map, opts?: mapboxgl.FitBoundsOptions) => {
    if (stopsRef.current.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds();
    stopsRef.current.forEach((s) => bounds.extend([s.lon, s.lat]));
    map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 0, ...opts });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: mapboxStyle,
      bounds: BRITISH_ISLES_BOUNDS,
      fitBoundsOptions: { padding: 20 },
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: "200px",
      offset: 12,
      className: "gds-popup",
    });

    const hoveredStopId = { current: null as string | null };
    let isFirstStyleLoad = true;

    map.on("style.load", () => {
      if (isFirstStyleLoad) {
        isFirstStyleLoad = false;
        return; // handled by "load"
      }
      // Re-add after style switch
      addSourcesAndLayers(map);
    });

    map.on("load", () => {
      addSourcesAndLayers(map);
      fitToBounds(map);
      map.on("mousemove", "corridor-markers", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features?.[0];
        if (!feature) return;

        const stopId = feature.id as string | undefined;
        if (hoveredStopId.current && hoveredStopId.current !== stopId) {
          map.setFeatureState(
            { source: "corridor-stops", id: hoveredStopId.current },
            { hover: false },
          );
        }
        if (stopId) {
          hoveredStopId.current = stopId;
          map.setFeatureState(
            { source: "corridor-stops", id: stopId },
            { hover: true },
          );
        }

        const coords = (
          feature.geometry as GeoJSON.Point
        ).coordinates.slice() as [number, number];
        const props = feature.properties as CorridorStop;
        popup
          .setLngLat(coords)
          .setHTML(
            `<div class="govuk-body-small govuk-!-font-weight-bold govuk-!-margin-bottom-1">${props.stopName ?? ""}</div>` +
              `<div class="govuk-body-small">${props.naptan ?? ""}</div>`,
          )
          .addTo(map);
      });

      map.on("mouseleave", "corridor-markers", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
        if (hoveredStopId.current) {
          map.setFeatureState(
            { source: "corridor-stops", id: hoveredStopId.current },
            { hover: false },
          );
          hoveredStopId.current = null;
        }
      });
    });

    map.on("moveend", () => setMoveCounter((count) => count + 1));

    mapRef.current = map;

    return () => {
      popup.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update corridor line when selection or service links change
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    (
      map.getSource("corridor-line") as mapboxgl.GeoJSONSource | undefined
    )?.setData(buildLineGeoJSON(stops, serviceLinks, selectedSegmentIndex));
  }, [stops, serviceLinks, selectedSegmentIndex]);

  // Update stop markers when stops change
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    (
      map.getSource("corridor-stops") as mapboxgl.GeoJSONSource | undefined
    )?.setData(buildStopsGeoJSON(stops));
  }, [stops]);

  const switchStyle = (style: "street" | "satellite") => {
    setActiveStyle(style);
    mapRef.current?.setStyle(
      style === "street"
        ? mapboxStyleRef.current
        : mapboxSatelliteStyleRef.current,
    );
  };

  const recentre = () => {
    const map = mapRef.current;
    if (!map) return;
    fitToBounds(map, { duration: 500 });
    setMoveCounter(0);
  };

  return (
    <div className="corridor__map-wrapper govuk-!-margin-bottom-7">
      <div
        ref={containerRef}
        className="corridor__map"
        aria-label="Corridor map"
      />
      <MapDisplayOptions
        activeStyle={activeStyle}
        mapboxSatelliteStyle={mapboxSatelliteStyle}
        onStyleChange={switchStyle}
      />
      {moveCounter > 1 && (
        <button
          type="button"
          className="corridor__map-recentre"
          onClick={recentre}
        >
          <ReCentreIcon
            className="corridor__map-recentre-icon"
            aria-hidden="true"
            focusable="false"
          />
          Re-centre
        </button>
      )}
    </div>
  );
};
