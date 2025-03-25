import {
  AlertType,
  AlertTypeEnum,
  FeatureFlag,
  LoginInfo,
  LoginResponse,
  Maybe,
  MutationResolvers,
  MutationResponseType,
  QueryResolvers,
  Resolvers,
  UserType,
} from "../types/generated.js";
import { v4 as uuidv4 } from "uuid";
import argon2 from "argon2";
import logger from "../logger.js";
import { requireUserSession } from "./helpers.js";
import { PrismaClient } from "@prisma/client";
import { sendDistributionMetric } from "datadog-lambda-js";
import { getUserOrgIds } from "../lib/utils.js";
import { isLocal } from "../prismaClient";

const SESSION_EXPIRY_TIME_IN_SECONDS = 60 * 60 * 24 * 14;
const accountTypes = {
  admin: 1,
  orgAdmin: 2,
  orgStaff: 3,
  developer: 4,
  agentUser: 5,
};

const supportUserEmailDomain = "@kpmg.co.uk";
const dftUserEmailDomain = "@dft.gov.uk";
// Summary: fetch all users
export const getUsers: QueryResolvers["users"] = async (
  _,
  __,
  context,
): Promise<Maybe<UserType[]>> => {
  const user = await requireUserSession(context);
  try {
    return await context.db.bods_user
      .findMany({
        where: {
          userOrganisations: {
            every: {
              organisation_id: { in: user.orgIds },
            },
          },
        },
        select: {
          id: true,
          username: true,
          first_name: true,
          last_name: true,
        },
      })
      .then((x) =>
        x.map((thisUser) => ({
          id: String(thisUser.id),
          username: thisUser.username,
          firstName: thisUser.first_name,
          lastName: thisUser.last_name,
        })),
      );
  } catch (error) {
    logger.error(error, "An error occurred when getting users");
    return null;
  }
};
// Summary: fetch a single user by id
export const getUser: QueryResolvers["user"] = async (
  _,
  __,
  context,
): Promise<Maybe<LoginInfo>> => {
  const user = await requireUserSession(context);
  try {
    const userDetails = await context.db.bods_user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        userOrganisations: {
          select: {
            organisation: { select: { is_abods_global_viewer: true } },
          },
        },
        email: true,
        account_type: true,
      },
    });

    const email = userDetails.email.toLowerCase();

    // Allow access to users with dft.gov.uk and site admins (account_type = 1)
    const canViewServiceMonitoring =
      email.endsWith(supportUserEmailDomain) ||
      (userDetails.account_type === accountTypes.admin &&
        email.endsWith(dftUserEmailDomain));

    const isAdmin = userDetails.userOrganisations.some(
      (org) => org.organisation.is_abods_global_viewer === true,
    );

    const flags: FeatureFlag[] = [];
    const addFlag = (env_var: string, flag: FeatureFlag) => {
      if (isLocal()) {
        flags.push(flag);
      }
      if (env_var in process.env && process.env[env_var] === "true") {
        flags.push(flag);
      }
    };

    addFlag("FLAG_DATA_MONITORING", FeatureFlag.DataMonitoring);
    addFlag("FLAG_SERVICE_MONITORING", FeatureFlag.ServiceMonitoring);
    addFlag("FLAG_STOP_ANALYSIS", FeatureFlag.StopAnalysis);

    return {
      currentUserId: user.id.toString(),
      canViewServiceMonitoring: canViewServiceMonitoring,
      canEditAllAlerts: isAdmin,
      serviceMonitoringEmbedUrl: canViewServiceMonitoring
        ? process.env.DATADOG_SERVICE_MONITORING_DASHBOARD
        : null,
      flags: flags,
    };
  } catch (error) {
    logger.error(error, "An error occurred when getting user info");
    return null;
  }
};

