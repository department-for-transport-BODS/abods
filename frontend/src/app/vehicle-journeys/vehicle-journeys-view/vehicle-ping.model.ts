import { AvlPoint, OtpEnum } from "../../../generated/graphql";

export function createVehiclePing(ping: AvlPoint, otp: OtpEnum | null) {
  return {
    lat: ping.latitude,
    lon: ping.longitude,
    ts: ping.recordedAtTimeUtc,
    onTimePerformance: otp,
    id:
      ping.latitude.toString() +
      ping.longitude.toString() +
      ping.recordedAtTimeUtc,
  };
}

export type VehiclePing = ReturnType<typeof createVehiclePing>;
