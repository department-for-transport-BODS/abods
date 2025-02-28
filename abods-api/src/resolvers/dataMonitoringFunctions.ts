import { sendDistributionMetric } from "datadog-lambda-js";
import {
  checkRequiredQuicksightVars,
  getDashboardId,
  getDashboardUrl,
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
  checkRequiredQuicksightVars();
  const user = await requireUserSession(context);
  sendDistributionMetric(
    "abods.graphql.quicksight.request",
    1,
    "function:GraphQlFunction",
    `env:${process.env.PROJECT_ENV}`,
    `user:${user.id}`,
  );

  const userDetails = await getUserTypeDetails(context.kysely, user.id);

  const localTransportAuthorityNames = userDetails
    .filter((user) => user.lta_name !== null)
    .map((user) => user.lta_name!);

  const organisationNames = userDetails
    .filter((user) => user.org_name !== null)
    .map((user) => user.org_name!);

  const isAdmin = userDetails.some((user) => user.is_superuser === true);
  const dashboardId = getDashboardId(isAdmin, localTransportAuthorityNames);

  if (!dashboardId) {
    throw Error("No quicksight dashboard id set in environment variables");
  }

  const sessionTags = getSessionTags(
    isAdmin,
    localTransportAuthorityNames,
    organisationNames,
  );
  const url = await getDashboardUrl(sessionTags, dashboardId);

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
