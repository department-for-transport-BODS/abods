import { VehiclePingStop } from './vehicle-ping-stop.model';
import { OtpEnum } from '../../../generated/graphql';

const calculateOtpStat = (stopList: VehiclePingStop[], statType: OtpEnum | null) => {
  const total = stopList.length;
  const value = stopList.filter((stop) => stop.onTimePerformance === statType).length;
  return {
    percent: value / total,
    value: value,
    total: total,
  };
};

export const calculateOnTimePerformance = (stopList: VehiclePingStop[], timingPointsOnly: boolean) => {
  const filteredStopList = stopList.filter((stop) => stop.isTimingPoint || !timingPointsOnly);
  return {
    early: calculateOtpStat(filteredStopList, OtpEnum.Early),
    late: calculateOtpStat(filteredStopList, OtpEnum.Late),
    onTime: calculateOtpStat(filteredStopList, OtpEnum.OnTime),
    noData: calculateOtpStat(filteredStopList, null),
  };
};

export type OnTimePerformanceStats = ReturnType<typeof calculateOnTimePerformance>;
