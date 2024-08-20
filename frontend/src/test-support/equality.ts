import { DateTime } from 'luxon';

export function dateTimeCloseEnoughToEqualityMatcher(first: any, second: any) {
  if (first?.isLuxonDateTime && second?.isLuxonDateTime) {
    const dateFirst = first as DateTime;
    const dateSecond = second as DateTime;
    return dateFirst.diff(dateSecond).milliseconds < 100;
  }
}

export function dateTimeEqualityMatcher(first: any, second: any) {
  if (first?.isLuxonDateTime && second?.isLuxonDateTime) {
    const dateFirst = first as DateTime;
    const dateSecond = second as DateTime;
    return dateFirst.equals(dateSecond);
  }
}
