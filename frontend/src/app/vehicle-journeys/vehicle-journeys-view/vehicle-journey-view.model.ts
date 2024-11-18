import { AvlPoint, Stop } from "../../../generated/graphql";
import { createStopModel, VehiclePingStop } from "./vehicle-ping-stop.model";
import {
  createJourneyInfo,
  VehicleJourneyInfo,
} from "./vehicle-journey-info.model";
import { VehicleJourney } from "../vehicle-journeys-search/vehicle-journeys-search.service";
import { DateTime } from "luxon";

export interface VehicleJourneyView {
  stopList: VehiclePingStop[];
  journeyInfo: VehicleJourneyInfo;
  gpsPingList: AvlPoint[];
  prevNextJourneys: [VehicleJourney | undefined, VehicleJourney | undefined];
}

export const createVehicleJourneyView = (
  journey: AvlPoint[],
  route: Stop[],
  journeys: VehicleJourney[],
  startTime: DateTime,
  journeyId: string,
): VehicleJourneyView => {
  journey = [...journey].sort((a, b) =>
    a.recordedAtTimeUtc.localeCompare(b.recordedAtTimeUtc),
  );
  route = [...route].sort((a, b) => a.stopIndex - b.stopIndex);

  const firstStop = route[0];
  if (!firstStop) {
    throw new Error("No data");
  }

  const stopList = route.map(createStopModel);

  let idx = -1;
  journeys.forEach((v, i) => {
    if (
      v.startTime?.toMillis() === startTime.toMillis() &&
      v.groupId === journeyId
    ) {
      idx = i;
    }
  });
  return {
    stopList: stopList,
    gpsPingList: journey,
    journeyInfo: createJourneyInfo(firstStop, journey[0]),
    prevNextJourneys: [journeys[idx - 1], journeys[idx + 1]],
  };
};
