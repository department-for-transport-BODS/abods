import { IResolvers } from '@graphql-tools/utils'
import { getUser, getUsers, getUserAlerts, loginUser, logoutUser, getUserAlert, addUserAlert, updateUserAlert, deleteUserAlert } from './userFunctions.js'
import { RequestContext } from '../../types.js';

const userResolvers: IResolvers = {
    Query: {
        user: (_: any, {id}: {id: string}, {sessionUser, db}: RequestContext) => getUser(id, sessionUser, db),
        users: (_: any, __: any, {sessionUser, db }: RequestContext) => getUsers(sessionUser, db),
        userAlerts: (_: any, __: any, {sessionUser, db }: RequestContext) => getUserAlerts(sessionUser, db),
        userAlert: async (_: any, { alertId }, {sessionUser, db}: RequestContext) => getUserAlert(alertId, sessionUser, db),
    },
    Mutation: {
        login: async (_: any, {username, password}: {username:string; password:string;}, {res, db}: RequestContext) => loginUser(username, password, db, res),
        logout: (_:any, __: any, {req, sessionUser, db }: RequestContext) => logoutUser(sessionUser, db, req),
        addUserAlert: async (_, {payload}, {sessionUser, db}: RequestContext) => addUserAlert(payload, sessionUser, db),
        updateUserAlert: async (_, {alertId, payload}, {sessionUser, db}: RequestContext) => updateUserAlert(alertId, payload, sessionUser, db),
        deleteUserAlert: async (_, {alertId}, {sessionUser, db}: RequestContext) => deleteUserAlert(alertId, sessionUser, db),
    }
}

export default userResolvers;
