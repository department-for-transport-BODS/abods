import { getUserOperatorIds } from "../lib/operators.js";
import { QueryResolvers, Resolvers, StopStatistics } from "../types/generated";
import { requireUserSession } from "./helpers.js";
import { sql } from "kysely";

const getStopAnalysis: QueryResolvers["stopAnalysis"] = async (
  _,
  args,
  context,
): Promise<StopStatistics[]> => {
  const user = await requireUserSession(context);
  const {
    boundingBox,
    fromTimestamp,
    toTimestamp,
    operatorId,
    lineId,
    adminAreaIds,
  } = args.inputs;

  const operatorIds = await getUserOperatorIds(user, context.kysely);

  let dbQuery = context.kysely
    .selectFrom("timetable_summary_stops_tz as t")
    .innerJoin("naptan_stoppoint_latlong as n", "n.id", "t.stop_id")
    .innerJoin("naptan_locality as l", "n.locality_id", "l.gazetteer_id")
    .innerJoin("naptan_adminarea as a", "n.admin_area_id", "a.id");

  if (operatorId) {
    dbQuery = dbQuery.where("t.operator_noc", "=", operatorId);
  }

  if (lineId) {
    dbQuery = dbQuery.where("t.noc_and_line_and_servicecode", "=", lineId);
  }

  if (adminAreaIds && adminAreaIds.length > 0) {
    dbQuery = dbQuery.where("n.admin_area_id", "in", adminAreaIds.map(Number));
  }

  // todo: throw if the bounding box is too big

  return dbQuery
    .where("t.date_of_journey", ">=", new Date(fromTimestamp))
    .where("t.date_of_journey", "<", new Date(toTimestamp))
    .where("t.stop_latitude", ">=", boundingBox.minLatitude)
    .where("t.stop_latitude", "<=", boundingBox.maxLatitude)
    .where("t.stop_longitude", ">=", boundingBox.minLongitude)
    .where("t.stop_longitude", "<=", boundingBox.maxLongitude)
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
    ])
    .select([
      "t.stop_id as stopId",
      "t.stop_latitude as latitude",
      "t.stop_longitude as longitude",
      "t.is_timing_point as timingPoint",
      "n.common_name as stopName",
      "l.name as localityName",
      "a.name as adminAreaName",
    ])
    .select((eb) => [
      eb.fn.coalesce("n.atco_code", sql.lit("<unknown>")).as("atcoCode"),
      eb.fn.sum<number>("t.early_count").as("early"),
      eb.fn.sum<number>("t.late_count").as("late"),
      eb.fn.sum<number>("t.on_time_count").as("onTime"),
      eb.fn.sum<number>("t.scheduled").as("scheduledDepartures"),
      eb.fn.sum<number>("t.completed").as("completedDepartures"),
      eb.fn.sum<number>("t.avg_time_difference").as("totalDelay"),
    ])
    .execute();
};

const stopAnalysisResolvers: Resolvers = {
  Query: {
    stopAnalysis: getStopAnalysis,
  },
};

export default stopAnalysisResolvers;
