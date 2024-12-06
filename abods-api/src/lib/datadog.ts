/* eslint-disable @typescript-eslint/require-await */
import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestContextExecutionDidStart,
  GraphQLRequestContextWillSendResponse,
  GraphQLRequestExecutionListener,
  GraphQLRequestListener,
  GraphQLRequestListenerDidResolveField,
} from "@apollo/server";
import { RequestContext } from "../types/extra";
import { sendDistributionMetric } from "datadog-lambda-js";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";

export const sendErrorMetric = (error: unknown) => {
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

const datadogMetricsPlugin: ApolloServerPlugin = {
  requestDidStart: async (
    context: GraphQLRequestContext<RequestContext>,
  ): Promise<GraphQLRequestListener<RequestContext>> => {
    const startTime = Date.now();

    return {
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
