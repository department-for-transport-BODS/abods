import { DateTime } from "luxon";
import { apolloClient } from "@/services/apolloClient";
import {
  JourneyDocument,
  JourneysDocument,
  OperatorLinesDocument,
  OperatorListDocument,
  ServicePatternDistanceGeomDocument,
} from "@/services/vehicle-journeys/vehicle-journeys.operations";
import {
  ServicePatternDistanceGeom,
  VehicleJourneyInfo,
  VehicleJourneyLine,
  VehicleJourneyOperator,
  VehicleJourneySummary,
} from "@/types/vehicle-journeys";

const asRouteGeometry = (geom: unknown): [number, number][] | null => {
  if (!Array.isArray(geom)) return null;

  const points = geom.filter(
    (point): point is [number, number] =>
      Array.isArray(point) &&
      point.length >= 2 &&
      typeof point[0] === "number" &&
      typeof point[1] === "number",
  );

  return points.length > 0 ? points : null;
};

export const vehicleJourneysService = {
  fetchOperators: async (): Promise<VehicleJourneyOperator[]> => {
    try {
      const result = await apolloClient.query({
        query: OperatorListDocument,
      });
      return result.data?.operators ?? [];
    } catch (error) {
      console.warn("Failed to fetch vehicle journey operators:", error);
      return [];
    }
  },

  fetchLines: async (
    operatorId: string,
    inputDate: string,
  ): Promise<VehicleJourneyLine[]> => {
    try {
      const result = await apolloClient.query({
        query: OperatorLinesDocument,
        variables: { operatorIds: [operatorId], inputDate },
      });
      return result.data?.lines ?? [];
    } catch (error) {
      console.warn("Failed to fetch vehicle journey services:", error);
      return [];
    }
  },

  fetchDayJourneys: async (
    dateOfJourney: string,
    lineId: string,
  ): Promise<VehicleJourneySummary[] | null> => {
    try {
      const result = await apolloClient.query({
        query: JourneysDocument,
        variables: { dateOfJourney, lineId },
      });
      const now = DateTime.now();

      return [...(result.data?.findJourneys ?? [])]
        .filter((journey) => DateTime.fromISO(journey.startTime) <= now)
        .sort((left, right) => left.startTime.localeCompare(right.startTime));
    } catch (error) {
      console.warn("Failed to fetch vehicle journeys:", error);
      return null;
    }
  },

  fetchJourney: async (
    groupId: string,
    lineId: string,
  ): Promise<VehicleJourneyInfo | null> => {
    try {
      const result = await apolloClient.query({
        query: JourneyDocument,
        variables: { groupId, lineId },
      });
      return result.data?.journey ?? null;
    } catch (error) {
      console.warn("Failed to fetch vehicle journey:", error);
      return null;
    }
  },

  fetchServicePatternDistanceGeom: async (
    vehicleJourneyId: string,
  ): Promise<ServicePatternDistanceGeom | null> => {
    try {
      const result = await apolloClient.query({
        query: ServicePatternDistanceGeomDocument,
        variables: { vehicleJourneyId },
      });
      const distanceGeom = result.data?.getServicePatternDistanceGeom;

      if (!distanceGeom) return null;

      return {
        ...distanceGeom,
        geom: asRouteGeometry(distanceGeom.geom),
      };
    } catch (error) {
      console.warn("Failed to fetch service pattern geometry:", error);
      return null;
    }
  },
};
