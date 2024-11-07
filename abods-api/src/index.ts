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

let db = await createContext();
let startTime = getDate();
let apiKeyAuth = await getAPITokenHash();

const typeDefs = gql`
  ${fs.readFileSync(resolve("schema.graphql"), "utf8")}
`;
const server = new ApolloServer<RequestContext>({
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
      const { event } = getCurrentInvoke();
      const headers = event.headers;
      logger.debug("Server started and within context block");
      const retry = getDate().isAfter(startTime.add(10, "minute"));
      if (retry) {
        try {
          db = await createContext(true);
          startTime = getDate();
        } catch (error) {
          logger.error(error);
          logger.error("Failed to create database context");
        }
      }
      return { req, res, headers, db, apiKeyAuth };
    },
  }),
);

const handler = serverlessExpress({ app });

export { handler as default };
