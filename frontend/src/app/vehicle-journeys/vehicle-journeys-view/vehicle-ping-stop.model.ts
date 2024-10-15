import { DateTime, Duration } from 'luxon';
import { getOtpEnum, OnTimePerformanceEnum } from './on-time-performance.enum';
import { ApolloGpsFeedType, StopDetails } from './vehicle-journeys-view.service';
import { Ping } from './vehicle-ping.model';

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
  actualDelay?: Duration;

  static createVehiclePingStop(nearestPing: ApolloGpsFeedType, stop: StopDetails): VehiclePingStop {
    // Workaround for the fact that the ping might be matched to the wrong stop
    const pingDeparture = DateTime.fromISO(nearestPing.scheduledDeparture);
    const scheduledDeparture = stop.startTime.plus({ minutes: stop.departureTimeOffset });
    const nearestPingDifferenceSeconds = pingDeparture.isValid
      ? pingDeparture.diff(scheduledDeparture).as('seconds')
      : 0;
    const nearestPingDelay = (nearestPing.actualDelay ?? 0) + nearestPingDifferenceSeconds;

    const vps = new VehiclePingStop();
    vps.id = stop?.stopId as string;
    vps.stopName = stop?.stopName;
    vps.isTimingPoint = stop.timingPoint;
    vps.scheduledDeparture = scheduledDeparture;
    vps.actualDeparture = vps.scheduledDeparture.plus({ seconds: nearestPingDelay });
    vps.lat = stop?.lat as number;
    vps.lon = stop?.lon as number;
    vps.ts = DateTime.fromISO(nearestPing.ts);
    vps.onTimePerformance = getOtpEnum(nearestPing.delay);
    vps.isHidden = false;
    vps.delay = Duration.fromMillis((nearestPing.delay ?? 0) * 1000);
    vps.actualDelay = Duration.fromMillis((nearestPing.actualDelay ?? 0) * 1000);
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
