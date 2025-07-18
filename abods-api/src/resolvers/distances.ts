import { sql } from "kysely";
import { userSelectedDateAsUtc } from "../lib/dayjs.js";
import {
  Resolvers,
  QueryResolvers,
  Distance,
  DistancesDropdown,
  OperatorForDistances,
  AdminOrgOperatorMap,
} from "../types/generated";
import { requireUserSession } from "./helpers.js";

const getDistances: QueryResolvers["distances"] = async (
  _,
  args,
  context,
): Promise<Distance[]> => {
  if (!args.filterBy) {
    return [];
  }
  const {
    orgId,
    operatorIds,
    nocLineAndServiceCodes,
    fromTimestamp,
    toTimestamp,
    licenseIds,
    adminAreaIds,
  } = args.filterBy;

  const user = await requireUserSession(context);

  if (
    orgId &&
    !user.isGlobalUser &&
    !user.orgs.map((org) => org.id).includes(Number(orgId))
  ) {
    return [];
  }

  let query = context.kysely
    .selectFrom("expected_services as es")
    .innerJoin(
      "bods_organisationoperator as boo",
      "boo.operatorref",
      "es.operator_noc",
    )
    .innerJoin("all_operators as ao", "ao.operatorref", "boo.operatorref")
    .where(
      "boo.organisation_id",
      "=",
      user.orgs.map((org) => org.id),
    )
    .where(
      "es.date_of_journey",
      ">=",
      userSelectedDateAsUtc(fromTimestamp).toDate(),
    )
    .where(
      "es.date_of_journey",
      "<",
      userSelectedDateAsUtc(toTimestamp).toDate(),
    )
    .orderBy("ao.name", "asc")
    .orderBy("es.noc_and_line_and_servicecode", "asc")
    .groupBy([
      "es.operator_noc",
      "ao.name",
      "es.noc_and_line_and_servicecode",
      "es.line_name",
      "es.service_name",
    ])
    .select([
      "es.operator_noc as operatorId",
      "es.noc_and_line_and_servicecode as nocLineAndServiceCode",
      "es.line_name as lineName",
      "es.service_name as serviceName",
    ])
    .select(({ fn }) => [
      fn.coalesce("ao.name", sql.lit("")).as("operatorName"),
      fn.sum<number>("es.total_distance").as("distance"),
      fn.sum<number>("es.avl_true_distance").as("avlDistance"),
    ]);

  if (operatorIds && operatorIds.length > 0) {
    query = query.where("es.operator_noc", "in", operatorIds);
  }

  if (nocLineAndServiceCodes && nocLineAndServiceCodes.length > 0) {
    query = query.where(
      "es.noc_and_line_and_servicecode",
      "in",
      nocLineAndServiceCodes,
    );
  }

  if (licenseIds && licenseIds.length > 0) {
    query = query.where("es.license", "in", licenseIds);
  }

  if (adminAreaIds && adminAreaIds.length > 0) {
    query = query.where(
      (eb) =>
        sql<boolean>`${eb.ref("admin_area_id")} && ARRAY[${sql.join(adminAreaIds)}]::int4[]`,
    );
  }

  return query.execute();
};

const getDistancesDropdowns: QueryResolvers["distancesDropdowns"] = async (
  _,
  args,
  context,
): Promise<DistancesDropdown> => {
  const { startDate, endDate } = args;

  if (!startDate || !endDate) {
    throw new Error("Start date and end date are mandatory");
  }

  const user = await requireUserSession(context);

  const userOperators = context.kysely
    .selectFrom("bods_organisationoperator")
    .select("operatorref")
    .distinct()
    .where(
      "organisation_id",
      "in",
      user.orgs.map((org) => org.id),
    );

  const cte_services = context.kysely.with("cte_services", (db) =>
    db
      .selectFrom("expected_services")
      .where("date_of_journey", ">=", userSelectedDateAsUtc(startDate).toDate())
      .where("date_of_journey", "<", userSelectedDateAsUtc(endDate).toDate())
      .where("operator_noc", "in", userOperators)
      .select([
        "operator_noc",
        "license",
        "noc_and_line_and_servicecode",
        "line_name",
      ])
      .distinct(),
  );

  const servicesQuery = cte_services
    .selectFrom("cte_services as cs")
    .innerJoin(
      "service_details as sd",
      "sd.noc_and_line_and_servicecode",
      "cs.noc_and_line_and_servicecode",
    )
    .innerJoin("all_operators as ao", "ao.operatorref", "cs.operator_noc")
    .select([
      "ao.name as operator_name",
      "cs.operator_noc as operator_noc",
      "cs.license as license",
      "cs.noc_and_line_and_servicecode as service_id",
      "sd.service_name as service_name",
      "cs.line_name as line_name",
    ])
    .distinct();

  const results = await servicesQuery.execute();

  const operators: Map<string, OperatorForDistances> = new Map<
    string,
    OperatorForDistances
  >();

  results.forEach((service) => {
    const operator: OperatorForDistances = operators.get(
      service.operator_noc,
    ) ?? {
      name: service.operator_name ?? "",
      id: service.operator_noc,
      licenses: [],
    };
    operators.set(service.operator_noc, operator);

    let license = operator.licenses?.find(
      (license) => license.id === service.license,
    );
    if (!license) {
      license = {
        id: service.license ?? "",
        services: [],
      };
      operator.licenses?.push(license);
    }

    license.services?.push({
      id: service.service_id,
      name: service.service_name ?? "",
      line: service.line_name,
    });
  });

  return {
    operators: Array.from(operators.values()),
  };
};

const getAdminOrgMaps: QueryResolvers["adminOrgMap"] = async (
  _,
  args,
  context,
): Promise<AdminOrgOperatorMap[]> => {
  const { startDate, endDate } = args;

  if (!startDate || !endDate) {
    throw new Error("Start date and end date are mandatory");
  }

  const user = await requireUserSession(context);
  const userOperators = context.kysely
    .selectFrom("bods_organisationoperator")
    .select("operatorref")
    .distinct()
    .where(
      "organisation_id",
      "in",
      user.orgs.map((org) => org.id),
    );

  const adminAreaIdsCte = context.kysely.with("admin_areas", (db) =>
    db
      .selectFrom("expected_services")
      .where("date_of_journey", ">=", userSelectedDateAsUtc(startDate).toDate())
      .where("date_of_journey", "<", userSelectedDateAsUtc(endDate).toDate())
      .where("operator_noc", "in", userOperators)
      .select((eb) => [
        sql<number>`unnest(${eb.ref("admin_area_id")})`.as("admin_area_id"),
        "operator_noc",
      ])
      .distinct(),
  );

  const query = adminAreaIdsCte
    .selectFrom("admin_areas as aa")
    .innerJoin("naptan_adminarea_with_shape as na", "na.id", "aa.admin_area_id")
    .innerJoin(
      "bods_organisationoperator as boo",
      "boo.operatorref",
      "aa.operator_noc",
    )
    .innerJoin("bods_organisation as bo", "bo.id", "boo.organisation_id")
    .where("bo.name", "not ilike", "%LTA%")
    .where("bo.is_abods_global_viewer", "=", false)
    .select([
      "aa.admin_area_id as adminAreaId",
      "na.name as adminName",
      "aa.operator_noc as operatorId",
      "boo.organisation_id as orgId",
      "bo.name as orgName",
    ])
    .distinct();

  return query.execute();
};

const distancesResolver: Resolvers = {
  Query: {
    distances: getDistances,
    distancesDropdowns: getDistancesDropdowns,
    adminOrgMap: getAdminOrgMaps,
  },
};

export default distancesResolver;
