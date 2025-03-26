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
import { sendDistributionMetric } from "datadog-lambda-js";
import { getUserOrgIds } from "../lib/utils.js";
import { isLocal } from "../dbHelpers.js";
import { Kysely, sql } from "kysely";
import { DB } from "../kysely";

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
    return await context.kysely
      .selectFrom("bods_user")
      .where(
        "id",
        "in",
        context.kysely
          .selectFrom("bods_userorganisation")
          .where("bods_userorganisation.organisation_id", "in", user.orgIds)
          .select("user_id"),
      )
      .select(["id", "username", "first_name", "last_name"])
      .execute()
      .then((x) =>
        x.map((thisUser) => ({
          id: String(thisUser.id),
          username: thisUser.username ?? "",
          firstName: thisUser.first_name,
          lastName: thisUser.last_name,
        })),
      );
  } catch (error) {
    logger.error(error, "An error occurred when getting users");
    return null;
  }
};

const getFeatureFlags = () => {
  const flags: FeatureFlag[] = [];
  const flagPrefix = "ABODS_FLAG_";
  for (const key of Object.keys(FeatureFlag)) {
    const envVarName = flagPrefix + key;
    const flag = FeatureFlag[key as FeatureFlag];
    if (!isLocal()) {
      if (!(envVarName in process.env)) continue;
      if (process.env[envVarName] !== "true") continue;
    }
    flags.push(flag);
  }
  return flags;
};

