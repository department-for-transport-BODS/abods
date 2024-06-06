import { Pipe, PipeTransform } from '@angular/core';
import { Duration } from 'luxon';

const isNegativeDuration = (value: Duration): boolean => value.valueOf() < 0;
const isPositiveDuration = (value: Duration): boolean => value.valueOf() > 0;

@Pipe({
  name: 'formatDuration',
})
export class FormatDurationPipe implements PipeTransform {
  /**
   * Formats a duration with negative sign preceeding the desired format if negative duration, and no sign if positive.
   * Use instead of luxon `durationToFormat` pipe that has open issue https://github.com/moment/luxon/issues/415
   * @param value
   * @param format
   * @returns
   */
  transform<T extends Duration | null | undefined>(
    value: T,
    format: string,
    positivePrefix = '',
    negativePrefix = '-'
  ) {
    return (value == null || value == undefined
      ? null
      : this.format(value, format, positivePrefix, negativePrefix)) as T extends Duration ? string : null;
  }

  private format<T extends Duration>(value: T, format: string, positivePrefix: string, negativePrefix: string): string {
    if (isNegativeDuration(value)) {
      return `${negativePrefix}${value.negate().toFormat(format)}`;
    } else if (isPositiveDuration(value)) {
      return `${positivePrefix}${value.toFormat(format)}`;
    } else {
      return `${value.toFormat(format)}`;
    }
  }
}
