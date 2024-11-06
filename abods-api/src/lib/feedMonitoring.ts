import {
  ExpectedJourneyType,
  getAvlPerMinute,
  getAvlPoints,
  getExpectedJourneysCount,
} from "./otp.js";
import { FeedMonitoringType, LiveStatsType, VehicleStatsType } from "../types/generated.js";
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
  avl: Awaited<ReturnType<typeof getAvlPoints>>,
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