export const getUser: QueryResolvers["user"] = async (
  _,
  __,
  context,
): Promise<Maybe<LoginInfo>> => {
  const user = await requireUserSession(context);
  try {
    const userDetails = await context.kysely
      .selectFrom("bods_user")
      .where("id", "=", user.id)
      .select(["email", "account_type"])
      .select((eb) =>
        eb
          .exists(
            eb
              .selectFrom("bods_userorganisation as uo")
              .innerJoin("bods_organisation as o", "o.id", "uo.organisation_id")
              .where("uo.user_id", "=", user.id)
              .where("o.is_abods_global_viewer", "=", true),
          )
          .as("has_global_viewer_org"),
      )
      .executeTakeFirstOrThrow();
    if (!userDetails.email) throw new Error("Email is null");

    const email = userDetails.email.toLowerCase();

    // Allow access to users with dft.gov.uk and site admins (account_type = 1)
    const canViewServiceMonitoring =
      email.endsWith(supportUserEmailDomain) ||
      (userDetails.account_type === accountTypes.admin &&
        email.endsWith(dftUserEmailDomain));

    return {
      currentUserId: user.id.toString(),
      canViewServiceMonitoring: canViewServiceMonitoring,
      canEditAllAlerts: Boolean(userDetails.has_global_viewer_org),
      serviceMonitoringEmbedUrl: canViewServiceMonitoring
        ? process.env.DATADOG_SERVICE_MONITORING_DASHBOARD
        : null,
      flags: getFeatureFlags(),
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
    const alerts = await context.kysely
      .selectFrom("Alert as a")
      .where((eb) =>
        eb.or([
          eb("a.created_by", "=", user.id),
          eb("a.send_to", "=", user.id),
        ]),
      )
      .leftJoin("bods_user as c", "c.id", "a.created_by")
      .leftJoin("bods_user as s", "s.id", "a.send_to")
      .select([
        "a.id",
        "a.alert",
        "a.event_hysterisis",
        "a.event_threshold",
        "c.id as creator_id",
        "c.username as creator_username",
        "c.first_name as creator_first_name",
        "c.last_name as creator_last_name",
        "s.id as sender_id",
        "s.username as sender_username",
        "s.first_name as sender_first_name",
        "s.last_name as sender_last_name",
      ])
      .execute();

    if (alerts.length === 0) {
      throw new Error("Alerts not found");
    }

    return alerts.map((alert) => ({
      alertId: alert.id,
      alertType: alert.alert?.trim() as AlertTypeEnum,
      eventHysterisis: Number(alert.event_hysterisis),
      eventThreshold: Number(alert.event_threshold),
      createdBy: alert.creator_id
        ? {
            id: String(alert.creator_id),
            username: alert.creator_username!,
            firstName: alert.creator_first_name!,
            lastName: alert.creator_last_name!,
          }
        : null,
      sendTo: alert.sender_id
        ? {
            id: String(alert.sender_id),
            username: alert.sender_username!,
            firstName: alert.sender_first_name!,
            lastName: alert.sender_last_name!,
          }
        : null,
    }));
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

    const bodsUser = await context.kysely
      .selectFrom("bods_user as u")
      .innerJoin("bods_userorganisation as o", "o.user_id", "u.id")
      .where(
        (eb) => eb.fn<string>("lower", ["u.email"]),
        "=",
        args.username.toLowerCase(),
      )
      .where("u.is_active", "=", true)
      .groupBy(["u.id", "u.password"])
      .select([
        "u.id",
        "u.password",
        sql<string>`string_agg(distinct o.organisation_id::text, ',')`.as(
          "org_ids",
        ),
      ])
      .executeTakeFirst()
      .then((r) => {
        if (!r) return r;
        return {
          password: r.password,
          id: r.id,
          orgIds: r.org_ids.split(",").map(Number),
        };
      });

    if (!bodsUser?.password || !bodsUser.id) {
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
        context.kysely
          .insertInto("Tokens")
          .values(tokenRecord)
          .onConflict((oc) =>
            oc.doUpdateSet((eb) => ({
              token: eb.ref("excluded.token"),
              expires: eb.ref("excluded.expires"),
            })),
          ),
        context.kysely
          .insertInto("login_details")
          .values(loginDetails)
          .onConflict((oc) =>
            oc.doUpdateSet((eb) => ({
              last_login: eb.ref("excluded.last_login"),
            })),
          ),
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
    await context.kysely
      .deleteFrom("Tokens")
      .where("user_id", "=", user.id)
      .execute();
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

    return getUserAlertFromDb(args.alertId, user.id, context.kysely);
  } catch (error) {
    logger.error(error, "An error occurred when getting user alert info");
    return null;
  }
};

async function getUserAlertFromDb(
  alertId: string,
  userId: number,
  db: Kysely<DB>,
) {
  // fetch alert by id and ONLY if user is creator or recipient
  const alert = await db
    .selectFrom("Alert")
    .where("id", "=", alertId)
    .where((eb) =>
      eb.or([eb("send_to", "=", userId), eb("created_by", "=", userId)]),
    )
    .select(["id", "alert", "event_hysterisis", "event_threshold"])
    .executeTakeFirst();
  if (!alert) {
    throw new Error("Alert not found");
  }

  return {
    alertId: alert.id,
    alertType: alert.alert?.trim() as AlertTypeEnum,
    eventHysterisis:
      alert.event_hysterisis === undefined || alert.event_hysterisis === null
        ? alert.event_hysterisis
        : Number(alert.event_hysterisis),
    eventThreshold:
      alert.event_threshold === undefined || alert.event_threshold === null
        ? alert.event_threshold
        : Number(alert.event_threshold),
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
    await context.kysely
      .insertInto("Alert")
      .values({
        alert: alertType,
        event_hysterisis: eventHysterisis?.toString(),
        event_threshold: eventThreshold?.toString(),
        send_to: Number(sendTo.id),
        created_by: user.id,
      })
      .execute();

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

    const alert = await getUserAlertFromDb(
      args.alertId,
      user.id,
      context.kysely,
    );

    if (!alert) {
      throw new Error("Alert not found");
    }

    await context.kysely
      .updateTable("Alert")
      .where("id", "=", args.alertId)
      .set({
        alert: alertType,
        event_hysterisis: eventHysterisis?.toString(),
        event_threshold: eventThreshold?.toString(),
        send_to: sendTo ? Number(sendTo.id) : null,
      })
      .execute();

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

    const alert = await getUserAlertFromDb(
      args.alertId,
      user.id,
      context.kysely,
    );

    if (alert) {
      await context.kysely
        .deleteFrom("Alert")
        .where("id", "=", args.alertId)
        .execute();
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
