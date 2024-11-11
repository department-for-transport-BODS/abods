import { VehicleStatsType } from "../types/generated.js";
import { getDate, getFormattedDate } from "./dayjs.js";
import { Prisma, PrismaClient } from "@prisma/client";
import { Dayjs } from "dayjs";

export type ExpectedJourneyType = {
  group_id: string;
  expected_journey_start: Date;
  expected_journey_end: Date | null;
};

export const getVehicleStats = async (
  avl: Awaited<ReturnType<typeof getAvlPoints>>,
  expected: ExpectedJourneyType[],
): Promise<VehicleStatsType[]> => {
  const avlPerMinute: Record<string, Set<string>> = await getAvlPerMinute(
    avl ?? [],
  );
  const expectedJourneys: ExpectedJourneyType[] = expected ?? [];

  const result: VehicleStatsType[] = [];
  Object.entries(avlPerMinute).forEach(([timestamp, avlJourneys]) => {
    const eachMinuteTimestamp = getDate(timestamp)
    const expected = getExpectedJourneysCount(
      expectedJourneys,
      eachMinuteTimestamp,
    );
    const actual = expected.filter(
      (journey) =>
        avlJourneys.has(journey.group_id) &&
        !eachMinuteTimestamp.isBefore(getDate(journey.expected_journey_start)) &&
        eachMinuteTimestamp.isBefore(journey.expected_journey_end)
    ).length;

    result.push({
      timestamp: getFormattedDate(getDate(timestamp).toDate()),
      expected: expected.length,
      actual,
    });
  });

  return result;
};

export enum VehicleCountType {
  Actual = "actual",
  Expected = "expected",
}

export const getOperatorWithFeed = (db: PrismaClient, operatorRefs: string) => {
  return db.feed_monitor_summary.findUnique({
    where: {
      operator_noc: operatorRefs,
    },
  });
};

export const getExpectedJourneys = async (
  db: PrismaClient,
  operatorId: string,
  inputDate: Dayjs,
  duration?: number,
) => {
  const where: Prisma.expected_journeysWhereInput = {
    operator_noc: operatorId,
    date_of_journey: inputDate.toDate(),
  };

  if (duration) {
    where.expected_journey_start = {
      lt: inputDate.toDate(),
    };

    where.expected_journey_end = {
      gte: inputDate.subtract(duration, "minute").toDate(),
    };
  }

  return db.expected_journeys.findMany({
    where: where,
    select: {
      group_id: true,
      expected_journey_start: true,
      expected_journey_end: true,
    },
    distinct: ["group_id"],
  });
};

export const getAvlPoints = async (
  db: PrismaClient,
  operatorId: string,
  inputDate: Dayjs,
  last20Mins?: boolean,
  groupIds?: string[],
) => {
  const currentDate = new Date();
  const where: Prisma.SiriVMPositionsWhereInput = {
    date_of_journey: inputDate.toDate(),
    operator_ref: operatorId,
  };

  if (last20Mins) {
    where.recorded_at_time = {
      gte: inputDate.subtract(21, "minute").set("second", 0).toDate(),
      lte: inputDate.set("second", 0).toDate(),
    };
  }

  if (groupIds && groupIds.length > 0) {
    where.group_id = {
      in: groupIds,
    };
  }

  return db.siriVMPositions.findMany({
    where: where,
    select: {
      recorded_at_time: true,
      group_id: true,
      vehicle_ref: true,
    },
  });
};

export const getAvlPerMinute = async (
  avl: Awaited<ReturnType<typeof getAvlPoints>>,
) => {
  const avlSecondBuckets: Record<string, Set<string>> = {};
  for (const a of avl) {
    if (!a.group_id) continue;
    const recordedAt = getDate(a.recorded_at_time)
      .set("second", 0)
      .set("millisecond", 0)
      .toISOString();
    avlSecondBuckets[recordedAt] = avlSecondBuckets[recordedAt] ?? new Set();
    avlSecondBuckets[recordedAt].add(a.group_id);
  }
  return avlSecondBuckets;
};

export const getExpectedJourneysCount = (
  expected: ExpectedJourneyType[],
  date: Dayjs,
) => {
  return expected.filter(
    (j) =>
      getDate(j.expected_journey_end).isAfter(date) &&
      !getDate(j.expected_journey_start).isAfter(date),
  );
};
