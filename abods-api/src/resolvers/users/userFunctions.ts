import { Context } from '../../context.js'
import { RoleType, UserType, AlertType, AlertTypeEnum, ScopeEnum, SessionUser, OperatorType } from '../../types.js';
import { v4 as uuidv4 } from 'uuid';
import argon2 from 'argon2';
import logger from '../../logger.js';

export const getSession = async (sessionId, db: Context) : Promise<SessionUser> =>  {
  logger.debug("Within get session function")
  let sessionUser: SessionUser = {
    user: null,
    userOrganisationIDs: null
  }

  // temporary session token storage
  const sessionRecord = await db.prisma.tokens.findFirst({
    where: {
      token: sessionId
    }
  })
  
  logger.debug(
    { sessionRecord },
    `session record obtained for session id ${sessionId}: `,
  );
  if(sessionRecord) {
    // fetch user from bods
    const bodsUser = await db.prisma.bods_user.findUnique(
      { 
        where:{ id: sessionRecord.user_id },
        include:{
          userOrganisations: true
        }
      }
    )

    logger.debug({ bodsUser }, 'Retrieved bods user: ');
    if(bodsUser)
    {
      sessionUser.user = bodsUser;
      sessionUser.userOrganisationIDs = bodsUser.userOrganisations.map(o=>o.organisation_id);
    }
  }

  logger.debug({ sessionUser }, "Session user returned: ")
  return sessionUser;
}



// Summary: fetch all users
export const getUsers = async (sessionUser: SessionUser, db: Context) => {
  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }

    if(!sessionUser.userOrganisationIDs){
      throw ("User not in any organisations")
    }

    const orgIds = sessionUser.userOrganisationIDs;
    const bodsUsers = await db.prisma.bods_user.findMany({
      where:{
        userOrganisations:{
          every:{
            organisation_id:{
              in: orgIds
            }
          }
        }
      },
      include:{
        userOrganisations: true
      },
    });
   
    const userResponse = bodsUsers.map((thisUser): UserType => {

      return{ 
        id: String(thisUser.id),
        username: thisUser.username,
        email: thisUser.email,
        firstName: thisUser.first_name,
        lastName: thisUser.last_name,
        organisation: sessionUser.userOrganisationIDs ? {
          id: String(sessionUser.userOrganisationIDs[0]),
          name: String(sessionUser.userOrganisationIDs[0])
        } : null,
        roles: [{
          "id": "1",
          "name": "Staff",
          "scope": ScopeEnum.Organisation
        }]
      };
    });

    return userResponse;
  } catch (error) {
    console.error(error)
    return null;
  } 
  
}
// Summary: fetch a single user by id
export const getUser = async (id: string, sessionUser: SessionUser, db: Context) => {
  try {
    if(!sessionUser.user){
      throw ("Not authorized")
    }

    return {
      id: sessionUser.user.id,
      username: sessionUser.user.username,
      email: sessionUser.user.email,
      firstName: sessionUser.user.first_name,
      lastName: sessionUser.user.last_name,
      roles: [{
        "id": "1",
        "name": "Staff",
        "scope": "organisation"
      },
      {
        "id": "2",
        "name": "Administrator",
        "scope": "organisation"
      },
    ]
    }
  
  } catch (error) {
    console.error(error)
    return null;
  } 
}

// Summary: fetch all user alerts
export const getUserAlerts = async (sessionUser: any, db: Context) => {
  try {
    
    if(!sessionUser.user)
    {
      throw ("Not Authorized")
    }

    // fetch alerts ONLY if user is creator or recipient
    const alerts = await db.prisma.alert.findMany({
      where:{
        OR: [
          {
          created_by: {
            equals: sessionUser.id
          },
          },
          {
            send_to: {
              equals: sessionUser.id
            },
          }
        ]
      },
      include: {
        created_by_user: true,
        send_to_user: true
      }
    })

    if(!alerts)
    {
      throw new Error("Alerts not found");
    }

    const userAlerts = alerts.map((alert): AlertType => {
      return {
        alertId: alert.id,
        alertType: alert.alert?.trim() as AlertTypeEnum,
        eventHysterisis: alert.event_hysterisis,
        eventThreshold: alert.event_threshold,
        createdBy: alert.created_by_user ? {
          id: String(alert.created_by_user.id),
          username: alert.created_by_user.username,
          email: alert.created_by_user.email,
          firstName: alert.created_by_user.first_name,
          lastName: alert.created_by_user.last_name,
          roles: new Array<RoleType>
        } : null,
        sendTo: alert.send_to_user ? {
          id: String(alert.send_to_user.id),
          username: alert.send_to_user.username,
          email: alert.send_to_user.email,
          firstName: alert.send_to_user.first_name,
          lastName: alert.send_to_user.last_name,
          roles: new Array<RoleType>
        } : null,
      }
    })

    return userAlerts;
  } catch (error) {
    return null;
  } 
}

