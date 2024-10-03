import { DateTime } from 'luxon';

export const toUrlDateFormat = (date: string): string => {
  const urlDateFormat = "yyyy-LL-dd'T'HHmm";
  return DateTime.fromISO(date).toFormat(urlDateFormat);
};
