import { AvlPoint, OtpEnum, Stop } from '../../../generated/graphql';
import { createVehiclePing, VehiclePing } from './vehicle-ping.model';
import { createStopModel, VehiclePingStop } from './vehicle-ping-stop.model';
import { createJourneyInfo, VehicleJourneyInfo } from './vehicle-journey-info.model';
import { calculateOnTimePerformance, OnTimePerformanceStats } from './on-time-performance-stats.model';

export interface VehicleJourneyView {
  stopList: VehiclePingStop[];
  journeyInfo: VehicleJourneyInfo;
  gpsPingList: VehiclePing[];
  otpStats: OnTimePerformanceStats;
}

export const createVehicleJourneyView = (
  journey: AvlPoint[],
  route: Stop[],
  timingPointsOnly: boolean
): VehicleJourneyView => {
  journey = [...journey].sort(
    (a, b) => new Date(a.recordedAtTimeUtc).getDate() - new Date(b.recordedAtTimeUtc).getDate()
  );
  route = [...route].sort((a, b) => a.stopIndex - b.stopIndex);

  const firstAvlPoint = journey[0];
  const firstStop = route[0];
  if (!firstAvlPoint || !firstStop) {
    throw new Error('No data');
  }

  const stopList = route.map((stop) => createStopModel(stop, timingPointsOnly));
  let otp: OtpEnum | null = null;
  const gpsPingList = journey.map((ping: AvlPoint) => {
    const thisMatch = stopList.find((s) => s.actualDepartureTimestamp === ping.recordedAtTimeUtc);
    if (thisMatch) {
      otp = thisMatch.onTimePerformance;
    }
    return createVehiclePing(ping, otp);
  });
  return {
    stopList: stopList,
    gpsPingList: gpsPingList,
    journeyInfo: createJourneyInfo(firstStop, firstAvlPoint),
    otpStats: calculateOnTimePerformance(stopList),
  };
};
