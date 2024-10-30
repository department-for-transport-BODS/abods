import { RequestContext, SessionUser } from '../types/extra';
import logger from '../logger';

export const emptyResolver = async () => ({});

export const requireUserSession = async (context: RequestContext) => {
  const cookieHeader = getHeader(context.headers, 'Cookie');
  if (!cookieHeader) {
    throw 'Not Authorized';
  }
  logger.debug(`parsing cookie from header: ${JSON.stringify(cookieHeader)}`);
  const cookies = parseCookie(cookieHeader);
  const sessionId = cookies['abods_sessionid'];

  logger.debug(`Session id: ${sessionId}`);
  if (!sessionId) {
    throw 'Not Authorized';
  }
  logger.debug('Within get session function');

  // temporary session token storage
  const sessionRecord = await context.db.prisma.tokens.findFirst({
    where: {
      token: sessionId
    }
  });

  logger.debug(
    `session record obtained for session id ${sessionId}: ${JSON.stringify(sessionRecord)}`
  );
  if (!sessionRecord) {
    logger.debug('No Session record found for user');
    throw 'Not Authorized';
  }
  // fetch user from bods
  const bodsUser = await context.db.prisma.bods_user.findUnique(
    {
      where: { id: sessionRecord.user_id },
      include: {
        userOrganisations: true
      }
    }
  );

  logger.debug(`Retrieved bods user: ${JSON.stringify(bodsUser)}`);
  if (!bodsUser) {
    logger.debug('No bods user found');
    throw 'Not Authorized';
  }
  if (!bodsUser.userOrganisations || bodsUser.userOrganisations.length === 0) {
    logger.error('User not mapped to an organisation');
    throw 'User not mapped to any organisation';
  }
  const sessionUser: SessionUser = {
    id: bodsUser.id,
    username: bodsUser.username,
    email: bodsUser.email,
    first_name: bodsUser.first_name,
    last_name: bodsUser.last_name,
    orgIds: bodsUser.userOrganisations.map(o => o.organisation_id)
  };

  logger.debug(`Session user returned: ${JSON.stringify(sessionUser)}`);
  return sessionUser;
};

export const requireApiToken = (context: RequestContext) => {
  // todo
};

function getHeader(headers, name) {
  return headers[name.toLowerCase()] || headers[name.toUpperCase()] || headers[name];
}

const parseCookie = (str: string) =>
  str
    .split(';')
    .map((v) => v.split('='))
    .reduce((acc: { [key: string]: string }, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      return acc;
    }, {});