import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestContextWillSendResponse,
  GraphQLRequestListener,
} from "@apollo/server";
import { RequestContext } from "../types/extra";
import axios from "axios";
import { sendDistributionMetric } from "datadog-lambda-js";

const DATADOG_API_KEY = process.env.DD_API_KEY;
const DATADOG_API_URL = "https://api.datadoghq.eu/api/v1/series";

// Helper function to send custom metrics
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendCustomMetricsToDatadog = async (metrics: any): Promise<void> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    console.log("key---", process.env.DD_API_KEY);
    const response = await axios.post(
      DATADOG_API_URL,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { series: metrics },
      {
        headers: {
          "DD-API-KEY": DATADOG_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );
    console.log("Custom metrics sent to Datadog:", response.status);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      // Specific error type for Axios
      console.error("Error sending custom metrics to Datadog:", error.message);
      console.error("Axios error details:", error.response?.data);
    } else if (error instanceof Error) {
      // Generic error type
      console.error("Error sending custom metrics to Datadog:", error.message);
    } else {
      // Fallback for unknown error type
      console.error("Unknown error occurred:", error);
    }
  }
};

const datadogMetricsPlugin: ApolloServerPlugin = {
  // eslint-disable-next-line @typescript-eslint/require-await
  requestDidStart: async (
    req: GraphQLRequestContext<RequestContext>,
  ): Promise<GraphQLRequestListener<RequestContext>> => {
    const startTime = Date.now();
    console.log("Request::::::", req.request.operationName);

    return {
      // eslint-disable-next-line @typescript-eslint/require-await
      willSendResponse: async (
        _: GraphQLRequestContextWillSendResponse<RequestContext>,
      ) => {
        const requestEndTime = Date.now();
        const requestDuration = requestEndTime - startTime;

        console.log("requestDuration::::::", requestDuration);
        // Publish request metrics
        // const metrics = [
        //   {
        //     metric: 'graphql.execution.duration',
        //     points: [[Math.floor(Date.now() / 1000), requestDuration]],
        //     tags: ['function:GraphQlFunction', 'env:local', `operation:${req.request.operationName}`], // Add relevant tags
        //     type: 'gauge',
        //   },
        //   {
        //     metric: 'graphql.execution.success',
        //     points: [[Math.floor(Date.now() / 1000), 1]],
        //     tags: ['function:GraphQlFunction', 'env:local', `operation:${req.request.operationName}`],
        //     type: 'count',
        //   },
        // ];

        // Send custom metrics to Datadog
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        //await sendCustomMetricsToDatadog(metrics);
        sendDistributionMetric(
          "lib.graphql.execution.duration",
          requestDuration,
          "function:GraphQlFunction",
          "env:local",
          `operation:${req.request.operationName}`,
        );
        sendDistributionMetric(
          "lib.graphql.execution.success",
          requestDuration,
          "function:GraphQlFunction",
          "env:local",
          `operation:${req.request.operationName}`,
        );
        console.log("after::::::");
      },
    };
  },
};

export default datadogMetricsPlugin;
