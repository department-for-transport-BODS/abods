import { getUserOperatorIds } from "../lib/operators.js";
import {
  MatchType,
  QueryResolvers,
  Resolvers,
  StopStatistics,
} from "../types/generated.js";
import { requireUserSession } from "./helpers.js";
import { sql } from "kysely";
import { GraphQLError } from "graphql";
import dayjs from "dayjs";
import { userSelectedDateAsUtc } from "../lib/dayjs.js";
import { getDayOfWeekNumbers } from "../lib/utils.js";

const getStopAnalysis: QueryResolvers["stopAnalysis"] = async (
  _,
  args,
  context,
): Promise<StopStatistics[]> => {
  const user = await requireUserSession(context);

  let dbQuery = context.kysely
    .selectFrom("timetable_summary_stops_tz as t")
    .innerJoin("naptan_stoppoint_latlong as n", "n.id", "t.stop_id")
    .innerJoin("naptan_locality as l", "n.locality_id", "l.gazetteer_id")
    .innerJoin("naptan_adminarea as a", "n.admin_area_id", "a.id");

  const from = dayjs(args.inputs.fromTimestamp);
  const to = dayjs(args.inputs.toTimestamp);
  if (from.diff(to, "days") > 90) {
    throw new GraphQLError("Date range is too large to fullfill the request", {
      extensions: { code: "BAD_REQUEST", http: { status: 422 } },
    });
  }
  if (from.isAfter(to)) {
    throw new GraphQLError("To date must on or before from date", {
      extensions: { code: "BAD_REQUEST", http: { status: 422 } },
    });
  }
  const startDateUtc = userSelectedDateAsUtc(args.inputs.fromTimestamp);
  const endDateUtc = userSelectedDateAsUtc(args.inputs.toTimestamp); // the front end uploads an exclusive end date
  dbQuery = dbQuery
    .where("t.date_of_journey", ">=", startDateUtc.toDate())
    .where("t.date_of_journey", "<", endDateUtc.toDate());

  if (args.inputs.dayOfWeekFlags) {
    const days = getDayOfWeekNumbers(args.inputs.dayOfWeekFlags);
    dbQuery = dbQuery.where("t.day_of_week", "in", days);
  }
  let operatorIds = await getUserOperatorIds(user, context.kysely);

  if (args.inputs.operatorIds.length > 0) {
    operatorIds = args.inputs.operatorIds.filter((n) =>
      operatorIds.includes(n),
    );
  }

  if (operatorIds.length === 0) {
    throw new GraphQLError(
      "User does not have access to any of the selected operator data",
      {
        extensions: { code: "FORBIDDEN", http: { status: 403 } },
      },
    );
  }

  if (args.inputs.lineIds.length > 0) {
    dbQuery = dbQuery.where(
      "t.noc_and_line_and_servicecode",
      "in",
      args.inputs.lineIds,
    );
  }

  if (args.inputs.adminAreaIds.length > 0) {
    dbQuery = dbQuery.where(
      "n.admin_area_id",
      "in",
      args.inputs.adminAreaIds.map(Number),
    );
  }

  if (args.inputs.matchType === MatchType.Evidenced) {
    dbQuery = dbQuery.where("t.estimated", "is", false);
  }

  // If start or end time aren't set, use the start and end of the day as default values,
  // so that we can still use the result in the filters
  const startDateTime = Number(
    (args.inputs.startTime ?? "00:00").split(":")[0],
  );
  const endDateTime = Number((args.inputs.endTime ?? "23:59").split(":")[0]);

  dbQuery = dbQuery.where(
    (eb) =>
      sql<boolean>`
      EXTRACT(HOUR FROM ${eb.ref("t.departure_hour")} AT TIME ZONE ${eb.val("Europe/London")}) 
      BETWEEN ${eb.val(startDateTime)} AND ${eb.val(endDateTime)}
    `,
  );

  // todo: throw if the bounding box is too big
  return dbQuery
    .where("t.stop_latitude", ">=", args.inputs.boundingBox.minLatitude)
    .where("t.stop_latitude", "<=", args.inputs.boundingBox.maxLatitude)
    .where("t.stop_longitude", ">=", args.inputs.boundingBox.minLongitude)
    .where("t.stop_longitude", "<=", args.inputs.boundingBox.maxLongitude)
    .where("t.operator_noc", "in", operatorIds)
    .groupBy([
      "t.stop_id",
      "t.stop_latitude",
      "t.stop_longitude",
      "t.is_timing_point",
      "n.common_name",
      "n.atco_code",
      "l.name",
      "a.name",
      "t.direction",
    ])
    .select([
      "t.stop_latitude as latitude",
      "t.stop_longitude as longitude",
      "t.is_timing_point as timingPoint",
      "n.common_name as stopName",
      "l.name as localityName",
      "a.name as adminAreaName",
      "t.direction as direction",
    ])
    .select((eb) => [
      eb.fn.coalesce("n.atco_code", sql.lit("<unknown>")).as("atcoCode"),
      eb.fn.sum<number>("t.early_count").as("early"),
      eb.fn.sum<number>("t.late_count").as("late"),
      eb.fn.sum<number>("t.on_time_count").as("onTime"),
      eb.fn.sum<number>("t.scheduled").as("scheduledDepartures"),
      eb.fn.sum<number>("t.completed").as("completedDepartures"),
      eb.fn.sum<number>("t.avg_time_difference").as("totalDelay"),
      eb.fn.sum<number>("t.count_delayed").as("countDelayed"),
      eb.fn
        .sum<number>(
          sql`(${eb.ref("t.count_delayed")} * ${eb.ref("t.average_delay")})`,
        )
        .as("averageDelay"),
      eb.fn
        .avg<number | null>("t.diff_sched_time_to_stop")
        .as("averageScheduled"),
      eb.fn
        .avg<number | null>("t.diff_sched_time_to_stop_timing_point")
        .as("averageScheduledTimingPoint"),
      eb.fn
        .avg<number | null>("t.diff_actual_time_to_stop")
        .as("averageActual"),
      eb.fn
        .avg<number | null>("t.diff_actual_time_to_stop_timing_point")
        .as("averageActualTimingPoint"),
      sql<
        number | null
      >`SUM(${eb.ref("t.avg_time_difference")} * ${eb.ref("t.on_time_count")}) FILTER (WHERE ${eb.ref("t.on_time_count")} > 0) * 60`.as(
        "onTimeInSeconds",
      ),
      sql<
        number | null
      >`SUM(${eb.ref("t.avg_time_difference")} * ${eb.ref("t.late_count")}) FILTER (WHERE ${eb.ref("t.late_count")} > 0) * 60`.as(
        "lateInSeconds",
      ),
      sql<
        number | null
      >`SUM(${eb.ref("t.avg_time_difference")}  * ${eb.ref("t.early_count")}) FILTER (WHERE ${eb.ref("t.early_count")} > 0) * 60`.as(
        "earlyInSeconds",
      ),
    ])
    .where("n.atco_code", "=", "0100BRA10196")
    .execute();
};

const stopAnalysisResolvers: Resolvers = {
  Query: {
    stopAnalysis: getStopAnalysis,
  },
};

export default stopAnalysisResolvers;
