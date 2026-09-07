import {
  JourneyQuery,
  JourneysQuery,
  OperatorLinesQuery,
  OperatorListQuery,
  ServicePatternDistanceGeomQuery,
} from "@/src/generated/graphql";

export type VehicleJourneySummary = JourneysQuery["findJourneys"][number];
export type VehicleJourneyInfo = JourneyQuery["journey"];
export type VehicleJourneyStop = JourneyQuery["journey"]["stops"][number];
export type VehicleJourneyAvl = JourneyQuery["journey"]["avls"][number];
export type VehicleJourneyOperator = OperatorListQuery["operators"][number];
export type VehicleJourneyLine = OperatorLinesQuery["lines"][number];
export type ServicePatternDistanceGeom =
  ServicePatternDistanceGeomQuery["getServicePatternDistanceGeom"] & {
    geom: [number, number][] | null;
  };
