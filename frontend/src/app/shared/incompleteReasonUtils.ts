import { Journey } from "../../generated/graphql";
import { DateTime } from "luxon";

export const incompleteIdToString = (
  incompleteId: number | null | undefined,
) => {
  switch (incompleteId) {
    case 1:
      return "missing NOC from real-time data";
    case 2:
      return "missing service from real-time data";
    case 3:
      return "missing journey code from real-time data";
    case 4:
      return "missing real-time data within the zone of a stop";
    case 5:
      return "GPS location in the zone of a stop that is deemed invalid";
    default:
      return "an unspecified matching issue";
  }
};

export const incompleteTally = (
  reasons: (number | null)[],
): Record<string, number> => ({
  [incompleteIdToString(1)]: reasons.filter((n) => n == 1).length,
  [incompleteIdToString(2)]: reasons.filter((n) => n == 2).length,
  [incompleteIdToString(3)]: reasons.filter((n) => n == 3).length,
  [incompleteIdToString(4)]: reasons.filter((n) => n == 4).length,
  [incompleteIdToString(5)]: reasons.filter((n) => n == 5).length,
  [incompleteIdToString(null)]: reasons.filter((n) => n == null).length,
});

export const incompleteConversion = (
  reasons: Record<number, number>,
): Record<string, number> => ({
  [incompleteIdToString(1)]: reasons[1] ?? 0,
  [incompleteIdToString(2)]: reasons[2] ?? 0,
  [incompleteIdToString(3)]: reasons[3] ?? 0,
  [incompleteIdToString(4)]: reasons[4] ?? 0,
  [incompleteIdToString(5)]: reasons[5] ?? 0,
  [incompleteIdToString(null)]: reasons[-1] ?? 0,
});
