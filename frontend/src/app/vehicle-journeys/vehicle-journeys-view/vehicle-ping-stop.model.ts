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
  delay?: Duration;
}

export const createStopModel = (stop: Stop): VehiclePingStop => {
  const model: VehiclePingStop = {
    id: stop.stopId.toString(),
    stopName: stop.stopName,
    isTimingPoint: stop.isTimingPoint,
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
  return {
    ...model,
    actualDeparture,
    delay: actualDeparture.diff(model.scheduledDeparture),
  };
};
