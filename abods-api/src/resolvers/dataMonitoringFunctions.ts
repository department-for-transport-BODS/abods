import { sendDistributionMetric } from "datadog-lambda-js";
import {
  checkRequiredQuicksightVars,
  getDashboardId,
  getDashboardUrl,
  getSessionTags,
} from "../lib/aws.js";
import {
  AwsQuicksightUser,
  MutationResolvers,
  Resolvers,
} from "../types/generated";
import { requireUserSession } from "./helpers.js";
import { getUserTypeDetails } from "../lib/operators.js";
import logger from "../logger.js";
import { SessionUser } from "../types/extra.js";
import { Kysely } from "kysely";
import { DB } from "../kysely.js";
import dayjs from "dayjs";

const allowedSessionsWithin10mins = 10;
const accessAllowedWithinAnHour = 20;
const accessAllowedWithinADay = 50;

const isUserAllowedAccess = (
  lastAccessed: Date | null,
  accessedCount: number,
) => {
  const currentTimestamp = dayjs();
  const diffLastAccessed = currentTimestamp.diff(dayjs(lastAccessed), "minute");

  if (
    (lastAccessed &&
      accessedCount > allowedSessionsWithin10mins &&
      diffLastAccessed <= 10) ||
    (accessedCount > accessAllowedWithinAnHour && diffLastAccessed <= 60) ||
    (accessedCount > accessAllowedWithinADay && diffLastAccessed <= 24 * 60)
  ) {
    return false;
  }

  return true;
};

const updateAccess = async (user: SessionUser, db: Kysely<DB>) => {
  const currentTimestamp = dayjs();
  let accessCount = user.dataMonitoringAccessCount + 1;
  let updateQuery = db.updateTable("Tokens").where("user_id", "=", user.id);

  if (
    !user.dataMonitoringLastAccessed ||
    currentTimestamp.diff(dayjs(user.dataMonitoringLastAccessed), "hour") > 24
  ) {
    accessCount = 0;
    updateQuery = updateQuery.set({
      data_monitoring_last_accessed: currentTimestamp.toDate(),
    });
  }

  await updateQuery
    .set({
      data_monitoring_access_count: accessCount,
    })
    .execute();
};

export const getEmbeddedUrl: MutationResolvers["embeddedUrl"] = async (
  _,
  __,
  context,
): Promise<AwsQuicksightUser> => {
  checkRequiredQuicksightVars();
  const user = await requireUserSession(context);

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

  const allowAccess = isUserAllowedAccess(
    user.dataMonitoringLastAccessed,
    user.dataMonitoringAccessCount,
  );

  if (!allowAccess) {
    return {
      enabled: allowAccess,
    };
  }

  if (url) {
    await Promise.all([
      updateAccess(user, context.kysely),
      sendDistributionMetric(
        "abods.graphql.quicksight.request",
        1,
        "function:GraphQlFunction",
        `env:${process.env.PROJECT_ENV}`,
        `user:${user.id}`,
      ),
    ]);
  }

  logger.info("Dashboard enabled for user");
  return {
    enabled: true,
    url: url,
  };
};

const dataMonitoringResolvers: Resolvers = {
  Mutation: {
    embeddedUrl: getEmbeddedUrl,
  },
};

export default dataMonitoringResolvers;
