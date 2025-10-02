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
import { userSelectedDateAsUtc } from "../lib/dayjs.js";
import { getDayOfWeekNumbers } from "../lib/utils.js";
import { executeQuery } from "../lib/dbKysely.js";

const getStopAnalysis: QueryResolvers["stopAnalysis"] = async (
  _,
  args,
  context,
): Promise<StopStatistics[]> => {
  const user = await requireUserSession(context);
  const summaryStart = Date.now();
  let naptanQuery = context.kysely
    .selectFrom("naptan_stoppoint_latlong as n")
    .innerJoin("naptan_locality as l", "n.locality_id", "l.gazetteer_id")
    .innerJoin("naptan_adminarea as a", "n.admin_area_id", "a.id")
    .select([
      "n.id as stop_id",
      "n.common_name as stopName",
      "l.name as localityName",
      "a.name as adminAreaName",
      "n.atco_code as atcoCode",
      "n.latitude",
      "n.longitude",
    ])
    .where("n.latitude", ">=", args.inputs.boundingBox.minLatitude)
    .where("n.latitude", "<=", args.inputs.boundingBox.maxLatitude)
    .where("n.longitude", ">=", args.inputs.boundingBox.minLongitude)
    .where("n.longitude", "<=", args.inputs.boundingBox.maxLongitude);

  if (args.inputs.adminAreaIds.length > 0) {
    naptanQuery = naptanQuery.where(
      "n.admin_area_id",
      "in",
      args.inputs.adminAreaIds.map(Number),
    );
  }

  const naptanStops = await naptanQuery.execute();
  console.log(`naptanQuery took ${Date.now() - summaryStart} ms`);
  const stopInfoMap = new Map<number, (typeof naptanStops)[0]>();
  for (const stop of naptanStops) {
    stopInfoMap.set(stop.stop_id, stop);
  }

  if (naptanStops.length === 0) {
    return [];
  }

  let days: number[] = [];
  if (args.inputs.dayOfWeekFlags) {
    days = getDayOfWeekNumbers(args.inputs.dayOfWeekFlags);
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

  // If start or end time aren't set, use the start and end of the day as default values,
  // so that we can still use the result in the filters
  const startDateTime = Number(
    (args.inputs.startTime ?? "00:00").split(":")[0],
  );
  const endDateTime = Number((args.inputs.endTime ?? "23:59").split(":")[0]);

  const startDateUtc = userSelectedDateAsUtc(args.inputs.fromTimestamp);
  const endDateUtc = userSelectedDateAsUtc(args.inputs.toTimestamp); // the front end uploads an exclusive end date

  const startDate = startDateUtc.startOf("day");
  const weekRanges: { from: Date; to: Date }[] = [];
  let current = startDate;
  while (current.isBefore(endDateUtc)) {
    const weekStart = current;
    const weekEnd = current.add(1, "week");
    weekRanges.push({
      from: weekStart.toDate(),
      to: weekEnd.isBefore(endDateUtc) ? weekEnd.toDate() : endDateUtc.toDate(),
    });
    current = weekEnd;
  }

  const summaryResults = await Promise.all(
    weekRanges.map(async (week) => {
      let summaryQuery = context.kysely
        .selectFrom("timetable_summary_stops_tz as t")
        .where("t.date_of_journey", ">=", week.from)
        .where("t.date_of_journey", "<", week.to)
        .where("t.stop_latitude", ">=", args.inputs.boundingBox.minLatitude)
        .where("t.stop_latitude", "<=", args.inputs.boundingBox.maxLatitude)
        .where("t.stop_longitude", ">=", args.inputs.boundingBox.minLongitude)
        .where("t.stop_longitude", "<=", args.inputs.boundingBox.maxLongitude)
        .where("t.operator_noc", "in", operatorIds);

      if (args.inputs.dayOfWeekFlags) {
        summaryQuery = summaryQuery.where("t.day_of_week", "in", days);
      }

      if (args.inputs.lineIds.length > 0) {
        summaryQuery = summaryQuery.where(
          "t.noc_and_line_and_servicecode",
          "in",
          args.inputs.lineIds,
        );
      }
      summaryQuery = summaryQuery.where(
        (eb) =>
          sql<boolean>`
      EXTRACT(HOUR FROM ${eb.ref("t.departure_hour")} AT TIME ZONE ${eb.val("Europe/London")}) 
      BETWEEN ${eb.val(startDateTime)} AND ${eb.val(endDateTime)}
    `,
      );

      const scheduledCountPromise = summaryQuery
        .select([
          "t.stop_id",
          "t.is_timing_point",
          "t.direction",
          sql<number>`SUM(t.scheduled)`.as("scheduled"),
        ])
        .groupBy(["t.stop_id", "t.is_timing_point", "t.direction"]);

      if (args.inputs.matchType === MatchType.Evidenced) {
        summaryQuery = summaryQuery.where("t.estimated", "is", false);
      }

      const summaryPromise = summaryQuery
        .select(["t.stop_id", "t.is_timing_point as timingPoint"])
        .select((eb) => [
          eb.fn.sum<number>("t.early_count").as("early"),
          eb.fn.sum<number>("t.late_count").as("late"),
          eb.fn.sum<number>("t.on_time_count").as("onTime"),
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
          sql<number>`SUM(${eb.ref("t.scheduled")}) FILTER (WHERE ${eb.ref("t.estimated")} = false)`.as(
            "scheduledDepartures",
          ),
        ])
        .select((eb) => [
          eb
            .case()
            .when(sql`LOWER(${eb.ref("t.direction")})`, "=", "anticlockwise")
            .then("inbound")
            .when(sql`LOWER(${eb.ref("t.direction")})`, "=", "clockwise")
            .then("outbound")
            .else(eb.ref("t.direction"))
            .end()
            .as("direction"),
        ]);

      const [summaryResults, scheduledCountResults] = await Promise.all([
        executeQuery(summaryPromise),
        executeQuery(scheduledCountPromise),
      ]);
      return { summaryResults, scheduledCountResults };
    }),
  );

  const merged = new Map<
    string,
    {
      stop_id: number;
      timingPoint: boolean;
      early: number;
      late: number;
      onTime: number;
      completedDepartures: number;
      totalDelay: number;
      countDelayed: number;
      averageDelay: number | null;
      averageScheduled: number | null;
      averageScheduledTimingPoint: number | null;
      averageActual: number | null;
      averageActualTimingPoint: number | null;
      onTimeInSeconds: number | null;
      lateInSeconds: number | null;
      earlyInSeconds: number | null;
      scheduledDepartures: number;
      direction?: string;
    }
  >();

  for (const weekResult of summaryResults) {
    const weeklySummaryResult = weekResult.summaryResults;
    const weeklyScheduledCountResult = weekResult.scheduledCountResults;
    const scheduledMap = new Map<string, number>();
    for (const row of weeklyScheduledCountResult) {
      const key = `${row.stop_id}|${row.is_timing_point}|${row.direction}`;
      scheduledMap.set(key, Number(row.scheduled ?? 0));
    }
    for (const row of weeklySummaryResult) {
      const key = `${row.stop_id}|${row.timingPoint}|${row.direction}`;
      if (!merged.has(key)) {
        merged.set(key, {
          ...row,
          scheduledDepartures: scheduledMap.get(key) ?? 0,
        });
      } else {
        const existing = merged.get(key) ?? {
          stop_id: row.stop_id,
          timingPoint: row.timingPoint,
          early: 0,
          late: 0,
          onTime: 0,
          completedDepartures: 0,
          totalDelay: 0,
          countDelayed: 0,
          averageDelay: null,
          averageScheduled: null,
          averageScheduledTimingPoint: null,
          averageActual: null,
          averageActualTimingPoint: null,
          onTimeInSeconds: null,
          lateInSeconds: null,
          earlyInSeconds: null,
          scheduledDepartures: 0,
          direction: row.direction,
        };
        existing.early = Number(existing.early) + Number(row.early);
        existing.late = Number(existing.late) + Number(row.late);
        existing.onTime = Number(existing.onTime) + Number(row.onTime);
        existing.completedDepartures =
          Number(existing.completedDepartures) +
          Number(row.completedDepartures);
        existing.totalDelay =
          Number(existing.totalDelay) + Number(row.totalDelay);
        existing.countDelayed =
          Number(row.countDelayed) + Number(existing.countDelayed);
        existing.scheduledDepartures =
          Number(scheduledMap.get(key) ?? 0) +
          Number(existing.scheduledDepartures ?? 0);
        if (row.averageDelay !== null && !isNaN(Number(row.averageDelay))) {
          const sum =
            Number(existing.averageDelay ?? 0) + Number(row.averageDelay);
          existing.averageDelay = sum;
        }

        if (
          row.averageScheduledTimingPoint !== null &&
          !isNaN(Number(row.averageScheduledTimingPoint))
        ) {
          existing.averageScheduledTimingPoint =
            existing.averageScheduledTimingPoint !== null
              ? (Number(existing.averageScheduledTimingPoint) +
                  Number(row.averageScheduledTimingPoint)) /
                2
              : Number(row.averageScheduledTimingPoint);
        }

        if (
          row.averageScheduled !== null &&
          !isNaN(Number(row.averageScheduled))
        ) {
          existing.averageScheduled =
            existing.averageScheduled !== null
              ? (Number(existing.averageScheduled) +
                  Number(row.averageScheduled)) /
                2
              : Number(row.averageScheduled);
        }
        if (
          row.averageActualTimingPoint !== null &&
          !isNaN(Number(row.averageActualTimingPoint))
        ) {
          existing.averageActualTimingPoint =
            existing.averageActualTimingPoint !== null
              ? (Number(existing.averageActualTimingPoint) +
                  Number(row.averageActualTimingPoint)) /
                2
              : Number(row.averageActualTimingPoint);
        }
        if (row.averageActual !== null && !isNaN(Number(row.averageActual))) {
          existing.averageActual =
            existing.averageActual !== null
              ? (Number(existing.averageActual) + Number(row.averageActual)) / 2
              : Number(row.averageActual);
        }

        if (row.onTimeInSeconds !== null) {
          existing.onTimeInSeconds =
            Number(existing.onTimeInSeconds ?? 0) + Number(row.onTimeInSeconds);
        }
        if (row.lateInSeconds !== null) {
          existing.lateInSeconds =
            Number(existing.lateInSeconds ?? 0) + Number(row.lateInSeconds);
        }
        if (row.earlyInSeconds !== null) {
          existing.earlyInSeconds =
            Number(existing.earlyInSeconds ?? 0) + Number(row.earlyInSeconds);
        }
      }
    }
  }

  const result: StopStatistics[] = [];
  for (const stopSummary of merged.values()) {
    const stop = stopInfoMap.get(stopSummary.stop_id);
    result.push({
      ...stopSummary,
      stopName: stop?.stopName ?? "N/A",
      localityName: stop?.localityName ?? "N/A",
      adminAreaName: stop?.adminAreaName ?? "N/A",
      atcoCode: stop?.atcoCode ?? "N/A",
      latitude: stop?.latitude ?? 0,
      longitude: stop?.longitude ?? 0,
    });
  }

  return result;
};

const stopAnalysisResolvers: Resolvers = {
  Query: {
    stopAnalysis: getStopAnalysis,
  },
};

export default stopAnalysisResolvers;
