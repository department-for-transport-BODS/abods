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
    !user.isGlobalUser ||
    (orgId && !user.orgs.map((org) => org.id).includes(Number(orgId)))
  ) {
    return [];
  }

  let orgIds = user.orgs.map((org) => org.id);

  if (orgId) {
    orgIds = [Number(orgId)];
  }

  let query = context.kysely
    .selectFrom("expected_services as es")
    .innerJoin(
      "bods_organisationoperator as boo",
      "boo.operatorref",
      "es.operator_noc",
    )
    .innerJoin("all_operators as ao", "ao.operatorref", "boo.operatorref")
    .where("boo.organisation_id", "in", orgIds)
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
  const user = await requireUserSession(context);

  let servicesQuery = context.kysely
    .selectFrom("service_details as sd")
    .innerJoin(
      "bods_organisationoperator as boo",
      "sd.operator_noc",
      "boo.operatorref",
    )
    .innerJoin("all_operators as ao", "ao.operatorref", "sd.operator_noc")
    .where("sd.operator_noc", "is not", null)
    .select([
      "ao.name as operator_name",
      "sd.operator_noc as operator_noc",
      "sd.license as license",
      "sd.noc_and_line_and_servicecode as service_id",
      "sd.service_name as service_name",
      "sd.line_name as line_name",
    ])
    .distinct();

  if (!user.isGlobalUser) {
    servicesQuery = servicesQuery.where(
      "boo.organisation_id",
      "in",
      user.orgs.map((org) => org.id),
    );
  }

  const results = await servicesQuery.execute();

  const operators: Map<string, OperatorForDistances> = new Map<
    string,
    OperatorForDistances
  >();

  results.forEach((service) => {
    const operator: OperatorForDistances = operators.get(
      service.operator_noc!,
    ) ?? {
      name: service.operator_name ?? "",
      id: service.operator_noc!,
      licenses: [],
    };
    operators.set(service.operator_noc!, operator);

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
      line: service.line_name ?? "",
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
  const user = await requireUserSession(context);

  const adminAreaIdsCte = context.kysely.with("admin_areas", (db) =>
    db
      .selectFrom("service_details as sd")
      .innerJoin(
        "bods_organisationoperator as boo",
        "boo.operatorref",
        "sd.operator_noc",
      )
      .$if(!user.isGlobalUser, (qb) =>
        qb.where(
          "boo.organisation_id",
          "in",
          user.orgs.map((org) => org.id),
        ),
      )
      .select((eb) => [
        sql<number>`unnest(${eb.ref("sd.admin_areas")})`.as("admin_area_id"),
        "sd.operator_noc",
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
      sql<string>`COALESCE(aa.operator_noc, '')`.as("operatorId"),
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
