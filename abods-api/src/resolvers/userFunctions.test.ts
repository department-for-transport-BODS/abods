import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { GraphQLResolveInfo } from "graphql";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import {
  Dialect,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { createRequest, createResponse } from "node-mocks-http";
import { DB } from "../kysely";
import * as kyselyLib from "../lib/dbKysely.js";
import logger from "../logger";
import * as prismaClient from "../prismaClient";
import { RequestContext } from "../types/extra";
import {
  FeatureFlag,
  LoginInfo,
  LoginResponse,
  Organisation,
} from "../types/generated";
import * as helpers from "./helpers";
import {
  getFeatureFlags,
  getUser,
  getUserOrgs,
  loginUser,
  logoutUser,
} from "./userFunctions";

jest.mock("./helpers", () => ({
  requireUserSession: jest.fn(),
  throwUnauthenticatedError: jest.fn(),
}));

jest.mock("argon2", () => ({
  verify: jest.fn(),
}));
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-token"),
}));
jest.mock("datadog-lambda-js", () => ({
  sendDistributionMetric: jest.fn(),
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
let mockDb: DeepMockProxy<PrismaClient>;
let context: RequestContext;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(logger, "error").mockResolvedValue({} as never);
  mockDb = mockDeep<PrismaClient>();
  context = {
    db: mockDb,
    req: createRequest(),
    res: createResponse(),
    headers: {},
    kysely: dummyKysely,
  };
});

describe("getFeatureFlags", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("returns enabled flags when not local", () => {
    jest.spyOn(prismaClient, "isLocal").mockReturnValue(false);
    process.env.ABODS_FLAG_ServiceMonitoring = "true";

    const flags = getFeatureFlags();
    expect(flags).toContain("ServiceMonitoring");
  });

  it("returns enabled flags when ENABLE_FEATURE_FLAG_LOCAL is set", () => {
    jest.spyOn(prismaClient, "isLocal").mockReturnValue(true);
    process.env.ENABLE_FEATURE_FLAG_LOCAL = "true";
    process.env.ABODS_FLAG_ServiceMonitoring = "true";

    const flags = getFeatureFlags();
    expect(flags).toContain("ServiceMonitoring");
  });

  it("does not return flag if env var is not true", () => {
    jest.spyOn(prismaClient, "isLocal").mockReturnValue(false);
    process.env.ABODS_FLAG_ServiceMonitoring = "false";

    const flags = getFeatureFlags();
    expect(flags).not.toContain("ServiceMonitoring");
  });

  it("does not return flag if env var is missing", () => {
    jest.spyOn(prismaClient, "isLocal").mockReturnValue(false);
    delete process.env.ABODS_FLAG_ServiceMonitoring;

    const flags = getFeatureFlags();
    expect(flags).not.toContain("ServiceMonitoring");
  });
});

