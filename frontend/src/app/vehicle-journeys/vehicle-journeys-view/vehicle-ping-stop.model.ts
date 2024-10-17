import { DateTime, Duration } from 'luxon';
import { getOtpEnum, OnTimePerformanceEnum } from './on-time-performance.enum';
import { ApolloGpsFeedType, StopDetails } from './vehicle-journeys-view.service';
import { Ping } from './vehicle-ping.model';

export interface VehiclePingStop extends Ping {
  id: string;
  lat: number;
  lon: number;
  ts: DateTime;
  onTimePerformance: OnTimePerformanceEnum;
  stopName?: string;
  isTimingPoint?: boolean;
  scheduledDeparture?: DateTime;
  actualDeparture?: DateTime;
  isHidden?: boolean;
  delay?: Duration;
  actualDelay?: Duration;
}

export function createVehiclePingStop(nearestPing: ApolloGpsFeedType, stop: StopDetails): VehiclePingStop {
  // Workaround for the fact that the ping might be matched to the wrong stop
  const pingDeparture = DateTime.fromISO(nearestPing.scheduledDeparture);
  const scheduledDeparture = stop.startTime.plus({ minutes: stop.departureTimeOffset });
  const nearestPingDifferenceSeconds = pingDeparture.isValid ? pingDeparture.diff(scheduledDeparture).as('seconds') : 0;
  const nearestPingDelay = (nearestPing.actualDelay ?? 0) + nearestPingDifferenceSeconds;

  return {
    id: stop?.stopId as string,
    stopName: stop?.stopName,
    isTimingPoint: stop.timingPoint,
    scheduledDeparture: scheduledDeparture,
    actualDeparture: scheduledDeparture.plus({ seconds: nearestPingDelay }),
    lat: stop?.lat as number,
    lon: stop?.lon as number,
    ts: DateTime.fromISO(nearestPing.ts),
    onTimePerformance: getOtpEnum(nearestPing.delay),
    isHidden: false,
    delay: Duration.fromMillis((nearestPing.delay ?? 0) * 1000),
    actualDelay: Duration.fromMillis(nearestPingDelay * 1000),
  };
}

export function createNoDataStop(stop: StopDetails): VehiclePingStop {
  return {
    id: stop?.stopId as string,
    stopName: stop?.stopName,
    isTimingPoint: stop.timingPoint,
    onTimePerformance: OnTimePerformanceEnum.NoData,
    scheduledDeparture: stop.startTime.plus({ minutes: stop.departureTimeOffset }),
    lat: stop?.lat as number,
    lon: stop?.lon as number,
    isHidden: false,

    ts: DateTime.fromSeconds(0),
  };
}

export function createHiddenStop(stop: StopDetails): VehiclePingStop {
  return {
    id: stop?.stopId as string,
    stopName: stop?.stopName,
    isTimingPoint: stop.timingPoint,
    scheduledDeparture: stop.startTime.plus({ minutes: stop.departureTimeOffset }),
    lat: stop?.lat as number,
    lon: stop?.lon as number,
    isHidden: true,

    ts: DateTime.fromSeconds(0),
    onTimePerformance: OnTimePerformanceEnum.NoData,
  };
}
