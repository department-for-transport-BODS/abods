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
import { RequestContext } from "./types/extra.js";
import logger from "./logger.js";
import { getAPITokenHash } from "./lib/apiauth.js";
import { IncomingHttpHeaders } from "http";

import { DB } from "./kysely.js";
import { Kysely } from "kysely";
import { getKyselyClient } from "./kyselyClient.js";
import datadogMetricsPlugin from "./lib/datadog.js";
import { datadog } from "datadog-lambda-js";
import { apolloLogger } from "./apolloLogger.js";
import dayjs from "dayjs";

export let db: Kysely<DB> | undefined = undefined;

let startTime = dayjs();
const apiKeyAuth = await getAPITokenHash();

const typeDefs = gql`
  ${fs.readFileSync(resolve("schema.graphql"), "utf8")}
`;

const server = new ApolloServer<RequestContext>({
  typeDefs,
  resolvers,
  logger,
  plugins: [apolloLogger, datadogMetricsPlugin],
});

logger.info("Starting server in the background");
server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();
const corsOrigin = process.env.CORS_ORIGIN;
const app = express();
const env = process.env.PROJECT_ENV ?? "local";

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
        db = await getKyselyClient();
        startTime = dayjs();
      }
      return { req, res, headers, apiKeyAuth, db };
    },
  }),
);

const handler = serverlessExpress({ app });

export default env !== "local" ? datadog(handler) : handler;
