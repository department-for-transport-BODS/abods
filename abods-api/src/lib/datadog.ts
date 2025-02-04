/* eslint-disable @typescript-eslint/require-await */
import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestContextExecutionDidStart,
  GraphQLRequestContextWillSendResponse,
  GraphQLRequestExecutionListener,
  GraphQLRequestListener,
  GraphQLRequestListenerDidResolveField,
  GraphQLServerListener,
} from "@apollo/server";
import { RequestContext } from "../types/extra";
import { sendDistributionMetric } from "datadog-lambda-js";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";
import { GraphQLError } from "graphql";
import logger from "../logger.js";

export const sendErrorMetric = (error: unknown) => {
  if (
    error instanceof GraphQLError &&
    error?.extensions?.code === "UNAUTHENTICATED"
  ) {
    return;
  }
  if (error instanceof PrismaClientInitializationError) {
    sendDistributionMetric(
      "abods.graphql.prisma.error",
      1,
      "function:GraphQlFunction",
      `env:${process.env.PROJECT_ENV}`,
    );
  }

  sendDistributionMetric(
    "abods.graphql.request.status",
    1,
    "function:GraphQlFunction",
    `env:${process.env.PROJECT_ENV}`,
    `status:error`,
  );
};

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

const datadogMetricsPlugin: ApolloServerPlugin = {
  invalidRequestWasReceived({ error }) {
    sendErrorMetric(error);
    logger.error({ error }, "Received invalid request");
    return Promise.resolve();
  },
  startupDidFail({ error }) {
    sendErrorMetric(error);
    logger.error({ error }, "Startup failed");
    return Promise.resolve();
  },
  contextCreationDidFail({ error }) {
    logger.error({ error }, "Failed to create context");
    sendErrorMetric(error);
    return Promise.resolve();
  },
  unexpectedErrorProcessingRequest({
    error,
    requestContext: {
      request: { query, operationName },
    },
  }) {
    sendErrorMetric(error);
    logger.error({ error, query, operationName }, "Failed to process request");
    return Promise.resolve();
  },
  serverWillStart() {
    logger.info("Started server");
    return Promise.resolve(serverListener);
  },

  requestDidStart: async (
    context: GraphQLRequestContext<RequestContext>,
  ): Promise<GraphQLRequestListener<RequestContext>> => {
    const startTime = Date.now();

    return {
      didEncounterErrors: ({ errors, request: { query, operationName } }) => {
        for (const error of errors) {
          logger.error(
            { error, query, operationName },
            "Encountered error when processing request",
          );
          sendErrorMetric(error);
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
          sendErrorMetric(error);
        }
        return Promise.resolve();
      },

      executionDidStart: async (
        _: GraphQLRequestContextExecutionDidStart<RequestContext>,
      ): Promise<GraphQLRequestExecutionListener<RequestContext>> => {
        const executionStartTime = Date.now();

        return {
          willResolveField: ({
            info,
          }): GraphQLRequestListenerDidResolveField => {
            const fieldStartTime = Date.now();

            return () => {
              const fieldEndTime = Date.now();
              const fieldDuration = fieldEndTime - fieldStartTime;

              sendDistributionMetric(
                "abods.graphql.field.count",
                1,
                "function:GraphQlFunction",
                `env:${process.env.PROJECT_ENV}`,
                `field:${info.fieldName}`,
                `parentType:${info.parentType.name}`,
              );

              sendDistributionMetric(
                "abods.graphql.field.duration",
                fieldDuration,
                "function:GraphQlFunction",
                `env:${process.env.PROJECT_ENV}`,
                `field:${info.fieldName}`,
                `parentType:${info.parentType.name}`,
              );
            };
          },
          executionDidEnd: async () => {
            const executionEndTime = Date.now();
            const executionDuration = executionEndTime - executionStartTime;

            sendDistributionMetric(
              "abods.graphql.execution.duration",
              executionDuration,
              "function:GraphQlFunction",
              `env:${process.env.PROJECT_ENV}`,
              `operation:${context.request.operationName}`,
            );
          },
        };
      },
      willSendResponse: async (
        _: GraphQLRequestContextWillSendResponse<RequestContext>,
      ) => {
        const requestEndTime = Date.now();
        const requestDuration = requestEndTime - startTime;

        const status =
          context.errors && context.errors.length > 0 ? "error" : "success";

        sendDistributionMetric(
          "abods.graphql.request.duration",
          requestDuration,
          "function:GraphQlFunction",
          `env:${process.env.PROJECT_ENV}`,
          `operation:${context.request.operationName}`,
        );
        sendDistributionMetric(
          "abods.graphql.request.status",
          1,
          "function:GraphQlFunction",
          `env:${process.env.PROJECT_ENV}`,
          `operation:${context.request.operationName}`,
          `status:${status}`,
        );
      },
    };
  },
};

export default datadogMetricsPlugin;
