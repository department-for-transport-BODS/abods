import argon2 from "argon2";
import { createHmac, randomBytes } from "node:crypto";
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
import dayjs from "dayjs";

const SESSION_EXPIRY_TIME_IN_SECONDS = 60 * 60 * 24 * 14;
export const accountTypes = {
  admin: 1,
  orgAdmin: 2,
  orgStaff: 3,
  developer: 4,
  agentUser: 5,
};

const dftUserEmailDomain = "@dft.gov.uk";

const INCORRECT_LOGIN_MAX_ATTEMPTS = parseInt(
  process.env.INCORRECT_LOGIN_MAX_ATTEMPTS ?? "5",
);
const FAILED_LOGIN_LOCKOUT_MINS = parseInt(
  process.env.FAILED_LOGIN_LOCKOUT_MINS ?? "15",
);

const generateSecureDatadogEmbedUrl = (
  baseUrl: string,
  credential: string,
): string => {
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000);
  const token = createHmac("sha256", credential)
    .update(`${nonce}|${timestamp}`)
    .digest("hex");

  const url = new URL(baseUrl);
  url.searchParams.set("token", token);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("ts", timestamp.toString());

  return url.toString();
};

const getServiceMonitoringEmbedUrl = (): string | null => {
  const dashboardUrl = process.env.DATADOG_SERVICE_MONITORING_DASHBOARD;
  const secureEmbedCredential =
    process.env.DATADOG_SERVICE_MONITORING_DASHBOARD_CREDENTIAL;

  if (!dashboardUrl) {
    return null;
  }

  if (!secureEmbedCredential) {
    return dashboardUrl;
  }

  try {
    return generateSecureDatadogEmbedUrl(dashboardUrl, secureEmbedCredential);
  } catch (error) {
    logger.error(error, "Error generating secure Datadog embed URL");
    return null;
  }
};

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
    const supportUserEmailDomains = (
      process.env.SUPPORT_USER_EMAIL_DOMAINS || ""
    )
      .split(",")
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean);

    // Allow access to users with any support domain or site admins (account_type = 1)
    const canViewServiceMonitoring =
      supportUserEmailDomains.some((domain) => email.endsWith(domain)) ||
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
        ? getServiceMonitoringEmbedUrl()
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

    const query = context.kysely
      .selectFrom("bods_user")
      .leftJoin(
        "bods_userorganisation",
        "bods_userorganisation.user_id",
        "bods_user.id",
      )
      .leftJoin(
        "bods_organisation",
        "bods_organisation.id",
        "bods_userorganisation.organisation_id",
      )
      .leftJoin("login_details", "login_details.user_id", "bods_user.id")
      .where(
        (eb) => eb.fn("lower", [eb.ref("bods_user.email")]),
        "=",
        args.username.toLowerCase(),
      )
      .where("bods_user.is_active", "=", true)
      .distinctOn(["bods_user.id", "bods_user.password"])
      .select([
        "bods_user.id",
        "bods_user.password",
        "bods_userorganisation.organisation_id",
        "bods_organisation.name",
        "login_details.last_login as lastLogin",
        "login_details.failed_attempts as failedAttempts",
      ]);

    const bodsUser = await executeQuery(query);

    if (!bodsUser || bodsUser.length < 1) {
      logger.debug("User not found in bods user table");
      throw "Invalid username or password";
    }

    const orgNames = bodsUser.filter((n) => n.name != null).map((n) => n.name);
    if (orgNames.length < 1) {
      logger.error(
        { userId: bodsUser[0].id },
        "User not mapped to an organisation",
      );
      throwUnauthenticatedError("User not mapped to any organisation");
    }

    const now = dayjs();
    const currentFailedAttempts = bodsUser[0].failedAttempts ?? 0;
    const unlockAt =
      bodsUser[0].lastLogin != null
        ? dayjs(bodsUser[0].lastLogin).add(FAILED_LOGIN_LOCKOUT_MINS, "minute")
        : null;

    if (
      currentFailedAttempts >= INCORRECT_LOGIN_MAX_ATTEMPTS &&
      unlockAt?.isAfter(now)
    ) {
      return {
        success: false,
        unlockAt: unlockAt.toISOString(),
        failedAttempts: currentFailedAttempts,
        locked: true,
        maxAttempts: INCORRECT_LOGIN_MAX_ATTEMPTS,
      };
    }

    const strippedPassword = bodsUser[0].password.replace("argon2$", "$");
    const validPassword = await argon2.verify(strippedPassword, args.password);
    const user_id = bodsUser[0].id;

    if (!validPassword) {
      let failedAttempts = currentFailedAttempts + 1;
      if (
        failedAttempts > INCORRECT_LOGIN_MAX_ATTEMPTS ||
        unlockAt?.isBefore(now)
      ) {
        failedAttempts = 1;
      }
      const loginDetails = {
        user_id,
        last_login: now.toDate(),
        failed_attempts: failedAttempts,
      };
      await context.db.login_details.upsert({
        where: { user_id },
        create: loginDetails,
        update: loginDetails,
      });

      return {
        success: false,
        failedAttempts: failedAttempts,
        maxAttempts: INCORRECT_LOGIN_MAX_ATTEMPTS,
        locked: failedAttempts >= INCORRECT_LOGIN_MAX_ATTEMPTS ? true : false,
        unlockAt:
          failedAttempts >= INCORRECT_LOGIN_MAX_ATTEMPTS
            ? now.add(FAILED_LOGIN_LOCKOUT_MINS, "minute").toISOString()
            : undefined,
      };
    }

    const token = uuidv4();
    const expiryTimeMilliseconds = SESSION_EXPIRY_TIME_IN_SECONDS * 1000;
    const expires = new Date(Date.now() + expiryTimeMilliseconds);
    const tokenRecord = { user_id, token, expires };
    const loginDetails = {
      user_id,
      last_login: now.toDate(),
      failed_attempts: 0,
    };
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
    return {
      success: true,
      expiresAt: expires.toISOString(),
    };
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
