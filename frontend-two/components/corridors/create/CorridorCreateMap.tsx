import styles from "./corridor-create-map.module.scss";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MapDisplayOptions } from "@/components/shared/MapDisplayOptions";
import {
  displayCorridorChevrons,
  displayMatchingStopChevrons,
} from "@/components/corridors/shared/corridorChevrons";
import { ReCentreIcon } from "@/components/icons/ReCentreIcon";
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
    // Mapbox feature-state requires integer ids, so NaPTAN codes can't be used here
    id: stop.intId,
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

const boundsFromStops = (stops: CorridorStop[]) => {
  const bounds = new mapboxgl.LngLatBounds();
  stops.forEach((stop) => bounds.extend([stop.lon, stop.lat]));
  return bounds;
};

// Preview line from the last picked corridor stop to each candidate, shown on hover
const matchingStopLinesGeoJSON = (
  corridorStops: CorridorStop[],
  matchingStops: CorridorStop[],
): GeoJSON.FeatureCollection<GeoJSON.LineString> => {
  if (corridorStops.length === 0) {
    return { type: "FeatureCollection", features: [] };
  }

  const lastStop = corridorStops[corridorStops.length - 1];

  return {
    type: "FeatureCollection",
    features: matchingStops.map((stop) => ({
      type: "Feature",
      id: stop.intId,
      geometry: {
        type: "LineString",
        coordinates: [
          [lastStop.lon, lastStop.lat],
          [stop.lon, stop.lat],
        ],
      },
      properties: { ...stop },
    })),
  };
};

// While picking the first stop, all candidates show a black ring; afterwards only the hovered one does
const matchingStopStrokeExpression = (
  isFirstStop: boolean,
): mapboxgl.Expression =>
  [
    "case",
    ["boolean", ["feature-state", "hover"], isFirstStop],
    "#0b0c0c",
    "#B1B4B6",
  ] as unknown as mapboxgl.Expression;

const geoJSONSource = (map: mapboxgl.Map | null, id: string) =>
  (map?.getSource(id) ?? undefined) as mapboxgl.GeoJSONSource | undefined;

interface Props {
  corridorStops: CorridorStop[];
  matchingStops: CorridorStop[];
  otherStops?: CorridorStop[];
  nonOrgStops?: CorridorStop[];
  locationBounds?: mapboxgl.LngLatBounds | null;
  showRecentre?: boolean;
  onSelectStop: (stop: CorridorStop) => void;
  onBoundsChange?: (bounds: mapboxgl.LngLatBounds | null) => void;
  mapboxToken: string;
  mapboxStyle: string;
  mapboxSatelliteStyle?: string;
}

