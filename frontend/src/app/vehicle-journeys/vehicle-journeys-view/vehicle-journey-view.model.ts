import { DateTime } from 'luxon';
import { AvlPoint, Stop } from '../../../generated/graphql';
import { OnTimePerformanceEnum } from './on-time-performance.enum';
import { VehiclePing } from './vehicle-ping.model';
import { createHiddenStop, createVehiclePingStop, VehiclePingStop } from './vehicle-ping-stop.model';

export interface OnTimePerformanceStat {
  percent: number;
  value: number;
  total: number;
}

export interface OnTimePerformanceStats {
  onTime?: OnTimePerformanceStat;
  late?: OnTimePerformanceStat;
  early?: OnTimePerformanceStat;
  noData?: OnTimePerformanceStat;
}

export interface VehicleJourneyInfo {
  operatorInfo: {
    nocCode: string;
    operatorName: string;
  };
  serviceInfo: {
    serviceId: string;
    serviceName: string;
    serviceNumber: string;
  };
  vehicleId: string;
  startTime: DateTime;
}

export interface VehicleJourneyViewParams {
  timingPointsOnly: boolean;
}

const calculateOtpStat = (stopList: VehiclePingStop[], statType: OnTimePerformanceEnum): OnTimePerformanceStat => {
  const total = stopList.length;
  const value = stopList.filter((stop) => stop.onTimePerformance === statType).length;
  return {
    percent: value / total,
    value: value,
    total: total,
  };
};

export class VehicleJourneyView {
  stopList: VehiclePingStop[];
  journeyInfo: VehicleJourneyInfo;
  gpsPingList: VehiclePing[];
  otpStats: OnTimePerformanceStats;

  constructor(journey: AvlPoint[], route: Stop[], params: VehicleJourneyViewParams) {
    if (!(journey[0] && route[0])) {
      throw new Error('No data');
    }
    journey.sort((a, b) => new Date(a.recordedAtTimeUtc).getDate() - new Date(b.recordedAtTimeUtc).getDate());
    route.sort((a, b) => a.stopIndex - b.stopIndex);

    const lastStopIndex = Math.max(...route.map((n) => n.stopIndex));
    const stopList = route.map((stop) =>
      params.timingPointsOnly && !stop.isTimingPoint
        ? createHiddenStop(stop, lastStopIndex === stop.stopIndex)
        : createVehiclePingStop(stop, lastStopIndex === stop.stopIndex)
    );
    this.stopList = stopList;
    this.journeyInfo = {
      operatorInfo: {
        nocCode: route[0].operatorNoc,
        operatorName: route[0].operatorName,
      },
      serviceInfo: {
        serviceName: route[0].serviceName,
        serviceId: route[0].serviceId,
        serviceNumber: route[0].lineName,
      },
      vehicleId: journey[0].vehicleRef,
      startTime: DateTime.fromISO(route[0].startTime),
    };

    let otp: OnTimePerformanceEnum = OnTimePerformanceEnum.NoData;
    this.gpsPingList = journey.map((ping: AvlPoint) => {
      const thisMatch = stopList.find((s) => s.actualDepartureTimestamp === ping.recordedAtTimeUtc);
      if (thisMatch) {
        otp = thisMatch.onTimePerformance;
      }
      return new VehiclePing(ping, otp);
    });
    const filteredStopList = stopList.filter((stop) => !stop.isHidden);
    this.otpStats = {
      early: calculateOtpStat(filteredStopList, OnTimePerformanceEnum.Early),
      late: calculateOtpStat(filteredStopList, OnTimePerformanceEnum.Late),
      onTime: calculateOtpStat(filteredStopList, OnTimePerformanceEnum.OnTime),
      noData: calculateOtpStat(filteredStopList, OnTimePerformanceEnum.NoData),
    };
  }
}
