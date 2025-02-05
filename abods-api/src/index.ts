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
import { Kysely } from "kysely";
import { DefaultArgs } from "@prisma/client/runtime/library.js";
import { Prisma, PrismaClient } from "@prisma/client";
import { getKyselyClient } from "./kyselyClient.js";
import datadogMetricsPlugin from "./lib/datadog.js";
import { datadog } from "datadog-lambda-js";
import { apolloLogger } from "./apolloLogger.js";

export let kysely: Kysely<DB> | undefined = undefined;

let db:
  | PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>
  | undefined = undefined;
let startTime = getDate();
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
      if (!db || !kysely || retry) {
        [db, kysely] = await Promise.all([
          createContext(true),
          getKyselyClient(),
        ]);
        startTime = getDate();
      }
      return { req, res, headers, db, apiKeyAuth, kysely };
    },
  }),
);

const handler = serverlessExpress({ app });

export default datadog(handler);
