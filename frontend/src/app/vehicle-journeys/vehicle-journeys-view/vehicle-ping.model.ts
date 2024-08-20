import { DateTime } from 'luxon';
import { getOtpEnum, OnTimePerformanceEnum } from './on-time-performance.enum';
import { ApolloGpsFeedType } from './vehicle-journeys-view.service';

export interface Ping {
  id: string;
  lat: number;
  lon: number;
  ts: DateTime;
  onTimePerformance: OnTimePerformanceEnum;
}

export class VehiclePing implements Ping {
  id!: string;
  lat!: number;
  lon!: number;
  ts!: DateTime;
  onTimePerformance!: OnTimePerformanceEnum;
  formattedTime?: string;

  static createVehiclePing(ping: ApolloGpsFeedType): VehiclePing {
    const vp = new VehiclePing();
    vp.id = ping.lat.toString() + ping.lon.toString() + ping.ts;
    vp.lat = ping.lat;
    vp.lon = ping.lon;
    vp.ts = DateTime.fromISO(ping.ts);
    vp.onTimePerformance = getOtpEnum(ping.delay);
    vp.formattedTime = DateTime.fromISO(ping.ts).toFormat('HH:mm:ss');
    return vp;
  }
}
