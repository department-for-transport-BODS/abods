import { isNotNullOrUndefined } from '../../shared/rxjs-operators';

const LATE_THRESHOLD = 360;
const EARLY_THRESHOLD = -60;

export enum OnTimePerformanceEnum {
  Early = 'Early',
  Late = 'Late',
  OnTime = 'OnTime',
  NoData = 'NoData',
}

export const getOtpEnum = (delay: number | undefined | null): OnTimePerformanceEnum => {
  if (isNotNullOrUndefined(delay)) {
    if (delay >= LATE_THRESHOLD) {
      return OnTimePerformanceEnum.Late;
    } else if (delay < EARLY_THRESHOLD) {
      return OnTimePerformanceEnum.Early;
    } else {
      return OnTimePerformanceEnum.OnTime;
    }
  } else {
    return OnTimePerformanceEnum.NoData;
  }
};