// Summary: fetch all user alerts
export const getUserAlerts: QueryResolvers["userAlerts"] = async (
  _,
  args,
  context,
): Promise<Maybe<AlertType[]>> => {
  const user = await requireUserSession(context);
  try {
    // fetch alerts ONLY if user is creator or recipient
    const alerts = await context.db.alert.findMany({
      where: {
        OR: [
          {
            created_by: {
              equals: user.id,
            },
          },
          {
            send_to: {
              equals: user.id,
            },
          },
        ],
      },
      include: {
        created_by_user: true,
        send_to_user: true,
      },
    });

    if (!alerts) {
      throw new Error("Alerts not found");
    }

    return alerts.map((alert) => {
      return {
        alertId: alert.id,
        alertType: alert.alert?.trim() as AlertTypeEnum,
        eventHysterisis: alert.event_hysterisis?.toNumber(),
        eventThreshold: alert.event_threshold?.toNumber(),
        createdBy: alert.created_by_user
          ? {
              id: String(alert.created_by_user.id),
              username: alert.created_by_user.username,
              firstName: alert.created_by_user.first_name,
              lastName: alert.created_by_user.last_name,
            }
          : null,
        sendTo: alert.send_to_user
          ? {
              id: String(alert.send_to_user.id),
              username: alert.send_to_user.username,
              firstName: alert.send_to_user.first_name,
              lastName: alert.send_to_user.last_name,
            }
          : null,
      };
    });
  } catch (error) {
    logger.error(error, "An error occurred when getting user alerts");
    return null;
  }
};

// Summary: log the user in
export const loginUser: MutationResolvers["login"] = async (
  _,
  args,
  context,
): Promise<LoginResponse> => {
  logger.debug({ username: args.username }, "Logging in user");
  try {
    if (!args.username || !args.password) {
      throw "Invalid username or password";
    }

    const bodsUser = await context.db.bods_user.findFirst({
      where: {
        email: { equals: args.username, mode: "insensitive" },
        is_active: true,
      },
      select: {
        id: true,
        password: true,
        userOrganisations: { select: { organisation_id: true } },
      },
    });

    if (!bodsUser) {
      logger.debug("User not found in bods user table");
      throw "Invalid username or password";
    }

    const orgIds = getUserOrgIds(bodsUser);

    const strippedPassword = bodsUser.password.replace("argon2$", "$");
    if (await argon2.verify(strippedPassword, args.password)) {
      const token = uuidv4();
      const expiryTimeMilliseconds = SESSION_EXPIRY_TIME_IN_SECONDS * 1000;
      const now = new Date();
      const expires = new Date(Date.now() + expiryTimeMilliseconds);
      const user_id = bodsUser.id;
      const tokenRecord = { user_id, token, expires };
      const loginDetails = { user_id, last_login: now };
      await Promise.all([
        context.db.tokens.upsert({
          where: { user_id },
          create: tokenRecord,
          update: tokenRecord,
        }),
        context.db.login_details.upsert({
          where: { user_id },
          create: loginDetails,
          update: loginDetails,
        }),
      ]);
      const expiryTimestamp = expires.toUTCString();

      context.res.setHeader(
        "Set-Cookie",
        `abods_sessionid=${token}; expires=${expiryTimestamp}; HttpOnly; Max-Age=${SESSION_EXPIRY_TIME_IN_SECONDS}; Path=/; SameSite=None; Secure`,
      );

      sendDistributionMetric(
        "abods.graphql.login.count",
        1,
        "function:GraphQlFunction",
        `env:${process.env.PROJECT_ENV}`,
        ...orgIds.map((orgId) => `org:${orgId}`),
      );
      return { success: true, expiresAt: expiryTimestamp };
    } else {
      logger.debug("Invalid password entered");
      throw "Invalid username or password";
    }
  } catch (error) {
    logger.error(error);
    return { success: false };
  }
};

export const logoutUser: MutationResolvers["logout"] = async (
  _,
  __,
  context,
): Promise<boolean> => {
  const user = await requireUserSession(context);
  try {
    await context.db.tokens.delete({
      where: {
        user_id: user.id,
      },
    });

    return true;
  } catch (error) {
    logger.error(error, "An error occurred on user log out");
    return false;
  }
};

