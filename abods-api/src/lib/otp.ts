import {
  FrequentServiceInfoInputType,
  PerformanceInputType,
  PunctualityTotalsType,
} from "../types/generated.js";
import { otpFilters, timeDiffFilters } from "../resolvers/otpFunctions.js";
import { Kysely } from "kysely";
import { DB } from "../kysely";
import { getUserOperatorIdsQuery } from "./operators";
import { SessionUser } from "../types/extra";

export const compareThresholds = async (
  inputs: PerformanceInputType,
  db: Kysely<DB>,
  user: SessionUser,
): Promise<PunctualityTotalsType | null> => {
  if (!inputs.filters.onTimeMinMinutes || !inputs.filters.onTimeMaxMinutes) {
    return null;
  }
  const query = timeDiffFilters(
    db
      .selectFrom("timetable_threshold_summary")
      .where("operator_noc", "in", getUserOperatorIdsQuery(db, user)),
    inputs,
  ).select((eb) => eb.fn.sum<number>("otp_count").as("otp_count"));

  const [early, late, onTime] = await Promise.all([
    query
      .where("time_diff_minutes", "<", inputs.filters.onTimeMinMinutes)
      .executeTakeFirst(),
    query
      .where("time_diff_minutes", ">=", inputs.filters.onTimeMaxMinutes)
      .executeTakeFirst(),
    query
      .where("time_diff_minutes", ">=", inputs.filters.onTimeMaxMinutes)
      .where("time_diff_minutes", "<", inputs.filters.onTimeMinMinutes)
      .executeTakeFirst(),
  ]);

  return {
    early: early?.otp_count ?? 0,
    late: late?.otp_count ?? 0,
    onTime: onTime?.otp_count ?? 0,
    scheduled: 0,
    completed: 0,
    averageDeviation: 0,
    incomplete: "{}",
  };
};

export const getSummaryStopsTotalHours = async (
  db: Kysely<DB>,
  inputs: FrequentServiceInfoInputType,
  user: SessionUser,
) => {
  const results = await otpFilters(
    db
      .selectFrom("timetable_summary_stops_tz")
      .where("operator_noc", "in", getUserOperatorIdsQuery(db, user)),
    inputs,
  )
    .where("scheduled", ">", 0)
    .select("departure_hour")
    .distinct()
    .execute();
  return results.length;
};

export const getFrequentServiceActualHours = async (
  db: Kysely<DB>,
  inputs: FrequentServiceInfoInputType,
  user: SessionUser,
) => {
  const results = await otpFilters(
    db
      .selectFrom("timetable_frequent_summary_services")
      .where("operator_noc", "in", getUserOperatorIdsQuery(db, user)),
    inputs,
  )
    .where("actual_headway", ">", "0")
    .select("departure_hour")
    .distinct()
    .execute();
  return results.length;
};
