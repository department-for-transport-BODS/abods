import {
  FrequentServiceInfoInputType,
  InputMaybe,
  OtpEnum,
  PerformanceInputType,
  PunctualityTotalsType,
} from "../types/generated.js";
import {
  getKyselyFiltersForOTPQuery,
  kyselyFilterForAdminIds,
} from "../resolvers/otpFunctions.js";
import { Kysely } from "kysely";
import { DB } from "../kysely.js";
import { executeQuery, executeQueryTakeFirst } from "./kysely.js";
import { Prisma, PrismaClient } from "@prisma/client";

const getThresholds = async (
  db: Kysely<DB>,
  inputs: PerformanceInputType,
  userOperatorIds: string[],
  otpType: OtpEnum,
) => {
  const { filters } = inputs;
  const {
    startTime,
    endTime,
    adminAreaIds,
    onTimeMinMinutes,
    onTimeMaxMinutes,
  } = filters || {};

  let summarySubQuery = getKyselyFiltersForOTPQuery(
    db,
    "timetable_threshold_summary",
    inputs,
    userOperatorIds,
  );

  if (otpType === OtpEnum.Early && onTimeMinMinutes) {
    summarySubQuery = summarySubQuery.where(
      "time_diff_minutes",
      "<",
      onTimeMinMinutes,
    );
  }

  if (otpType === OtpEnum.OnTime && onTimeMinMinutes && onTimeMaxMinutes) {
    summarySubQuery = summarySubQuery
      .where("time_diff_minutes", "<", onTimeMaxMinutes)
      .where("time_diff_minutes", ">=", onTimeMinMinutes);
  }

  if (otpType === OtpEnum.Late && onTimeMaxMinutes) {
    summarySubQuery = summarySubQuery.where(
      "time_diff_minutes",
      ">=",
      onTimeMaxMinutes,
    );
  }

  summarySubQuery = kyselyFilterForAdminIds(
    summarySubQuery,
    adminAreaIds ?? [],
  );

  const aliasedSubQuery = summarySubQuery.as("summary");

  let mainQuery = db
    .selectFrom(aliasedSubQuery)
    .select(db.fn.sum("otp_count").as("otp_count"));

  if (startTime || endTime) {
    const start = Number((startTime ?? "00:00").split(":")[0]);
    const end = Number((endTime ?? "23:59").split(":")[0]);
    mainQuery = mainQuery.where("hour", ">=", start).where("hour", "<=", end);
  }

  return executeQueryTakeFirst(mainQuery);
};

export const compareThresholds = async (
  inputs: PerformanceInputType,
  userOperatorIds: string[],
  db: Kysely<DB>,
): Promise<PunctualityTotalsType | null> => {
  if (!inputs.filters.onTimeMinMinutes || !inputs.filters.onTimeMaxMinutes) {
    return null;
  }

  const [early, late, onTime] = await Promise.all([
    getThresholds(db, inputs, userOperatorIds, OtpEnum.Early),
    getThresholds(db, inputs, userOperatorIds, OtpEnum.Late),
    getThresholds(db, inputs, userOperatorIds, OtpEnum.OnTime),
  ]);

  return {
    early: Number(early?.otp_count ?? 0),
    late: Number(late?.otp_count ?? 0),
    onTime: Number(onTime?.otp_count ?? 0),
    scheduled: 0,
    completed: 0,
    averageDeviation: 0,
    incomplete: "{}",
  };
};

export const getSummaryStopsTotalHours = async (
  db: Kysely<DB>,
  inputs: FrequentServiceInfoInputType,
  userOperatorIds: string[],
) => {
  const { filters } = inputs;
  const { startTime, endTime } = filters || {};

  const summarySubQuery = getKyselyFiltersForOTPQuery(
    db,
    "timetable_summary_stops_tz",
    inputs,
    userOperatorIds,
  );

  const aliasedSubQuery = summarySubQuery
    .where("scheduled", ">", 0)
    .as("summary");

  let mainQuery = db
    .selectFrom(aliasedSubQuery)
    .select(["departure_hour"])
    .distinct();

  if (startTime || endTime) {
    const start = Number((startTime ?? "00:00").split(":")[0]);
    const end = Number((endTime ?? "23:59").split(":")[0]);
    mainQuery = mainQuery.where("hour", ">=", start).where("hour", "<=", end);
  }

  const results = await executeQuery(mainQuery);

  return results.length;
};

export const getFrequentServiceActualHours = async (
  db: Kysely<DB>,
  inputs: FrequentServiceInfoInputType,
  userOperatorIds: string[],
) => {
  const { filters } = inputs;
  const { startTime, endTime } = filters || {};

  const summarySubQuery = getKyselyFiltersForOTPQuery(
    db,
    "timetable_frequent_summary_services",
    inputs,
    userOperatorIds,
  );

  const aliasedSubQuery = summarySubQuery
    .where("actual_headway", "is not", null)
    .as("summary");

  let mainQuery = db
    .selectFrom(aliasedSubQuery)
    .select(["departure_hour"])
    .distinct();

  if (startTime || endTime) {
    const start = Number((startTime ?? "00:00").split(":")[0]);
    const end = Number((endTime ?? "23:59").split(":")[0]);
    mainQuery = mainQuery.where("hour", ">=", start).where("hour", "<=", end);
  }

  const results = await executeQuery(mainQuery);

  return results.length;
};

export const getOperatorsForUser = async (
  db: PrismaClient,
  user: { orgs: { id: number }[] },
  adminAreaIds?: InputMaybe<string[]>,
) => {
  return db.all_operators.findMany({
    where: {
      noc_adminarea:
        adminAreaIds && adminAreaIds.length > 0
          ? { some: { adminarea_id: { in: adminAreaIds.map(Number) } } }
          : Prisma.skip,
      operatorOrganisations: {
        some: { organisation_id: { in: user.orgs.map((org) => org.id) } },
      },
    },
    select: {
      operatorref: true,
      name: true,
    },
  });
};
