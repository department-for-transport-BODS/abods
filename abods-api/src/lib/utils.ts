import { DayOfWeekFlagsInputType, Maybe } from '../types.js';

export const isDefined = <T>(value: Maybe<T>): value is T => {
  return value !== null && value !== undefined;
}

export const getDayOfWeekNumbers = (dayOfWeekFlags: DayOfWeekFlagsInputType): number[] =>{
  let dayOfWeekNumbers: number[] = [];
  if (dayOfWeekFlags.monday == true) dayOfWeekNumbers.push(1);
  if (dayOfWeekFlags.tuesday == true) dayOfWeekNumbers.push(2);
  if (dayOfWeekFlags.wednesday == true) dayOfWeekNumbers.push(3);
  if (dayOfWeekFlags.thursday == true) dayOfWeekNumbers.push(4);
  if (dayOfWeekFlags.friday == true) dayOfWeekNumbers.push(5);
  if (dayOfWeekFlags.saturday == true) dayOfWeekNumbers.push(6);
  if (dayOfWeekFlags.sunday == true) dayOfWeekNumbers.push(0);
  return dayOfWeekNumbers;
}