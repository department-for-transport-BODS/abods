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
import { ComparisonOperatorExpression, Kysely } from "kysely";
import { DB } from "../kysely.js";
import dayjs from "dayjs";

const accessAllowedWithinAnHour = 10;

const isUserAllowedAccess = (
  lastAccessed: Date | null | undefined,
  accessedCount: number,
) => {
  const currentTimestamp = dayjs();
  const diffLastAccessed = currentTimestamp.diff(dayjs(lastAccessed), "minute");
  if (!lastAccessed || diffLastAccessed > 60) return true;

  if (accessedCount >= accessAllowedWithinAnHour && diffLastAccessed <= 60) {
    return false;
  }

  return true;
};

const updateAccess = async (
  user_id: number,
  previousAccessDetails: Awaited<
    ReturnType<typeof getDataMonitoringAccessDetails>
  >,
  db: Kysely<DB>,
) => {
  const currentTimestamp = dayjs();

  let accessCount =
    (previousAccessDetails?.data_monitoring_access_count ?? 0) + 1;

  let access_count_operator: ComparisonOperatorExpression = "=";

  if (previousAccessDetails?.data_monitoring_access_count === null) {
    access_count_operator = "is";
  }
  let updateQuery = db
    .updateTable("login_details")
    .where("user_id", "=", user_id)
    .where(
      "data_monitoring_access_count",
      access_count_operator,
      previousAccessDetails?.data_monitoring_access_count ?? null,
    );

  if (
    !previousAccessDetails?.data_monitoring_last_accessed ||
    currentTimestamp.diff(
      dayjs(previousAccessDetails?.data_monitoring_last_accessed),
      "minute",
    ) > 60
  ) {
    if (previousAccessDetails?.data_monitoring_access_count !== null) {
      accessCount = 0;
    }
    updateQuery = updateQuery.set({
      data_monitoring_last_accessed: currentTimestamp.toDate(),
    });
  }

  const updatedRows = await updateQuery
    .set({
      data_monitoring_access_count: accessCount,
    })
    .executeTakeFirst();

  return updatedRows.numUpdatedRows;
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

  const dashboardAccessDetails = await getDataMonitoringAccessDetails(
    user.id,
    context.kysely,
  );

  const allowAccess = isUserAllowedAccess(
    dashboardAccessDetails?.data_monitoring_last_accessed,
    dashboardAccessDetails?.data_monitoring_access_count ?? 0,
  );

  if (!allowAccess) {
    return {
      enabled: allowAccess,
    };
  }

  const rowsUpdated = await updateAccess(
    user.id,
    dashboardAccessDetails,
    context.kysely,
  );

  if (Number(rowsUpdated) < 1) {
    return {
      enabled: allowAccess,
    };
  }

  const [url, ___] = await Promise.all([
    getDashboardUrl(sessionTags, dashboardId),
    sendDistributionMetric(
      "abods.graphql.quicksight.request",
      1,
      "function:GraphQlFunction",
      `env:${process.env.PROJECT_ENV}`,
      `user:${user.id}`,
    ),
  ]);

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
