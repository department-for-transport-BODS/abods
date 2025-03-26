import { RequestContext, SessionUser } from "../types/extra.js";
import logger from "../logger.js";
import { IncomingHttpHeaders } from "http";
import { GraphQLError } from "graphql";
import { getUserOrgIds } from "../lib/utils.js";
import { sql } from "kysely";

export function throwUnauthenticatedError(
  message?: string,
  path?: string | number,
): never {
  throw new GraphQLError(message || "Unauthorized", {
    extensions: {
      code: "UNAUTHENTICATED",
      http: { status: 401 },
      path,
    },
  });
}

export const emptyResolver = () => ({});

export const requireUserSession = async (context: RequestContext) => {
  const cookieHeader = getHeader(context.headers, "Cookie");
  if (!cookieHeader) {
    throwUnauthenticatedError();
  }
  logger.debug({ cookieHeader }, "parsing cookie from header");
  const cookies = parseCookie(cookieHeader);
  const sessionId = cookies.abods_sessionid;

  logger.debug({ sessionId });
  if (!sessionId) {
    throwUnauthenticatedError();
  }
  logger.debug("Within get session function");

  // temporary session token storage
  const sessionRecord = await context.kysely
    .selectFrom("Tokens")
    .where("token", "=", sessionId)
    .where("expires", ">", new Date())
    .select("user_id")
    .executeTakeFirst();

  logger.debug(
    { sessionRecord, sessionId },
    "session record obtained for session id",
  );
  if (!sessionRecord) {
    logger.debug("No Session record found for user");
    throwUnauthenticatedError();
  }

  const bodsUser = await context.kysely
    .selectFrom("bods_user as u")
    .innerJoin("bods_userorganisation as o", "o.user_id", "u.id")
    .where("u.id", "=", sessionRecord.user_id)
    .where("u.is_active", "=", true)
    .groupBy(["u.id", "u.password"])
    .select([
      "u.id",
      "u.is_active",
      sql<string>`string_agg(distinct o.organisation_id::text, ',')`.as(
        "org_ids",
      ),
    ])
    .executeTakeFirst()
    .then((r) => {
      if (!r) return r;
      return {
        is_active: r.is_active,
        id: r.id,
        orgIds: r.org_ids.split(",").map(Number),
      };
    });

  logger.debug({ bodsUser }, "Retrieved bods user");
  if (!bodsUser) {
    logger.debug("No bods user found");
    throwUnauthenticatedError();
  }
  if (!bodsUser.is_active) {
    logger.debug("User exists but is not active");
    throwUnauthenticatedError();
  }

  const orgIds = getUserOrgIds(bodsUser);

  const sessionUser: SessionUser = {
    id: sessionRecord.user_id,
    orgIds: orgIds,
  };

  logger.debug({ sessionUser }, "Session user returned");
  return sessionUser;
};

export function getHeader(
  headers: IncomingHttpHeaders,
  name: string,
): string | string[] | undefined {
  return (
    headers[name.toLowerCase()] || headers[name.toUpperCase()] || headers[name]
  );
}

const parseCookie = (str: string | string[]) =>
  (typeof str === "string" ? str.split(";") : str)
    .map((v) => v.split("="))
    .reduce((acc: Record<string, string>, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      return acc;
    }, {});
