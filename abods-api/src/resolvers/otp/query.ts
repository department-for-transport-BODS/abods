import { Kysely, sql } from "kysely";
import {
  getUserOperatorIds,
  getUserOperatorIdsQuery,
} from "../../lib/operators.js";
import {
  AdminAreasType,
  LineType,
  Maybe,
  OperatorType,
  QueryResolvers,
  Resolvers,
  ServiceInfoType,
  ServicePatternType,
} from "../../types/generated.js";
import { emptyResolver, requireUserSession } from "../helpers.js";
import logger from "../../logger.js";
import { userSelectedDateAsUtc } from "../../lib/dayjs.js";
import { DB } from "../../kysely.js";
import { listServiceLinks } from "../../lib/common.js";
import { executeQuery } from "../../lib/dbKysely.js";

export const getOperatorList: QueryResolvers["operators"] = async (
  _,
  args,
  context,
): Promise<OperatorType[]> => {
  const user = await requireUserSession(context);

  let query = context.kysely
    .selectFrom("service_details as s")
    .where(
      "s.operator_noc",
      "in",
      getUserOperatorIdsQuery(context.kysely, user),
    )
    .innerJoin("all_operators as a", "a.operatorref", "s.operator_noc")
    .innerJoin(
      "noc_adminarea as n",
      "n.national_operator_code",
      "s.operator_noc",
    );
  if (args.filterBy?.operatorIds && args.filterBy.operatorIds.length > 0) {
    query = query.where("s.operator_noc", "in", args.filterBy.operatorIds);
  }

  if (args.filterBy?.orgId) {
    query = query
      .innerJoin(
        "bods_organisationoperator as boo",
        "boo.operatorref",
        "a.operatorref",
      )
      .where("boo.organisation_id", "=", args.filterBy?.orgId);
  }

  // creating a new variable as return types were not infered when reusing query variable
  const mainQuery = query
    .select((eb) => [
      eb.fn.coalesce("name", sql.lit("<unknown>")).as("name"),
      eb.fn.coalesce("operator_noc", sql.lit("<unknown>")).as("operatorId"),
      sql<string>`string_agg(distinct n.adminarea_id::text, ',')`.as(
        "adminAreaIds",
      ),
    ])
    .groupBy(["a.name", "s.operator_noc"])
    .orderBy("name");

  return executeQuery(mainQuery).then((x) =>
    x.map((o) => ({
      name: o.name,
      operatorId: o.operatorId,
      nocCode: o.operatorId,
      adminAreaIds: o.adminAreaIds.split(","),
    })),
  );
};

export const getServiceInfo: QueryResolvers["serviceInfo"] = async (
  _,
  args,
  context,
): Promise<Maybe<ServiceInfoType>> => {
  const user = await requireUserSession(context);
  try {
    const userOperatorIds = await getUserOperatorIds(user, context.kysely);
    const service = await context.db.expected_services.findFirst({
      where: {
        noc_and_line_and_servicecode: args.serviceId,
      },
      select: {
        operator_noc: true,
        line_name: true,
        service_name: true,
      },
    });

    if (!service) {
      throw Error("No service found");
    }

    if (userOperatorIds.includes(service.operator_noc)) {
      return {
        serviceId: args.serviceId,
        serviceNumber: service.line_name,
        serviceName: service.service_name,
      };
    } else throw Error("User does not have access to service");
  } catch (error) {
    logger.error(error, "An error occurred when getting service info");
    return null;
  }
};