export const CorridorCreateMap = ({
  corridorStops,
  matchingStops,
  otherStops,
  nonOrgStops,
  locationBounds,
  showRecentre = false,
  onSelectStop,
  onBoundsChange,
  mapboxToken,
  mapboxStyle,
  mapboxSatelliteStyle,
}: Props) => {
  const [activeStyle, setActiveStyle] = useState<"default" | "satellite">(
    "default",
  );
  const [moveCounter, setMoveCounter] = useState(0);
  const [recentrePortal, setRecentrePortal] = useState<HTMLDivElement | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const lastFitBoundsRef = useRef<mapboxgl.LngLatBounds | null>(null);
  const mapboxStyleRef = useRef(mapboxStyle);
  const mapboxSatelliteStyleRef = useRef(mapboxSatelliteStyle);

  const onSelectStopRef = useRef(onSelectStop);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const matchingStopsRef = useRef(matchingStops);
  const corridorStopsRef = useRef(corridorStops);
  const otherStopsRef = useRef(otherStops ?? []);
  const nonOrgStopsRef = useRef(nonOrgStops ?? []);
  const hoveredStopIdRef = useRef<number | null>(null);

  useEffect(() => {
    onSelectStopRef.current = onSelectStop;
  });
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  });
  useEffect(() => {
    matchingStopsRef.current = matchingStops;
  });
  useEffect(() => {
    corridorStopsRef.current = corridorStops;
  });
  useEffect(() => {
    otherStopsRef.current = otherStops ?? [];
  });
  useEffect(() => {
    nonOrgStopsRef.current = nonOrgStops ?? [];
  });
  useEffect(() => {
    mapboxStyleRef.current = mapboxStyle;
  });
  useEffect(() => {
    mapboxSatelliteStyleRef.current = mapboxSatelliteStyle;
  });

  const addSourcesAndLayers = async (map: mapboxgl.Map) => {
    if (!map.getSource("matching-stops")) {
      map.addSource("matching-stops", {
        type: "geojson",
        data: stopsToGeoJSON(matchingStopsRef.current),
        cluster: true,
        clusterMinPoints: 30,
      });
    }

    if (!map.getSource("corridor-stops")) {
      map.addSource("corridor-stops", {
        type: "geojson",
        data: stopsToGeoJSON(corridorStopsRef.current),
      });
    }

    if (!map.getSource("corridor-line")) {
      map.addSource("corridor-line", {
        type: "geojson",
        data: lineGeoJSON(corridorStopsRef.current),
      });
    }

    if (!map.getSource("matching-stop-lines")) {
      map.addSource("matching-stop-lines", {
        type: "geojson",
        data: matchingStopLinesGeoJSON(
          corridorStopsRef.current,
          matchingStopsRef.current,
        ),
      });
    }

    if (!map.getSource("other-stops")) {
      map.addSource("other-stops", {
        type: "geojson",
        data: stopsToGeoJSON(otherStopsRef.current),
      });
    }

    if (!map.getSource("non-org-stops")) {
      map.addSource("non-org-stops", {
        type: "geojson",
        data: stopsToGeoJSON(nonOrgStopsRef.current),
      });
    }

    if (!map.getLayer("corridor-line-layer")) {
      map.addLayer({
        id: "corridor-line-layer",
        type: "line",
        source: "corridor-line",
        paint: { "line-color": "#1d70b8", "line-width": 5 },
        layout: { "line-cap": "round", "line-join": "round" },
      });
    }

    if (!map.getLayer("matching-stop-clusters")) {
      map.addLayer({
        id: "matching-stop-clusters",
        type: "circle",
        source: "matching-stops",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#0b0c0c",
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "point_count"],
            10,
            16,
            300,
            33,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0b0c0c",
        },
      });
    }

    if (!map.getLayer("matching-stop-clusters-inner")) {
      map.addLayer({
        id: "matching-stop-clusters-inner",
        type: "circle",
        source: "matching-stops",
        filter: ["has", "point_count"],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "point_count"],
            10,
            14,
            300,
            31,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    }

    if (!map.getLayer("matching-stop-clusters-size")) {
      map.addLayer({
        id: "matching-stop-clusters-size",
        type: "symbol",
        source: "matching-stops",
        filter: ["has", "point_count"],
        paint: { "text-color": "#ffffff" },
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Overpass Bold", "Arial Unicode MS Bold"],
          "text-size": 16,
          "text-line-height": 1.25,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
      });
    }

    if (!map.getLayer("matching-stop-markers")) {
      map.addLayer(
        {
          id: "matching-stop-markers",
          type: "circle",
          source: "matching-stops",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#ffffff",
            "circle-radius": 6,
            "circle-stroke-width": 4,
            "circle-stroke-color": matchingStopStrokeExpression(
              corridorStopsRef.current.length === 0,
            ),
            "circle-pitch-alignment": "map",
          },
        },
        "matching-stop-clusters",
      );
    }

    if (!map.getLayer("matching-stop-lines-layer")) {
      map.addLayer(
        {
          id: "matching-stop-lines-layer",
          type: "line",
          source: "matching-stop-lines",
          paint: {
            "line-color": "#1d70b8",
            "line-width": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              5,
              0,
            ],
          },
          layout: { "line-cap": "round", "line-join": "round" },
        },
        "matching-stop-markers",
      );
    }

    await displayMatchingStopChevrons(map);

    if (!map.getLayer("corridor-markers")) {
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
    }

    await displayCorridorChevrons(map, "corridor-markers");

    if (!map.getLayer("other-stop-markers")) {
      map.addLayer(
        {
          id: "other-stop-markers",
          type: "circle",
          source: "other-stops",
          paint: {
            "circle-color": "#28A197",
            "circle-radius": [
              "interpolate",
              ["exponential", 0.6],
              ["zoom"],
              11,
              2,
              13,
              5,
            ],
            "circle-pitch-alignment": "map",
          },
        },
        map.getLayer("matching-stop-markers")
          ? "matching-stop-markers"
          : "corridor-markers",
      );
    }

    if (!map.getLayer("non-org-stop-markers")) {
      map.addLayer(
        {
          id: "non-org-stop-markers",
          type: "circle",
          source: "non-org-stops",
          paint: {
            "circle-color": "#B1B4B6",
            "circle-radius": [
              "interpolate",
              ["exponential", 0.6],
              ["zoom"],
              11,
              2,
              13,
              5,
            ],
            "circle-pitch-alignment": "map",
          },
        },
        map.getLayer("other-stop-markers")
          ? "other-stop-markers"
          : map.getLayer("corridor-markers")
            ? "corridor-markers"
            : "matching-stop-markers",
      );
    }
  };

  // Records the target so Re-centre can return here
  const fitTo = (
    map: mapboxgl.Map,
    bounds: mapboxgl.LngLatBounds,
    options: mapboxgl.FitBoundsOptions,
  ) => {
    lastFitBoundsRef.current = bounds;
    setMoveCounter(0);
    map.fitBounds(bounds, options);
  };

  const fitCorridorBounds = (map: mapboxgl.Map) => {
    if (corridorStopsRef.current.length === 0) {
      return;
    }

    fitTo(map, boundsFromStops(corridorStopsRef.current), {
      padding: 60,
      maxZoom: 14,
    });
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
    map.addControl(new mapboxgl.GeolocateControl(), "top-right");

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: "200px",
      offset: 12,
      className: "gds-popup",
    });

    map.on("load", () => {
      void (async () => {
        await addSourcesAndLayers(map);
        fitCorridorBounds(map);
      })();

      map.on("moveend", () => {
        setMoveCounter((count) => count + 1);
        onBoundsChangeRef.current?.(map.getBounds());
      });

      map.on("style.load", () => {
        void addSourcesAndLayers(map);
      });

      map.on("mousemove", "matching-stop-markers", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features?.[0];
        if (!feature) return;

        const stopId = feature.id as number | undefined;
        if (stopId === undefined) return;

        if (
          hoveredStopIdRef.current !== null &&
          hoveredStopIdRef.current !== stopId
        ) {
          map.setFeatureState(
            { source: "matching-stops", id: hoveredStopIdRef.current },
            { hover: false },
          );
          map.setFeatureState(
            { source: "matching-stop-lines", id: hoveredStopIdRef.current },
            { hover: false },
          );
        }
        hoveredStopIdRef.current = stopId;
        map.setFeatureState(
          { source: "matching-stops", id: stopId },
          { hover: true },
        );
        map.setFeatureState(
          { source: "matching-stop-lines", id: stopId },
          { hover: true },
        );

        const coords = (
          feature.geometry as GeoJSON.Point
        ).coordinates.slice() as [number, number];
        const { stopName, localityName, naptan } =
          feature.properties as CorridorStop;
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
        if (hoveredStopIdRef.current !== null) {
          map.setFeatureState(
            { source: "matching-stops", id: hoveredStopIdRef.current },
            { hover: false },
          );
          map.setFeatureState(
            { source: "matching-stop-lines", id: hoveredStopIdRef.current },
            { hover: false },
          );
          hoveredStopIdRef.current = null;
        }
      });

      map.on("click", "matching-stop-markers", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        onSelectStopRef.current(feature.properties as CorridorStop);
      });

      map.on("mousemove", "other-stop-markers", (e) => {
        map.getCanvas().style.cursor = "default";
        const feature = e.features?.[0];
        if (!feature) return;

        const coords = (
          feature.geometry as GeoJSON.Point
        ).coordinates.slice() as [number, number];
        const { stopName, localityName, naptan } =
          feature.properties as CorridorStop;
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

      map.on("mouseleave", "other-stop-markers", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

      map.on("mousemove", "non-org-stop-markers", (e) => {
        map.getCanvas().style.cursor = "default";
        const feature = e.features?.[0];
        if (!feature) return;

        const coords = (
          feature.geometry as GeoJSON.Point
        ).coordinates.slice() as [number, number];
        const { stopName, localityName, naptan } =
          feature.properties as CorridorStop;

        popup
          .setLngLat(coords)
          .setHTML(
            `<div>
              <div class="govuk-body-small govuk-!-font-weight-bold govuk-!-margin-bottom-1">${stopName ?? ""}</div>
              <div class="govuk-body-small">${[localityName, naptan].filter(Boolean).join(" ")}</div>
              <hr style="margin: 6px 0; border: 0; border-top: 1px solid #b1b4b6" />
              <div class="govuk-body-small">We can't find any services from your organisation's data that use this stop</div>
            </div>`,
          )
          .addTo(map);
      });

      map.on("mouseleave", "non-org-stop-markers", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
    });

    mapRef.current = map;

    const recentreContainer = document.createElement("div");
    recentreContainer.className = "mapboxgl-ctrl";
    map.addControl(
      { onAdd: () => recentreContainer, onRemove: () => {} },
      "bottom-left",
    );
    setRecentrePortal(recentreContainer);

    return () => {
      setRecentrePortal(null);
      popup.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    geoJSONSource(map, "matching-stops")?.setData(
      stopsToGeoJSON(matchingStops),
    );
    geoJSONSource(map, "matching-stop-lines")?.setData(
      matchingStopLinesGeoJSON(corridorStops, matchingStops),
    );
  }, [matchingStops, corridorStops]);

  // Stop-name search fits to candidates; after the first stop, keep the corridor in view
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (corridorStops.length === 0) {
      if (locationBounds || matchingStops.length === 0) return;

      fitTo(map, boundsFromStops(matchingStops), {
        padding: 50,
        maxZoom: 16,
        duration: 500,
      });
      return;
    }

    fitTo(map, boundsFromStops([...corridorStops, ...matchingStops]), {
      padding: 50,
      maxZoom: 16,
      duration: 500,
    });
  }, [matchingStops, corridorStops, locationBounds]);

  useEffect(() => {
    const map = mapRef.current;

    geoJSONSource(map, "other-stops")?.setData(
      stopsToGeoJSON(otherStops ?? []),
    );
    geoJSONSource(map, "non-org-stops")?.setData(
      stopsToGeoJSON(nonOrgStops ?? []),
    );
  }, [otherStops, nonOrgStops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    geoJSONSource(map, "corridor-stops")?.setData(
      stopsToGeoJSON(corridorStops),
    );
    geoJSONSource(map, "corridor-line")?.setData(lineGeoJSON(corridorStops));

    if (map.getLayer("matching-stop-markers")) {
      map.setPaintProperty(
        "matching-stop-markers",
        "circle-stroke-color",
        matchingStopStrokeExpression(corridorStops.length === 0),
      );
    }
  }, [corridorStops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !locationBounds || corridorStops.length > 0) return;

    fitTo(map, locationBounds, { padding: 60, maxZoom: 14 });
  }, [corridorStops.length, locationBounds]);

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

  const recentre = () => {
    const map = mapRef.current;
    if (!map || !lastFitBoundsRef.current) return;

    fitTo(map, lastFitBoundsRef.current, {
      padding: 50,
      maxZoom: 16,
      duration: 500,
    });
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
      {recentrePortal &&
        showRecentre &&
        moveCounter > 1 &&
        lastFitBoundsRef.current &&
        createPortal(
          <button
            type="button"
            className={styles.mapRecentre}
            onClick={recentre}
          >
            <ReCentreIcon className={styles.mapRecentreIcon} />
            Re-centre
          </button>,
          recentrePortal,
        )}
    </div>
  );
};
