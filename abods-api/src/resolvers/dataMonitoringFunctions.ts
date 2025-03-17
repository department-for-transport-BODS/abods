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
import { Kysely } from "kysely";
import { DB } from "../kysely.js";
import dayjs from "dayjs";

const allowedSessionsWithin10mins = 10;
const accessAllowedWithinAnHour = 20;
const accessAllowedWithinADay = 50;

const isUserAllowedAccess = (
  lastAccessed: Date | null | undefined,
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

const updateAccess = async (
  user_id: number,
  dataMonitoringAccessCount: number,
  dataMonitoringLastAccessed: Date | null | undefined,
  db: Kysely<DB>,
) => {
  const currentTimestamp = dayjs();
  let accessCount = dataMonitoringAccessCount + 1;
  let updateQuery = db
    .updateTable("login_details")
    .where("user_id", "=", user_id);

  if (
    !dataMonitoringLastAccessed ||
    currentTimestamp.diff(dayjs(dataMonitoringLastAccessed), "hour") > 24
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

const getDataMonitoringAccessDetails = (user_id: number, db: Kysely<DB>) => {
  return db
    .selectFrom("login_details")
    .select(["data_monitoring_access_count", "data_monitoring_last_accessed"])
    .where("user_id", "=", user_id)
    .executeTakeFirst();
};

export const getEmbeddedUrl: QueryResolvers["embeddedUrl"] = async (
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

  const [url, dashboardAccessDetails] = await Promise.all([
    getDashboardUrl(sessionTags, dashboardId),
    getDataMonitoringAccessDetails(user.id, context.kysely),
  ]);

  const allowAccess = isUserAllowedAccess(
    dashboardAccessDetails?.data_monitoring_last_accessed,
    dashboardAccessDetails?.data_monitoring_access_count ?? 0,
  );

  if (!allowAccess) {
    return {
      enabled: allowAccess,
    };
  }

  if (url) {
    await Promise.all([
      updateAccess(
        user.id,
        dashboardAccessDetails?.data_monitoring_access_count ?? 0,
        dashboardAccessDetails?.data_monitoring_last_accessed,
        context.kysely,
      ),
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
  Query: {
    embeddedUrl: getEmbeddedUrl,
  },
};

export default dataMonitoringResolvers;
