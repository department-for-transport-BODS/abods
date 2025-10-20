import argon2 from "argon2";
import { sendDistributionMetric } from "datadog-lambda-js";
import { v4 as uuidv4 } from "uuid";
import { executeQuery } from "../lib/dbKysely.js";
import logger from "../logger.js";
import { isLocal } from "../prismaClient.js";
import {
  FeatureFlag,
  LoginInfo,
  LoginResponse,
  Maybe,
  MutationResolvers,
  Organisation,
  QueryResolvers,
  Resolvers,
} from "../types/generated.js";
import { requireUserSession, throwUnauthenticatedError } from "./helpers.js";

const SESSION_EXPIRY_TIME_IN_SECONDS = 60 * 60 * 24 * 14;
export const accountTypes = {
  admin: 1,
  orgAdmin: 2,
  orgStaff: 3,
  developer: 4,
  agentUser: 5,
};

const supportUserEmailDomain = "@kpmg.co.uk";
const dftUserEmailDomain = "@dft.gov.uk";

export const getFeatureFlags = () => {
  const flags: FeatureFlag[] = [];
  const flagPrefix = "ABODS_FLAG_";
  for (const key of Object.keys(FeatureFlag)) {
    const envVarName = flagPrefix + key;
    const flag = FeatureFlag[key as FeatureFlag];
    if (!isLocal() || process.env.ENABLE_FEATURE_FLAG_LOCAL) {
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

    return {
      currentUserId: user.id.toString(),
      canViewServiceMonitoring: canViewServiceMonitoring,
      canEditAllAlerts: isAdmin,
      canViewDistances: isAdmin,
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
        userOrganisations: {
          select: {
            organisation_id: true,
            organisation: { select: { name: true } },
          },
        },
      },
    });

    if (!bodsUser) {
      logger.debug("User not found in bods user table");
      throw "Invalid username or password";
    }

    if (bodsUser.userOrganisations.length < 1) {
      logger.error(
        { userId: bodsUser.id },
        "User not mapped to an organisation",
      );
      throwUnauthenticatedError("User not mapped to any organisation");
    }

    const orgNames = bodsUser.userOrganisations.map((n) => n.organisation.name);

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
        `abods-db-user-id:${user_id}`,
        ...orgNames.map((name) => `org:${name}`),
      );
      return { success: true, expiresAt: expires.toISOString() };
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

export const getUserOrgs: QueryResolvers["userOrgs"] = async (
  _,
  __,
  context,
): Promise<Organisation[]> => {
  const user = await requireUserSession(context);

  const orgs = context.kysely
    .selectFrom("bods_organisation")
    .select(["name", "id", "is_abods_global_viewer"])
    .where("name", "is not", null);
  let userOrgs = await executeQuery(
    orgs.where(
      "id",
      "in",
      user.orgs.map((org) => org.id),
    ),
  );
  if (userOrgs.some((org) => org.is_abods_global_viewer)) {
    userOrgs = await executeQuery(orgs.distinct());
  }

  return userOrgs.map((org) => ({
    id: org.id,
    name: org.name ?? "-",
  }));
};

const userResolvers: Resolvers = {
  Query: {
    user: getUser,
    userOrgs: getUserOrgs,
  },
  Mutation: {
    login: loginUser,
    logout: logoutUser,
  },
};

export default userResolvers;
