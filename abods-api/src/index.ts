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
import { SessionUser } from './types.js';
import { getSession } from './resolvers/users/userFunctions.js';
import logger from './logger.js';
import { Prisma } from '@prisma/client';

let db = await createContext()

const typeDefs = gql` ${fs.readFileSync(resolve('src/schema.graphql'), 'utf8')}`;
const server = new ApolloServer({
  typeDefs,
  resolvers
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
      try {
        logger.debug("Server started and within context block")
        let sessionUser: SessionUser = {
          user: null,
          userOrganisationIDs: null
        }

        const cookieHeader = getHeader(event.headers, 'Cookie');
        if (cookieHeader) {
          logger.debug(`parsing cookie from header: ${JSON.stringify(cookieHeader)}`);
          const cookies = parseCookie(cookieHeader)
          const sessionid = cookies["abods_sessionid"];

          logger.debug(`Session id: ${sessionid}`);
          if(sessionid) {
            let session: SessionUser = {
              user: null,
              userOrganisationIDs: null
            }
            try {
              session = await getSession(sessionid, db);
            } catch (error) {
              logger.error(`exception caught***** ${error}`)
              if (error instanceof Prisma.PrismaClientKnownRequestError) {
                db = await createContext()
                session = await getSession(sessionid, db);
                logger.error('PrismaClientKnownRequestError check****: ', error.message);
              }
            }

            logger.debug(`Session retrieved from db: ${JSON.stringify(session)}`);
            if(session)
            {
              sessionUser = session;
            }
          }
        }

        return {
          req: req, 
          res: res, 
          sessionUser, 
          db,
          lambdaEvent: event,
          lambdaContext: context,
        }
      } catch (error) {
        logger.error("****error in context handling: " + error)
        return {req: event, 
          res: context}
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