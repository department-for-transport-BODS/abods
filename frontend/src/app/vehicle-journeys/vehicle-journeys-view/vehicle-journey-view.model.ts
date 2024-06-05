import { DateTime } from 'luxon';
import { OperatorInfoType, ServiceInfoType } from '../../../generated/graphql';
import { maybeToTypeOrUndefined } from '../../shared/type-helper';
import { OnTimePerformanceEnum } from './on-time-performance.enum';
import { ApolloGpsFeedType, StopDetails } from './vehicle-journeys-view.service';
import { VehiclePing } from './vehicle-ping.model';
import { VehiclePingStop } from './vehicle-ping-stop.model';

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
  operatorInfo?: OperatorInfoType;
  serviceInfo?: ServiceInfoType;
  vehicleId?: string;
  startTime?: DateTime;
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

const findNearestPingToStop = (
  journey: ApolloGpsFeedType[],
  stop: StopDetails,
  stopHashMap: Map<string, StopDetails>
): ApolloGpsFeedType | undefined => {
  // There may be more than one match for the stop
  // e.g. a circular route will have the same starting and ending stop
  const matchedStops = journey.filter((point: ApolloGpsFeedType) => point.previousStopInfo?.stopId === stop?.stopId);
  for (let i = 0; i < matchedStops.length; i++) {
    // We can use stopId and scheduledDeparture time for a unique key and add it to the hashmap
    const hashKey = stop?.stopId + matchedStops[i].scheduledDeparture + '';
    if (stopHashMap.has(hashKey)) {
      continue;
    } else {
      stopHashMap.set(hashKey, stop);
      return matchedStops[i];
    }
  }
};

export class VehicleJourneyView {
  stopList: VehiclePingStop[] = [];
  journeyInfo: VehicleJourneyInfo = {};
  gpsPingList: VehiclePing[] = [];
  otpStats: OnTimePerformanceStats = {};

  static createView(stops: StopDetails[], journey: ApolloGpsFeedType[], params: VehicleJourneyViewParams) {
    const view = new VehicleJourneyView();
    view.stopList = VehicleJourneyView.createStopList(stops, journey, params);
    view.journeyInfo = VehicleJourneyView.createJourneyInfo(journey);
    view.otpStats = VehicleJourneyView.createOtpStats(view.stopList.filter((stop) => !stop.isHidden));
    view.gpsPingList = VehicleJourneyView.createGpsPingList(journey);
    return view;
  }

  private static createStopList(stops: StopDetails[], journey: ApolloGpsFeedType[], params: VehicleJourneyViewParams) {
    const stopHashMap = new Map<string, StopDetails>();
    return stops.map((stop: StopDetails) => {
      // Find the nearest ping to previous stop
      const nearestStopPing = findNearestPingToStop(journey, stop, stopHashMap);
      // Create stop list for timing points only
      if (params.timingPointsOnly) {
        return VehicleJourneyView.createTimingPointStop(stop, nearestStopPing);
      }
      // Create stop list for all stops
      return VehicleJourneyView.createStop(stop, nearestStopPing);
    });
  }

  private static createTimingPointStop(stop: StopDetails, nearestStopPing?: ApolloGpsFeedType): VehiclePingStop {
    if (stop.timingPoint) {
      return VehicleJourneyView.createStop(stop, nearestStopPing);
    } else {
      return VehiclePingStop.createHiddenStop(stop);
    }
  }

  private static createStop(stop: StopDetails, nearestStopPing?: ApolloGpsFeedType): VehiclePingStop {
    if (nearestStopPing) {
      return VehiclePingStop.createVehiclePingStop(nearestStopPing, stop);
    } else {
      return VehiclePingStop.createNoDataStop(stop);
    }
  }

  private static createJourneyInfo(journey: ApolloGpsFeedType[]): VehicleJourneyInfo {
    let info = <VehicleJourneyInfo>{};
    if (journey[0]) {
      info = {
        operatorInfo: maybeToTypeOrUndefined(journey[0].operatorInfo),
        serviceInfo: maybeToTypeOrUndefined(journey[0].serviceInfo),
        vehicleId: journey[0].vehicleId,
        startTime: DateTime.fromISO(journey[0].startTime),
      };
    }
    return info;
  }

  private static createOtpStats(stopList: VehiclePingStop[]): OnTimePerformanceStats {
    return <OnTimePerformanceStats>{
      early: calculateOtpStat(stopList, OnTimePerformanceEnum.Early),
      late: calculateOtpStat(stopList, OnTimePerformanceEnum.Late),
      onTime: calculateOtpStat(stopList, OnTimePerformanceEnum.OnTime),
      noData: calculateOtpStat(stopList, OnTimePerformanceEnum.NoData),
    };
  }

  private static createGpsPingList(journey: ApolloGpsFeedType[]): VehiclePing[] {
    return journey
      .filter((ping) => ping.lon && ping.lat)
      .map((ping: ApolloGpsFeedType) => VehiclePing.createVehiclePing(ping));
  }
}
