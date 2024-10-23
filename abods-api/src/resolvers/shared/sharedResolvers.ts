import { IResolvers } from '@graphql-tools/utils';
import { getApiInfo, getRoles } from './sharedFunctions.js';
import { RequestContext } from '../../types';

const sharedResolvers: IResolvers = {
  Query: {
    apiInfo: (_: any, __: any, { db }: RequestContext) => getApiInfo(db),
    roles: (_: any, __: any, { sessionUser, db }: RequestContext) => getRoles(sessionUser, db)
  }
}

export default sharedResolvers;