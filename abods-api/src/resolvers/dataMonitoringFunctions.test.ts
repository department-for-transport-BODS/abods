import { getEmbeddedUrl } from "./dataMonitoringFunctions";
import {
  Dialect,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { DB } from "../kysely";
import { createRequest, createResponse } from "node-mocks-http";
import { RequestContext } from "../types/extra";
import { GraphQLResolveInfo } from "graphql";
import * as helpers from "./helpers";
import * as awsLib from "../lib/aws";
import * as operatorsLib from "../lib/operators";
import * as kyselyLib from "../lib/dbKysely";
import { sendDistributionMetric } from "datadog-lambda-js";
import { AwsQuicksightUser } from "../types/generated";

jest.mock("datadog-lambda-js", () => ({
  sendDistributionMetric: jest.fn(),
}));

jest.mock("./helpers", () => ({
  requireUserSession: jest.fn(),
}));

jest.mock("../lib/aws", () => ({
  checkRequiredQuicksightVars: jest.fn(),
  getDashboardId: jest.fn(),
  getDashboardUrl: jest.fn(),
  getDashboardUserType: jest.fn(),
  getSessionTags: jest.fn(),
}));

jest.mock("../lib/operators", () => ({
  getUserTypeDetails: jest.fn(),
}));

jest.mock("../logger", () => ({
  debug: jest.fn(),
  info: jest.fn(),
}));

const dummyDialect: Dialect = {
  createDriver: () => new DummyDriver(),
  createQueryCompiler: () => new PostgresQueryCompiler(),
  createAdapter: () => new PostgresAdapter(),
  createIntrospector: (db) => new PostgresIntrospector(db),
};

const dummyKysely = new Kysely<DB>({
  dialect: dummyDialect,
});

let context: RequestContext;

beforeEach(() => {
  jest.clearAllMocks();
  context = {
    kysely: dummyKysely,
    db: {} as never,
    req: createRequest(),
    res: createResponse(),
    headers: {},
  };
});

describe("getEmbeddedUrl", () => {
  it("returns enabled: true and url when user is allowed and dashboardId exists", async () => {
    // Mock user session
    (helpers.requireUserSession as jest.Mock).mockResolvedValue({
      id: 1,
      orgs: [{ id: 10, name: "Org 10" }],
    });

    // Mock Kysely updateTable chain for access count
    jest
      .spyOn(kyselyLib, "updateQueryTakeFirst")
      .mockResolvedValue({ numUpdatedRows: 1 } as never);

    // Mock AWS/Quicksight helpers
    (awsLib.checkRequiredQuicksightVars as jest.Mock).mockReturnValue(
      undefined,
    );
    (operatorsLib.getUserTypeDetails as jest.Mock).mockResolvedValue([
      { lta_name: "LTA", org_name: "Org 10", is_superuser: false },
    ]);
    (awsLib.getDashboardUserType as jest.Mock).mockReturnValue("org");
    (awsLib.getDashboardId as jest.Mock).mockReturnValue("dashboard-123");
    (awsLib.getSessionTags as jest.Mock).mockReturnValue([
      { Key: "k", Value: "v" },
    ]);
    (awsLib.getDashboardUrl as jest.Mock).mockResolvedValue(
      "https://dashboard.url",
    );

    const args = {};
    let result: Partial<AwsQuicksightUser> | null = null;
    if (typeof getEmbeddedUrl === "function") {
      result = await getEmbeddedUrl(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result).toEqual({ enabled: true, url: "https://dashboard.url" });
    expect(helpers.requireUserSession).toHaveBeenCalled();
    expect(awsLib.checkRequiredQuicksightVars).toHaveBeenCalled();
    expect(operatorsLib.getUserTypeDetails).toHaveBeenCalledWith(
      context.kysely,
      1,
    );
    expect(awsLib.getDashboardUserType).toHaveBeenCalled();
    expect(awsLib.getDashboardId).toHaveBeenCalledWith("org");
    expect(awsLib.getSessionTags).toHaveBeenCalled();
    expect(awsLib.getDashboardUrl).toHaveBeenCalledWith(
      [{ Key: "k", Value: "v" }],
      "dashboard-123",
    );
    expect(sendDistributionMetric).toHaveBeenCalled();
  });

  it("returns enabled: false when throttled", async () => {
    (helpers.requireUserSession as jest.Mock).mockResolvedValue({
      id: 1,
      orgs: [{ id: 10, name: "Org 10" }],
    });

    jest
      .spyOn(kyselyLib, "updateQueryTakeFirst")
      .mockResolvedValue({ numUpdatedRows: 0 });

    const args = {};
    let result: Partial<AwsQuicksightUser> | null = null;
    if (typeof getEmbeddedUrl === "function") {
      result = await getEmbeddedUrl(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result).toEqual({ enabled: false });
  });

  it("throws error if dashboardId is missing", async () => {
    (helpers.requireUserSession as jest.Mock).mockResolvedValue({
      id: 1,
      orgs: [{ id: 10, name: "Org 10" }],
    });

    jest
      .spyOn(kyselyLib, "updateQueryTakeFirst")
      .mockResolvedValue({ numUpdatedRows: 1 });

    (awsLib.checkRequiredQuicksightVars as jest.Mock).mockReturnValue(
      undefined,
    );
    (operatorsLib.getUserTypeDetails as jest.Mock).mockResolvedValue([
      { lta_name: "LTA", org_name: "Org 10", is_superuser: false },
    ]);
    (awsLib.getDashboardUserType as jest.Mock).mockReturnValue("org");
    (awsLib.getDashboardId as jest.Mock).mockReturnValue(undefined);

    const args = {};
    if (typeof getEmbeddedUrl === "function") {
      await expect(
        getEmbeddedUrl({}, args, context, {} as GraphQLResolveInfo),
      ).rejects.toThrow(
        "No quicksight dashboard id set in environment variables",
      );
    }
  });
});
