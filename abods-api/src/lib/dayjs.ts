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

export const parseTimetz = (timetzString: string): Dayjs => {
  const [timePart] = timetzString.split('+');
  const [time, timezone] = timePart.split(' ');
  const [hours, minutes, seconds] = time.split(':').map(Number);

  return dayjs()
    .set('hour', hours)
    .set('minute', minutes)
    .set('second', seconds);
};

export const getDateLocale = (utcString: string): Dayjs => {
  return dayjs.tz(utcString, 'Europe/London');
};

export const getDateUTC = (
  journeyDate: Dayjs,
  hour: Dayjs | undefined,
): Dayjs => {
  const utcString = `${journeyDate.format('YYYY-MM-DD')}T${getStrUTCHour(
    hour,
  )}Z`;
  return dayjs.utc(utcString);
};

export const dbGmtToUtc = (
  journeyDate: Dayjs,
  hour: Dayjs | undefined,
): Dayjs => {
  const utcString = `${journeyDate.format('YYYY-MM-DD')}T${getStrUTCHour(
    hour,
  )}`;
  return getDateLocale(utcString);
};

export const getStrUTCHour = (hour: Dayjs | undefined): string => {
  return hour ? dayjs.utc(hour).format('HH:mm:ss') : '00:00:00';
};

export const getBSTDate = (date: Date | Dayjs, format: string): string => {
  return dayjs(date).tz('Europe/London').format(format);
};

export const getStrDateRange = (startDate: Date, endDate: Date): string[] => {
  const strDates: string[] = [];

  let fromDate = getDate(startDate);
  const toDate = getDate(endDate);

  while (fromDate.isBefore(toDate)) {
    strDates.push(getBSTDate(fromDate, 'YYYY-MM-DD'));
    fromDate = fromDate.add(1, 'day');
  }
  return strDates;
};

export const overwriteDate = (
  inputDate: Dayjs,
  overwriteDate: Dayjs,
): Dayjs => {
  return inputDate
    .set('year', overwriteDate.year())
    .set('month', overwriteDate.month())
    .set('day', overwriteDate.date());
};

export const getFormattedDate = (
  inputDate: Date | null | undefined
): string => {
  return getDate(inputDate)
    .tz('Europe/London')
    .format('YYYY-MM-DDTHH:mm:ssZ');
};
