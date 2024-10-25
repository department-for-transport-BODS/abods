import {
  getUser,
  getUsers,
  getUserAlerts,
  loginUser,
  logoutUser,
  getUserAlert,
  addUserAlert,
  updateUserAlert,
  deleteUserAlert
} from './userFunctions.js';
import { Resolvers } from '../../types/generated';

const userResolvers: Resolvers = {
  Query: {
    user: (_, __, { sessionUser }) => getUser(sessionUser),
    users: (_, __, { sessionUser, db }) => getUsers(sessionUser, db),
    userAlerts: (_, __, { sessionUser, db }) => getUserAlerts(sessionUser, db),
    userAlert: (_, { alertId }, { sessionUser, db }) => getUserAlert(alertId, sessionUser, db)
  },
  Mutation: {
    login: (_, { username, password }, { res, db }) => loginUser(username, password, db, res),
    logout: (_, __, { sessionUser, db }) => logoutUser(sessionUser, db),
    addUserAlert: (_, { payload }, { sessionUser, db }) => addUserAlert(payload, sessionUser, db),
    updateUserAlert: (_, { alertId, payload }, {
      sessionUser,
      db
    }) => updateUserAlert(alertId, payload, sessionUser, db),
    deleteUserAlert: (_, { alertId }, { sessionUser, db }) => deleteUserAlert(alertId, sessionUser, db)
  }
};

export default userResolvers;
