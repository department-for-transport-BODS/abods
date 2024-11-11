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

  return Object.entries(avlPerMinute).map(([timestamp, avlJourneys]) => {
    const minute = getDate(timestamp);
    const expected = expectedJourneys
      .filter((j) => minute.isSameOrAfter(j.expected_journey_start))
      .filter((j) => minute.isBefore(j.expected_journey_end));

    return {
      timestamp: getFormattedDate(getDate(timestamp).toDate()),
      expected: expected.length,
      actual: expected.filter((j) => avlJourneys.has(j.group_id)).length,
    };
  });
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
  duration?: number,
  groupIds?: string[],
) => {
  const where: Prisma.SiriVMPositionsWhereInput = {
    date_of_journey: inputDate.toDate(),
    operator_ref: operatorId,
  };

  if (duration) {
    where.recorded_at_time = {
      gte: inputDate.subtract(duration, "minute").startOf("minute").toDate(),
      lt: inputDate.startOf("minute").toDate(),
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
