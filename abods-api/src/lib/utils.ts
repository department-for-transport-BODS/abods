import { DayOfWeekFlagsInputType } from "../types/generated.js";
import logger from "../logger.js";
import { throwUnauthenticatedError } from "../resolvers/helpers.js";

export const getDayOfWeekNumbers = (
  dayOfWeekFlags: DayOfWeekFlagsInputType,
): number[] => {
  const dayOfWeekNumbers: number[] = [];
  if (dayOfWeekFlags.monday == true) dayOfWeekNumbers.push(1);
  if (dayOfWeekFlags.tuesday == true) dayOfWeekNumbers.push(2);
  if (dayOfWeekFlags.wednesday == true) dayOfWeekNumbers.push(3);
  if (dayOfWeekFlags.thursday == true) dayOfWeekNumbers.push(4);
  if (dayOfWeekFlags.friday == true) dayOfWeekNumbers.push(5);
  if (dayOfWeekFlags.saturday == true) dayOfWeekNumbers.push(6);
  if (dayOfWeekFlags.sunday == true) dayOfWeekNumbers.push(0);
  return dayOfWeekNumbers;
};

export const getPercentile = (percentile: number, sortedArray: number[]) => {
  if (sortedArray.length === 0) {
    return null; // Return null or handle empty array case
  }

  if (percentile < 0 || percentile > 100) {
    throw new Error("Percentile must be between 0 and 100");
  }

  const index = (percentile / 100) * (sortedArray.length - 1); // Calculate the index for the 25th percentile
  const lower = Math.floor(index); // The floor of the index
  const upper = lower + 1; // The next index
  const weight = index - lower; // The fractional part of the index

  if (upper >= sortedArray.length) {
    // If upper is out of bounds, return the last element
    return sortedArray[lower];
  }

  // Perform linear interpolation between the two closest values
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
};

export const getUserOrgIds = (user: {
  id: number | null;
  orgIds: number[];
}) => {
  if (user.orgIds.length < 1) {
    logger.error({ userId: user.id }, "User not mapped to an organisation");
    throwUnauthenticatedError("User not mapped to any organisation");
  }
  // Make sure to sort org ids so that in the few places where we pick the first, at least it's consistent
  return user.orgIds.sort();
};
