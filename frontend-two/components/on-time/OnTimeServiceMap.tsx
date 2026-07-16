import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl, { GeoJSONSource, Map } from "mapbox-gl";
import bbox from "@turf/bbox";
import { featureCollection, lineString, point } from "@turf/helpers";
import type {
  Feature,
  FeatureCollection,
  LineString,
  Point,
  Position,
} from "geojson";
import { registerTimingPointIcons } from "@/components/icons/timingPointIcons";
import { Spinner } from "@/components/shared/Spinner";
import {
  clearStopPopup,
  StopPopupContent,
  StopPopupRoot,
  showStopPopup,
} from "@/components/on-time/StopPopup";
import {
  PerformanceParams,
  onTimeService,
} from "@/services/on-time/on-time.service";
import { stopPerformanceService } from "@/services/on-time/stop-performance.service";
import {
  ServicePattern,
  transitModelService,
} from "@/services/on-time/transit-model.service";
import {
  BRITISH_ISLES_BBOX,
  getOnTimeServiceNoDataCircleRadius,
  getOnTimeServiceNoDataCircleStrokeWidth,
  ON_TIME_SERVICE_DIRECTION_LAYOUT,
  ON_TIME_SERVICE_MAP_IDS,
  ON_TIME_SERVICE_NO_DATA_FILTER,
  ON_TIME_SERVICE_PATTERN_LINE_LAYOUT,
  ON_TIME_SERVICE_PATTERN_LINE_PAINT,
  ON_TIME_SERVICE_STOP_MARKERS_CIRCLE_COLOR,
  ON_TIME_SERVICE_STOP_MARKERS_CIRCLE_RADIUS,
  ON_TIME_SERVICE_STOP_MARKERS_CIRCLE_STROKE_COLOR,
  ON_TIME_SERVICE_STOP_MARKERS_CIRCLE_STROKE_WIDTH,
  ON_TIME_SERVICE_STOP_MARKERS_FILTER,
  ON_TIME_SERVICE_STOP_NAMES_FILTER,
  ON_TIME_SERVICE_STOP_NAMES_LAYOUT,
  ON_TIME_SERVICE_STOP_NAMES_PAINT,
  ON_TIME_SERVICE_TIMING_POINTS_FILTER,
  ON_TIME_SERVICE_TIMING_POINTS_ICON_IMAGE,
  ON_TIME_SERVICE_TIMING_POINTS_ICON_SIZE,
} from "@/utils/map-constants";
import { RouteType, ServiceLinkType, StopType } from "@/src/generated/graphql";

interface OnTimeServiceMapProps {
  mapboxToken: string;
  mapboxStyle: string;
  params: PerformanceParams | null;
  timingPointsOnly?: boolean;
}

type BBox2d = [number, number, number, number];

const SYNTHETIC_STOP_FILTER = {
  lat: 51,
  lon: -6.5,
};

const pairwise = <T,>(items: T[]): [T, T][] => {
  const out: [T, T][] = [];
  for (let i = 0; i < items.length - 1; i += 1) {
    out.push([items[i], items[i + 1]]);
  }
  return out;
};

const removeAdminAreaIds = (params: PerformanceParams): PerformanceParams => {
  const { adminAreaIds: _adminAreaIds, ...filters } = params.filters ?? {};
  return {
    ...params,
    filters,
  };
};

const positionFromStop = (stop: {
  lon: number;
  lat: number;
}): [number, number] => [stop.lon, stop.lat];

const segmentIdFromPair = (segment: [StopType, StopType]) =>
  `${segment[0].stopId}${segment[1].stopId}`;

const setCoordinates = (
  segment: [StopType, StopType],
  serviceLinks: ServiceLinkType[],
  existingFeatures: Feature<LineString>[],
): Position[] | undefined => {
  const serviceLink = serviceLinks.find(
    (link) =>
      link.fromStop === segment[0].stopId && link.toStop === segment[1].stopId,
  );

  if (serviceLink?.routeValidity === RouteType.Valid && serviceLink.linkRoute) {
    try {
      return JSON.parse(serviceLink.linkRoute) as Position[];
    } catch {
      return [positionFromStop(segment[0]), positionFromStop(segment[1])];
    }
  }

  const segmentId = segmentIdFromPair(segment);
  const exists = existingFeatures.some(
    (feature) => feature.properties?.segmentId === segmentId,
  );
  if (exists) {
    return undefined;
  }

  return [positionFromStop(segment[0]), positionFromStop(segment[1])];
};

