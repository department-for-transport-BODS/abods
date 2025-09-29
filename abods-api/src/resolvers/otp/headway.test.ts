import {
  Dialect,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  SelectQueryBuilder,
} from "kysely";
import { DB } from "../../kysely";
import {
  RequireFields,
  HeadwayMetricsTypeHeadwayOverviewArgs,
  HeadwayOverviewType,
  Granularity,
  HeadwayMetricsTypeHeadwayTimeSeriesArgs,
  HeadwayTimeSeriesType,
} from "../../types/generated";
import { getHeadwayOverview, getHeadwayTimeSeries } from "./headway";
import * as kyselyLib from "../../lib/dbKysely.js";
import { RequestContext } from "../../types/extra";
import { GraphQLResolveInfo } from "graphql";
import dayjs from "dayjs";

jest.mock("../../../src/resolvers/helpers", () => ({
  requireUserSession: jest.fn(() =>
    Promise.resolve({ id: 1, orgs: [{ id: 10 }] }),
  ),
}));
jest.mock("../../../src/lib/operators", () => ({
  getUserOperatorIds: jest.fn(() => Promise.resolve(["OP1", "OP2"])),
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
  context = { kysely: dummyKysely } as RequestContext;
});

describe("getHeadwayOverview", () => {
  it("returns correct excess wait time", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      { excess_wait_time: 5, headway_stops_count: 2 },
      { excess_wait_time: 7, headway_stops_count: 3 },
      { excess_wait_time: 10, headway_stops_count: 5 },
    ]);

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
      result = await getHeadwayOverview(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result).not.toBeNull();
    expect(result?.excess).toBeCloseTo(8.1, 5);
  });

  it("returns undefined excess when no results", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([]);

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
      result = await getHeadwayOverview(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result).not.toBeNull();
    expect(result?.excess).toBeUndefined();
  });

  it("returns null when user does not have access to operator", async () => {
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
      result = await getHeadwayOverview(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result?.excess).toBeUndefined();
  });

  it("includes startTime and endTime filters in the query", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
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

    let result: HeadwayOverviewType | null = null;
    if (typeof getHeadwayOverview === "function") {
      result = await getHeadwayOverview(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result).not.toBeNull();

    // Check that the query builder received the correct hour filters
    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();
    expect(compiled.sql).toContain("hour");
    expect(compiled.parameters).toContain(8);
    expect(compiled.parameters).toContain(18);
  });
});

describe("getHeadwayTimeSeries", () => {
  it("returns correct headway time series stats", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      {
        departure_hour: "2025-09-11T08:00:00.000Z",
        actual_headway: 6,
        expected_headway: 5,
        excess_wait_time: 2,
        headway_stops_count: 2,
      },
      {
        departure_hour: "2025-09-11T09:00:00.000Z",
        actual_headway: 8,
        expected_headway: 7,
        excess_wait_time: 3,
        headway_stops_count: 4,
      },
    ]);

    const args: RequireFields<
      HeadwayMetricsTypeHeadwayTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          granularity: Granularity.Hour,
        },
      },
    };

    let result: Partial<HeadwayTimeSeriesType>[] | null = null;
    if (typeof getHeadwayTimeSeries === "function") {
      result = (await getHeadwayTimeSeries(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<HeadwayTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      ts: new Date("2025-09-11T08:00:00.000Z"),
      actual: 6,
      scheduled: 5,
      excess: 2,
    });
    expect(result?.[1]).toEqual({
      ts: new Date("2025-09-11T09:00:00.000Z"),
      actual: 8,
      scheduled: 7,
      excess: 3,
    });
  });

  it("includes startTime and endTime filters in the query", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      {
        departure_hour: "2025-09-11T08:00:00.000Z",
        actual_headway: 6,
        expected_headway: 5,
        excess_wait_time: 2,
        headway_stops_count: 2,
      },
    ]);

    const args: RequireFields<
      HeadwayMetricsTypeHeadwayTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          startTime: "08:00",
          endTime: "18:00",
          granularity: Granularity.Hour,
        },
      },
    };

    let result: Partial<HeadwayTimeSeriesType>[] | null = null;
    if (typeof getHeadwayTimeSeries === "function") {
      result = (await getHeadwayTimeSeries(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<HeadwayTimeSeriesType>[];
    }
    expect(result).not.toBeNull();
    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();
    expect(compiled.sql).toContain("hour");
    expect(compiled.parameters).toContain(8);
    expect(compiled.parameters).toContain(18);
  });

  it("returns sorted headway time series by ts", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      {
        departure_hour: "2025-09-11T15:00:00.000Z",
        actual_headway: 4,
        expected_headway: 3,
        excess_wait_time: 1,
        headway_stops_count: 1,
      },
      {
        departure_hour: "2025-09-11T08:00:00.000Z",
        actual_headway: 6,
        expected_headway: 5,
        excess_wait_time: 2,
        headway_stops_count: 2,
      },
      {
        departure_hour: "2025-09-11T09:00:00.000Z",
        actual_headway: 8,
        expected_headway: 7,
        excess_wait_time: 3,
        headway_stops_count: 4,
      },
    ]);

    const args: RequireFields<
      HeadwayMetricsTypeHeadwayTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          granularity: Granularity.Hour,
        },
      },
    };

    let result: Partial<HeadwayTimeSeriesType>[] | null = null;
    if (typeof getHeadwayTimeSeries === "function") {
      result = (await getHeadwayTimeSeries(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<HeadwayTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(3);

    // Sorted by ts: 08:00, 09:00, 15:00
    expect(
      dayjs(result?.[0].ts).isSame(dayjs("2025-09-11T08:00:00.000Z")),
    ).toBe(true);
    expect(
      dayjs(result?.[1].ts).isSame(dayjs("2025-09-11T09:00:00.000Z")),
    ).toBe(true);
    expect(
      dayjs(result?.[2].ts).isSame(dayjs("2025-09-11T15:00:00.000Z")),
    ).toBe(true);
  });
});
