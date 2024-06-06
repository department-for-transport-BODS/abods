import { DateTime } from 'luxon';

export enum Period {
  Last28 = 'last28',
  Last7 = 'last7',
  LastMonth = 'lastMonth',
  MonthToDate = 'monthToDate',
}

export enum Custom {
  Custom = 'custom',
}

export type Preset = Period | Custom;
export const Preset = { ...Period, ...Custom };

export interface FromTo {
  from: DateTime;
  to: DateTime;
}

export interface FromToPreset extends FromTo {
  preset: Preset;
}
export interface Day {
  date: DateTime;
  isToday: boolean;
  isSelected: boolean;
  isSelectable: boolean;
  isVisible: boolean;
  isSaturday: boolean;
}

export class NullDay implements Day {
  date = DateTime.invalid('NullDay');
  isToday = false;
  isSelected = false;
  isSelectable = false;
  isVisible = false;
  isSaturday = false;
}
