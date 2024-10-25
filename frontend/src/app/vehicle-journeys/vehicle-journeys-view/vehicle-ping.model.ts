import { DateTime } from 'luxon';
import { AvlPoint, OtpEnum } from '../../../generated/graphql';

export interface Ping {
  id: string;
  lat: number;
  lon: number;
  ts: DateTime;
  onTimePerformance: OtpEnum | null;
}

export class VehiclePing implements Ping {
  id: string;
  lat: number;
  lon: number;
  ts: DateTime;
  onTimePerformance: OtpEnum | null;
  formattedTime?: string;

  constructor(ping: AvlPoint, otp: OtpEnum | null) {
    this.lat = ping.latitude;
    this.lon = ping.longitude;
    this.ts = DateTime.fromISO(ping.recordedAtTimeUtc);
    this.onTimePerformance = otp;
    this.formattedTime = this.ts.toFormat('HH:mm:ss');
    this.id = ping.latitude.toString() + ping.longitude.toString() + ping.recordedAtTimeUtc;
  }
}
