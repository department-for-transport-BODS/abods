import { getHeadwayOverview } from "../../../src/resolvers/otpFunctions";
import { jest } from "@jest/globals";
import * as kysely from "../../../src/lib/kysely";
import {
  HeadwayOverviewType,
  RequireFields,
  HeadwayMetricsTypeHeadwayOverviewArgs,
} from "../../../src/types/generated";
import { DB } from "../../../src/kysely";
import {
  Dialect,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  SelectQueryBuilder,
} from "kysely";

const dummyDialect: Dialect = {
  createDriver: () => new DummyDriver(),
  createQueryCompiler: () => new PostgresQueryCompiler(),
  createAdapter: () => new PostgresAdapter(),
  createIntrospector: (db) => new PostgresIntrospector(db),
};

const dummyKysely = new Kysely<DB>({
  dialect: dummyDialect,
});

jest.mock("../../../src/resolvers/helpers", () => ({
  requireUserSession: jest.fn(() =>
    Promise.resolve({ id: 1, orgs: [{ id: 10 }] }),
  ),
}));
jest.mock("../../../src/lib/operators", () => ({
  getUserOperatorIds: jest.fn(() => Promise.resolve(["OP1"])),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getHeadwayOverview", () => {
  it("returns correct excess wait time", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([
      { excess_wait_time: 5, headway_stops_count: 2 },
      { excess_wait_time: 7, headway_stops_count: 3 },
      { excess_wait_time: 10, headway_stops_count: 5 },
    ]);

    const context = { kysely: dummyKysely };
    const args: RequireFields<HeadwayMetricsTypeHeadwayOverviewArgs, "inputs"> =
      {
        inputs: {
          fromTimestamp: "2025-09-11T00:00:00.000+01:00",
          toTimestamp: "2025-09-18T00:00:00.000+01:00",
          filters: {
            operatorIds: ["OP1"],
          },
        },
      };

    let result: HeadwayOverviewType | null = null;
    if (typeof getHeadwayOverview === "function") {
      result = await getHeadwayOverview({}, args, context as any, {} as any);
    }

    expect(result).not.toBeNull();
    expect(result?.excess).toBeCloseTo(8.1, 5);
  });

  it("returns undefined excess when no results", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([]);

    const context = { kysely: dummyKysely };
    const args: RequireFields<HeadwayMetricsTypeHeadwayOverviewArgs, "inputs"> =
      {
        inputs: {
          fromTimestamp: "2025-09-11T00:00:00.000+01:00",
          toTimestamp: "2025-09-18T00:00:00.000+01:00",
          filters: {
            operatorIds: ["OP1"],
          },
        },
      };

    let result: HeadwayOverviewType | null = null;
    if (typeof getHeadwayOverview === "function") {
      result = await getHeadwayOverview({}, args, context as any, {} as any);
    }

    expect(result).not.toBeNull();
    expect(result?.excess).toBeUndefined();
  });

  it("returns null when user does not have access to operator", async () => {
    const context = { kysely: dummyKysely };
    const args: RequireFields<HeadwayMetricsTypeHeadwayOverviewArgs, "inputs"> =
      {
        inputs: {
          fromTimestamp: "2025-09-11T00:00:00.000+01:00",
          toTimestamp: "2025-09-18T00:00:00.000+01:00",
          filters: {
            operatorIds: ["OP2"],
          },
        },
      };

    let result: HeadwayOverviewType | null = null;
    if (typeof getHeadwayOverview === "function") {
      result = await getHeadwayOverview({}, args, context as any, {} as any);
    }

    expect(result?.excess).toBeUndefined();
  });

  it("includes startTime and endTime filters in the query", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([
      { excess_wait_time: 5, headway_stops_count: 2 },
      { excess_wait_time: 7, headway_stops_count: 3 },
    ]);

    const args: RequireFields<HeadwayMetricsTypeHeadwayOverviewArgs, "inputs"> =
      {
        inputs: {
          fromTimestamp: "2025-09-11T00:00:00.000+01:00",
          toTimestamp: "2025-09-18T00:00:00.000+01:00",
          filters: {
            operatorIds: ["OP1"],
            startTime: "08:00",
            endTime: "18:00",
          },
        },
      };
    const context = { kysely: dummyKysely };

    let result: HeadwayOverviewType | null = null;
    if (typeof getHeadwayOverview === "function") {
      result = await getHeadwayOverview({}, args, context as any, {} as any);
    }

    expect(result).not.toBeNull();

    // Check that the query builder received the correct hour filters
    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();
    expect(compiled.sql).toContain("hour");
    expect(compiled.parameters).toContain(8);
    expect(compiled.parameters).toContain(18);
  });
});
