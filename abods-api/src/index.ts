import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import serverlessExpress, {
  getCurrentInvoke,
} from "@codegenie/serverless-express";
import express from "express";
import cors from "cors";
import gql from "graphql-tag";
import { resolve } from "path";
import resolvers from "./resolvers/index.js";
import fs from "fs";
import { createContext } from "./context.js";
import { RequestContext } from "./types/extra.js";
import logger from "./logger.js";
import { getAPITokenHash } from "./lib/apiauth.js";
import { IncomingHttpHeaders } from "http";

import { DB } from "./kysely.js";
import pg from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { getDatabaseUrl, isLocal } from "./prismaClient.js";
import { apolloLogger } from "./apolloLogger.js";
import { DefaultArgs } from "@prisma/client/runtime/library.js";
import { Prisma, PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("en");

export const kysely = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({
      connectionString: await getDatabaseUrl(),
    }),
  }),
  log(event) {
    if (event.level === "query") {
      logger.debug(event.query.sql);
      // Don't log query parameters for now in case there's anything sensitive. Local is fine though
      if (isLocal()) {
        logger.debug(event.query.parameters);
      }
    }
    if (event.level === "error") {
      logger.error(event.error);
    }
  },
});

let db:
  | PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>
  | undefined = undefined;
let startTime = dayjs();
const apiKeyAuth = await getAPITokenHash();

const typeDefs = gql`
  ${fs.readFileSync(resolve("schema.graphql"), "utf8")}
`;
const server = new ApolloServer<RequestContext>({
  typeDefs,
  resolvers,
  logger,
  plugins: [apolloLogger],
});
logger.info("Starting server in the background");
server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();
const corsOrigin = process.env.CORS_ORIGIN;
const app = express();

app.use(
  cors<cors.CorsRequest>({ origin: corsOrigin, credentials: true }),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { event } = getCurrentInvoke();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const headers: IncomingHttpHeaders = event.headers;
      logger.debug("Server started and within context block");
      const retry = dayjs().isAfter(startTime.add(10, "minute"));
      if (!db || retry) {
        db = await createContext(true);
        startTime = dayjs();
      }
      return { req, res, headers, db, apiKeyAuth, kysely };
    },
  }),
);

const handler = serverlessExpress({ app });

export { handler as default };
