import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl, { Map, LngLatBoundsLike, GeoJSONSource } from "mapbox-gl";
import type { FeatureCollection, Feature, LineString, Point } from "geojson";
import { Spinner } from "@/components/shared/Spinner";
import { NormalizedStop } from "@/services/on-time/stop-performance.service";
import { ServicePattern } from "@/services/on-time/transit-model.service";

const BRITISH_ISLES_BBOX: LngLatBoundsLike = [-10.5, 49.5, 2.0, 61.0];

interface OnTimeServiceMapProps {
  mapboxToken: string;
  mapboxStyle: string;
  loading?: boolean;
  stops: NormalizedStop[];
  servicePatterns: ServicePattern[];
}

export const OnTimeServiceMap = ({
  mapboxToken,
  mapboxStyle,
  loading = false,
  stops,
  servicePatterns,
}: OnTimeServiceMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Build stops GeoJSON with on-time performance coloring
  const stopsGeoJSON: FeatureCollection = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: stops.map((stop) => {
        // Color by on-time ratio (0-1)
        const onTimePercentage = stop.onTimeRatio ?? 0;

        let color = "#b1b4b6"; // grey - no data
        if (stop.noData || stop.total === 0) {
          color = "#b1b4b6"; // grey
        } else if (onTimePercentage < 0.6) {
          color = "#d4351c"; // red
        } else if (onTimePercentage < 0.8) {
          color = "#ffdd00"; // amber
        } else {
          color = "#28a197"; // green
        }

        return {
          type: "Feature" as const,
          properties: {
            ...stop,
            onTimeColor: color,
            stopId: stop.stopId,
            stopName: stop.stopName,
            stopLocality: stop.stopLocality,
          },
          geometry: {
            type: "Point" as const,
            coordinates: [stop.lon, stop.lat],
          },
        };
      }),
    };
  }, [stops]);

  // Build route lines GeoJSON
  const routeLinesGeoJSON: FeatureCollection = useMemo(() => {
    const features: Feature<LineString>[] = [];
    for (const pattern of servicePatterns) {
      const stops = pattern.stops ?? [];
      for (let i = 0; i < stops.length - 1; i++) {
        const fromStop = stops[i];
        const toStop = stops[i + 1];

        if (!fromStop || !toStop) continue;

        // Try to find the service link route
        const serviceLink = (pattern.serviceLinks ?? []).find(
          (link) =>
            link.fromStop === fromStop.stopId && link.toStop === toStop.stopId,
        );

        let coordinates: Array<[number, number]> = [];

        if (serviceLink?.linkRoute) {
          try {
            coordinates = JSON.parse(serviceLink.linkRoute);
          } catch {
            // Fall back to straight line
            coordinates = [
              [fromStop.lon, fromStop.lat],
              [toStop.lon, toStop.lat],
            ];
          }
        } else {
          // Simple straight line between stops
          coordinates = [
            [fromStop.lon, fromStop.lat],
            [toStop.lon, toStop.lat],
          ];
        }

        if (coordinates.length >= 2) {
          features.push({
            type: "Feature",
            properties: { servicePatternId: pattern.servicePatternId },
            geometry: {
              type: "LineString",
              coordinates,
            },
          });
        }
      }
    }

    return {
      type: "FeatureCollection",
      features,
    };
  }, [servicePatterns]);

  // Calculate bounds from stops
  const bounds = useMemo(() => {
    if (stops.length === 0) return BRITISH_ISLES_BBOX;
    const lons = stops.map((s) => s.lon);
    const lats = stops.map((s) => s.lat);
    return [
      Math.min(...lons),
      Math.min(...lats),
      Math.max(...lons),
      Math.max(...lats),
    ] as LngLatBoundsLike;
  }, [stops]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapboxStyle,
      bounds,
      fitBoundsOptions: { padding: 50 },
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      // Add route lines source/layer
      map.addSource("route-lines", {
        type: "geojson",
        data: routeLinesGeoJSON,
      });

      map.addLayer({
        id: "route-lines-layer",
        type: "line",
        source: "route-lines",
        paint: {
          "line-color": "#626A6E",
          "line-width": 2,
          "line-opacity": 0.7,
        },
      });

      // Add stops source/layer
      map.addSource("stops", {
        type: "geojson",
        data: stopsGeoJSON,
        cluster: false,
      });

      map.addLayer({
        id: "stops-layer",
        type: "circle",
        source: "stops",
        paint: {
          "circle-radius": 6,
          "circle-color": ["get", "onTimeColor"],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#000",
        },
      });

      // Add hover effect
      map.on("mouseenter", "stops-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "stops-layer", () => {
        map.getCanvas().style.cursor = "";
      });

      // Show popup on click
      map.on("click", "stops-layer", (e) => {
        const props = e.features?.[0].properties;
        if (!props) return;

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div><strong>${props.stopName}</strong><br/>${props.stopLocality || ""}</div>`,
          )
          .addTo(map);
      });

      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken, mapboxStyle]);

  // Update sources when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const stopsSource = map.getSource("stops") as GeoJSONSource | undefined;
    if (stopsSource) {
      stopsSource.setData(stopsGeoJSON);
    }

    const linesSource = map.getSource("route-lines") as
      | GeoJSONSource
      | undefined;
    if (linesSource) {
      linesSource.setData(routeLinesGeoJSON);
    }

    // Fit bounds to new data
    if (stops.length > 0) {
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [
    stops,
    servicePatterns,
    stopsGeoJSON,
    routeLinesGeoJSON,
    bounds,
    mapLoaded,
  ]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          backgroundColor: "#f3f2f1",
        }}
      >
        <Spinner size="small" />
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      style={{ minHeight: "400px", width: "100%" }}
      data-testid="on-time-service-map"
    />
  );
};
