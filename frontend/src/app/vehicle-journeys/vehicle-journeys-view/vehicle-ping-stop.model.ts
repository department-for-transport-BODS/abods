import { DateTime, Duration } from 'luxon';
import { getOtpEnum, OnTimePerformanceEnum } from './on-time-performance.enum';
import { ApolloGpsFeedType, StopDetails } from './vehicle-journeys-view.service';
import { Ping } from './vehicle-ping.model';

const calcScheduledDeparture = (nearestPing: ApolloGpsFeedType, stop: StopDetails): DateTime => {
  // GPS feed has granularity in seconds and should be used for scheduledDeparture
  const scheduledDeparture = DateTime.fromISO(nearestPing.scheduledDeparture);
  // Fallback to using departureTimeOffset to calculate scheduledDeparture
  return scheduledDeparture.isValid ? scheduledDeparture : stop.startTime.plus({ minutes: stop.departureTimeOffset });
};

export class VehiclePingStop implements Ping {
  id!: string;
  lat!: number;
  lon!: number;
  ts!: DateTime;
  onTimePerformance!: OnTimePerformanceEnum;
  stopName?: string;
  isTimingPoint?: boolean;
  scheduledDeparture?: DateTime;
  actualDeparture?: DateTime;
  isHidden?: boolean;
  delay?: Duration;

  static createVehiclePingStop(nearestPing: ApolloGpsFeedType, stop: StopDetails): VehiclePingStop {
    const vps = new VehiclePingStop();
    vps.id = stop?.stopId as string;
    vps.stopName = stop?.stopName;
    vps.isTimingPoint = stop.timingPoint;
    vps.scheduledDeparture = calcScheduledDeparture(nearestPing, stop);
    vps.actualDeparture = vps.scheduledDeparture.plus({ seconds: nearestPing.delay ?? 0 });
    vps.lat = stop?.lat as number;
    vps.lon = stop?.lon as number;
    vps.ts = DateTime.fromISO(nearestPing.ts);
    vps.onTimePerformance = getOtpEnum(nearestPing.delay);
    vps.isHidden = false;
    vps.delay = Duration.fromMillis((nearestPing.delay ?? 0) * 1000);
    return vps;
  }

  static createNoDataStop(stop: StopDetails): VehiclePingStop {
    const vps = new VehiclePingStop();
    vps.id = stop?.stopId as string;
    vps.stopName = stop?.stopName;
    vps.isTimingPoint = stop.timingPoint;
    vps.onTimePerformance = OnTimePerformanceEnum.NoData;
    vps.scheduledDeparture = stop.startTime.plus({ minutes: stop.departureTimeOffset });
    vps.lat = stop?.lat as number;
    vps.lon = stop?.lon as number;
    vps.isHidden = false;
    return vps;
  }

  static createHiddenStop(stop: StopDetails): VehiclePingStop {
    const vps = new VehiclePingStop();
    vps.id = stop?.stopId as string;
    vps.stopName = stop?.stopName;
    vps.isTimingPoint = stop.timingPoint;
    vps.scheduledDeparture = stop.startTime.plus({ minutes: stop.departureTimeOffset });
    vps.lat = stop?.lat as number;
    vps.lon = stop?.lon as number;
    vps.isHidden = true;
    return vps;
  }
}
