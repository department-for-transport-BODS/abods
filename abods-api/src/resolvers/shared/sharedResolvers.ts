import { getApiInfo, getRoles } from './sharedFunctions.js';
import { Resolvers } from '../../types/generated';

const sharedResolvers: Resolvers = {
  Query: {
    apiInfo: (_, __, { db }) => getApiInfo(db),
    roles: (_, __, { sessionUser, db }) => getRoles(sessionUser)
  }
}

export default sharedResolvers;