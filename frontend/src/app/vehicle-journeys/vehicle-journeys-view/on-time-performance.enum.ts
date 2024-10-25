const LATE_THRESHOLD = 360;
const EARLY_THRESHOLD = -60;

export enum OnTimePerformanceEnum {
  Early = 'Early',
  Late = 'Late',
  OnTime = 'OnTime',
  NoData = 'NoData',
}

export const getOtpEnum = (delayInSeconds: number): OnTimePerformanceEnum => {
  if (delayInSeconds >= LATE_THRESHOLD) {
    return OnTimePerformanceEnum.Late;
  } else if (delayInSeconds < EARLY_THRESHOLD) {
    return OnTimePerformanceEnum.Early;
  } else {
    return OnTimePerformanceEnum.OnTime;
  }
};