export const getUserAlert: QueryResolvers["userAlert"] = async (
  _,
  args,
  context,
): Promise<Maybe<AlertType>> => {
  const user = await requireUserSession(context);
  try {
    if (!args.alertId) {
      throw new Error("Alert id required");
    }

    return getUserAlertFromDb(args.alertId, user.id, context.db);
  } catch (error) {
    logger.error(error, "An error occurred when getting user alert info");
    return null;
  }
};

async function getUserAlertFromDb(
  alertId: string,
  userId: number,
  db: PrismaClient,
) {
  // fetch alert by id and ONLY if user is creator or recipient
  const alert = await db.alert.findUnique({
    where: {
      id: alertId,
      AND: {
        OR: [
          {
            created_by: {
              equals: userId,
            },
          },
          {
            send_to: {
              equals: userId,
            },
          },
        ],
      },
    },
    include: {
      created_by_user: true,
      send_to_user: true,
    },
  });

  if (!alert) {
    throw new Error("Alert not found");
  }

  return {
    alertId: alert.id,
    alertType: alert.alert?.trim() as AlertTypeEnum,
    eventHysterisis: alert.event_hysterisis?.toNumber(),
    eventThreshold: alert.event_threshold?.toNumber(),
    createdBy: alert.created_by_user
      ? {
          id: alert.created_by_user.id.toString(),
          username: alert.created_by_user.username,
          firstName: alert.created_by_user.first_name,
          lastName: alert.created_by_user.last_name,
        }
      : null,
    sendTo: alert.send_to_user
      ? {
          id: alert.send_to_user.id.toString(),
          username: alert.send_to_user.username,
          firstName: alert.send_to_user.first_name,
          lastName: alert.send_to_user.last_name,
        }
      : null,
  };
}

export const addUserAlert: MutationResolvers["addUserAlert"] = async (
  _,
  args,
  context,
): Promise<MutationResponseType> => {
  const user = await requireUserSession(context);
  try {
    const { alertType, eventHysterisis, eventThreshold, sendTo } = args.payload;

    // TODO: check if sendto user id is in one of the same organisations as created_by user
    await context.db.alert.create({
      data: {
        alert: alertType,
        event_hysterisis: eventHysterisis,
        event_threshold: eventThreshold,
        send_to: Number(sendTo.id),
        created_by: user.id,
      },
    });

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error(error, "An error occurred when adding user alert");
    return {
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
};

const updateUserAlert: MutationResolvers["updateUserAlert"] = async (
  _,
  args,
  context,
): Promise<MutationResponseType> => {
  const user = await requireUserSession(context);
  try {
    const { alertType, eventHysterisis, eventThreshold, sendTo } = args.payload;

    if (!args.alertId) {
      throw new Error("AlertId is required");
    }

    const alert = await getUserAlertFromDb(args.alertId, user.id, context.db);

    if (!alert) {
      throw new Error("Alert not found");
    }

    await context.db.alert.update({
      where: {
        id: alert.alertId,
      },
      data: {
        alert: alertType,
        event_hysterisis: eventHysterisis,
        event_threshold: eventThreshold,
        send_to: sendTo ? Number(sendTo.id) : null,
      },
    });

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error(error, "An error occurred when updating user alert");
    return {
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
};

export const deleteUserAlert: MutationResolvers["deleteUserAlert"] = async (
  _,
  args,
  context,
): Promise<MutationResponseType> => {
  const user = await requireUserSession(context);
  try {
    if (!args.alertId) {
      throw new Error("AlertId is required");
    }

    const alert = await getUserAlertFromDb(args.alertId, user.id, context.db);

    if (alert) {
      await context.db.alert.delete({ where: { id: args.alertId } });
    } else {
      throw "Not Authorized";
    }

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error(error, "An error occurred when deleting user alert");
    return {
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
};

const userResolvers: Resolvers = {
  Query: {
    user: getUser,
    users: getUsers,
    userAlerts: getUserAlerts,
    userAlert: getUserAlert,
  },
  Mutation: {
    login: loginUser,
    logout: logoutUser,
    addUserAlert: addUserAlert,
    updateUserAlert: updateUserAlert,
    deleteUserAlert: deleteUserAlert,
  },
};

export default userResolvers;
