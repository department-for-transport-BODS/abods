import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestContextWillSendResponse,
  GraphQLRequestListener,
} from "@apollo/server";
import { StatsD } from "hot-shots";
import { RequestContext } from "../types/extra";

const dogstatsd = new StatsD();

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
        responseContext: GraphQLRequestContextWillSendResponse<RequestContext>,
      ) => {
        const requestEndTime = Date.now();
        const requestDuration = requestEndTime - startTime;

        const operationName = req.operationName ?? "unknown_operation";
        const status =
          responseContext.errors && responseContext.errors.length > 0
            ? "error"
            : "success";

        console.log("requestDuration::::::", requestDuration);
        // Publish request metrics
        dogstatsd.timing("graphql.request.duration", requestDuration, [
          `operation:${operationName}`,
          `status:${status}`,
        ]);

        dogstatsd.increment("graphql.request.count", 1, [
          `operation:${operationName}`,
          `status:${status}`,
        ]);

        dogstatsd.close();
      },
    };
  },
};

export default datadogMetricsPlugin;
