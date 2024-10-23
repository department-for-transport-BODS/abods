import { SiriVMPositions } from "@prisma/client";
import {
  ExpectedJourneyType,
  getAvlPerMinute,
  getExpectedJourneysCount,
} from "./otp.js";
import { FeedMonitoringType, LiveStatsType, VehicleStatsType } from "../types";
import { getDate, getFormattedDate } from "./dayjs.js";

export type FeedMonitoringListType = 
  Omit<FeedMonitoringType, "liveStats" | "historicalStats" | "vehicleStats"> &
    Partial<LiveStatsType>;

export enum AlertType {
  VehicleCountDisparityEvent = 'VehicleCountDisparityEvent',
  FeedUnavailableEvent = 'FeedUnavailableEvent',
  FeedAvailableEvent = 'FeedAvailableEvent',
}

export const getVehicleStats = async (
  avl: { group_id: string; recorded_at_time: Date; vehicle_ref: string;}[],
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

export enum VechileCountType {
    Actual = 'actual',
    Expected = 'expected'
}