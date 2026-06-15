import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MapDisplayOptions } from "@/components/shared/MapDisplayOptions";
import { displayCorridorChevrons } from "@/components/corridors/shared/corridorChevrons";
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
  otherStops?: CorridorStop[];
  nonOrgStops?: CorridorStop[];
  onSelectStop: (stop: CorridorStop) => void;
  onBoundsChange?: (bounds: mapboxgl.LngLatBounds) => void;
  mapboxToken: string;
  mapboxStyle: string;
  mapboxSatelliteStyle?: string;
}

export const CorridorCreateMap = ({
  corridorStops,
  matchingStops,
  otherStops,
  nonOrgStops,
  onSelectStop,
  onBoundsChange,
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

  const onSelectStopRef = useRef(onSelectStop);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const matchingStopsRef = useRef(matchingStops);
  const corridorStopsRef = useRef(corridorStops);
  const otherStopsRef = useRef(otherStops ?? []);
  const nonOrgStopsRef = useRef(nonOrgStops ?? []);
  const hoveredNaptanRef = useRef<string | null>(null);

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

    if (!map.getLayer("matching-stop-markers")) {
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
    }

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

  const fitCorridorBounds = (map: mapboxgl.Map) => {
    if (corridorStopsRef.current.length === 0) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    corridorStopsRef.current.forEach((stop) =>
      bounds.extend([stop.lon, stop.lat]),
    );
    map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
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
        if (
          !onBoundsChangeRef.current ||
          corridorStopsRef.current.length === 0
        ) {
          return;
        }

        onBoundsChangeRef.current(map.getBounds());
      });

      map.on("style.load", () => {
        void addSourcesAndLayers(map);
      });

      map.on("mousemove", "matching-stop-markers", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features?.[0];
        if (!feature) return;

        const naptan = feature.properties?.naptan as string | undefined;
        if (!naptan) return;

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

    return () => {
      popup.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    (
      map.getSource("matching-stops") as mapboxgl.GeoJSONSource | undefined
    )?.setData(stopsToGeoJSON(matchingStops));
  }, [matchingStops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    (
      map.getSource("other-stops") as mapboxgl.GeoJSONSource | undefined
    )?.setData(stopsToGeoJSON(otherStops ?? []));
    (
      map.getSource("non-org-stops") as mapboxgl.GeoJSONSource | undefined
    )?.setData(stopsToGeoJSON(nonOrgStops ?? []));
  }, [otherStops, nonOrgStops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    (
      map.getSource("corridor-stops") as mapboxgl.GeoJSONSource | undefined
    )?.setData(stopsToGeoJSON(corridorStops));

    (
      map.getSource("corridor-line") as mapboxgl.GeoJSONSource | undefined
    )?.setData(lineGeoJSON(corridorStops));
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
