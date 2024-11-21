import { PrismaClient } from "@prisma/client";
import { Kysely, NotNull } from "kysely";
import { DB } from "../kysely";
import { SessionUser } from "../types/extra";
import { getUserOperatorIdsQuery } from "./operators";

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

export const getVehicleCounts = (
  db: Kysely<DB>,
  user: SessionUser,
  operatorId: string | null,
  startTime: Date,
  endTime: Date,
) => {
  const baseQuery = db
    .selectFrom("expected_journeys")
    .where("date_of_journey", "=", startTime)
    .where("expected_journey_start", "<", endTime)
    .where("expected_journey_end", ">", startTime)
    .where("operator_noc", "is not", null)
    .where("group_id", "is not", null)
    .$if(!!operatorId, (qb) => qb.where("operator_noc", "=", operatorId))
    .where("operator_noc", "in", getUserOperatorIdsQuery(db, user))
    .distinct()
    .select("operator_noc")
    .select("group_id")
    .select((eb) => [
      eb
        .exists(
          eb
            .selectFrom("SiriVMPositions")
            .where("SiriVMPositions.date_of_journey", "=", startTime)
            .whereRef(
              "SiriVMPositions.group_id",
              "=",
              "expected_journeys.group_id",
            )
            .whereRef(
              "SiriVMPositions.operator_ref",
              "=",
              "expected_journeys.operator_noc",
            )
            .where("SiriVMPositions.recorded_at_time", ">=", startTime)
            .where("SiriVMPositions.recorded_at_time", "<", endTime),
        )
        .as("cur"),
    ]);

  return db
    .selectFrom(baseQuery.as("sq"))
    .groupBy("sq.operator_noc")
    .select(({ fn, eb }) => [
      "sq.operator_noc as operatorId",
      eb.cast<number>(fn.countAll(), "integer").as("expected"),
      eb
        .cast<number>(
          fn.count(eb.case().when("sq.cur", "=", true).then(1).end()),
          "integer",
        )
        .as("actual"),
    ])
    .$narrowType<{ operatorId: NotNull }>() // null is filtered above
    .execute();
};
