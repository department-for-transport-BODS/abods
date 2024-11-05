import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { GraphQLScalarType, Kind } from 'graphql';

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

export const getStrHour = (hour: Dayjs | undefined): string => {
  return hour ? dayjs(hour).format('HH:mm:ss') : '00:00:00';
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
  inputDate: Date | null | undefined,
  format?: string
): string => {
  return format
    ? getDate(inputDate).tz('Europe/London').format(format)
    : getDate(inputDate).tz('Europe/London').format('YYYY-MM-DDTHH:mm:ssZ');
};

export const getDateWithTimestamp = (date: Date, time: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const milliseconds = time.getMilliseconds();

  const combinedDate = dayjs(
    new Date(year, month, day, hours, minutes, seconds, milliseconds),
  );

  return combinedDate.tz('Europe/London').format('YYYY-MM-DDTHH:mm:ssZ');
};

export const getHourFormattedDate = (
  inputDate: Date | null | undefined,
  format?: string,
): string => {
  return format
    ? getDate(inputDate).tz('Europe/London').startOf('hour').format(format)
    : getDate(inputDate)
        .tz('Europe/London')
        .startOf('hour')
        .format('YYYY-MM-DDTHH:mm:ssZ');
};

export const getDayFormattedDate = (
  inputDate: Date | null | undefined,
  format?: string,
): string => {
  return format
    ? getDate(inputDate).tz('Europe/London').startOf('day').format(format)
    : getDate(inputDate)
        .tz('Europe/London')
        .startOf('hour')
        .format('YYYY-MM-DDTHH:mm:ssZ');
};

export const dbUtcToBstHour = (inputDate: Date): string => {
  return getUTCDate(inputDate).tz('Europe/London').format('HH:mm:ss');
};

export const dbUtcToBstDate = (inputDate: Date | string): string => {
  return getUTCDate(inputDate).tz('Europe/London').format('YYYY-MM-DD');
};

export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'A custom scalar to handle ISO 8601 date-time format with timezone offset',

  // Parses the client input to dayjs format
  parseValue(value: string) {
    return dayjs(value).toDate(); // Converts incoming ISO string to JavaScript Date object
  },

  // Serializes the Date object to a specific format
  serialize(value: Date) {
    // Convert JavaScript Date to ISO format with timezone offset
    return dayjs(value).tz('Europe/London').format('YYYY-MM-DDTHH:mm:ssZ'); // Default ISO 8601 with timezone
  },

  // Parses literal values in the AST
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return dayjs(ast.value).toDate(); // Converts incoming ISO string to Date
    }
    return null; // Invalid format returns null
  },
});