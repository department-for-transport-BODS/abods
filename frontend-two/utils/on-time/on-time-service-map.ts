import { featureCollection, lineString, point } from "@turf/helpers";
import type {
  Feature,
  FeatureCollection,
  LineString,
  Point,
  Position,
} from "geojson";
import {
  PerformanceParams,
  onTimeService,
} from "@/services/on-time/on-time.service";
import { stopPerformanceService } from "@/services/on-time/stop-performance.service";
import {
  ServicePattern,
  transitModelService,
} from "@/services/on-time/transit-model.service";
import { RouteType, ServiceLinkType, StopType } from "@/src/generated/graphql";

export const SYNTHETIC_STOP_FILTER = {
  lat: 51,
  lon: -6.5,
};

export const pairwise = <T>(items: T[]): [T, T][] => {
  const out: [T, T][] = [];
  for (let i = 0; i < items.length - 1; i += 1) {
    out.push([items[i], items[i + 1]]);
  }
  return out;
};

export const removeAdminAreaIds = (
  params: PerformanceParams,
): PerformanceParams => {
  const { adminAreaIds: _adminAreaIds, ...filters } = params.filters ?? {};
  return {
    ...params,
    filters,
  };
};

export const positionFromStop = (stop: {
  lon: number;
  lat: number;
}): [number, number] => [stop.lon, stop.lat];

export const segmentIdFromPair = (segment: [StopType, StopType]) =>
  `${segment[0].stopId}${segment[1].stopId}`;

export const setCoordinates = (
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

export const buildPatternFeatures = (
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

export const buildStopFeatures = (
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