describe("getUser", () => {
  it("returns user info with correct flags and permissions", async () => {
    // Mock session user
    (helpers.requireUserSession as jest.Mock).mockResolvedValue({
      id: 123,
      orgs: [{ id: 10 }],
    });

    // Mock Prisma user details
    mockDb.bods_user.findUniqueOrThrow.mockResolvedValue({
      userOrganisations: [{ organisation: { is_abods_global_viewer: true } }],
      email: "admin@dft.gov.uk",
      account_type: 1,
    } as never);

    process.env.ENABLE_FEATURE_FLAG_LOCAL = "true";
    process.env.ABODS_FLAG_StopAnalysis = "true";
    process.env.ABODS_FLAG_Distances = "true";
    process.env.ABODS_FLAG_DataMonitoring = "true";
    process.env.ABODS_FLAG_ServiceMonitoring = "false";
    process.env.DATADOG_SERVICE_MONITORING_DASHBOARD =
      "https://dashboard.example.com";

    let result: Partial<LoginInfo> | null = null;
    if (typeof getUser === "function") {
      result = await getUser({}, {}, context, {} as GraphQLResolveInfo);
    }

    expect(result).not.toBeNull();
    expect(result?.currentUserId).toBe("123");
    expect(result?.canViewServiceMonitoring).toBe(true);
    expect(result?.canEditAllAlerts).toBe(true);
    expect(result?.canViewDistances).toBe(true);
    expect(result?.serviceMonitoringEmbedUrl).toBe(
      "https://dashboard.example.com",
    );
    expect(result?.flags).not.toContain(FeatureFlag.ServiceMonitoring);
  });

  it("returns null and logs error if prisma throws", async () => {
    (helpers.requireUserSession as jest.Mock).mockResolvedValue({
      id: 123,
      orgs: [{ id: 10 }],
    });

    mockDb.bods_user.findUniqueOrThrow.mockRejectedValue(new Error("DB error"));

    let result: Partial<LoginInfo> | null = null;
    if (typeof getUser === "function") {
      result = await getUser({}, {}, context, {} as GraphQLResolveInfo);
    }

    expect(result).toBeNull();
  });

  it("returns correct permissions for non-admin user", async () => {
    (helpers.requireUserSession as jest.Mock).mockResolvedValue({
      id: 456,
      orgs: [{ id: 20 }],
    });

    mockDb.bods_user.findUniqueOrThrow.mockResolvedValue({
      userOrganisations: [{ organisation: { is_abods_global_viewer: false } }],
      email: "user@otherdomain.com",
      account_type: 3,
    } as never);

    process.env.ABODS_FLAG_DataMonitoring = "true";
    process.env.DATADOG_SERVICE_MONITORING_DASHBOARD =
      "https://dashboard.example.com";

    let result: Partial<LoginInfo> | null = null;
    if (typeof getUser === "function") {
      result = await getUser({}, {}, context, {} as GraphQLResolveInfo);
    }

    expect(result).not.toBeNull();
    expect(result?.currentUserId).toBe("456");
    expect(result?.canViewServiceMonitoring).toBe(false);
    expect(result?.canEditAllAlerts).toBe(false);
    expect(result?.canViewDistances).toBe(false);
    expect(result?.serviceMonitoringEmbedUrl).toBeNull();
  });

  it("can view service monitoring url for users with support email domain", async () => {
    (helpers.requireUserSession as jest.Mock).mockResolvedValue({
      id: 456,
      orgs: [{ id: 20 }],
    });

    mockDb.bods_user.findUniqueOrThrow.mockResolvedValue({
      userOrganisations: [{ organisation: { is_abods_global_viewer: false } }],
      email: "user@kpmg.co.uk",
      account_type: 3,
    } as never);

    process.env.DATADOG_SERVICE_MONITORING_DASHBOARD =
      "https://dashboard.example.com";

    let result: Partial<LoginInfo> | null = null;
    if (typeof getUser === "function") {
      result = await getUser({}, {}, context, {} as GraphQLResolveInfo);
    }

    expect(result).not.toBeNull();
    expect(result?.canViewServiceMonitoring).toBe(true);
    expect(result?.serviceMonitoringEmbedUrl).toBe(
      "https://dashboard.example.com",
    );
  });

  it("can view service monitoring url for dft admin user", async () => {
    (helpers.requireUserSession as jest.Mock).mockResolvedValue({
      id: 456,
      orgs: [{ id: 20 }],
    });

    mockDb.bods_user.findUniqueOrThrow.mockResolvedValue({
      userOrganisations: [{ organisation: { is_abods_global_viewer: false } }],
      email: "user@dft.gov.uk",
      account_type: 1,
    } as never);

    process.env.DATADOG_SERVICE_MONITORING_DASHBOARD =
      "https://dashboard.example.com";

    let result: Partial<LoginInfo> | null = null;
    if (typeof getUser === "function") {
      result = await getUser({}, {}, context, {} as GraphQLResolveInfo);
    }

    expect(result).not.toBeNull();
    expect(result?.canViewServiceMonitoring).toBe(true);
    expect(result?.serviceMonitoringEmbedUrl).toBe(
      "https://dashboard.example.com",
    );
  });
});

