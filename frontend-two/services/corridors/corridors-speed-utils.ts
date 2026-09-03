import {
  CorridorStatsPerServiceType,
  RouteType,
  ServiceLinkType,
} from "../../src/generated/graphql";

const MS_TO_MPH_FACTOR = 2.237;

export const isInvalidRouteLink = (link: ServiceLinkType): boolean =>
  link.routeValidity !== RouteType.Valid;

export const calculateTotalServiceLinkDistance = (
  serviceLinks: ServiceLinkType[],
): number => serviceLinks.reduce((acc, link) => acc + link.distance, 0);

export const calculateAverageSpeedInMph = (
  meters: number,
  seconds: number | null | undefined,
): number | undefined => {
  if (seconds && seconds > 0) {
    return Math.round((meters / seconds) * MS_TO_MPH_FACTOR);
  }
  return undefined;
};

export const averageSpeedLabel = (
  serviceLinks: ServiceLinkType[],
  averageTransitTime: number | null | undefined,
): string => {
  const totalDistance = calculateTotalServiceLinkDistance(serviceLinks);
  const speed = calculateAverageSpeedInMph(totalDistance, averageTransitTime);
  return `${speed ?? 0}mph`;
};

export const averageServiceSpeedLabel = (
  serviceLinks: ServiceLinkType[],
  service: CorridorStatsPerServiceType,
): string => {
  const totalDistance = calculateTotalServiceLinkDistance(serviceLinks);
  const recorded = service.recordedTransits ?? 0;
  if (!recorded || !service.totalTransitTime) return "0mph";

  const avgJourneyTimeSeconds = service.totalTransitTime / recorded;
  const speed = calculateAverageSpeedInMph(
    totalDistance,
    avgJourneyTimeSeconds,
  );
  return `${speed ?? 0}mph`;
};
