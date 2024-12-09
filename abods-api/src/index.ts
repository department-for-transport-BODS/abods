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
import { getDate } from "./lib/dayjs.js";
import { getAPITokenHash } from "./lib/apiauth.js";
import { IncomingHttpHeaders } from "http";

import { DB } from "./kysely.js";
import pg from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { getDatabaseUrl, isLocal } from "./prismaClient.js";
import datadogMetricsPlugin, { sendErrorMetric } from "./lib/datadog.js";
import { datadog } from "datadog-lambda-js";
import { GraphQLFormattedError } from "graphql";
import { apolloLogger } from "./apolloLogger.js";

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

let db = await createContext();
let startTime = getDate();
const apiKeyAuth = await getAPITokenHash();

const typeDefs = gql`
  ${fs.readFileSync(resolve("schema.graphql"), "utf8")}
`;

const formatError = (
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError => {
  sendErrorMetric(error);
  return formattedError;
};

const server = new ApolloServer<RequestContext>({
  typeDefs,
  resolvers,
  formatError,
  plugins: [datadogMetricsPlugin, apolloLogger],
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
      const retry = getDate().isAfter(startTime.add(10, "minute"));
      if (retry) {
        try {
          db = await createContext(true);
          startTime = getDate();
        } catch (error) {
          sendErrorMetric(error);
          logger.error("Failed to create database context");
        }
      }
      return { req, res, headers, db, apiKeyAuth, kysely };
    },
  }),
);

const handler = serverlessExpress({ app });

export default datadog(handler);
