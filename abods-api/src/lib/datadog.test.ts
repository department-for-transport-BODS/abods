import datadogMetricsPlugin, * as datadog from "./datadog";
import { sendDistributionMetric } from "datadog-lambda-js";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";
import { GraphQLError } from "graphql";

jest.mock("datadog-lambda-js", () => ({
  sendDistributionMetric: jest.fn(),
}));

describe("sendErrorMetric", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, PROJECT_ENV: "test" };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("does not send metrics for UNAUTHENTICATED GraphQLError", () => {
    const error = new GraphQLError("Unauthenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });

    datadog.sendErrorMetric(error);

    expect(sendDistributionMetric).not.toHaveBeenCalled();
  });

  it("sends prisma error metric and error status for PrismaClientInitializationError", () => {
    const error = new PrismaClientInitializationError("Prisma error", "P1001");

    datadog.sendErrorMetric(error);

    expect(sendDistributionMetric).toHaveBeenCalledWith(
      "abods.graphql.prisma.error",
      1,
      "function:GraphQlFunction",
      "env:test",
    );
    expect(sendDistributionMetric).toHaveBeenCalledWith(
      "abods.graphql.request.status",
      1,
      "function:GraphQlFunction",
      "env:test",
      "status:error",
    );
  });

  it("sends error status metric for generic error", () => {
    const error = new Error("Some error");

    datadog.sendErrorMetric(error);

    expect(sendDistributionMetric).toHaveBeenCalledWith(
      "abods.graphql.request.status",
      1,
      "function:GraphQlFunction",
      "env:test",
      "status:error",
    );
  });

  it("sends error status metric for GraphQLError with other code", () => {
    const error = new GraphQLError("Other error", {
      extensions: { code: "SOME_OTHER_CODE" },
    });

    datadog.sendErrorMetric(error);

    expect(sendDistributionMetric).toHaveBeenCalledWith(
      "abods.graphql.request.status",
      1,
      "function:GraphQlFunction",
      "env:test",
      "status:error",
    );
  });
});

describe("datadogMetricsPlugin", () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, PROJECT_ENV: "test" };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("calls sendErrorMetric for invalidRequestWasReceived", async () => {
    const error = new Error("Invalid request");
    const spy = jest.spyOn(datadog, "sendErrorMetric");
    await datadogMetricsPlugin.invalidRequestWasReceived!({ error });
    expect(spy).toHaveBeenCalledWith(error);
  });

  it("calls sendErrorMetric for startupDidFail", async () => {
    const error = new Error("Startup failed");
    const spy = jest.spyOn(datadog, "sendErrorMetric");
    await datadogMetricsPlugin.startupDidFail!({ error });
    expect(spy).toHaveBeenCalledWith(error);
  });

  it("calls sendErrorMetric for contextCreationDidFail", async () => {
    const error = new Error("Context creation failed");
    const spy = jest.spyOn(datadog, "sendErrorMetric");
    await datadogMetricsPlugin.contextCreationDidFail!({ error });
    expect(spy).toHaveBeenCalledWith(error);
  });

  it("calls sendErrorMetric for unexpectedErrorProcessingRequest", async () => {
    const error = new Error("Unexpected error");
    const spy = jest.spyOn(datadog, "sendErrorMetric");
    await datadogMetricsPlugin.unexpectedErrorProcessingRequest!({
      error,
    } as never);
    expect(spy).toHaveBeenCalledWith(error);
  });

  it("requestDidStart: didEncounterErrors calls sendErrorMetric for each error", async () => {
    const error1 = new Error("Error 1");
    const error2 = new Error("Error 2");
    const spy = jest.spyOn(datadog, "sendErrorMetric");
    const listener = await datadogMetricsPlugin.requestDidStart!({
      request: { operationName: "TestOp" },
    } as never);
    if (listener && listener.didEncounterErrors) {
      await listener.didEncounterErrors({ errors: [error1, error2] } as never);
    }
    expect(spy).toHaveBeenCalledWith(error1);
    expect(spy).toHaveBeenCalledWith(error2);
  });

  it("requestDidStart: didEncounterSubsequentErrors calls sendErrorMetric for each error", async () => {
    const error1 = new Error("Error 1");
    const error2 = new Error("Error 2");
    const spy = jest.spyOn(datadog, "sendErrorMetric");
    const listener = await datadogMetricsPlugin.requestDidStart!({
      request: { operationName: "TestOp" },
    } as never);
    if (listener && listener.didEncounterSubsequentErrors) {
      await listener.didEncounterSubsequentErrors(
        { errors: [error1, error2] } as never,
        {} as never,
      );
    }
    expect(spy).toHaveBeenCalledWith(error1);
    expect(spy).toHaveBeenCalledWith(error2);
  });

  it("requestDidStart: executionDidStart/executionDidEnd sends execution duration metric", async () => {
    const listener = await datadogMetricsPlugin.requestDidStart!({
      request: { operationName: "TestOp" },
    } as never);
    if (listener && listener.executionDidStart) {
      const execListener = await listener.executionDidStart({} as never);
      if (execListener && execListener.executionDidEnd) {
        await execListener.executionDidEnd();
      }
    }
    expect(sendDistributionMetric).toHaveBeenCalledWith(
      "abods.graphql.execution.duration",
      expect.any(Number),
      "function:GraphQlFunction",
      "env:test",
      "operation:TestOp",
    );
  });

  it("requestDidStart: willSendResponse sends request duration and status metrics", async () => {
    const listener = await datadogMetricsPlugin.requestDidStart!({
      request: { operationName: "TestOp" },
      errors: [],
    } as never);

    if (listener && listener.willSendResponse) {
      await listener.willSendResponse({
        errors: [],
        request: { operationName: "TestOp" },
      } as never);
    }

    expect(sendDistributionMetric).toHaveBeenCalledWith(
      "abods.graphql.request.duration",
      expect.any(Number),
      "function:GraphQlFunction",
      "env:test",
      "operation:TestOp",
    );
    expect(sendDistributionMetric).toHaveBeenCalledWith(
      "abods.graphql.request.status",
      1,
      "function:GraphQlFunction",
      "env:test",
      "operation:TestOp",
      "status:success",
    );
  });

  it("requestDidStart: willSendResponse sends error status if errors present", async () => {
    const listener = await datadogMetricsPlugin.requestDidStart!({
      request: { operationName: "TestOp" },
      errors: [new Error("fail")],
    } as never);

    if (listener && listener.willSendResponse) {
      await listener.willSendResponse({
        errors: [new Error("fail")],
        request: { operationName: "TestOp" },
      } as never);
    }

    expect(sendDistributionMetric).toHaveBeenCalledWith(
      "abods.graphql.request.status",
      1,
      "function:GraphQlFunction",
      "env:test",
      "operation:TestOp",
      "status:error",
    );
  });
});
