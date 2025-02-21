import { sendDistributionMetric } from "datadog-lambda-js";
import { assumeRole, getDashboardUrl, getQuicksighClient } from "../lib/aws.js";
import { getOperatorsFromOrgId } from "../lib/otp.js";
import {
  AwsQuicksightUser,
  QueryResolvers,
  Resolvers,
} from "../types/generated";
import { requireUserSession } from "./helpers.js";

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
  const orgOperators = await getOperatorsFromOrgId(user.orgId, context.db);

  const url = await getDashboardUrl(
    orgOperators.map((op) => op.operatorref),
    quickSightClient,
  );

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