const buildPatternFeatures = (
  servicePatterns: ServicePattern[],
): FeatureCollection<LineString> => {
  const features: Feature<LineString>[] = [];

  for (const pattern of servicePatterns) {
    const filteredStops = (pattern.stops ?? []).filter(
      (stop) =>
        stop.lat >= SYNTHETIC_STOP_FILTER.lat &&
        stop.lon >= SYNTHETIC_STOP_FILTER.lon,
    );

    for (const segment of pairwise(filteredStops)) {
      const coordinates = setCoordinates(
        segment,
        pattern.serviceLinks ?? [],
        features,
      );
      if (!coordinates) {
        continue;
      }

      features.push(
        lineString(coordinates, {
          servicePatternId: pattern.servicePatternId,
          segmentId: segmentIdFromPair(segment),
          dashedLine: coordinates.length <= 2,
        }),
      );
    }
  }

  return featureCollection(features);
};

const buildStopFeatures = (
  stopPerformance: Awaited<
    ReturnType<typeof onTimeService.fetchStopPerformanceList>
  >,
  servicePatterns: ServicePattern[],
): FeatureCollection<Point> => {
  const mergedStops = stopPerformanceService.mergeStops(
    stopPerformance,
    servicePatterns,
  );

  return featureCollection(
    mergedStops
      .filter(
        (stop) =>
          stop.lat >= SYNTHETIC_STOP_FILTER.lat &&
          stop.lon >= SYNTHETIC_STOP_FILTER.lon,
      )
      .map((stop) => point(positionFromStop(stop), stop)),
  );
};