describe("loginUser", () => {
  it("logs in user with valid credentials and returns success", async () => {
    mockDb.bods_user.findFirst.mockResolvedValue({
      id: 123,
      password: "argon2$hashedpassword",
      is_active: true,
      userOrganisations: [
        { organisation_id: 10, organisation: { name: "Org1" } },
      ],
    } as never);

    (argon2.verify as jest.Mock).mockResolvedValue(true);

    mockDb.tokens.upsert.mockResolvedValue({} as never);
    mockDb.login_details.upsert.mockResolvedValue({} as never);

    const args = { username: "user@dft.gov.uk", password: "password" };

    let result: Partial<LoginResponse> | null = null;
    if (typeof loginUser === "function") {
      result = await loginUser({}, args, context, {} as GraphQLResolveInfo);
    }

    expect(result?.success).toBe(true);
    expect(result?.expiresAt).toBeDefined();
    expect(context.res.getHeader("Set-Cookie")).toMatch(
      /abods_sessionid=mock-token/,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.tokens.upsert).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.login_details.upsert).toHaveBeenCalled();
  });

  it("returns failure if username or password is missing", async () => {
    let result: Partial<LoginResponse> | null = null;
    if (typeof loginUser === "function") {
      result = await loginUser(
        {},
        {} as never,
        context,
        {} as GraphQLResolveInfo,
      );
    }
    expect(result?.success).toBe(false);
  });

  it("returns failure if user not found", async () => {
    mockDb.bods_user.findFirst.mockResolvedValue(null);

    const args = { username: "user@dft.gov.uk", password: "password" };
    let result: Partial<LoginResponse> | null = null;
    if (typeof loginUser === "function") {
      result = await loginUser({}, args, context, {} as GraphQLResolveInfo);
    }

    expect(result?.success).toBe(false);
  });

  it("returns failure if user is not mapped to any organisation", async () => {
    mockDb.bods_user.findFirst.mockResolvedValue({
      id: 123,
      password: "argon2$hashedpassword2",
      is_active: true,
      userOrganisations: [],
    } as never);

    const args = { username: "user@dft.gov.uk", password: "password" };

    if (typeof loginUser === "function") {
      await loginUser({}, args, context, {} as GraphQLResolveInfo);
    }

    expect(helpers.throwUnauthenticatedError).toHaveBeenCalledWith(
      "User not mapped to any organisation",
    );
  });

  it("returns failure if password does not match", async () => {
    mockDb.bods_user.findFirst.mockResolvedValue({
      id: 123,
      password: "argon2$hashedpassword",
      is_active: true,
      userOrganisations: [
        { organisation_id: 10, organisation: { name: "Org1" } },
      ],
    } as never);

    (argon2.verify as jest.Mock).mockResolvedValue(false);

    const args = { username: "user@dft.gov.uk", password: "wrongpassword" };
    let result: Partial<LoginResponse> | null = null;
    if (typeof loginUser === "function") {
      result = await loginUser({}, args, context, {} as GraphQLResolveInfo);
    }

    expect(result?.success).toBe(false);
  });
});

describe("getUserOrgs", () => {
  it("returns all orgs when user is global admin", async () => {
    // User with global admin org
    const user = { id: 1, orgs: [{ id: 10 }, { id: 20 }] };
    (helpers.requireUserSession as jest.Mock).mockResolvedValue(user);

    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValueOnce([
        { id: 10, name: "Org A", is_abods_global_viewer: true },
        { id: 20, name: "Org B", is_abods_global_viewer: false },
      ])
      // Second execute returns all orgs
      .mockResolvedValueOnce([
        { id: 10, name: "Org A", is_abods_global_viewer: true },
        { id: 20, name: "Org B", is_abods_global_viewer: false },
        { id: 30, name: "Org C", is_abods_global_viewer: false },
      ]);

    // Patch requireUserSession to return our user
    jest.spyOn(helpers, "requireUserSession").mockResolvedValue(user as never);

    let result: Partial<Organisation>[] = [];
    if (typeof getUserOrgs === "function") {
      result = (await getUserOrgs(
        {},
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<Organisation>[];
    }

    expect(result).toEqual([
      { id: 10, name: "Org A" },
      { id: 20, name: "Org B" },
      { id: 30, name: "Org C" },
    ]);
    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(2);
  });

  it("returns only user's orgs when not global admin", async () => {
    // User without global admin
    const user = { id: 1, orgs: [{ id: 10 }, { id: 20 }] };
    (helpers.requireUserSession as jest.Mock).mockResolvedValue(user);

    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue([
        { id: 20, name: "Org B", is_abods_global_viewer: false },
      ]);

    jest.spyOn(helpers, "requireUserSession").mockResolvedValue(user as never);

    let result: Partial<Organisation>[] = [];
    if (typeof getUserOrgs === "function") {
      result = (await getUserOrgs(
        {},
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<Organisation>[];
    }

    expect(result).toEqual([{ id: 20, name: "Org B" }]);
    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(1);
  });
});

describe("logoutUser", () => {
  it("deletes user token and returns true", async () => {
    (helpers.requireUserSession as jest.Mock).mockResolvedValue({
      id: 123,
      orgs: [{ id: 10 }],
    });
    mockDb.tokens.delete.mockResolvedValue({} as never);

    let result: boolean | null = null;
    if (typeof logoutUser === "function") {
      result = await logoutUser({}, {}, context, {} as GraphQLResolveInfo);
    }

    expect(result).toBe(true);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.tokens.delete).toHaveBeenCalledWith({
      where: { user_id: 123 },
    });
  });

  it("returns false and logs error if token deletion fails", async () => {
    (helpers.requireUserSession as jest.Mock).mockResolvedValue({
      id: 123,
      orgs: [{ id: 10 }],
    });
    mockDb.tokens.delete.mockRejectedValue(new Error("DB error"));

    let result: boolean | null = null;
    if (typeof logoutUser === "function") {
      result = await logoutUser({}, {}, context, {} as GraphQLResolveInfo);
    }

    expect(result).toBe(false);
  });
});
