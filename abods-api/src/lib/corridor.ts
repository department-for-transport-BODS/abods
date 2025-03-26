import { MatchType } from "../types/generated.js";
import { SessionUser } from "../types/extra.js";
import { TimetableType } from "../resolvers/corridorFunctions.js";
import { Kysely } from "kysely";
import { DB } from "../kysely";
import { getUserOperatorIdsQuery } from "./operators";

export enum CorridorTransitStatsOption {
  day,
  hour,
  dayOfWeek,
  hourAsNumber,
}

export interface CorridorTransitServiceStatsType {
  totalTransitTime: number;
  recordedTransits: number;
  scheduledTransits: number;
  operatorNoc: string | null;
  serviceCode: string | null;
  lineName: string | null;
}

export const deleteCorridorDb = (corridorId: number, db: Kysely<DB>) =>
  db.deleteFrom("corridor").where("corridor_id", "=", corridorId).execute();

export const deleteCorridorStops = (corridorId: number, db: Kysely<DB>) =>
  db
    .deleteFrom("corridor_stops")
    .where("corridor_id", "=", corridorId)
    .execute();

export const updateCorridorDb = (
  corridorId: number,
  corridorName: string,
  db: Kysely<DB>,
) => {
  return db
    .updateTable("corridor")
    .where("corridor_id", "=", corridorId)
    .set({
      corridor_name: corridorName,
    })
    .execute();
};

export const isCorridorMappedToUserOrg = async (
  corridorId: number,
  user: SessionUser,
  db: Kysely<DB>,
): Promise<boolean> => {
  const result = await db
    .selectFrom("corridor")
    .where("corridor_id", "=", corridorId)
    .where("organisation_id", "in", user.orgIds)
    .select("corridor_id")
    .executeTakeFirst();
  return !!result;
};

export const distinctRoutes = (db: Kysely<DB>, stopsPattern: string) =>
  db
    .selectFrom("distinct_routes")
    .where("route", "like", `%${stopsPattern}%`)
    .select(["route"])
    .execute();

export const getOrgAdminAreas = async (db: Kysely<DB>, user: SessionUser) =>
  db
    .selectFrom("noc_adminarea")
    .where("national_operator_code", "in", getUserOperatorIdsQuery(db, user))
    .select("adminarea_id")
    .execute();

export const getStopDepartureTime = (
  stop: TimetableType,
  matchType: MatchType,
) => {
  return (
    stop.actual_departure_time ??
    (matchType === MatchType.Estimated ? stop.timestamp_after_estimate : null)
  );
};
