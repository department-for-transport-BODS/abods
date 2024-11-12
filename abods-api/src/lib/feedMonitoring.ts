import { VehicleStatsType } from "../types/generated.js";
import { getDate, getFormattedDate } from "./dayjs.js";
import { Prisma, PrismaClient } from "@prisma/client";
import { Dayjs } from "dayjs";

export type ExpectedJourneyType = {
  group_id: string;
  expected_journey_start: Date;
  expected_journey_end: Date | null;
};

export const getPerMinuteTimestamps = (
  currentTime: Dayjs,
  duration: number,
) => {
  const avlPerMinute: Record<string, Set<string>> = {};
  let minute = currentTime.subtract(duration, "minute").startOf("minute");
  while (minute.isBefore(currentTime.startOf("minute"))) {
    const key = minute.toISOString();
    avlPerMinute[key] = new Set<string>();
    minute = minute.add(1, "minute");
  }

  return avlPerMinute;
};

export const getVehicleStats = async (
  avl: Awaited<ReturnType<typeof getAvlPoints>>,
  expected: ExpectedJourneyType[],
  currentTime: Dayjs,
  duration: number,
): Promise<VehicleStatsType[]> => {
  const avlPerMinute: Record<string, Set<string>> = await getAvlPerMinute(
    avl ?? [],
    currentTime,
    duration,
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
  } else {
    where.expected_journey_start = {
      gte: inputDate.startOf("minute").subtract(1, "minute").toDate(),
    };
    where.expected_journey_end = {
      lt: inputDate.startOf("minute").toDate(),
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
): Promise<
  | { group_id: string | null }[]
  | { recorded_at_time: Date; group_id: string; vehicle_ref: string }[]
> => {
  const where: Prisma.SiriVMPositionsWhereInput = {
    date_of_journey: inputDate.toDate(),
    operator_ref: operatorId,
  };

  where.recorded_at_time = {
    gte: inputDate
      .subtract(duration ?? 1, "minute")
      .startOf("minute")
      .toDate(),
    lt: inputDate.startOf("minute").toDate(),
  };

  if (groupIds && groupIds.length > 0) {
    where.group_id = {
      in: groupIds,
    };
  }

  return db.siriVMPositions.findMany({
    where: where,
    select: duration
      ? {
          recorded_at_time: true,
          group_id: true,
          vehicle_ref: true,
        }
      : {
          group_id: true,
        },
    distinct: duration ? Prisma.skip : ["group_id"],
  });
};

export const getAvlPerMinute = async (
  avl: Awaited<ReturnType<typeof getAvlPoints>>,
  currentTime: Dayjs,
  duration: number,
) => {
  const avlPerMinute: Record<string, Set<string>> = getPerMinuteTimestamps(
    currentTime,
    duration,
  );

  for (const a of avl as {
    recorded_at_time: Date;
    group_id: string;
    vehicle_ref: string;
  }[]) {
    if (!a.group_id) continue;
    const recordedAt = getDate(a.recorded_at_time)
      .startOf("minute")
      .toISOString();
    avlPerMinute[recordedAt] = avlPerMinute[recordedAt] ?? new Set();
    avlPerMinute[recordedAt].add(a.group_id);
  }

  return avlPerMinute;
};
