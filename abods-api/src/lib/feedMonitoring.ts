import { getDate, getFormattedDate } from "./dayjs";
import { Prisma, PrismaClient } from "@prisma/client";
import { Dayjs } from "dayjs";

export const getPerMinuteTimestamps = (startTime: Dayjs, endTime: Dayjs) => {
  const avlPerMinute: Record<string, Set<string>> = {};
  let minute = startTime;
  while (minute.isBefore(endTime)) {
    const key = minute.toISOString();
    avlPerMinute[key] = new Set<string>();
    minute = minute.add(1, "minute");
  }
  return avlPerMinute;
};

export const getVehicleStats = (
  avl: Awaited<ReturnType<typeof getAvlDetails>>,
  expectedJourneys: Awaited<ReturnType<typeof getExpectedJourneys>>,
  startTime: Dayjs,
  endTime: Dayjs,
) => {
  const avlPerMinute = getAvlPerMinute(avl, startTime, endTime);

  return Object.entries(avlPerMinute).map(([timestamp, avlJourneys]) => {
    const minute = getDate(timestamp);
    const expected = expectedJourneys
      .filter((j) => minute.isSameOrAfter(j.expected_journey_start))
      .filter((j) => minute.isBefore(j.expected_journey_end));

    return {
      timestamp: getFormattedDate(minute.toDate()),
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

const journeyBaseQuery = (
  operatorId: string,
  startTime: Date,
  endTime: Date,
): Prisma.expected_journeysFindManyArgs => ({
  where: {
    operator_noc: operatorId,
    date_of_journey: startTime,
    expected_journey_start: { lt: startTime },
    expected_journey_end: { gte: endTime },
  },
  distinct: ["group_id"],
});

export const getExpectedGroupIds = async (
  db: PrismaClient,
  operatorId: string,
  startTime: Date,
  endTime: Date,
) =>
  db.expected_journeys.findMany({
    ...journeyBaseQuery(operatorId, startTime, endTime),
    select: { group_id: true },
  });

export const getExpectedJourneys = async (
  db: PrismaClient,
  operatorId: string,
  startTime: Date,
  endTime: Date,
) =>
  db.expected_journeys.findMany({
    ...journeyBaseQuery(operatorId, startTime, endTime),
    select: {
      group_id: true,
      expected_journey_start: true,
      expected_journey_end: true,
    },
  });

const avlBaseQuery = (
  operatorId: string,
  startTime: Date,
  endTime: Date,
): Prisma.SiriVMPositionsFindManyArgs => ({
  where: {
    date_of_journey: startTime,
    operator_ref: operatorId,
    recorded_at_time: { gte: startTime, lt: endTime },
  },
});

export const getActualGroupIds = async (
  db: PrismaClient,
  operatorId: string,
  startTime: Date,
  endTime: Date,
) =>
  db.siriVMPositions.findMany({
    ...avlBaseQuery(operatorId, startTime, endTime),
    select: { group_id: true },
    distinct: ["group_id"],
  });

export const getAvlDetails = async (
  db: PrismaClient,
  operatorId: string,
  startTime: Date,
  endTime: Date,
) =>
  db.siriVMPositions.findMany({
    ...avlBaseQuery(operatorId, startTime, endTime),
    select: {
      recorded_at_time: true,
      group_id: true,
      vehicle_ref: true,
    },
  });

export const getAvlPerMinute = async (
  avl: Awaited<ReturnType<typeof getAvlDetails>>,
  startTime: Dayjs,
  endTime: Dayjs,
) => {
  const avlPerMinute = getPerMinuteTimestamps(startTime, endTime);

  for (const a of avl) {
    if (!a.group_id) continue;
    const recordedAt = getDate(a.recorded_at_time)
      .startOf("minute")
      .toISOString();
    avlPerMinute[recordedAt] = avlPerMinute[recordedAt] ?? new Set();
    avlPerMinute[recordedAt].add(a.group_id);
  }

  return avlPerMinute;
};
