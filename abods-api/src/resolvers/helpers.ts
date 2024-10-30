import { RequestContext } from '../types/extra';

export const emptyResolver = async () => ({});

export const requireUserSession = (context: RequestContext) => {
  if (!context.sessionUser) {
    throw 'Not Authorized';
  }
  return context.sessionUser;
};

export const requireApiToken = (context: RequestContext) => {
  // todo
};