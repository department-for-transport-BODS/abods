import { sql } from "kysely";
import { userSelectedDateAsUtc } from "../lib/dayjs.js";
import { Resolvers, QueryResolvers, Distance } from "../types/generated";
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
  } = args.filterBy;

  const user = await requireUserSession(context);

  if (
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
    .where("boo.organisation_id", "=", Number(orgId))
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
    .groupBy([
      "es.operator_noc",
      "ao.name",
      "es.noc_and_line_and_servicecode",
      "es.line_name",
    ])
    .select([
      "es.operator_noc as operatorId",
      "es.noc_and_line_and_servicecode as nocLineAndServiceCode",
      "es.line_name as lineName",
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

  return query.execute();
};

const distancesResolver: Resolvers = {
  Query: {
    distances: getDistances,
  },
};

export default distancesResolver;
