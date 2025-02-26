import { sendDistributionMetric } from "datadog-lambda-js";
import {
  assumeRole,
  getDashboardId,
  getDashboardUrl,
  getQuicksighClient,
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

export const getEmbeddedUrl: QueryResolvers["embeddedUrl"] = async (
  _,
  __,
  context,
): Promise<AwsQuicksightUser> => {
  const user = await requireUserSession(context);
  sendDistributionMetric(
    "abods.graphql.quicksight.request",
    1,
    "function:GraphQlFunction",
    `env:${process.env.PROJECT_ENV}`,
    `user:${user.id}`,
  );

  const awsCreds = await assumeRole();
  const quickSightClient = getQuicksighClient(awsCreds);
  const userDetails = await getUserTypeDetails(context.kysely, user.id);

  const ltaUsers = userDetails
    .map((user) => user.lta_name)
    .filter((lta_name) => lta_name !== null);

  const orgUsers = userDetails
    .map((user) => user.org_name)
    .filter((org_name) => org_name !== null);

  const isAdmin = userDetails.some((user) => user.is_superuser === true);

  const sessionTags = getSessionTags(isAdmin, ltaUsers, orgUsers);
  const dashboardId = getDashboardId(isAdmin, ltaUsers);

  if (!dashboardId) {
    throw Error("No quicksight dashboard id set in environment variables");
  }
  const url = await getDashboardUrl(quickSightClient, sessionTags, dashboardId);

  logger.info("Dashboard enabled for user");
  return {
    enabled: true,
    url: url,
  };
};

const dataMonitoringResolvers: Resolvers = {
  Query: {
    embeddedUrl: getEmbeddedUrl,
  },
};

export default dataMonitoringResolvers;
