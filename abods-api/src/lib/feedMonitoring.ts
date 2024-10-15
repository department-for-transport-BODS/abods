import { SiriVMPositions } from "@prisma/client";
import {
  ExpectedJourneyType,
  getAvlPerMinute,
  getExpectedJourneysCount,
} from "./otp.js";
import { VehicleStatsType } from "../types";
import { getDate, getFormattedDate } from "./dayjs.js";

export const getVehicleStats = async (
  avl: SiriVMPositions[],
  expected: ExpectedJourneyType[]
): Promise<VehicleStatsType[]> => {
  const avlPromise: Map<string, Set<string>> = await getAvlPerMinute(avl ?? []);
  const expectedJourneys: ExpectedJourneyType[] = expected ?? [];
  const promises: Promise<void>[] = [];

  const result: VehicleStatsType[] = [];
  avlPromise.forEach((avlJourneys, timestamp) => {
    promises.push(
      getExpectedJourneysCount(expectedJourneys, getDate(timestamp)).then(
        (expected) => {
          result.push({
            timestamp: getFormattedDate(getDate(timestamp).toDate()),
            expected,
            actual: avlJourneys.size,
          });
        }
      )
    );
  });

  await Promise.all(promises);
  return result;
};