// Summary: log the user in
export const loginUser = async (username:string, password:string, db: Context, res: any) => {
  logger.debug(`Logging in user: ${username}`)
  try {
    if (!username || !password) {
      throw('Invalid username or password')
    }

    const bodsUser = await db.prisma.bods_user.findUnique(
      { 
        where:{ email: username },
        include:{
          userOrganisations: true
        }
      }
    )

    if(!bodsUser)
    {
      logger.debug('User not found in bods user table')
      throw("Invalid username or password")
    }

    const strippedPassword = bodsUser.password.replace("argon2$", "$")
    if (await argon2.verify(strippedPassword, password)) {
      const sessionId = uuidv4();
      const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString();
      const session = await db.prisma.tokens.findUnique({
        where:{
          user_id: bodsUser.id
        }
      })


      if(!session)
      {
        logger.debug('Session in tokens table not found')
        await db.prisma.tokens.create({
          data:{
            user_id: bodsUser.id,
            token: sessionId
          }
        })
      }
      else{
        logger.debug({ session }, 'Session found in tokends table')
        await db.prisma.tokens.update({
          where:{
            user_id: bodsUser.id
          },
          data: {
            token: sessionId
          }
        })
      }
      
      res.setHeader('Set-Cookie', `abods_sessionid=${sessionId}; expires=${expires}; HttpOnly; Max-Age=1209600; Path=/; SameSite=None; Secure`)
      return {
        success: true,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    } else {
      logger.debug('Invalid password entered')
      throw("Invalid username or password")
    }
  } catch (error) {
    logger.error(error)
    return {
      success: false
    }
  } 
}

export const logoutUser = async (sessionUser: any, db: Context, req: any) => {
  try {
    if(!sessionUser.user)
    {
      throw ("Not Authorized")
    }

    await db.prisma.tokens.delete({
      where: {
        user_id: sessionUser.user.id
      }
    })
    
    return true;
  
  } catch (error) {
    console.error(error)
    return false;
  } 
}

export const getUserAlert = async (alertId, sessionUser: any, db: Context) => {
  try {

    if(!sessionUser.user)
    {
      throw ("Not Authorized")
    }

    if(!alertId){
      throw new Error("Alert id required");
    }

    // fetch alert by id and ONLY if user is creator or recipient
    const alert = await db.prisma.alert.findUnique({
      where: {
        id: alertId,
        AND: {
          OR: [
            {
              created_by: {
              equals: sessionUser.id
            },
            },
            {
              send_to: {
                equals: sessionUser.id
              },
            }
          ]
        }
      },
      include: {
        created_by_user: true,
        send_to_user: true
      }
    })

    if(!alert)
    {
      throw new Error("Alert not found");
    }

    return {
      alertId: alert.id,
      alertType: alert.alert?.trim() as AlertTypeEnum,
      eventHysterisis: alert.event_hysterisis,
      eventThreshold: alert.event_threshold,
      createdBy: alert.created_by_user ? {
        id: alert.created_by_user.id,
        username: alert.created_by_user.username,
        email: alert.created_by_user.email,
        firstName: alert.created_by_user.first_name,
        lastName: alert.created_by_user.last_name
      } : null,
      sendTo: alert.send_to_user ? {
        id: alert.send_to_user.id,
        username: alert.send_to_user.username,
        email: alert.send_to_user.email,
        firstName: alert.send_to_user.first_name,
        lastName: alert.send_to_user.last_name
      } : null,
    }
  } catch (error) {
    return null;
  }
}

export const addUserAlert = async (payload, sessionUser: any, db: Context) => {
  try {
    if(!sessionUser.user)
      {
        throw ("Not Authorized")
      }

    const {alertType, eventHysterisis, eventThreshold, sendTo } = payload;

    // TODO: check if sendto user id is in one of the same organisations as created_by user
    await db.prisma.alert.create({
      data:{
        alert: alertType,
        event_hysterisis: eventHysterisis,
        event_threshold: eventThreshold,
        send_to: Number(sendTo.id),
        created_by: sessionUser.id
      }
    })

    return {
      error: null, 
      success: true
    }
  } catch (error) {
    return {
      error: error.message,
      success: false
    }
  } 
}

export const updateUserAlert = async (alertId, payload, sessionUser: any, db: Context) => {
  try {
    if(!sessionUser.user)
      {
        throw ("Not Authorized")
      }

    const {alertType, eventHysterisis, eventThreshold, sendTo } = payload;

    if(!alertId){
      throw new Error("AlertId is required");
    }

    // only an alert created by or the recipient of can update
    var alert = await getUserAlert(alertId, sessionUser, db);

    if(!alert)
    {
      throw new Error("Alert not found");
    }

    await db.prisma.alert.update({
      where:{
        id: alert.alertId
      },
      data:{
        alert: alertType,
        event_hysterisis: eventHysterisis,
        event_threshold: eventThreshold,
        send_to: sendTo ? Number(sendTo.id) : null
      }
    })

    return {
      error: null, 
      success: true
    }
  } catch (error) {
    return {
      error: error.message,
      success: false
    }
  } 
}

export const deleteUserAlert = async (alertId, sessionUser: any, db: Context) => {
  try {
    if(!sessionUser.user)
    {
      throw ("Not Authorized")
    }

    if(!alertId){
      throw new Error("AlertId is required");
    }

    // only an alert created by or the recipient of can delete
    var alert = await getUserAlert(alertId, sessionUser, db);

    if(alert){
      await db.prisma.alert.delete({where: {id:alertId}})
    }
    else{
      throw ("Not Authorized")
    }
    
    return {
      error: null, 
      success: true
    }
  } catch (error) {
    return {
      error: error.message,
      success: false
    }
  } 
}