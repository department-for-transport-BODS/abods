import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import serverlessExpress, { getCurrentInvoke } from '@codegenie/serverless-express';
import express from 'express';
import cors from 'cors';
import gql from 'graphql-tag';
import { resolve } from 'path';
import resolvers from './resolvers/index.js'
import fs from 'fs'
import { createContext } from './context.js';
import { SessionUser } from './types/extra.js';
import { getSession } from './resolvers/users/userFunctions.js';
import logger from './logger.js';
import { getDate } from './lib/dayjs.js';

let db = await createContext()
let startTime = getDate()

const typeDefs = gql` ${fs.readFileSync(resolve('src/schema.graphql'), 'utf8')}`;
const server = new ApolloServer({
  typeDefs,
  resolvers,
});
logger.info("Starting server in the background");
server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();
const corsOrigin = process.env["CORS_ORIGIN"];
const app = express();
app.use(
  cors<cors.CorsRequest>({ origin: corsOrigin, credentials: true }),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      const { event, context } = getCurrentInvoke()
      let sessionUser: SessionUser = {
        user: null,
        userOrganisationIDs: null
      }
      try {
        logger.debug("Server started and within context block")
        const retry = getDate().isAfter(startTime.add(10, 'minute'))
        if(retry) {
          db = await createContext(true)
          startTime = getDate()
        }
        const cookieHeader = getHeader(event.headers, 'Cookie');
        if (cookieHeader) {
          logger.debug(`parsing cookie from header: ${JSON.stringify(cookieHeader)}`);
          const cookies = parseCookie(cookieHeader)
          const sessionid = cookies["abods_sessionid"];

          logger.debug(`Session id: ${sessionid}`);
          if(sessionid) {
            const session = await getSession(sessionid, db);

            logger.debug(`Session retrieved from db: ${JSON.stringify(session)}`);
            if(session && session.user)
            {
              if (
                !session.userOrganisationIDs ||
                session.userOrganisationIDs.length === 0
              ) {
                logger.error('User not mapped to an organisation');
                throw 'User not mapped to any organisation';
              }
              sessionUser = session;
            }
          }
        }

        logger.debug(`Returning session user: ${JSON.stringify(sessionUser)}`);
        return {
          req,
          res,
          sessionUser, 
          db,
        }
      } catch (error) {
        logger.error("****error in context handling: " + error)
        return { req, res, sessionUser, db };
      }
    }
  })
);

function getHeader(headers, name) {
  return headers[name.toLowerCase()] || headers[name.toUpperCase()] || headers[name];
}

const parseCookie = (str: string) =>
  str
    .split(";")
    .map((v) => v.split("="))
    .reduce((acc: { [key: string]: string }, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      return acc;
  }, {});

const handler = serverlessExpress({ app });

export { handler as default}