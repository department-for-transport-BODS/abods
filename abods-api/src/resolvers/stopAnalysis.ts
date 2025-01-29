import { getUserOperatorIds } from "../lib/operators.js";
import {
  QueryResolvers,
  Resolvers,
  StopAnalysisType,
} from "../types/generated";
import { requireUserSession } from "./helpers.js";
import { DB } from "../kysely.js";

const getStopAnalysis: QueryResolvers["stopAnalysis"] = async (
  _,
  args,
  context,
): Promise<StopAnalysisType[]> => {
  const user = await requireUserSession(context);
  const { boundingBox, fromTimestamp, toTimestamp, operatorId, lineId } =
    args.inputs;

  const userOperatorIds = await getUserOperatorIds(user, context.kysely);

  let dbQuery = context.kysely
    .selectFrom("timetable_summary_stops_tz")
    .innerJoin(
      "naptan_stoppoint_latlong",
      "naptan_stoppoint_latlong.id",
      "timetable_summary_stops_tz.stop_id",
    )
    .select([
      "stop_id as stopId",
      "stop_latitude as latitude",
      "stop_longitude as longitude",
      "is_timing_point as timingPoint",
    ])
    .select((eb) => [
      eb.fn.sum<number>("early_count").as("early"),
      eb.fn.sum<number>("late_count").as("late"),
      eb.fn.sum<number>("on_time_count").as("onTime"),
      eb.fn.sum<number>("scheduled").as("scheduledDepartures"),
      eb.fn.sum<number>("completed").as("completedDepartures"),
      eb.fn.avg<number>("avg_time_difference").as("averageDelay"),
    ])
    .select("naptan_stoppoint_latlong.common_name as stopName");

  if (operatorId) {
    if (!userOperatorIds.includes(operatorId)) {
      return [];
    }
    dbQuery = dbQuery
      .select("operator_noc as operatorId")
      .groupBy("operator_noc")
      .where("operator_noc", "=", operatorId);
  } else {
    dbQuery = dbQuery
      .innerJoin(
        "bods_organisationoperator",
        "bods_organisationoperator.operatorref",
        "timetable_summary_stops_tz.operator_noc",
      )
      .where("bods_organisationoperator.organisation_id", "=", user.orgId);
  }

  if (lineId) {
    dbQuery = dbQuery
      .select("noc_and_line_and_servicecode as lineId")
      .groupBy("noc_and_line_and_servicecode")
      .where("noc_and_line_and_servicecode", "=", lineId);
  }

  if (fromTimestamp && toTimestamp) {
    dbQuery = dbQuery
      .where(
        "timetable_summary_stops_tz.date_of_journey",
        ">=",
        new Date(fromTimestamp),
      )
      .where(
        "timetable_summary_stops_tz.date_of_journey",
        "<",
        new Date(toTimestamp),
      );
  }

  dbQuery = dbQuery
    .where(
      "timetable_summary_stops_tz.stop_latitude",
      ">=",
      boundingBox.minLatitude,
    )
    .where(
      "timetable_summary_stops_tz.stop_latitude",
      "<=",
      boundingBox.maxLatitude,
    )
    .where(
      "timetable_summary_stops_tz.stop_longitude",
      ">=",
      boundingBox.minLongitude,
    )
    .where(
      "timetable_summary_stops_tz.stop_longitude",
      "<=",
      boundingBox.maxLongitude,
    );

  dbQuery = dbQuery.groupBy([
    "stop_id",
    "stop_latitude",
    "stop_longitude",
    "is_timing_point",
    "naptan_stoppoint_latlong.common_name",
  ]);

  return dbQuery.execute();
};

const stopAnalysisResolvers: Resolvers = {
  Query: {
    stopAnalysis: getStopAnalysis,
  },
};

export default stopAnalysisResolvers;
