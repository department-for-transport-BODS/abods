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
import dayjs from "dayjs";

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

  const result = await context.kysely
    .updateTable("login_details")
    .where("user_id", "=", user.id)
    .where((eb) =>
      eb.or([
        eb("data_monitoring_access_refresh", "is", null),
        eb("data_monitoring_access_refresh", "<", now.toDate()),
        eb("data_monitoring_access_count", "<", accessAllowedWithinAnHour),
      ]),
    )
    .set((eb) => {
      const replaceRecord = eb.or([
        eb("data_monitoring_access_refresh", "is", null),
        eb("data_monitoring_access_refresh", "<", now.toDate()),
      ]);
      return {
        data_monitoring_access_count: eb
          .case()
          .when(replaceRecord)
          .then(1)
          .else(eb("data_monitoring_access_count", "+", 1))
          .end(),
        data_monitoring_access_refresh: eb
          .case()
          .when(replaceRecord)
          .then(now.add(1, "hour").toDate())
          .else(eb.ref("data_monitoring_access_refresh"))
          .end(),
      };
    })
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
  sendDistributionMetric(
    "abods.graphql.quicksight.request",
    1,
    "function:GraphQlFunction",
    `env:${process.env.PROJECT_ENV}`,
    `user:${user.id}`,
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
