import { DateTime } from 'luxon';

const fromTimestamp = DateTime.fromISO('2021-01-01T00:00:00+00:00');
const toTimestamp = DateTime.fromISO('2021-01-31T23:59:59.999+00:00');
const fromTimestampAlt = DateTime.fromISO('2021-01-01T00:00:00+00:00');
const toTimestampAlt = DateTime.fromISO('2021-02-01T00:00:00+00:00');
const noc007 = 'OP007';
const noc008 = 'OP008';

export const onTimeInputParams = {
  fromTimestamp,
  toTimestamp,
  filters: {
    nocCodes: [noc007],
  },
};

export const onTimeInputParamsAltTs = {
  fromTimestamp: fromTimestampAlt,
  toTimestamp: toTimestampAlt,
  filters: {
    nocCodes: [noc007],
  },
};

export const onTimeInputParamsAlt = {
  fromTimestamp,
  toTimestamp,
  filters: {
    nocCodes: [noc008],
  },
};

export const onTimeInputParamsTimingPointFalse = {
  fromTimestamp,
  toTimestamp,
  filters: {
    nocCodes: [noc008],
    timingPointsOnly: false,
  },
};

export const onTimeInputParamsTimingPointTrue = {
  fromTimestamp,
  toTimestamp,
  filters: {
    nocCodes: [noc008],
    timingPointsOnly: true,
  },
};
