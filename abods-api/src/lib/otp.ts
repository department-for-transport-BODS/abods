import { Prisma, PrismaClient } from "@prisma/client";
import {
  FrequentServiceInfoInputType,
  PerformanceInputType,
  PunctualityTotalsType,
} from "../types/generated.js";
import {
  getPrismaFiltersForOTPQuery,
  timeDiffFilters,
} from "../resolvers/otpFunctions.js";

const getThresholds = async (
  db: PrismaClient,
  where: Prisma.timetable_threshold_summaryWhereInput,
) => {
  return db.timetable_threshold_summary.aggregate({
    _sum: { otp_count: true },
    where: { ...where },
  });
};

export const compareThresholds = async (
  inputs: PerformanceInputType,
  userOperatorIds: string[],
  db: PrismaClient,
): Promise<PunctualityTotalsType | null> => {
  if (!inputs.filters.onTimeMinMinutes || !inputs.filters.onTimeMaxMinutes) {
    return null;
  }
  const where = timeDiffFilters(inputs, userOperatorIds);

  const [early, late, onTime] = await Promise.all([
    getThresholds(db, {
      ...where,
      time_diff_minutes: {
        ...where.time_diff_minutes,
        lt: inputs.filters.onTimeMinMinutes,
      },
    }),
    getThresholds(db, {
      ...where,
      time_diff_minutes: {
        ...where.time_diff_minutes,
        gte: inputs.filters.onTimeMaxMinutes,
      },
    }),
    getThresholds(db, {
      ...where,
      time_diff_minutes: {
        ...where.time_diff_minutes,
        gte: inputs.filters.onTimeMinMinutes,
        lt: inputs.filters.onTimeMaxMinutes,
      },
    }),
  ]);

  return {
    early: early._sum.otp_count ?? 0,
    late: late._sum.otp_count ?? 0,
    onTime: onTime._sum.otp_count ?? 0,
    scheduled: 0,
    completed: 0,
    averageDeviation: 0,
    incomplete: "{}",
  };
};

export const getSummaryStopsTotalHours = async (
  db: PrismaClient,
  inputs: FrequentServiceInfoInputType,
  userOperatorIds: string[],
) => {
  const results = await db.timetable_summary_stops_tz.findMany({
    distinct: ["departure_hour"],
    where: {
      ...getPrismaFiltersForOTPQuery(inputs, userOperatorIds),
      scheduled: { gt: 0 },
    },
    select: { departure_hour: true },
  });
  return results.length;
};

export const getFrequentServiceActualHours = async (
  db: PrismaClient,
  inputs: FrequentServiceInfoInputType,
  userOperatorIds: string[],
) => {
  const results = await db.timetable_frequent_summary_services.findMany({
    distinct: ["departure_hour"],
    where: {
      ...getPrismaFiltersForOTPQuery(inputs, userOperatorIds),
      actual_headway: { not: null },
    },
    select: { departure_hour: true },
  });
  return results.length;
};
