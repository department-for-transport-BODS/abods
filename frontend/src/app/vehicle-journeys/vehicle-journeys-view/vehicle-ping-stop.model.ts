import { DateTime, Duration } from 'luxon';
import { getOtpEnum, OnTimePerformanceEnum } from './on-time-performance.enum';
import { Ping } from './vehicle-ping.model';
import { Stop } from '../../../generated/graphql';

export interface VehiclePingStop extends Ping {
  id: string;
  lat: number;
  lon: number;
  onTimePerformance: OnTimePerformanceEnum;
  stopName?: string;
  isTimingPoint?: boolean;
  scheduledDeparture: DateTime;
  actualDeparture?: DateTime;
  actualDepartureTimestamp?: string;
  isHidden: boolean;
  delay?: Duration;
  actualDelay?: Duration;
}

export function createVehiclePingStop(stop: Stop, isFinalStop: boolean): VehiclePingStop {
  return { ...createHiddenStop(stop, isFinalStop), isHidden: false };
}

export function createHiddenStop(stop: Stop, isFinalStop: boolean): VehiclePingStop {
  const data = {
    id: stop.stopId.toString(),
    stopName: stop.stopName,
    isTimingPoint: stop.isTimingPoint,
    scheduledDeparture: DateTime.fromISO(stop.scheduledDepartureUtc),
    lat: stop.latitude,
    lon: stop.longitude,
    actualDepartureTimestamp: stop.actualDepartureUtc ?? undefined,

    isHidden: true,

    delay: Duration.fromMillis(0),
    actualDelay: Duration.fromMillis(0),
    ts: DateTime.fromSeconds(0),
    onTimePerformance: OnTimePerformanceEnum.NoData,
    actualDeparture: DateTime.fromSeconds(0),
  };
  if (!stop.actualDepartureUtc) {
    return data;
  }
  const pingDeparture = DateTime.fromISO(stop.actualDepartureUtc);
  const difference = pingDeparture.diff(data.scheduledDeparture);
  const normalised = isFinalStop ? Duration.fromMillis(0) : difference;
  return {
    ...data,
    actualDeparture: pingDeparture,
    delay: normalised,
    actualDelay: difference,
    ts: DateTime.fromSeconds(0),
    onTimePerformance: getOtpEnum(normalised.as('seconds')),
  };
}
