/* eslint-disable @typescript-eslint/require-await */
import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestContextExecutionDidStart,
  GraphQLRequestContextWillSendResponse,
  GraphQLRequestExecutionListener,
  GraphQLRequestListener,
} from "@apollo/server";
import { RequestContext } from "../types/extra";
import { sendDistributionMetric } from "datadog-lambda-js";
import { GraphQLError } from "graphql";

export const sendErrorMetric = (error: unknown) => {
  if (
    error instanceof GraphQLError &&
    error?.extensions?.code === "UNAUTHENTICATED"
  ) {
    return;
  }

  sendDistributionMetric(
    "abods.graphql.request.status",
    1,
    "function:GraphQlFunction",
    `env:${process.env.PROJECT_ENV}`,
    `status:error`,
  );
};

const datadogMetricsPlugin: ApolloServerPlugin = {
  invalidRequestWasReceived({ error }) {
    sendErrorMetric(error);
    return Promise.resolve();
  },
  startupDidFail({ error }) {
    sendErrorMetric(error);
    return Promise.resolve();
  },
  contextCreationDidFail({ error }) {
    sendErrorMetric(error);
    return Promise.resolve();
  },
  unexpectedErrorProcessingRequest({ error }) {
    sendErrorMetric(error);
    return Promise.resolve();
  },

  requestDidStart: async (
    context: GraphQLRequestContext<RequestContext>,
  ): Promise<GraphQLRequestListener<RequestContext>> => {
    const startTime = Date.now();

    return {
      didEncounterErrors: ({ errors }) => {
        for (const error of errors) {
          sendErrorMetric(error);
        }
        return Promise.resolve();
      },

      didEncounterSubsequentErrors: ({ errors }) => {
        if (!errors) return Promise.resolve();
        for (const error of errors) {
          sendErrorMetric(error);
        }
        return Promise.resolve();
      },

      executionDidStart: async (
        _: GraphQLRequestContextExecutionDidStart<RequestContext>,
      ): Promise<GraphQLRequestExecutionListener<RequestContext>> => {
        const executionStartTime = Date.now();

        return {
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