export const OnTimeServiceMap = ({
  mapboxToken,
  mapboxStyle,
  params,
  timingPointsOnly = false,
}: OnTimeServiceMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const mapStyleRef = useRef(mapboxStyle);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const popupRootRef = useRef<StopPopupRoot | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [styleRevision, setStyleRevision] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  const [servicePatterns, setServicePatterns] =
    useState<FeatureCollection<LineString> | null>(null);
  const [stops, setStops] = useState<FeatureCollection<Point> | null>(null);
  const [bounds, setBounds] = useState<BBox2d>(BRITISH_ISLES_BBOX);

  const canLoad = useMemo(
    () => Boolean(params?.filters?.lineIds?.length),
    [params],
  );

  const handleStopHover = useCallback(
    (event: mapboxgl.MapLayerMouseEvent) => {
      const map = mapRef.current;
      const feature = event.features?.[0];
      if (!map || !feature || feature.geometry.type !== "Point") {
        return;
      }

      const coordinates = feature.geometry.coordinates as [number, number];
      const props = feature.properties as StopPopupContent | undefined;
      if (!props) {
        return;
      }

      showStopPopup({
        map,
        coordinates,
        stop: props,
        popupRef,
        popupRootRef,
      });
    },
    [popupRef, popupRootRef],
  );

  const handleStopLeave = useCallback(() => {
    const map = mapRef.current;
    if (map) {
      map.getCanvas().style.cursor = "";
    }
    clearStopPopup({ popupRef, popupRootRef });
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapboxStyle,
      bounds: [
        [BRITISH_ISLES_BBOX[0], BRITISH_ISLES_BBOX[1]],
        [BRITISH_ISLES_BBOX[2], BRITISH_ISLES_BBOX[3]],
      ],
      fitBoundsOptions: { padding: 50, duration: 0 },
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-left");

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
          setStyleRevision((previous) => previous + 1);
        }
      })();
    });

    mapRef.current = map;

    return () => {
      clearStopPopup({ popupRef, popupRootRef });
      map.remove();
      mapRef.current = null;
    };
  }, [mapboxStyle, mapboxToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || mapStyleRef.current === mapboxStyle) {
      return;
    }

    mapStyleRef.current = mapboxStyle;
    map.setStyle(mapboxStyle);
  }, [mapLoaded, mapboxStyle]);

  useEffect(() => {
    if (!params || !canLoad) {
      return;
    }

    let cancelled = false;

    const loadMapData = async () => {
      setIsLoading(true);
      setErrored(false);

      try {
        const effectiveParams = removeAdminAreaIds(params);
        const operatorId = effectiveParams.filters?.operatorIds?.[0] ?? null;
        const lineId = effectiveParams.filters?.lineIds?.[0] ?? null;

        const [stopPerformance, servicePatternStops] = await Promise.all([
          onTimeService.fetchStopPerformanceList(effectiveParams),
          transitModelService.fetchServicePatternStops(operatorId, lineId),
        ]);

        if (cancelled) {
          return;
        }

        const patternFeatures = buildPatternFeatures(servicePatternStops);
        const stopFeatures = buildStopFeatures(
          stopPerformance,
          servicePatternStops,
        );

        setServicePatterns(patternFeatures);
        setStops(stopFeatures);
        setBounds(
          patternFeatures.features.length > 0
            ? (bbox(patternFeatures) as BBox2d)
            : BRITISH_ISLES_BBOX,
        );
      } catch {
        if (!cancelled) {
          setErrored(true);
          setServicePatterns(featureCollection([]));
          setStops(featureCollection([]));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadMapData();

    return () => {
      cancelled = true;
    };
  }, [canLoad, params]);

  useEffect(() => {
    const map = mapRef.current;
    if (
      !map ||
      !mapLoaded ||
      !map.isStyleLoaded() ||
      !servicePatterns ||
      !stops
    ) {
      return;
    }

    if (!map.getSource(ON_TIME_SERVICE_MAP_IDS.patternSource)) {
      map.addSource(ON_TIME_SERVICE_MAP_IDS.patternSource, {
        type: "geojson",
        data: servicePatterns,
        generateId: true,
      });
    } else {
      (
        map.getSource(ON_TIME_SERVICE_MAP_IDS.patternSource) as GeoJSONSource
      ).setData(servicePatterns);
    }

    if (!map.getSource(ON_TIME_SERVICE_MAP_IDS.stopSource)) {
      map.addSource(ON_TIME_SERVICE_MAP_IDS.stopSource, {
        type: "geojson",
        data: stops,
      });
    } else {
      (
        map.getSource(ON_TIME_SERVICE_MAP_IDS.stopSource) as GeoJSONSource
      ).setData(stops);
    }

    if (!map.getLayer(ON_TIME_SERVICE_MAP_IDS.patternLayer)) {
      map.addLayer({
        id: ON_TIME_SERVICE_MAP_IDS.patternLayer,
        type: "line",
        source: ON_TIME_SERVICE_MAP_IDS.patternSource,
        paint: ON_TIME_SERVICE_PATTERN_LINE_PAINT,
        layout: ON_TIME_SERVICE_PATTERN_LINE_LAYOUT,
      });
    }

    if (!map.getLayer(ON_TIME_SERVICE_MAP_IDS.directionLayer)) {
      map.addLayer({
        id: ON_TIME_SERVICE_MAP_IDS.directionLayer,
        type: "symbol",
        source: ON_TIME_SERVICE_MAP_IDS.patternSource,
        layout: ON_TIME_SERVICE_DIRECTION_LAYOUT,
      });
    }

    if (!map.getLayer(ON_TIME_SERVICE_MAP_IDS.stopNamesLayer)) {
      map.addLayer({
        id: ON_TIME_SERVICE_MAP_IDS.stopNamesLayer,
        type: "symbol",
        source: ON_TIME_SERVICE_MAP_IDS.stopSource,
        minzoom: 14,
        filter: ON_TIME_SERVICE_STOP_NAMES_FILTER,
        layout: ON_TIME_SERVICE_STOP_NAMES_LAYOUT,
        paint: ON_TIME_SERVICE_STOP_NAMES_PAINT,
      });
    }

    if (!map.getLayer(ON_TIME_SERVICE_MAP_IDS.stopMarkersNoDataLayer)) {
      map.addLayer({
        id: ON_TIME_SERVICE_MAP_IDS.stopMarkersNoDataLayer,
        type: "circle",
        source: ON_TIME_SERVICE_MAP_IDS.stopSource,
        filter: ON_TIME_SERVICE_NO_DATA_FILTER,
        paint: {
          "circle-radius": getOnTimeServiceNoDataCircleRadius(timingPointsOnly),
          "circle-color": "#b1b4b6",
          "circle-stroke-width":
            getOnTimeServiceNoDataCircleStrokeWidth(timingPointsOnly),
          "circle-stroke-color":
            ON_TIME_SERVICE_STOP_MARKERS_CIRCLE_STROKE_COLOR,
        },
      });

      map.on(
        "mousemove",
        ON_TIME_SERVICE_MAP_IDS.stopMarkersNoDataLayer,
        (event) => {
          map.getCanvas().style.cursor = "pointer";
          handleStopHover(event);
        },
      );
      map.on(
        "mouseleave",
        ON_TIME_SERVICE_MAP_IDS.stopMarkersNoDataLayer,
        handleStopLeave,
      );
    }

    map.setPaintProperty(
      ON_TIME_SERVICE_MAP_IDS.stopMarkersNoDataLayer,
      "circle-radius",
      getOnTimeServiceNoDataCircleRadius(timingPointsOnly),
    );

    map.setPaintProperty(
      ON_TIME_SERVICE_MAP_IDS.stopMarkersNoDataLayer,
      "circle-stroke-width",
      getOnTimeServiceNoDataCircleStrokeWidth(timingPointsOnly),
    );

    if (!map.getLayer(ON_TIME_SERVICE_MAP_IDS.stopMarkersLayer)) {
      map.addLayer({
        id: ON_TIME_SERVICE_MAP_IDS.stopMarkersLayer,
        type: "circle",
        source: ON_TIME_SERVICE_MAP_IDS.stopSource,
        filter: ON_TIME_SERVICE_STOP_MARKERS_FILTER,
        paint: {
          "circle-radius": ON_TIME_SERVICE_STOP_MARKERS_CIRCLE_RADIUS,
          "circle-color": ON_TIME_SERVICE_STOP_MARKERS_CIRCLE_COLOR,
          "circle-stroke-width":
            ON_TIME_SERVICE_STOP_MARKERS_CIRCLE_STROKE_WIDTH,
          "circle-stroke-color":
            ON_TIME_SERVICE_STOP_MARKERS_CIRCLE_STROKE_COLOR,
        },
      });

      map.on("mousemove", ON_TIME_SERVICE_MAP_IDS.stopMarkersLayer, (event) => {
        map.getCanvas().style.cursor = "pointer";
        handleStopHover(event);
      });
      map.on(
        "mouseleave",
        ON_TIME_SERVICE_MAP_IDS.stopMarkersLayer,
        handleStopLeave,
      );
    }

    map.setLayoutProperty(
      ON_TIME_SERVICE_MAP_IDS.stopMarkersLayer,
      "visibility",
      timingPointsOnly ? "none" : "visible",
    );

    if (!map.getLayer(ON_TIME_SERVICE_MAP_IDS.timingPointsLayer)) {
      map.addLayer({
        id: ON_TIME_SERVICE_MAP_IDS.timingPointsLayer,
        type: "symbol",
        source: ON_TIME_SERVICE_MAP_IDS.stopSource,
        filter: ON_TIME_SERVICE_TIMING_POINTS_FILTER,
        layout: {
          "icon-size": ON_TIME_SERVICE_TIMING_POINTS_ICON_SIZE,
          "icon-image": ON_TIME_SERVICE_TIMING_POINTS_ICON_IMAGE,
          "symbol-placement": "point",
          "icon-allow-overlap": true,
        },
      });

      map.on(
        "mousemove",
        ON_TIME_SERVICE_MAP_IDS.timingPointsLayer,
        (event) => {
          map.getCanvas().style.cursor = "pointer";
          handleStopHover(event);
        },
      );
      map.on(
        "mouseleave",
        ON_TIME_SERVICE_MAP_IDS.timingPointsLayer,
        handleStopLeave,
      );
    }

    map.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      {
        padding: 50,
        duration: 0,
      },
    );
  }, [
    bounds,
    handleStopHover,
    handleStopLeave,
    mapLoaded,
    servicePatterns,
    stops,
    styleRevision,
    timingPointsOnly,
  ]);

  return (
    <div className="on-time-service-map">
      <div
        ref={mapContainerRef}
        className="on-time-service-map__container"
        aria-label="On-time service map"
      />

      {isLoading && (
        <div
          className="on-time-service-map__loading-overlay"
          role="status"
          aria-live="polite"
          aria-label="Loading service map"
        >
          <Spinner size="x-small" />
        </div>
      )}

      {errored && (
        <div className="on-time-service-map__error">
          <p className="govuk-body govuk-!-margin-bottom-0">
            Unable to load map data.
          </p>
        </div>
      )}

      <div className="on-time-service-map__legend">
        <span className="on-time-service-map__dot on-time-service-map__dot--high" />
        <span>&gt; 80% on-time</span>
        <span className="on-time-service-map__dot on-time-service-map__dot--med" />
        <span>60 - 80% on-time</span>
        <span className="on-time-service-map__dot on-time-service-map__dot--low" />
        <span>&lt; 60% on-time</span>
        <span className="on-time-service-map__dot on-time-service-map__dot--no-data" />
        <span>No data</span>
      </div>
    </div>
  );
};
