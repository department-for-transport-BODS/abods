import { AvlPoint, OtpEnum } from "../../../generated/graphql";

export function createVehiclePing(
  ping: AvlPoint,
  otp: OtpEnum | null,
  otpEstimate: OtpEnum | null,
) {
  return {
    lat: ping.latitude,
    lon: ping.longitude,
    ts: ping.recordedAtTimeUtc,
    otp: otp,
    otpEstimate: otpEstimate,
    id:
      ping.latitude.toString() +
      ping.longitude.toString() +
      ping.recordedAtTimeUtc,
  };
}

export type VehiclePing = ReturnType<typeof createVehiclePing>;
