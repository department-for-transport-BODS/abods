import { DateTime, Duration } from "luxon";
import { OtpEnum, Stop } from "../../../generated/graphql";

export interface VehiclePingStop {
  stopId: string;
  latitude: number;
  longitude: number;
  otp: OtpEnum | null;
  otpEstimate: OtpEnum | null;
  stopName?: string;
  isTimingPoint?: boolean;
  scheduledDeparture: DateTime;
  actualDeparture?: DateTime;
  actualDepartureTimestamp?: string;
  estimatedDeparture?: DateTime;
  estimatedDepartureTimestamp?: string;
  delay?: Duration;
  delayEstimate?: Duration;
}

export const createStopModel = (stop: Stop): VehiclePingStop => {
  let model: VehiclePingStop = {
    stopId: stop.stopId.toString(),
    stopName: stop.stopName,
    isTimingPoint: stop.isTimingPoint,
    scheduledDeparture: DateTime.fromISO(stop.scheduledDepartureUtc),
    latitude: stop.latitude,
    longitude: stop.longitude,
    actualDepartureTimestamp: stop.actualDepartureUtc ?? undefined,
    estimatedDepartureTimestamp: stop.estimatedDepartureUtc ?? undefined,
    otp: stop.otp ?? null,
    otpEstimate: stop.otpEstimate ?? null,
  };
  if (stop.actualDepartureUtc) {
    const actualDeparture = DateTime.fromISO(stop.actualDepartureUtc);
    model = {
      ...model,
      actualDeparture,
      delay: actualDeparture.diff(model.scheduledDeparture),
    };
  }
  if (stop.estimatedDepartureUtc) {
    const estimatedDeparture = DateTime.fromISO(stop.estimatedDepartureUtc);
    model = {
      ...model,
      estimatedDeparture,
      delayEstimate: estimatedDeparture.diff(model.scheduledDeparture),
    };
  }
  return model;
};
