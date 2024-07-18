import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('en');

export const getDate = (
  date?: string | Date | null,
  format?: string,
): Dayjs => {
  if (format) {
    return dayjs(date, format);
  }
  if (date) {
    return dayjs(date);
  } else {
    return dayjs(new Date());
  }
};

export const getUTCDate = (date?: string | Date): Dayjs => {
  return dayjs.utc(date);
};

export const parseTimetz = (timetz: Dayjs): Dayjs => {
  return dayjs()
    .set('hour', timetz.hour())
    .set('minute', timetz.minute())
    .set('second', timetz.second());
};

export const getDateLocale = (utcString: string): Dayjs => {
  return dayjs.tz(utcString, 'Europe/London');
};

export const getBSTDate = (date: Date, format: string): string => {
  return dayjs(date).tz('Europe/London').format(format);
};

export const getDateUTC = (
  journeyDate: Dayjs,
  hour: Dayjs | undefined,
): Dayjs => {
  const utcString = `${journeyDate.format('YYYY-MM-DD')}T${getStrUTCHour(hour)}Z`
  return dayjs.utc(utcString);
};

export const dbGmtToUtc = (
  journeyDate: Dayjs,
  hour: Dayjs | undefined,
): Dayjs => {
  const utcString = `${journeyDate.format('YYYY-MM-DD')}T${getStrUTCHour(hour)}`
  return getDateLocale(utcString);
};

export const getStrUTCHour = (hour: Dayjs | undefined): string => {
    return hour ? dayjs.utc(hour).format('HH:mm:ss') : "00:00:00"
}