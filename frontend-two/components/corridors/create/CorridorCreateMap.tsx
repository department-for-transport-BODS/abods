import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MapDisplayOptions } from "@/components/shared/MapDisplayOptions";
import { CorridorStop } from "@/types/corridors";

const BRITISH_ISLES_BOUNDS: [[number, number], [number, number]] = [
  [-7.57, 49.96],
  [1.68, 58.64],
];

const stopsToGeoJSON = (
  stops: CorridorStop[],
): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
  type: "FeatureCollection",
  features: stops.map((stop) => ({
    type: "Feature",
    id: stop.naptan,
    geometry: { type: "Point", coordinates: [stop.lon, stop.lat] },
    properties: { ...stop },
  })),
});

const lineGeoJSON = (
  stops: CorridorStop[],
): GeoJSON.Feature<GeoJSON.LineString> => ({
  type: "Feature",
  geometry: {
    type: "LineString",
    coordinates: stops.map((s) => [s.lon, s.lat]),
  },
  properties: {},
});

interface Props {
  corridorStops: CorridorStop[];
  matchingStops: CorridorStop[];
  onSelectStop: (stop: CorridorStop) => void;
  mapboxToken: string;
  mapboxStyle: string;
  mapboxSatelliteStyle?: string;
}

export const CorridorCreateMap = ({
  corridorStops,
  matchingStops,
  onSelectStop,
  mapboxToken,
  mapboxStyle,
  mapboxSatelliteStyle,
}: Props) => {
  const [activeStyle, setActiveStyle] = useState<"default" | "satellite">(
    "default",
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapboxStyleRef = useRef(mapboxStyle);
  const mapboxSatelliteStyleRef = useRef(mapboxSatelliteStyle);

  // Refs so event handlers inside the load closure always see latest values
  const onSelectStopRef = useRef(onSelectStop);
  const matchingStopsRef = useRef(matchingStops);
  const corridorStopsRef = useRef(corridorStops);
  const hoveredNaptanRef = useRef<string | null>(null);

  useEffect(() => {
    onSelectStopRef.current = onSelectStop;
  });
  useEffect(() => {
    matchingStopsRef.current = matchingStops;
  });
  useEffect(() => {
    corridorStopsRef.current = corridorStops;
  });
  useEffect(() => {
    mapboxStyleRef.current = mapboxStyle;
  });
  useEffect(() => {
    mapboxSatelliteStyleRef.current = mapboxSatelliteStyle;
  });

  // Initialise map once
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
    map.addControl(new mapboxgl.GeolocateControl(), "top-right");

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: "200px",
      offset: 12,
      className: "gds-popup",
    });

    map.on("load", () => {
      // Sources — seeded with whatever data is current at load time
      map.addSource("matching-stops", {
        type: "geojson",
        data: stopsToGeoJSON(matchingStopsRef.current),
      });
      map.addSource("corridor-stops", {
        type: "geojson",
        data: stopsToGeoJSON(corridorStopsRef.current),
      });
      map.addSource("corridor-line", {
        type: "geojson",
        data: lineGeoJSON(corridorStopsRef.current),
      });

      // Layers — order: line first, then matching stops, then corridor stops on top
      map.addLayer({
        id: "corridor-line-layer",
        type: "line",
        source: "corridor-line",
        paint: { "line-color": "#1d70b8", "line-width": 5 },
        layout: { "line-cap": "round", "line-join": "round" },
      });

      map.addLayer({
        id: "matching-stop-markers",
        type: "circle",
        source: "matching-stops",
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
          "circle-pitch-alignment": "map",
        },
      });

      map.addLayer({
        id: "corridor-markers",
        type: "circle",
        source: "corridor-stops",
        paint: {
          "circle-color": "#ffffff",
          "circle-radius": 6,
          "circle-stroke-width": 4,
          "circle-stroke-color": "#0b0c0c",
          "circle-pitch-alignment": "map",
        },
      });

      // Hover: show popup and highlight stop
      map.on("mousemove", "matching-stop-markers", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features?.[0];
        if (!feature) return;

        const naptan = feature.properties?.naptan as string | undefined;
        if (!naptan) return;

        // Clear previous hover state if moved to a different stop
        if (hoveredNaptanRef.current && hoveredNaptanRef.current !== naptan) {
          map.setFeatureState(
            { source: "matching-stops", id: hoveredNaptanRef.current },
            { hover: false },
          );
        }
        hoveredNaptanRef.current = naptan;
        map.setFeatureState(
          { source: "matching-stops", id: naptan },
          { hover: true },
        );

        const coords = (
          feature.geometry as GeoJSON.Point
        ).coordinates.slice() as [number, number];
        const { stopName, localityName } = feature.properties as CorridorStop;
        const subtitle = [localityName, naptan].filter(Boolean).join(" ");

        popup
          .setLngLat(coords)
          .setHTML(
            `<div>
              <div class="govuk-body-small govuk-!-font-weight-bold govuk-!-margin-bottom-1">${stopName ?? ""}</div>
              <div class="govuk-body-small">${subtitle}</div>
            </div>`,
          )
          .addTo(map);
      });

      map.on("mouseleave", "matching-stop-markers", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
        if (hoveredNaptanRef.current) {
          map.setFeatureState(
            { source: "matching-stops", id: hoveredNaptanRef.current },
            { hover: false },
          );
          hoveredNaptanRef.current = null;
        }
      });

      // Click to add stop to corridor
      map.on("click", "matching-stop-markers", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        onSelectStopRef.current(feature.properties as CorridorStop);
      });
    });

    mapRef.current = map;

    return () => {
      popup.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update matching stops when prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    (
      map.getSource("matching-stops") as mapboxgl.GeoJSONSource | undefined
    )?.setData(stopsToGeoJSON(matchingStops));
  }, [matchingStops]);

  // Update corridor stops and line when prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    (
      map.getSource("corridor-stops") as mapboxgl.GeoJSONSource | undefined
    )?.setData(stopsToGeoJSON(corridorStops));

    (
      map.getSource("corridor-line") as mapboxgl.GeoJSONSource | undefined
    )?.setData(lineGeoJSON(corridorStops));

    if (corridorStops.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      corridorStops.forEach((s) => bounds.extend([s.lon, s.lat]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }
  }, [corridorStops]);

  const switchStyle = (style: "default" | "satellite") => {
    const map = mapRef.current;
    if (!map) return;

    setActiveStyle(style);
    map.setStyle(
      style === "default"
        ? mapboxStyleRef.current
        : mapboxSatelliteStyleRef.current ?? mapboxStyleRef.current,
    );
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "480px",
          border: "1px solid #b1b4b6",
          position: "sticky",
          top: "40px",
        }}
        aria-label="Corridor map"
      />
      <MapDisplayOptions
        activeStyle={activeStyle}
        mapboxSatelliteStyle={mapboxSatelliteStyle}
        onStyleChange={switchStyle}
      />
    </div>
  );
};
