import { Prisma, PrismaClient } from "@prisma/client";

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
  db: PrismaClient,
  userOrgId: number,
  operatorId: string | null,
  startTime: Date,
  endTime: Date,
) => {
  const start = Prisma.raw(startTime.toISOString());
  const end = Prisma.raw(endTime.toISOString());
  return db.$queryRaw<
    {
      operatorId: string;
      expected: number;
      actual: number;
    }[]
  >(Prisma.sql`SELECT operator_noc                                    AS "operatorId",
                      CAST(COUNT(*) AS int)                           AS "expected",
                      CAST(COUNT(CASE WHEN sq.cur THEN 1 END) AS int) AS "actual"
               FROM (SELECT DISTINCT j.operator_noc,
                                     j.group_id,
                                     EXISTS(SELECT 1
                                            FROM public."SiriVMPositions" s
                                            WHERE s.date_of_journey = '${start}'
                                              AND s.group_id = j.group_id
                                              AND s.operator_ref = j.operator_noc
                                              AND s.recorded_at_time >= '${start}'
                                              AND s.recorded_at_time < '${end}') AS cur
                     FROM public.expected_journeys j
                     WHERE j.date_of_journey = '${start}'
                       AND j.expected_journey_start < '${end}'
                       AND j.expected_journey_end > '${start}'
                       AND j.operator_noc IS NOT NULL
                       AND j.group_id IS NOT NULL
                       AND (CAST(${operatorId} AS text) IS NULL OR j.operator_noc = ${operatorId})
                       AND j.operator_noc IN (SELECT o.operatorref
                                              FROM public.bods_organisationoperator o
                                              WHERE o.organisation_id = ${userOrgId})) sq
               GROUP BY operator_noc;`);
};
