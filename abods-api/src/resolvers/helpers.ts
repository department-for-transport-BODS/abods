import { RequestContext, SessionUser } from "../types/extra.js";
import logger from "../logger.js";
import { IncomingHttpHeaders } from "http";
import { GraphQLError } from "graphql";
import { getUserOrgIds } from "../lib/utils.js";

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
  const sessionRecord = await context.db.tokens.findFirst({
    where: {
      token: sessionId,
      expires: { gt: new Date() },
    },
  });

  logger.debug(
    { sessionRecord, sessionId },
    "session record obtained for session id",
  );
  if (!sessionRecord) {
    logger.debug("No Session record found for user");
    throwUnauthenticatedError();
  }
  // fetch user from bods
  const bodsUser = await context.db.bods_user.findUnique({
    where: { id: sessionRecord.user_id },
    select: {
      userOrganisations: { select: { organisation_id: true } },
      is_active: true,
    },
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

  const orgIds = getUserOrgIds({
    userOrganisations: bodsUser.userOrganisations,
    id: sessionRecord.user_id,
  });

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
