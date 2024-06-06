import { Pattern, Color } from '@amcharts/amcharts4/core';
import { DateTime } from 'luxon';

export interface VehicleStatsViewModel {
  dateTime: DateTime;
  timestamp?: Date;
  expected?: number | null;
  actual?: number | null;
  expectedFill?: Pattern | Color | null;
}
