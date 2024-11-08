import {
  AlertType,
  AlertTypeEnum,
  LoginResponse,
  Maybe,
  MutationResolvers,
  MutationResponseType,
  QueryResolvers,
  Resolvers,
  RoleType,
  ScopeEnum,
  UserType,
} from "../types/generated.js";
import { v4 as uuidv4 } from "uuid";
import argon2 from "argon2";
import logger from "../logger.js";
import { requireUserSession } from "./helpers.js";
import { PrismaClient } from "@prisma/client";

// Summary: fetch all users
export const getUsers: QueryResolvers["users"] = async (
  _,
  __,
  context,
): Promise<Maybe<UserType[]>> => {
  try {
    const user = await requireUserSession(context);

    const bodsUsers = await context.db.bods_user.findMany({
      where: {
        userOrganisations: {
          every: {
            organisation_id: {
              in: user.orgIds,
            },
          },
        },
      },
      include: {
        userOrganisations: true,
      },
    });

    const userResponse = bodsUsers.map((thisUser) => {
      return {
        id: String(thisUser.id),
        username: thisUser.username,
        email: thisUser.email,
        firstName: thisUser.first_name,
        lastName: thisUser.last_name,
        organisation: user.orgIds
          ? {
              id: String(user.orgIds[0]),
              name: String(user.orgIds[0]),
            }
          : null,
        roles: [
          {
            id: "1",
            name: "Staff",
            scope: ScopeEnum.Organisation,
          },
        ],
      };
    });

    return userResponse;
  } catch (error) {
    console.error(error);
    return null;
  }
};
// Summary: fetch a single user by id
export const getUser: QueryResolvers["user"] = async (
  _,
  __,
  context,
): Promise<Maybe<UserType>> => {
  try {
    const user = await requireUserSession(context);

    return {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      roles: [
        {
          id: "1",
          name: "Staff",
          scope: "organisation",
        },
        {
          id: "2",
          name: "Administrator",
          scope: "organisation",
        },
      ],
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Summary: fetch all user alerts
export const getUserAlerts: QueryResolvers["userAlerts"] = async (
  _,
  args,
  context,
): Promise<Maybe<AlertType[]>> => {
  try {
    const user = await requireUserSession(context);

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
              email: alert.created_by_user.email,
              firstName: alert.created_by_user.first_name,
              lastName: alert.created_by_user.last_name,
              roles: new Array<RoleType>(),
            }
          : null,
        sendTo: alert.send_to_user
          ? {
              id: String(alert.send_to_user.id),
              username: alert.send_to_user.username,
              email: alert.send_to_user.email,
              firstName: alert.send_to_user.first_name,
              lastName: alert.send_to_user.last_name,
              roles: new Array<RoleType>(),
            }
          : null,
      };
    });
  } catch {
    return null;
  }
};

// Summary: log the user in
export const loginUser: MutationResolvers["login"] = async (
  _,
  args,
  context,
): Promise<LoginResponse> => {
  logger.debug(`Logging in user: ${args.username}`);
  try {
    if (!args.username || !args.password) {
      throw "Invalid username or password";
    }

    const bodsUser = await context.db.bods_user.findFirst({
      where: { email: { equals: args.username, mode: "insensitive" } },
      include: {
        userOrganisations: true,
      },
    });

    if (!bodsUser) {
      logger.debug("User not found in bods user table");
      throw "Invalid username or password";
    }

    const strippedPassword = bodsUser.password.replace("argon2$", "$");
    if (await argon2.verify(strippedPassword, args.password)) {
      const sessionId = uuidv4();
      const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString();
      const session = await context.db.tokens.findUnique({
        where: {
          user_id: bodsUser.id,
        },
      });

      if (!session) {
        logger.debug("Session in tokens table not found");
        await context.db.tokens.create({
          data: {
            user_id: bodsUser.id,
            token: sessionId,
          },
        });
      } else {
        logger.debug(
          `Session found in tokends table: ${JSON.stringify(session)}`,
        );
        await context.db.tokens.update({
          where: {
            user_id: bodsUser.id,
          },
          data: {
            token: sessionId,
          },
        });
      }

      context.res.setHeader(
        "Set-Cookie",
        `abods_sessionid=${sessionId}; expires=${expires}; HttpOnly; Max-Age=1209600; Path=/; SameSite=None; Secure`,
      );
      return {
        success: true,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toUTCString(),
      };
    } else {
      logger.debug("Invalid password entered");
      throw "Invalid username or password";
    }
  } catch (error) {
    logger.error(error);
    return {
      success: false,
    };
  }
};

export const logoutUser: MutationResolvers["logout"] = async (
  _,
  __,
  context,
): Promise<boolean> => {
  try {
    const user = await requireUserSession(context);

    await context.db.tokens.delete({
      where: {
        user_id: user.id,
      },
    });

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const getUserAlert: QueryResolvers["userAlert"] = async (
  _,
  args,
  context,
): Promise<Maybe<AlertType>> => {
  try {
    const user = await requireUserSession(context);

    if (!args.alertId) {
      throw new Error("Alert id required");
    }

    return getUserAlertFromDb(args.alertId, user.id, context.db);
  } catch {
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
          email: alert.created_by_user.email,
          firstName: alert.created_by_user.first_name,
          lastName: alert.created_by_user.last_name,
        }
      : null,
    sendTo: alert.send_to_user
      ? {
          id: alert.send_to_user.id.toString(),
          username: alert.send_to_user.username,
          email: alert.send_to_user.email,
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
  try {
    const user = await requireUserSession(context);

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
  try {
    const user = await requireUserSession(context);

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
  try {
    const user = await requireUserSession(context);

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
