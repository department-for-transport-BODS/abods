import { sendDistributionMetric } from "datadog-lambda-js";
import {
  DataAndServiceMonitoringAccess,
  MutationResolvers,
  Resolvers,
} from "../types/generated";
import { requireUserSession } from "./helpers.js";
import { GraphQLError } from "graphql";
import dayjs from "dayjs";
import { SessionUser } from "../types/extra";
import { Kysely } from "kysely";
import { DB } from "../kysely";

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
  let accessCount = user.serviceMonitoringAccessCount + 1;
  let updateQuery = db.updateTable("Tokens").where("user_id", "=", user.id);

  if (
    !user.serviceMonitoringLastAccessed ||
    currentTimestamp.diff(dayjs(user.serviceMonitoringLastAccessed), "hour") >
      24
  ) {
    accessCount = 0;
    updateQuery = updateQuery.set({
      service_monitoring_last_accessed: currentTimestamp.toDate(),
    });
  }

  await updateQuery
    .set({
      service_monitoring_access_count: accessCount,
    })
    .execute();
};

export const accessServiceMonitoring: MutationResolvers["accessServiceMonitoring"] =
  async (_, __, context): Promise<DataAndServiceMonitoringAccess> => {
    if (!process.env.DATADOG_SERVICE_MONITORING_DASHBOARD) {
      throw new GraphQLError(
        "Non admin user invoked the view service monitoring page",
        {
          extensions: { code: "NOT_FOUND", http: { status: 404 } },
        },
      );
    }

    const user = await requireUserSession(context);

    if (!user.canViewServiceMonitoring) {
      throw new GraphQLError(
        "Non admin user invoked the view service monitoring page",
        {
          extensions: { code: "BAD_REQUEST", http: { status: 401 } },
        },
      );
    }

    const allowAccess = isUserAllowedAccess(
      user.serviceMonitoringLastAccessed,
      user.serviceMonitoringAccessCount,
    );

    if (!allowAccess) {
      return {
        enabled: allowAccess,
      };
    }

    await Promise.all([
      updateAccess(user, context.kysely),
      sendDistributionMetric(
        "abods.graphql.datadog.request",
        1,
        "function:GraphQlFunction",
        `env:${process.env.PROJECT_ENV}`,
        `user:${user.id}`,
      ),
    ]);

    return {
      enabled: true,
      url: process.env.DATADOG_SERVICE_MONITORING_DASHBOARD,
    };
  };

const serviceMonitoringResolvers: Resolvers = {
  Mutation: {
    accessServiceMonitoring: accessServiceMonitoring,
  },
};

export default serviceMonitoringResolvers;
