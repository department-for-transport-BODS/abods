import {
  ApolloServerPlugin,
  GraphQLRequestListener,
  GraphQLServerListener,
} from "@apollo/server";
import { RequestContext } from "./types/extra";
import logger from "./logger.js";

const serverListener: GraphQLServerListener = {
  drainServer: () => {
    logger.info("Draining server");
    return Promise.resolve();
  },
  serverWillStop: () => {
    logger.info("Stopping server");
    return Promise.resolve();
  },
  schemaDidLoadOrUpdate: () => logger.info("Schema loaded"),
};

const requestListener: GraphQLRequestListener<RequestContext> = {
  didEncounterErrors: ({ errors, request: { query, operationName } }) => {
    for (const error of errors) {
      logger.error(
        { error, query, operationName },
        "Encountered error when processing request",
      );
    }
    return Promise.resolve();
  },
  didEncounterSubsequentErrors: ({
    errors,
    request: { query, operationName },
  }) => {
    if (!errors) return Promise.resolve();
    for (const error of errors) {
      logger.error(
        { error, query, operationName },
        "Encountered error when processing request",
      );
    }
    return Promise.resolve();
  },
};

export const apolloLogger: ApolloServerPlugin<RequestContext> = {
  invalidRequestWasReceived({ error }) {
    logger.error({ error }, "Received invalid request");
    return Promise.resolve();
  },
  startupDidFail({ error }) {
    logger.error({ error }, "Startup failed");
    return Promise.resolve();
  },
  contextCreationDidFail({ error }) {
    logger.error({ error }, "Failed to create context");
    return Promise.resolve();
  },
  unexpectedErrorProcessingRequest({
    error,
    requestContext: {
      request: { query, operationName },
    },
  }) {
    logger.error({ error, query, operationName }, "Failed to process request");
    return Promise.resolve();
  },
  serverWillStart() {
    logger.info("Started server");
    return Promise.resolve(serverListener);
  },
  requestDidStart({ request: { query, operationName } }) {
    logger.info({ query, operationName }, "Received Request");
    return Promise.resolve(requestListener);
  },
};
