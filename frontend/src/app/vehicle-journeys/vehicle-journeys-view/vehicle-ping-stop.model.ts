import { DateTime, Duration } from 'luxon';
import { OtpEnum, Stop } from '../../../generated/graphql';

export interface VehiclePingStop {
  id: string;
  lat: number;
  lon: number;
  onTimePerformance: OtpEnum | null;
  stopName?: string;
  isTimingPoint?: boolean;
  scheduledDeparture: DateTime;
  actualDeparture?: DateTime;
  actualDepartureTimestamp?: string;
  isHidden: boolean;
  delay?: Duration;
  actualDelay?: Duration;
}

export const createStopModel = (stop: Stop, timingPointsOnly: boolean, finalStopIndex: number) => {
  const model: VehiclePingStop = {
    id: stop.stopId.toString(),
    stopName: stop.stopName,
    isTimingPoint: stop.isTimingPoint,
    isHidden: timingPointsOnly && !stop.isTimingPoint,
    scheduledDeparture: DateTime.fromISO(stop.scheduledDepartureUtc),
    lat: stop.latitude,
    lon: stop.longitude,
    actualDepartureTimestamp: stop.actualDepartureUtc ?? undefined,
    onTimePerformance: stop.otp ?? null,
  };
  if (!stop.actualDepartureUtc) {
    return model;
  }
  const actualDeparture = DateTime.fromISO(stop.actualDepartureUtc);
  const actualDelay = actualDeparture.diff(model.scheduledDeparture);
  return {
    ...model,
    actualDeparture: actualDeparture,
    actualDelay: actualDelay,
    delay: finalStopIndex === stop.stopIndex ? Duration.fromMillis(0) : actualDelay,
  };
};
