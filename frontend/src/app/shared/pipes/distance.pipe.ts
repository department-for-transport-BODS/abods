import { formatNumber } from '@angular/common';
import { Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

export type DistanceUnit = 'm' | 'km' | 'yd' | 'mi';
export type UnitFormat = 'none' | 'short' | 'long';

// All factors are to transform from meters.
export const M_FACTOR = 1;
export const KM_FACTOR = 1000;
export const YD_FACTOR = 0.9144;
export const MI_FACTOR = 1609.344;

/**
 * Helper function to convert distance.
 * @param value The value to convert.
 * @param fromUnit The unit to convert from.
 * @param toUnit The unit to convert to.
 */
export const convertDistance = (value: number, fromUnit: DistanceUnit, toUnit: DistanceUnit): number =>
  CONVERT_DISTANCE_MAP[fromUnit](value, toUnit);

/**
 * Wrapper for `formatNumber` that always increments the smallest digit if the value if greater than 0.
 * @param value Number to format.
 * @param locale Specifies what locale format rules to use. See https://angular.io/api/common/DecimalPipe#locale.
 * @param digitsInfo Sets digit and decimal representation. Uses Angular number pipe format. See https://angular.io/api/common/DecimalPipe#digitsinfo.
 */
export const formatDistance = (value: number, locale: string, digitsInfo?: string): string => {
  let str: string = formatNumber(value, locale, digitsInfo);
  // If value is a positive distance we increment the smallest decimal
  if (value > 0 && parseFloat(str) === 0) {
    const lastIndex = str.lastIndexOf('0');
    const replacement = '1';
    str = str.substring(0, lastIndex) + replacement;
  }
  return str;
};

/**
 * Format a distance with a unit
 * @param value The value to be formatted.
 * @param unit The unit to format the value to.
 * @param unitFormat Short or long form e.g. `100 mi` or `100 miles`.
 */
export const formatDistanceUnit = (value: string | number, unit: DistanceUnit, unitFormat: UnitFormat) =>
  value + UNIT_FORMATTER_MAP[unit](value, unitFormat);

// Conversion map from meters.
const METER_CONVERSION_MAP: Record<DistanceUnit, ConvertFromMeters> = {
  m: (meters: number) => meters / M_FACTOR,
  km: (meters: number) => meters / KM_FACTOR,
  yd: (meters: number) => meters / YD_FACTOR,
  mi: (meters: number) => meters / MI_FACTOR,
};
// Conversion map from a unit to another unit.
const CONVERT_DISTANCE_MAP: Record<DistanceUnit, ConvertDistance> = {
  m: (distance: number, toUnit: DistanceUnit) => METER_CONVERSION_MAP[toUnit](distance),
  km: (distance: number, toUnit: DistanceUnit) => METER_CONVERSION_MAP[toUnit](distance * KM_FACTOR),
  yd: (distance: number, toUnit: DistanceUnit) => METER_CONVERSION_MAP[toUnit](distance * YD_FACTOR),
  mi: (distance: number, toUnit: DistanceUnit) => METER_CONVERSION_MAP[toUnit](distance * MI_FACTOR),
};
// Handle the formatting of units consistently.
const UNIT_FORMATTER_MAP: Record<DistanceUnit, UnitFormatter> = {
  m: (value: string | number, unitFormat: UnitFormat) =>
    unitFormat == 'short' ? 'm' : value == 1 ? ' meter' : ' meters',
  km: (value: string | number, unitFormat: UnitFormat) =>
    unitFormat == 'short' ? 'km' : value == 1 ? ' kilometer' : ' kilometers',
  yd: (value: string | number, unitFormat: UnitFormat) =>
    unitFormat == 'short' ? 'yd' : value == 1 ? ' yard' : ' yards',
  mi: (value: string | number, unitFormat: UnitFormat) =>
    unitFormat == 'short' ? 'mi' : value == 1 ? ' mile' : ' miles',
};

export const isValue = (value: number | string | null | undefined): value is number | string => {
  return !(value == null || value === '' || value !== value);
};

export const strToNumber = (value: number | string): number => {
  // Convert strings to numbers
  if (typeof value === 'string' && !isNaN(Number(value) - parseFloat(value))) {
    return Number(value);
  }
  if (typeof value !== 'number') {
    throw new Error(`${value} is not a number`);
  }
  return value;
};

type ConvertDistance = (distance: number, toUnit: DistanceUnit) => number;
type ConvertFromMeters = (meters: number) => number;
type UnitFormatter = (value: string | number, unitFormat: UnitFormat) => string;

@Pipe({
  name: 'distance',
})
export class DistancePipe implements PipeTransform {
  constructor(@Inject(LOCALE_ID) private _locale: string) {}

  /**
   * @param value The value to be formatted.
   * @param fromUnit The unit the value is in.
   * @param toUnit The unit to format the value to.
   * @param digitsInfo Sets digit and decimal representation. Uses Angular number pipe format. See https://angular.io/api/common/DecimalPipe#digitsinfo.
   * @param unitFormat Add unit to the distance in short or long form e.g. `100 mi` or `100 miles`.
   * @param locale Specifies what locale format rules to use. See https://angular.io/api/common/DecimalPipe#locale.
   */
  transform(
    value: number | string | null | undefined,
    fromUnit: DistanceUnit,
    toUnit: DistanceUnit,
    digitsInfo?: string,
    unitFormat?: UnitFormat,
    locale?: string
  ): string | null {
    if (!isValue(value)) {
      return null;
    }

    locale = locale || this._locale;

    try {
      const dist = convertDistance(strToNumber(value), fromUnit, toUnit);

      if (unitFormat !== undefined && unitFormat !== 'none') {
        return formatDistanceUnit(formatDistance(dist, locale, digitsInfo), toUnit, unitFormat);
      } else {
        return formatDistance(dist, locale, digitsInfo);
      }
    } catch (error) {
      throw `InvalidPipeArgument ${error} for pipe 'DistancePipe'`;
    }
  }
}
