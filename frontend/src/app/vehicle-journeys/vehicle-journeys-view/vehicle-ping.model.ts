import { DateTime } from 'luxon';
import { AvlPoint, OtpEnum } from '../../../generated/graphql';

export function createVehiclePing(ping: AvlPoint, otp: OtpEnum | null) {
  const timestamp = DateTime.fromISO(ping.recordedAtTimeUtc);
  return {
    lat: ping.latitude,
    lon: ping.longitude,
    ts: timestamp,
    onTimePerformance: otp,
    formattedTime: timestamp.toFormat('HH:mm:ss'),
    id: ping.latitude.toString() + ping.longitude.toString() + ping.recordedAtTimeUtc,
  };
}

export type VehiclePing = ReturnType<typeof createVehiclePing>;
