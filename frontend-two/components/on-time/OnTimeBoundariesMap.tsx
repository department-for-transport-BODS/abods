import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import bbox from "@turf/bbox";
import bboxClip from "@turf/bbox-clip";
import flip from "@turf/flip";
import pointOnFeature from "@turf/point-on-feature";
import { feature } from "@turf/helpers";
import { Spinner } from "@/components/shared/Spinner";
import type { Feature, FeatureCollection } from "geojson";
import {
  AdminAreaShape,
  BRITISH_ISLES_BOUNDS,
  ADMIN_AREA_HIDDEN_ZOOM,
  ADMIN_AREA_HIDDEN_ZOOM_THRESHOLD,
  ClipableFeature,
  isClipableFeature,
} from "@/utils/mapConstants";

interface OnTimeBoundariesMapProps {
  mapboxToken: string;
  mapboxStyle: string;
  adminAreas: AdminAreaShape[];
  selectedAdminAreaNames?: string[];
}
export const OnTimeBoundariesMap = ({
  mapboxToken,
  mapboxStyle,
  adminAreas,
  selectedAdminAreaNames = [],
}: OnTimeBoundariesMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredAdminAreaRef = useRef<ClipableFeature | null>(null);

  const clearPopup = useCallback(() => {
    popupRef.current?.remove();
    popupRef.current = null;
  }, []);

  const updateAdminAreaPopup = useCallback(
    (map: mapboxgl.Map) => {
      const hoveredAdminArea = hoveredAdminAreaRef.current;
      if (!hoveredAdminArea) {
        clearPopup();
        return;
      }

      if (map.getZoom() >= ADMIN_AREA_HIDDEN_ZOOM_THRESHOLD) {
        clearPopup();
        return;
      }

      const bounds = map.getBounds();
      if (!bounds) {
        clearPopup();
        return;
      }

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

  const boundariesGeoJson = useMemo<FeatureCollection>(() => {
    const selectedNameSet = new Set(selectedAdminAreaNames);
    const showAllAreas = selectedNameSet.size === 0;

    const features = adminAreas
      .filter((area) => showAllAreas || selectedNameSet.has(area.name))
      .map((area) => {
        try {
          const flipped = flip(
            feature(JSON.parse(area.shape), {
              id: area.id,
              name: area.name,
              selected: selectedNameSet.has(area.name),
            }),
            { mutate: true },
          );

          return {
            type: "Feature" as const,
            id: area.id,
            properties: {
              id: area.id,
              name: area.name,
              selected: selectedNameSet.has(area.name),
            },
            geometry: flipped.geometry,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Feature[];

    return {
      type: "FeatureCollection",
      features,
    };
  }, [adminAreas, selectedAdminAreaNames]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapboxStyle,
      bounds: BRITISH_ISLES_BOUNDS,
      fitBoundsOptions: { padding: 20 },
    });

    map.on("load", () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      clearPopup();
      map.remove();
      mapRef.current = null;
    };
  }, [mapboxToken, mapboxStyle, clearPopup]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.isStyleLoaded()) return;

    if (!map.getSource("on-time-admin-area-boundaries")) {
      map.addSource("on-time-admin-area-boundaries", {
        type: "geojson",
        data: boundariesGeoJson,
        promoteId: "id",
      });

      map.addLayer({
        id: "on-time-admin-area-boundaries-fill",
        type: "fill",
        source: "on-time-admin-area-boundaries",
        paint: {
          "fill-color": "#28A197",
          "fill-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            ["case", ["boolean", ["feature-state", "hover"], false], 0.5, 0.3],
            ADMIN_AREA_HIDDEN_ZOOM,
            0,
          ],
        },
      });

      let hoveredId: string | number | null = null;

      map.on("mouseenter", "on-time-admin-area-boundaries-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mousemove", "on-time-admin-area-boundaries-fill", (event) => {
        if (!event.features || event.features.length === 0) {
          return;
        }

        const hoveredFeature = event.features[0] as Feature | undefined;
        if (!hoveredFeature || !isClipableFeature(hoveredFeature)) {
          return;
        }

        if (hoveredId !== null) {
          map.setFeatureState(
            { source: "on-time-admin-area-boundaries", id: hoveredId },
            { hover: false },
          );
        }

        hoveredId = hoveredFeature.id ?? null;
        if (hoveredId !== null) {
          map.setFeatureState(
            { source: "on-time-admin-area-boundaries", id: hoveredId },
            { hover: true },
          );
        }

        hoveredAdminAreaRef.current = hoveredFeature;
        updateAdminAreaPopup(map);
      });

      map.on("mouseleave", "on-time-admin-area-boundaries-fill", () => {
        map.getCanvas().style.cursor = "";

        if (hoveredId !== null) {
          map.setFeatureState(
            { source: "on-time-admin-area-boundaries", id: hoveredId },
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
    } else {
      (
        map.getSource("on-time-admin-area-boundaries") as mapboxgl.GeoJSONSource
      ).setData(boundariesGeoJson);
    }

    if (boundariesGeoJson.features.length > 0) {
      const [minX, minY, maxX, maxY] = bbox(boundariesGeoJson);
      map.fitBounds(
        [
          [minX, minY],
          [maxX, maxY],
        ],
        {
          padding: 40,
          duration: 300,
          maxZoom: 10,
        },
      );
    }
  }, [boundariesGeoJson, mapLoaded, clearPopup, updateAdminAreaPopup]);

  return (
    <div style={{ position: "relative", height: "320px" }}>
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%" }}
        aria-label="On-time admin area boundaries map"
      />
      {!mapLoaded && (
        <div
          className="stop-analysis-map__loading-overlay"
          role="status"
          aria-live="polite"
          aria-label="Loading boundaries map"
        >
          <Spinner size="x-small" />
        </div>
      )}
    </div>
  );
};