export const getAdminAreas: QueryResolvers["adminAreas"] = async (
  _,
  __,
  context,
): Promise<Maybe<AdminAreasType[]>> => {
  const user = await requireUserSession(context);
  try {
    const userOperatorIds = await getUserOperatorIds(user, context.kysely);
    const adminAreaRecords = await context.db.noc_adminarea.findMany({
      where: {
        national_operator_code: {
          in: userOperatorIds,
        },
      },
      select: {
        adminarea_id: true,
      },
    });

    if (adminAreaRecords) {
      const adminareaIds = adminAreaRecords.map((a) => a.adminarea_id);
      const adminAreas = await context.db.naptan_adminarea_with_shape.findMany({
        where: {
          id: {
            in: adminareaIds,
          },
        },
      });

      if (!adminAreas) {
        throw Error("No admin areas found");
      }

      return adminAreas.map((adminArea) => ({
        id: adminArea.id.toString(),
        name: adminArea.name,
        shape: adminArea.st_asgeojson,
      }));
    }

    return null;
  } catch (error) {
    logger.error(error, "An error occurred when getting admin areas");
    return null;
  }
};

export const getLines: QueryResolvers["lines"] = async (
  _,
  args,
  context,
): Promise<LineType[]> => {
  const user = await requireUserSession(context);

  if (args.operatorIds.length === 0) return [];

  let query = context.kysely
    .selectFrom("expected_services")
    .where("operator_noc", "in", getUserOperatorIdsQuery(context.kysely, user))
    .where("operator_noc", "in", args.operatorIds);

  const inputDate = userSelectedDateAsUtc(args.inputDate).toDate();
  if (args.endDate) {
    const endDate = userSelectedDateAsUtc(args.endDate).toDate();
    query = query
      .where("date_of_journey", ">=", inputDate)
      .where("date_of_journey", "<", endDate);
  } else {
    query = query.where("date_of_journey", "=", inputDate);
  }

  const mainQuery = query
    .select("noc_and_line_and_servicecode as id")
    .select("service_name as name")
    .select("line_name as number")
    .select("admin_area_id as adminAreaIds")
    .distinctOn("noc_and_line_and_servicecode");

  return executeQuery(mainQuery);
};

const getOtpServiceLinks = (
  stops: { stopId: string; lon: number; stopName: string; lat: number }[],
  stopIdList: string[],
  db: Kysely<DB>,
) => {
  stops = stops.sort(
    (a, b) => stopIdList.indexOf(a.stopId) - stopIdList.indexOf(b.stopId),
  );
  return listServiceLinks(stops, db);
};

export const getServicePatterns: QueryResolvers["servicePatterns"] = async (
  _,
  args,
  context,
): Promise<ServicePatternType[]> => {
  await requireUserSession(context);
  const routesQueryResults = await context.db.distinct_routes.findMany({
    where: {
      servicepattern_route: {
        noc_and_line_and_servicecode: args.lineId,
      },
    },
    select: {
      id: true,
      route: true,
    },
  });
  const routes = routesQueryResults.map((n) => ({
    ...n,
    stopIds: n.route.split(","),
  }));
  const allStopIds = [...new Set(routes.flatMap((n) => n.stopIds))];
  const stopQueryResults = await context.db.naptan_stoppoint_latlong.findMany({
    where: {
      atco_code: { in: allStopIds },
      NOT: {
        atco_code: null,
        longitude: null,
        latitude: null,
      },
    },
    select: {
      common_name: true,
      atco_code: true,
      longitude: true,
      latitude: true,
    },
  });
  const stopDetails = stopQueryResults.map((n) => ({
    stopName: n.common_name,
    // workaround for nullable db columns that can probably be not null, the where clause should exclude null for now
    stopId: n.atco_code!,
    lon: n.longitude!,
    lat: n.latitude!,
  }));

  const result: ServicePatternType[] = [];
  for (const route of routes) {
    const stops = stopDetails.filter((s) => route.stopIds.includes(s.stopId));
    const serviceLinks = await getOtpServiceLinks(
      stops,
      route.stopIds,
      context.kysely,
    );
    result.push({
      stops,
      servicePatternId: route.id.toString(),
      serviceLinks,
    });
  }
  return result;
};

const otpQuery: Resolvers = {
  Query: {
    operators: getOperatorList,
    onTimePerformance: emptyResolver,
    headwayMetrics: emptyResolver,
    serviceInfo: getServiceInfo,
    adminAreas: getAdminAreas,
    lines: getLines,
    servicePatterns: getServicePatterns,
  },
};

export default otpQuery;
