import { AvlPoint, OtpEnum, Stop } from '../../../generated/graphql';
import { createVehiclePing, VehiclePing } from './vehicle-ping.model';
import { createStopModel, VehiclePingStop } from './vehicle-ping-stop.model';
import { createJourneyInfo, VehicleJourneyInfo } from './vehicle-journey-info.model';
import { calculateOnTimePerformance, OnTimePerformanceStats } from './on-time-performance-stats.model';
import { VehicleJourney } from '../vehicle-journeys-search/vehicle-journeys-search.service';
import { DateTime } from 'luxon';

export interface VehicleJourneyView {
  stopList: VehiclePingStop[];
  journeyInfo: VehicleJourneyInfo;
  gpsPingList: VehiclePing[];
  otpStats: OnTimePerformanceStats;
  prevNextJourneys: [VehicleJourney | undefined, VehicleJourney | undefined];
}

export const createVehicleJourneyView = (
  journey: AvlPoint[],
  route: Stop[],
  timingPointsOnly: boolean,
  journeys: VehicleJourney[],
  startTime: DateTime,
  journeyId: string
): VehicleJourneyView => {
  journey = [...journey].sort(
    (a, b) => new Date(a.recordedAtTimeUtc).getDate() - new Date(b.recordedAtTimeUtc).getDate()
  );
  route = [...route].sort((a, b) => a.stopIndex - b.stopIndex);

  const firstStop = route[0];
  if (!firstStop) {
    throw new Error('No data');
  }

  const stopList = route.map((stop) => createStopModel(stop));
  let otp: OtpEnum | null = null;
  const gpsPingList = journey.map((ping: AvlPoint) => {
    const thisMatch = stopList.find((s) => s.actualDepartureTimestamp === ping.recordedAtTimeUtc);
    if (thisMatch) {
      otp = thisMatch.onTimePerformance;
    }
    return createVehiclePing(ping, otp);
  });

  let idx = -1;
  journeys.forEach((v, i) => {
    if (v.startTime?.toMillis() === startTime.toMillis() && v.vehicleJourneyId === journeyId) {
      idx = i;
    }
  });
  return {
    stopList: stopList,
    gpsPingList: gpsPingList,
    journeyInfo: createJourneyInfo(firstStop, journey[0]),
    otpStats: calculateOnTimePerformance(stopList, timingPointsOnly),
    prevNextJourneys: [journeys[idx - 1], journeys[idx + 1]],
  };
};
