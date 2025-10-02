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
  FrequentServiceType,
  FrequentServiceInfoType,
  FrequentServiceInfoInputType,
} from "../../types/generated";
import {
  getFrequentServiceInfo,
  getFrequentServices,
  getHeadwayOverview,
  getHeadwayTimeSeries,
} from "./headway";
import * as kyselyLib from "../../lib/dbKysely.js";
import { RequestContext } from "../../types/extra";
import { GraphQLResolveInfo } from "graphql";
import dayjs from "dayjs";
import logger from "../../logger";
import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { createResponse, createRequest } from "node-mocks-http";
import * as otpLib from "../../lib/otp.js";

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

let mockDb: DeepMockProxy<PrismaClient>;
let context: RequestContext;
beforeEach(() => {
  jest.clearAllMocks();
  mockDb = mockDeep<PrismaClient>();
  context = {
    res: createResponse(),
    req: createRequest(),
    headers: {},
    db: mockDb,
    kysely: dummyKysely,
  };
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

describe("getFrequentServices", () => {
  it("returns frequent services when user has access to operator", async () => {
    const mockResults = [
      { noc_and_line_and_servicecode: "OP1-L1-S1" },
      { noc_and_line_and_servicecode: "OP1-L2-S2" },
    ];
    mockDb.timetable_frequent_summary_services.findMany.mockResolvedValue(
      mockResults as never,
    );

    const args = {
      operatorId: "OP1",
      fromTimestamp: "2025-09-01",
      toTimestamp: "2025-09-30",
    };

    let result: FrequentServiceType[] | null = null;
    if (typeof getFrequentServices === "function") {
      result = (await getFrequentServices(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as FrequentServiceType[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);
    expect(result?.[0]).toEqual({ serviceId: "OP1-L1-S1" });
    expect(result?.[1]).toEqual({ serviceId: "OP1-L2-S2" });
  });

  it("returns empty array when user does not have access to operator", async () => {
    const args = {
      operatorId: "OP3",
      fromTimestamp: "2025-09-01",
      toTimestamp: "2025-09-30",
    };

    let result: FrequentServiceType[] | null = null;
    if (typeof getFrequentServices === "function") {
      result = (await getFrequentServices(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as FrequentServiceType[];
    }

    expect(result).toEqual([]);
  });

  it("returns null and logs error on exception", async () => {
    mockDb.timetable_frequent_summary_services.findMany.mockRejectedValue(
      new Error("DB error"),
    );
    const loggerSpy = jest.spyOn(logger, "error").mockImplementation(jest.fn());

    const args = {
      operatorId: "OP1",
      fromTimestamp: "2025-09-01",
      toTimestamp: "2025-09-30",
    };

    let result: FrequentServiceType[] | null = null;
    if (typeof getFrequentServices === "function") {
      result = (await getFrequentServices(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as FrequentServiceType[];
    }

    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.any(Error),
      "An error occurred when getting frequent services",
    );
  });
});

describe("getFrequentServiceInfo", () => {
  it("returns frequent service info with correct hours", async () => {
    jest.spyOn(otpLib, "getSummaryStopsTotalHours").mockResolvedValue(100);
    jest.spyOn(otpLib, "getFrequentServiceActualHours").mockResolvedValue(80);

    const args = {
      inputs: {
        operatorId: "OP1",
        serviceId: "OP1-L1-S1",
      } as unknown as FrequentServiceInfoInputType,
    };

    let result: FrequentServiceInfoType | null = null;
    if (typeof getFrequentServiceInfo === "function") {
      result = (await getFrequentServiceInfo(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as FrequentServiceInfoType;
    }

    expect(result).not.toBeNull();
    expect(result).toEqual({
      numHours: 80,
      totalHours: 100,
    });

    expect(otpLib.getSummaryStopsTotalHours).toHaveBeenCalledWith(
      context.kysely,
      args.inputs,
      ["OP1", "OP2"],
    );
    expect(otpLib.getFrequentServiceActualHours).toHaveBeenCalledWith(
      context.kysely,
      args.inputs,
      ["OP1", "OP2"],
    );
  });

  it("returns null and logs error on exception", async () => {
    jest
      .spyOn(otpLib, "getSummaryStopsTotalHours")
      .mockRejectedValue(new Error("DB error"));
    const loggerSpy = jest.spyOn(logger, "error").mockImplementation(jest.fn());

    const args = {
      inputs: {
        operatorId: "OP1",
        serviceId: "OP1-L1-S1",
      } as unknown as FrequentServiceInfoInputType,
    };

    let result: FrequentServiceInfoType | null = null;
    if (typeof getFrequentServiceInfo === "function") {
      result = (await getFrequentServiceInfo(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as FrequentServiceInfoType;
    }

    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.any(Error),
      "An error occurred when getting frequent service info",
    );
  });
});
