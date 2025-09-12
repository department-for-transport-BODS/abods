import { sendDistributionMetric } from "datadog-lambda-js";
import {
  checkRequiredQuicksightVars,
  getDashboardId,
  getDashboardUrl,
  getDashboardUserType,
  getSessionTags,
} from "../lib/aws.js";
import {
  AwsQuicksightUser,
  QueryResolvers,
  Resolvers,
} from "../types/generated";
import { requireUserSession } from "./helpers.js";
import { getUserTypeDetails } from "../lib/operators.js";
import logger from "../logger.js";
import dayjs from "dayjs";
import { ExpressionBuilder } from "kysely";
import { DB } from "../kysely";

const accessAllowedWithinAnHour = Number(
  process.env.QUICKSIGHT_ALLOW_USER_ACCESS_COUNT ?? 10,
);

export const getEmbeddedUrl: QueryResolvers["embeddedUrl"] = async (
  _,
  __,
  context,
): Promise<AwsQuicksightUser> => {
  const user = await requireUserSession(context);

  const now = dayjs();

  const pastRefreshTime = (eb: ExpressionBuilder<DB, "login_details">) =>
    eb.or([
      eb("data_monitoring_access_refresh", "is", null),
      eb("data_monitoring_access_refresh", "<", now.toDate()),
    ]);

  const withinAllowedAccess = (eb: ExpressionBuilder<DB, "login_details">) =>
    eb.or([eb("data_monitoring_access_count", "<", accessAllowedWithinAnHour)]);

  const result = await context.kysely
    .updateTable("login_details")
    .where("user_id", "=", user.id)
    .where((eb) => eb.or([pastRefreshTime(eb), withinAllowedAccess(eb)]))
    .set((eb) => ({
      data_monitoring_access_count: eb
        .case()
        .when(pastRefreshTime(eb))
        .then(1)
        .else(eb("data_monitoring_access_count", "+", 1))
        .end(),
      data_monitoring_access_refresh: eb
        .case()
        .when(pastRefreshTime(eb))
        .then(now.add(1, "hour").toDate())
        .else(eb.ref("data_monitoring_access_refresh"))
        .end(),
    }))
    .executeTakeFirst();

  if (Number(result.numUpdatedRows) < 1) {
    logger.debug("Throttled access to data monitoring");
    return { enabled: false };
  }
  logger.debug("Generating data monitoring url");
  checkRequiredQuicksightVars();

  const userDetails = await getUserTypeDetails(context.kysely, user.id);

  const localTransportAuthorityNames = userDetails
    .filter((user) => user.lta_name !== null)
    .map((user) => user.lta_name!);

  const organisationNames = userDetails
    .filter((user) => user.org_name !== null)
    .map((user) => user.org_name!);

  const userType = getDashboardUserType(userDetails);

  const dashboardId = getDashboardId(userType);

  if (!dashboardId) {
    throw Error("No quicksight dashboard id set in environment variables");
  }

  const isAdmin = userDetails.some((user) => user.is_superuser === true);

  const sessionTags = getSessionTags(
    isAdmin,
    localTransportAuthorityNames,
    organisationNames,
  );

  const url = await getDashboardUrl(sessionTags, dashboardId);
  sendDistributionMetric(
    "abods.graphql.quicksight.request",
    1,
    "function:GraphQlFunction",
    `env:${process.env.PROJECT_ENV}`,
    `abods-db-user-id:${user.id}`,
    ...user.orgs.map((org) => `org:${org.name}`),
  );
  logger.info("Dashboard enabled for user");
  return { enabled: true, url: url };
};

const dataMonitoringResolvers: Resolvers = {
  Query: {
    embeddedUrl: getEmbeddedUrl,
  },
};

export default dataMonitoringResolvers;
