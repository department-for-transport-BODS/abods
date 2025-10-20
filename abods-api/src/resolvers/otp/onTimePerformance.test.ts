import {
  Dialect,
  DummyDriver,
  PostgresQueryCompiler,
  PostgresAdapter,
  PostgresIntrospector,
  Kysely,
  SelectQueryBuilder,
} from "kysely";
import * as kyselyLib from "../../lib/dbKysely.js";
import { DB } from "../../kysely";
import {
  RequireFields,
  OnTimePerformanceTypePunctualityOverviewArgs,
  MatchType,
  PunctualityTotalsType,
  Direction,
  OnTimePerformanceTypeOperatorPerformanceArgs,
  OperatorPerformancePage,
  OnTimePerformanceTypePunctualityDayOfWeekArgs,
  PunctualityDayOfWeekType,
  DelayFrequencyType,
  OnTimePerformanceTypeDelayFrequencyArgs,
  OnTimePerformanceTypePunctualityTimeOfDayArgs,
  PunctualityTimeOfDayType,
  Granularity,
  OnTimePerformanceTypePunctualityTimeSeriesArgs,
  PunctualityTimeSeriesType,
  OnTimePerformanceTypeServicePunctualityArgs,
  RankingOrder,
  ServicePunctualityType,
  StopPerformanceType,
  OnTimePerformanceTypeStopPerformanceArgs,
  OnTimePerformanceTypeServicePerformanceArgs,
  ServicePerformanceType,
} from "../../types/generated";
import {
  getDelayFrequency,
  getOperatorPerformance,
  getPunctualityDayOfWeek,
  getPunctualityOverview,
  getPunctualityTimeOfDay,
  getPunctualityTimeSeries,
  getServicePerformance,
  getServicePunctuality,
  getStopPerformance,
} from "./onTimePerformance";
import { GraphQLResolveInfo } from "graphql";
import { RequestContext } from "../../types/extra";
import * as otpLib from "../../lib/otp.js";
import { createRequest, createResponse } from "node-mocks-http";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const mockScheduledCounts = [
  {
    incomplete_reason: 1,
    scheduled: 57,
  },
  {
    incomplete_reason: 2,
    scheduled: 45,
  },
  {
    incomplete_reason: 3,
    scheduled: 44,
  },
  {
    incomplete_reason: 4,
    scheduled: 34,
  },
];
const mockExecuteQueryResults = [
  // Happy path, estimated = false, reasonId = 1
  {
    early_count: 5,
    late_count: 3,
    on_time_count: 12,
    completed: 20,
    count_delayed: 3,
    average_delay: 9,
    incomplete_reason: 1,
    estimated: false,
  },
  // Estimated = true, reasonId = 2
  {
    early_count: 2,
    late_count: 4,
    on_time_count: 9,
    completed: 10,
    count_delayed: 4,
    average_delay: 8,
    incomplete_reason: 2,
    estimated: true,
  },
  // Estimated = false, reasonId = 3, all completed
  {
    early_count: 1,
    late_count: 1,
    on_time_count: 8,
    completed: 10,
    count_delayed: 1,
    average_delay: 5,
    incomplete_reason: 3,
    estimated: false,
  },
  // Estimated = true, reasonId = 4, none completed
  {
    early_count: 0,
    late_count: 0,
    on_time_count: 0,
    completed: 0,
    count_delayed: 0,
    average_delay: 0,
    incomplete_reason: 4,
    estimated: true,
  },
  // Happy path, estimated = false, reasonId = 2, some incomplete
  {
    early_count: 6,
    late_count: 5,
    on_time_count: 14,
    completed: 20,
    count_delayed: 5,
    average_delay: 10,
    incomplete_reason: 2,
    estimated: false,
  },
  // Estimated = false, reasonId = 4, all late
  {
    early_count: 0,
    late_count: 12,
    on_time_count: 0,
    completed: 12,
    count_delayed: 12,
    average_delay: 24,
    incomplete_reason: 4,
    estimated: false,
  },
  // Estimated = true, reasonId = 1, all early
  {
    early_count: 7,
    late_count: 0,
    on_time_count: 0,
    completed: 7,
    count_delayed: 2,
    average_delay: 3,
    incomplete_reason: 1,
    estimated: true,
  },
  // Happy path, estimated = false, reasonId = 3, mixed
  {
    early_count: 4,
    late_count: 6,
    on_time_count: 8,
    completed: 15,
    count_delayed: 6,
    average_delay: 12,
    incomplete_reason: 3,
    estimated: false,
  },
  // New: estimated = false, reasonId = 1, all on time
  {
    early_count: 0,
    late_count: 0,
    on_time_count: 30,
    completed: 30,
    count_delayed: 0,
    average_delay: 0,
    incomplete_reason: 1,
    estimated: false,
  },
  // New: estimated = true, reasonId = 2, all late, none completed
  {
    early_count: 0,
    late_count: 5,
    on_time_count: 0,
    completed: 0,
    count_delayed: 5,
    average_delay: 15,
    incomplete_reason: 2,
    estimated: true,
  },
  // New: estimated = false, reasonId = 4, all early, some incomplete
  {
    early_count: 10,
    late_count: 0,
    on_time_count: 4,
    completed: 12,
    count_delayed: 3,
    average_delay: 6,
    incomplete_reason: 4,
    estimated: false,
  },
  // New: estimated = true, reasonId = 3, mixed, some incomplete
  {
    early_count: 3,
    late_count: 5,
    on_time_count: 8,
    completed: 10,
    count_delayed: 4,
    average_delay: 7,
    incomplete_reason: 3,
    estimated: true,
  },
];

// Mock dependencies
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

describe("getPunctualityOverview", () => {
  beforeEach(() => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValueOnce(mockExecuteQueryResults)
      .mockResolvedValueOnce(mockScheduledCounts);
  });
  it("returns calculated for timing points and evidenced", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityOverviewArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          timingPointsOnly: true,
          matchType: MatchType.Evidenced,
        },
      },
    };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context, {} as GraphQLResolveInfo);
    }

    // index defines the mock call - 0 index for first call
    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(result?.scheduled).toBe(180);
    expect(result?.early).toBe(26);
    expect(result?.onTime).toBe(76);
    expect(result?.completed).toBe(119);
    expect(result?.averageDelay).toBe(3);

    const incompleteReasons = JSON.parse(result?.incomplete ?? "{}") as Record<
      string,
      number
    >;
    expect(incompleteReasons["2"]).toBe(25);

    // estimated
    expect(compiled.parameters[2]).toBe(false);
    // timing points only
    expect(compiled.parameters[3]).toBe(true);
  });

  it("returns calculated for all stops and estimated", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityOverviewArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          timingPointsOnly: false,
          matchType: MatchType.Estimated,
        },
      },
    };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context, {} as GraphQLResolveInfo);
    }

    // index defines the mock call - 1 index for second call
    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(result?.scheduled).toBe(180);
    expect(result?.early).toBe(38);
    expect(result?.onTime).toBe(93);
    expect(result?.completed).toBe(146);
    expect(result?.averageDelay).toBe(3);

    const incompleteReasons = JSON.parse(result?.incomplete ?? "{}") as Record<
      string,
      number
    >;
    expect(incompleteReasons["2"]).toBe(15);

    // all stops and estimated means no filters to get the required data
    expect(compiled.parameters[2]).toBe(undefined);
  });

  it("Directions should not be filtered when all directions is passed as input", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityOverviewArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          timingPointsOnly: false,
          matchType: MatchType.Estimated,
          direction: [Direction.All],
        },
      },
    };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context, {} as GraphQLResolveInfo);
    }

    // index defines the mock call - 1 index for second call
    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    const incompleteReasons = JSON.parse(result?.incomplete ?? "{}") as Record<
      string,
      number
    >;
    expect(incompleteReasons["2"]).toBe(15);

    // All directions means no direction filter
    expect(compiled.parameters[2]).toBe(undefined);
  });

  it("Filter inbound and outbound directions", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityOverviewArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          timingPointsOnly: false,
          matchType: MatchType.Estimated,
          direction: [Direction.Inbound, Direction.Outbound],
        },
      },
    };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context, {} as GraphQLResolveInfo);
    }

    // index defines the mock call - 1 index for second call
    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    const incompleteReasons = JSON.parse(result?.incomplete ?? "{}") as Record<
      string,
      number
    >;
    expect(incompleteReasons["2"]).toBe(15);

    // All directions means no direction filter
    expect(compiled.parameters[2]).toBe(Direction.Inbound);
    expect(compiled.parameters[3]).toBe(Direction.Outbound);
    expect(compiled.parameters[4]).toBe(Direction.Anticlockwise);
    expect(compiled.parameters[5]).toBe(Direction.Clockwise);
  });

  it("Admin adrea filters to be included when passed as input", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityOverviewArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          timingPointsOnly: false,
          matchType: MatchType.Estimated,
          adminAreaIds: ["1", "2"],
        },
      },
    };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context, {} as GraphQLResolveInfo);
    }

    // index defines the mock call - 1 index for second call
    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    const incompleteReasons = JSON.parse(result?.incomplete ?? "{}") as Record<
      string,
      number
    >;
    expect(incompleteReasons["2"]).toBe(15);

    // All directions means no direction filter
    expect(compiled.parameters[2]).toBe("1");
    expect(compiled.parameters[3]).toBe("2");
  });

  it("Start time and end time is filtered", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityOverviewArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          timingPointsOnly: false,
          matchType: MatchType.Estimated,
          startTime: "10:00",
          endTime: "20:59",
        },
      },
    };
    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context, {} as GraphQLResolveInfo);
    }

    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    const incompleteReasons = JSON.parse(result?.incomplete ?? "{}") as Record<
      string,
      number
    >;
    expect(incompleteReasons["2"]).toBe(15);

    // All directions means no direction filter
    expect(compiled.parameters[2]).toBe(10);
    expect(compiled.parameters[3]).toBe(20);
  });

  it("returns calculated when no scheduled counts are present", async () => {
    (kyselyLib.executeQuery as jest.Mock).mockReset();
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValueOnce(mockExecuteQueryResults)
      .mockResolvedValueOnce([]);
    const args: RequireFields<
      OnTimePerformanceTypePunctualityOverviewArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          timingPointsOnly: true,
          matchType: MatchType.Evidenced,
        },
      },
    };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context, {} as GraphQLResolveInfo);
    }

    expect(result?.scheduled).toBe(0);
    expect(result?.early).toBe(26);
    expect(result?.onTime).toBe(76);
    expect(result?.completed).toBe(119);
    expect(result?.averageDelay).toBe(3);
  });
});

describe("getOperatorPerformance", () => {
  beforeEach(() => {
    jest.spyOn(otpLib, "getOperatorsForUser").mockResolvedValue([
      { operatorref: "OP1", name: "Operator One" },
      { operatorref: "OP2", name: "Operator Two" },
    ]);

    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      {
        operator_noc: "OP1",
        early_count: 5,
        late_count: 2,
        on_time_count: 10,
        completed: 15,
        scheduled: 20,
        count_delayed: 3,
        average_delay: 9,
      },
      {
        operator_noc: "OP2",
        early_count: 3,
        late_count: 4,
        on_time_count: 8,
        completed: 12,
        scheduled: 16,
        count_delayed: 2,
        average_delay: 4,
      },
    ]);
  });

  it("returns operator performance page with correct stats", async () => {
    const args: RequireFields<
      OnTimePerformanceTypeOperatorPerformanceArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          matchType: MatchType.Evidenced,
          adminAreaIds: ["1", "2"],
        },
      },
    };

    let result: Partial<OperatorPerformancePage> | null = null;
    if (typeof getOperatorPerformance === "function") {
      result = await getOperatorPerformance(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result).not.toBeNull();
    expect(result?.items?.length).toBe(2);

    expect(result?.items?.[0]).toEqual({
      nocCode: "OP1",
      operatorId: "OP1",
      name: "Operator One",
      early: 5,
      late: 2,
      onTime: 10,
      averageDelay: 3,
    });

    expect(result?.items?.[1]).toEqual({
      nocCode: "OP2",
      operatorId: "OP2",
      name: "Operator Two",
      early: 3,
      late: 4,
      onTime: 8,
      averageDelay: 2,
    });
  });

  it("returns empty stats when no operators are found", async () => {
    jest.spyOn(otpLib, "getOperatorsForUser").mockResolvedValue([]);

    const args: RequireFields<
      OnTimePerformanceTypeOperatorPerformanceArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          matchType: MatchType.Evidenced,
          adminAreaIds: ["1", "2"],
        },
      },
    };

    let result: Partial<OperatorPerformancePage> | null = null;
    if (typeof getOperatorPerformance === "function") {
      result = await getOperatorPerformance(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result).not.toBeNull();
    expect(result?.items?.length).toBe(0);
  });
});

describe("getPunctualityDayOfWeek", () => {
  beforeEach(() => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      { day_of_week: 0, early_count: 1, late_count: 2, on_time_count: 3 },
      { day_of_week: 1, early_count: 0, late_count: 0, on_time_count: 0 },
      { day_of_week: 2, early_count: 4, late_count: 5, on_time_count: 6 },
      { day_of_week: 3, early_count: 1, late_count: 7, on_time_count: 5 },
      { day_of_week: 4, early_count: 7, late_count: 0, on_time_count: 0 },
      { day_of_week: 5, early_count: 2, late_count: 1, on_time_count: 6 },
      { day_of_week: 6, early_count: 0, late_count: 0, on_time_count: 0 },
    ]);
  });
  it("returns correct day of week stats", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityDayOfWeekArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
        },
      },
    };

    let result: Partial<PunctualityDayOfWeekType>[] | null = null;
    if (typeof getPunctualityDayOfWeek === "function") {
      result = (await getPunctualityDayOfWeek(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<PunctualityDayOfWeekType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(5);

    expect(result?.[0]).toEqual({
      dayOfWeek: 1,
      early: 1,
      late: 2,
      onTime: 3,
    });

    expect(result?.[1]).toEqual({
      dayOfWeek: 3,
      early: 4,
      late: 5,
      onTime: 6,
    });
  });

  it("includes startTime and endTime filters in the query", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityDayOfWeekArgs,
      "inputs"
    > = {
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

    let result: Partial<PunctualityDayOfWeekType>[] | null = null;
    if (typeof getPunctualityDayOfWeek === "function") {
      result = (await getPunctualityDayOfWeek(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<PunctualityDayOfWeekType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(5);

    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(compiled.sql).toContain("hour");
    expect(compiled.parameters[3]).toBe(8);
    expect(compiled.parameters[4]).toBe(18);
  });

  it("returns empty array when no stats are present", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([]);

    const args: RequireFields<
      OnTimePerformanceTypePunctualityDayOfWeekArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
        },
      },
    };

    let result: Partial<PunctualityDayOfWeekType>[] | null = null;
    if (typeof getPunctualityDayOfWeek === "function") {
      result = (await getPunctualityDayOfWeek(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<PunctualityDayOfWeekType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });
});

describe("getDelayFrequency", () => {
  beforeEach(() => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      { time_diff_minutes: 0, otp_count: 5 },
      { time_diff_minutes: 1, otp_count: 10 },
      { time_diff_minutes: 2, otp_count: 7 },
      { time_diff_minutes: 3, otp_count: 0 },
    ]);
  });
  it("returns correct delay frequency buckets", async () => {
    const args: RequireFields<
      OnTimePerformanceTypeDelayFrequencyArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
        },
      },
    };

    let result: Partial<DelayFrequencyType>[] | null = null;
    if (typeof getDelayFrequency === "function") {
      result = (await getDelayFrequency(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<DelayFrequencyType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(4);

    expect(result?.[0]).toEqual({
      bucket: 0,
      frequency: 5,
    });
    expect(result?.[1]).toEqual({
      bucket: 1,
      frequency: 10,
    });
    expect(result?.[2]).toEqual({
      bucket: 2,
      frequency: 7,
    });
    expect(result?.[3]).toEqual({
      bucket: 3,
      frequency: 0,
    });
  });

  it("includes startTime and endTime filters in the query", async () => {
    const args: RequireFields<
      OnTimePerformanceTypeDelayFrequencyArgs,
      "inputs"
    > = {
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

    let result: Partial<DelayFrequencyType>[] | null = null;
    if (typeof getDelayFrequency === "function") {
      result = (await getDelayFrequency(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<DelayFrequencyType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(4);

    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(compiled.sql).toContain("hour");
    expect(compiled.parameters[3]).toBe(8);
    expect(compiled.parameters[4]).toBe(18);
  });

  it("returns null when operatorIds is not part of allowed user operators", async () => {
    const args: RequireFields<
      OnTimePerformanceTypeDelayFrequencyArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP3", "OP4"],
        },
      },
    };

    let result: Partial<DelayFrequencyType>[] | null = null;
    if (typeof getDelayFrequency === "function") {
      result = (await getDelayFrequency(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<DelayFrequencyType>[];
    }

    expect(result).toBeNull();
  });

  it("returns null when no operators are passed", async () => {
    jest.mock("../../../src/lib/operators", () => ({
      getUserOperatorIds: jest.fn(() => Promise.resolve(["OP2"])),
    }));

    const args: RequireFields<
      OnTimePerformanceTypeDelayFrequencyArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {},
      },
    };

    let result: Partial<DelayFrequencyType>[] | null = null;
    if (typeof getDelayFrequency === "function") {
      result = (await getDelayFrequency(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<DelayFrequencyType>[];
    }

    expect(result).toBeNull();
  });

  it("returns sorted buckets", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      { time_diff_minutes: 2, otp_count: 7 },
      { time_diff_minutes: 0, otp_count: 5 },
      { time_diff_minutes: 1, otp_count: 10 },
    ]);
    const args: RequireFields<
      OnTimePerformanceTypeDelayFrequencyArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
        },
      },
    };

    let result: Partial<DelayFrequencyType>[] | null = null;
    if (typeof getDelayFrequency === "function") {
      result = (await getDelayFrequency(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<DelayFrequencyType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(3);

    expect(result?.[0]).toEqual({
      bucket: 0,
      frequency: 5,
    });
    expect(result?.[1]).toEqual({
      bucket: 1,
      frequency: 10,
    });
    expect(result?.[2]).toEqual({
      bucket: 2,
      frequency: 7,
    });
  });
});

describe("getPunctualityTimeOfDay", () => {
  beforeEach(() => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      { hour: 8, early_count: 1, late_count: 2, on_time_count: 3 },
      { hour: 9, early_count: 0, late_count: 0, on_time_count: 0 },
      { hour: 10, early_count: 4, late_count: 5, on_time_count: 6 },
      { hour: 11, early_count: 1, late_count: 7, on_time_count: 5 },
      { hour: 12, early_count: 7, late_count: 0, on_time_count: 0 },
      { hour: 13, early_count: 2, late_count: 1, on_time_count: 6 },
      { hour: 14, early_count: 0, late_count: 0, on_time_count: 0 },
    ]);
  });
  it("returns correct time of day stats", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeOfDayArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
        },
      },
    };

    let result: Partial<PunctualityTimeOfDayType>[] | null = null;
    if (typeof getPunctualityTimeOfDay === "function") {
      result = (await getPunctualityTimeOfDay(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<PunctualityTimeOfDayType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBeGreaterThan(0);

    // Check first hour
    expect(result?.[0]).toEqual({
      timeOfDay: dayjs()
        .tz("Europe/London")
        .set("hour", 8)
        .startOf("hour")
        .format("HH:mm:ssZ"),
      early: 1,
      late: 2,
      onTime: 3,
    });

    const timeOfDay = dayjs()
      .tz("Europe/London")
      .set("hour", 10)
      .startOf("hour")
      .format("HH:mm:ssZ");
    // Check another hour with non-zero stats
    expect(result?.find((r) => r.timeOfDay === timeOfDay)).toEqual({
      timeOfDay,
      early: 4,
      late: 5,
      onTime: 6,
    });
  });

  it("returns sorted time of day buckets", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      { hour: 12, early_count: 7, late_count: 0, on_time_count: 0 },
      { hour: 8, early_count: 1, late_count: 2, on_time_count: 3 },
      { hour: 10, early_count: 4, late_count: 5, on_time_count: 6 },
    ]);

    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeOfDayArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
        },
      },
    };

    let result: Partial<PunctualityTimeOfDayType>[] | null = null;
    if (typeof getPunctualityTimeOfDay === "function") {
      result = (await getPunctualityTimeOfDay(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<PunctualityTimeOfDayType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(3);

    // Expect sorted by hour: 8, 10, 12
    expect(result?.[0].timeOfDay).toBe(
      dayjs()
        .tz("Europe/London")
        .set("hour", 8)
        .startOf("hour")
        .format("HH:mm:ssZ"),
    );
    expect(result?.[1].timeOfDay).toBe(
      dayjs()
        .tz("Europe/London")
        .set("hour", 10)
        .startOf("hour")
        .format("HH:mm:ssZ"),
    );
    expect(result?.[2].timeOfDay).toBe(
      dayjs()
        .tz("Europe/London")
        .set("hour", 12)
        .startOf("hour")
        .format("HH:mm:ssZ"),
    );
  });

  it("includes startTime and endTime filters in the query", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeOfDayArgs,
      "inputs"
    > = {
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

    let result: Partial<PunctualityTimeOfDayType>[] | null = null;
    if (typeof getPunctualityTimeOfDay === "function") {
      result = (await getPunctualityTimeOfDay(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<PunctualityTimeOfDayType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBeGreaterThan(0);

    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(compiled.sql).toContain("hour");
    expect(compiled.parameters[3]).toBe(8);
    expect(compiled.parameters[4]).toBe(18);
  });

  it("returns empty array when no stats are present", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([]);

    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeOfDayArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
        },
      },
    };

    let result: Partial<PunctualityTimeOfDayType>[] | null = null;
    if (typeof getPunctualityTimeOfDay === "function") {
      result = (await getPunctualityTimeOfDay(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<PunctualityTimeOfDayType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });
});

describe("getPunctualityTimeSeries", () => {
  beforeEach(() => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      {
        date_of_journey: "2025-09-11",
        early_count: 1,
        late_count: 2,
        on_time_count: 3,
      },
      {
        date_of_journey: "2025-09-12",
        early_count: 4,
        late_count: 5,
        on_time_count: 6,
      },
      {
        date_of_journey: "2025-09-13",
        early_count: 7,
        late_count: 0,
        on_time_count: 0,
      },
    ]);
  });
  it("returns correct time series stats for day granularity", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-14T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          granularity: Granularity.Day,
        },
      },
    };

    let result: Partial<PunctualityTimeSeriesType>[] | null = null;
    if (typeof getPunctualityTimeSeries === "function") {
      result = (await getPunctualityTimeSeries(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<PunctualityTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(3);

    expect(result?.[0]).toEqual({
      ts: dayjs("2025-09-11")
        .tz("Europe/London")
        .format("YYYY-MM-DDTHH:mm:ssZ"),
      early: 1,
      late: 2,
      onTime: 3,
    });
    expect(result?.[1]).toEqual({
      ts: dayjs("2025-09-12")
        .tz("Europe/London")
        .format("YYYY-MM-DDTHH:mm:ssZ"),
      early: 4,
      late: 5,
      onTime: 6,
    });
    expect(result?.[2]).toEqual({
      ts: dayjs("2025-09-13")
        .tz("Europe/London")
        .format("YYYY-MM-DDTHH:mm:ssZ"),
      early: 7,
      late: 0,
      onTime: 0,
    });
  });

  it("returns correct time series stats for hour granularity", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      {
        departure_hour: "2025-09-11T08:00:00.000Z",
        early_count: 2,
        late_count: 1,
        on_time_count: 5,
      },
      {
        departure_hour: "2025-09-11T09:00:00.000Z",
        early_count: 0,
        late_count: 3,
        on_time_count: 2,
      },
    ]);
    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeSeriesArgs,
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

    let result: Partial<PunctualityTimeSeriesType>[] | null = null;
    if (typeof getPunctualityTimeSeries === "function") {
      result = (await getPunctualityTimeSeries(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<PunctualityTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      ts: dayjs("2025-09-11T08:00:00.000Z")
        .tz("Europe/London")
        .format("YYYY-MM-DDTHH:mm:ssZ"),
      early: 2,
      late: 1,
      onTime: 5,
    });
    expect(result?.[1]).toEqual({
      ts: dayjs("2025-09-11T09:00:00.000Z")
        .tz("Europe/London")
        .format("YYYY-MM-DDTHH:mm:ssZ"),
      early: 0,
      late: 3,
      onTime: 2,
    });
  });

  it("returns correct time series stats during GMT", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      {
        departure_hour: "2025-02-11T08:00:00.000Z",
        early_count: 2,
        late_count: 1,
        on_time_count: 5,
      },
      {
        departure_hour: "2025-02-11T09:00:00.000Z",
        early_count: 0,
        late_count: 3,
        on_time_count: 2,
      },
    ]);
    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-02-11T00:00:00.000+01:00",
        toTimestamp: "2025-02-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          granularity: Granularity.Hour,
        },
      },
    };

    let result: Partial<PunctualityTimeSeriesType>[] | null = null;
    if (typeof getPunctualityTimeSeries === "function") {
      result = (await getPunctualityTimeSeries(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<PunctualityTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      ts: "2025-02-11T08:00:00+00:00",
      early: 2,
      late: 1,
      onTime: 5,
    });
    expect(result?.[1]).toEqual({
      ts: "2025-02-11T09:00:00+00:00",
      early: 0,
      late: 3,
      onTime: 2,
    });
  });

  it("returns sorted time series", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      {
        date_of_journey: "2025-09-13",
        early_count: 7,
        late_count: 0,
        on_time_count: 0,
      },
      {
        date_of_journey: "2025-09-11",
        early_count: 1,
        late_count: 2,
        on_time_count: 3,
      },
      {
        date_of_journey: "2025-09-12",
        early_count: 4,
        late_count: 5,
        on_time_count: 6,
      },
    ]);
    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-14T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          granularity: Granularity.Day,
        },
      },
    };

    let result: Partial<PunctualityTimeSeriesType>[] | null = null;
    if (typeof getPunctualityTimeSeries === "function") {
      result = (await getPunctualityTimeSeries(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<PunctualityTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(3);

    // Expect sorted by date: 2025-09-11, 2025-09-12, 2025-09-13
    expect(dayjs(result?.[0].ts).isSame(dayjs("2025-09-11"))).toBe(true);
    expect(dayjs(result?.[1].ts).isSame(dayjs("2025-09-12"))).toBe(true);
    expect(dayjs(result?.[2].ts).isSame(dayjs("2025-09-13"))).toBe(true);
  });

  it("returns sorted by hour", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      {
        departure_hour: "2025-09-11T08:00:00.000Z",
        early_count: 7,
        late_count: 0,
        on_time_count: 0,
      },
      {
        departure_hour: "2025-09-11T05:00:00.000Z",
        early_count: 1,
        late_count: 2,
        on_time_count: 3,
      },
      {
        departure_hour: "2025-09-11T15:00:00.000Z",
        early_count: 4,
        late_count: 5,
        on_time_count: 6,
      },
    ]);
    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-14T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          granularity: Granularity.Hour,
        },
      },
    };

    let result: Partial<PunctualityTimeSeriesType>[] | null = null;
    if (typeof getPunctualityTimeSeries === "function") {
      result = (await getPunctualityTimeSeries(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<PunctualityTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(3);

    console.log("result-----", result);
    expect(
      dayjs(result?.[0].ts)
        .tz("Europe/London")
        .isSame(dayjs("2025-09-11").hour(6)),
    ).toBe(true);
    expect(
      dayjs(result?.[1].ts)
        .tz("Europe/London")
        .isSame(dayjs("2025-09-11").hour(9)),
    ).toBe(true);
    expect(
      dayjs(result?.[2].ts)
        .tz("Europe/London")
        .isSame(dayjs("2025-09-11").hour(16)),
    ).toBe(true);
  });

  it("returns null when user does not have access to operator", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-14T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP3"],
          granularity: Granularity.Day,
        },
      },
    };

    let result: Partial<PunctualityTimeSeriesType>[] | null = null;
    if (typeof getPunctualityTimeSeries === "function") {
      result = (await getPunctualityTimeSeries(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<PunctualityTimeSeriesType>[];
    }

    expect(result).toBeNull();
  });

  it("returns empty array when no stats are present", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([]);

    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-14T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          granularity: Granularity.Day,
        },
      },
    };

    let result: Partial<PunctualityTimeSeriesType>[] | null = null;
    if (typeof getPunctualityTimeSeries === "function") {
      result = (await getPunctualityTimeSeries(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<PunctualityTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });
});

describe("getServicePunctuality", () => {
  const mockServices = [
    {
      noc_and_line_and_servicecode: "OP1-L1-S1",
      service_name: "S1",
    },
    {
      noc_and_line_and_servicecode: "OP2-L2-S2",
      service_name: "S2",
    },
  ];

  const mockPerformanceMetrics = [
    {
      operator_noc: "OP1",
      early_count: 2,
      late_count: 3,
      on_time_count: 5,
      service_name: "S1",
      noc_and_line_and_servicecode: "OP1-L1-S1",
    },
    {
      operator_noc: "OP2",
      early_count: 1,
      late_count: 2,
      on_time_count: 7,
      service_name: "S2",
      noc_and_line_and_servicecode: "OP2-L2-S2",
    },
  ];
  beforeEach(() => {
    mockDb.expected_services.findMany.mockResolvedValue(mockServices as never);
  });

  it("returns correct punctuality stats for services", async () => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue(mockPerformanceMetrics);

    const args: RequireFields<
      OnTimePerformanceTypeServicePunctualityArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        order: RankingOrder.Ascending,
        filters: {
          operatorIds: ["OP1", "OP2"],
        },
      },
    };

    let result: Partial<ServicePunctualityType>[] | null = null;
    if (typeof getServicePunctuality === "function") {
      result = (await getServicePunctuality(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0].lineId).toEqual("OP1-L1-S1");
    expect(result?.[0].nocCode).toEqual("OP1");
    expect(result?.[0].early).toEqual(2);
    expect(result?.[0].late).toEqual(3);
    expect(result?.[0].onTime).toEqual(5);
    expect(result?.[0].lineInfo?.serviceName).toEqual("S1");
    expect(result?.[0].lineInfo?.serviceId).toEqual("OP1-L1-S1");

    expect(result?.[1].lineId).toEqual("OP2-L2-S2");
    expect(result?.[1].nocCode).toEqual("OP2");
    expect(result?.[1].early).toEqual(1);
    expect(result?.[1].late).toEqual(2);
    expect(result?.[1].onTime).toEqual(7);
    expect(result?.[1].lineInfo?.serviceName).toEqual("S2");
    expect(result?.[1].lineInfo?.serviceId).toEqual("OP2-L2-S2");

    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(compiled.sql).toContain("asc");
  });

  it("returns correct punctuality stats for services when order is descending", async () => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue(mockPerformanceMetrics);

    const args: RequireFields<
      OnTimePerformanceTypeServicePunctualityArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        order: RankingOrder.Descending,
        filters: {
          operatorIds: ["OP1", "OP2"],
        },
      },
    };

    let result: Partial<ServicePunctualityType>[] | null = null;
    if (typeof getServicePunctuality === "function") {
      result = (await getServicePunctuality(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(compiled.sql).toContain("desc");
  });

  it("period type set to last 7 days", async () => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue(mockPerformanceMetrics);

    const args: RequireFields<
      OnTimePerformanceTypeServicePunctualityArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        order: RankingOrder.Descending,
        filters: {
          operatorIds: ["OP1", "OP2"],
        },
      },
    };

    let result: Partial<ServicePunctualityType>[] | null = null;
    if (typeof getServicePunctuality === "function") {
      result = (await getServicePunctuality(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(compiled.parameters[3]).toContain("last_7_days");
  });

  it("period type set to last 28 days", async () => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue(mockPerformanceMetrics);

    const args: RequireFields<
      OnTimePerformanceTypeServicePunctualityArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-01T00:00:00.000+01:00",
        toTimestamp: "2025-09-29T00:00:00.000+01:00",
        order: RankingOrder.Descending,
        filters: {
          operatorIds: ["OP1", "OP2"],
        },
      },
    };

    let result: Partial<ServicePunctualityType>[] | null = null;
    if (typeof getServicePunctuality === "function") {
      result = (await getServicePunctuality(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(compiled.parameters[3]).toContain("last_28_days");
  });

  it("period type set to month to date", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-09-12T12:00:00+01:00"));
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue(mockPerformanceMetrics);

    const args: RequireFields<
      OnTimePerformanceTypeServicePunctualityArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-01T00:00:00.000+01:00",
        toTimestamp: "2025-09-20T00:00:00.000+01:00",
        order: RankingOrder.Descending,
        filters: {
          operatorIds: ["OP1", "OP2"],
        },
      },
    };

    let result: Partial<ServicePunctualityType>[] | null = null;
    if (typeof getServicePunctuality === "function") {
      result = (await getServicePunctuality(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(compiled.parameters[3]).toContain("month_to_date");
    jest.useRealTimers();
  });

  it("period type set to last month", async () => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue(mockPerformanceMetrics);
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-09-12T12:00:00+01:00"));

    const args: RequireFields<
      OnTimePerformanceTypeServicePunctualityArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-08-01T00:00:00.000+01:00",
        toTimestamp: "2025-08-31T00:00:00.000+01:00",
        order: RankingOrder.Descending,
        filters: {
          operatorIds: ["OP1", "OP2"],
        },
      },
    };

    let result: Partial<ServicePunctualityType>[] | null = null;
    if (typeof getServicePunctuality === "function") {
      result = (await getServicePunctuality(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(compiled.parameters[3]).toContain("last_month");

    jest.useRealTimers();
  });

  it("returns empty array when no services are found", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([]);

    const args: RequireFields<
      OnTimePerformanceTypeServicePunctualityArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        order: RankingOrder.Ascending,
        filters: {
          operatorIds: ["OP1", "OP2"],
        },
      },
    };

    let result: Partial<ServicePunctualityType>[] | null = null;
    if (typeof getServicePunctuality === "function") {
      result = (await getServicePunctuality(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });

  it("returns empty array when user is not mapped to the expected operators", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([]);

    const args: RequireFields<
      OnTimePerformanceTypeServicePunctualityArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        order: RankingOrder.Ascending,
        filters: {
          operatorIds: ["OP3"],
        },
      },
    };

    let result: Partial<ServicePunctualityType>[] | null = null;
    if (typeof getServicePunctuality === "function") {
      result = (await getServicePunctuality(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });

  it("timing points only is set to true when passed", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-09-12T12:00:00+01:00"));
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue(mockPerformanceMetrics);

    const args: RequireFields<
      OnTimePerformanceTypeServicePunctualityArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-01T00:00:00.000+01:00",
        toTimestamp: "2025-09-20T00:00:00.000+01:00",
        order: RankingOrder.Descending,
        filters: {
          operatorIds: ["OP1", "OP2"],
          timingPointsOnly: true,
        },
      },
    };

    let result: Partial<ServicePunctualityType>[] | null = null;
    if (typeof getServicePunctuality === "function") {
      result = (await getServicePunctuality(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(compiled.parameters[4]).toBe(true);
    jest.useRealTimers();
  });
});

describe("getStopPerformance", () => {
  const mockStopResults = [
    {
      stop_id: 101,
      common_name: "Stop A",
      is_timing_point: true,
      early_count: 2,
      late_count: 3,
      on_time_count: 5,
      completed: 10,
      count_delayed: 2,
      average_delay: 6,
      direction: "inbound",
      diff_sched_time_to_stop: 1.5,
      diff_actual_time_to_stop: 2.5,
      on_time_in_seconds: 300,
      early_in_seconds: 120,
      late_in_seconds: 180,
      stop_index: 1,
    },
    {
      stop_id: 102,
      common_name: "Stop B",
      is_timing_point: false,
      early_count: 1,
      late_count: 2,
      on_time_count: 3,
      completed: 6,
      count_delayed: 1,
      average_delay: 2,
      direction: "outbound",
      diff_sched_time_to_stop: 1.2,
      diff_actual_time_to_stop: 2.2,
      on_time_in_seconds: 180,
      early_in_seconds: 60,
      late_in_seconds: 90,
      stop_index: 2,
    },
  ];

  const mockScheduledCounts = [
    {
      stop_id: 101,
      stop_index: 1,
      is_timing_point: true,
      direction: "inbound",
      scheduled: 12,
    },
    {
      stop_id: 102,
      stop_index: 2,
      is_timing_point: false,
      direction: "outbound",
      scheduled: 7,
    },
  ];

  const mockStops = [
    {
      id: 101,
      longitude: 1.1,
      latitude: 2.2,
      atco_code: "A",
      locality: {
        gazetteer_id: "G1",
        name: "Loc1",
        admin_area: { name: "Area1" },
      },
    },
    {
      id: 102,
      longitude: 3.3,
      latitude: 4.4,
      atco_code: "B",
      locality: {
        gazetteer_id: "G2",
        name: "Loc2",
        admin_area: { name: "Area2" },
      },
    },
  ];

  beforeEach(() => {
    mockDb.naptan_stoppoint_latlong.findMany.mockResolvedValue(
      mockStops as never,
    );
  });
  it("returns correct stop performance stats", async () => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValueOnce(mockStopResults)
      .mockResolvedValueOnce(mockScheduledCounts);

    const args: RequireFields<
      OnTimePerformanceTypeStopPerformanceArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          lineIds: ["L1"],
        },
      },
    };

    let result: Partial<StopPerformanceType>[] | null = null;
    if (typeof getStopPerformance === "function") {
      result = (await getStopPerformance(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<StopPerformanceType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      lineId: "L1",
      stopId: "A",
      early: 2,
      late: 3,
      onTime: 5,
      actualDepartures: 10,
      scheduledDepartures: 12,
      averageDelay: 3,
      countDelayed: 2,
      timingPoint: true,
      direction: Direction.Inbound,
      averageActual: 2.5,
      averageScheduled: 1.5,
      onTimeInSeconds: 60,
      earlyInSeconds: 60,
      lateInSeconds: 60,
      stopInfo: {
        stopId: "A",
        stopName: "Stop A",
        stopLocality: {
          localityId: "",
          localityName: "Loc1",
          localityAreaId: "",
          localityAreaName: "Area1",
        },
        sourceId: "A",
        stopLocation: {
          longitude: 1.1,
          latitude: 2.2,
        },
      },
    });

    expect(result?.[1]).toEqual({
      lineId: "L1",
      stopId: "B",
      early: 1,
      late: 2,
      onTime: 3,
      actualDepartures: 6,
      scheduledDepartures: 7,
      averageDelay: 2,
      countDelayed: 1,
      timingPoint: false,
      direction: Direction.Outbound,
      averageScheduled: 1.2,
      averageActual: 2.2,
      onTimeInSeconds: 60,
      earlyInSeconds: 60,
      lateInSeconds: 45,
      stopInfo: {
        stopId: "B",
        stopName: "Stop B",
        stopLocality: {
          localityId: "",
          localityName: "Loc2",
          localityAreaId: "",
          localityAreaName: "Area2",
        },
        sourceId: "B",
        stopLocation: {
          longitude: 3.3,
          latitude: 4.4,
        },
      },
    });
  });

  it("returns empty array when no stops are found", async () => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockScheduledCounts);
    mockDb.naptan_stoppoint_latlong.findMany.mockResolvedValue([] as never);

    const args: RequireFields<
      OnTimePerformanceTypeStopPerformanceArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          lineIds: ["L1"],
        },
      },
    };

    let result: Partial<StopPerformanceType>[] | null = null;
    if (typeof getStopPerformance === "function") {
      result = (await getStopPerformance(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<StopPerformanceType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });

  it("returns empty array when no scheduled counts are found", async () => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValueOnce(mockStopResults)
      .mockResolvedValueOnce([]);
    mockDb.naptan_stoppoint_latlong.findMany.mockResolvedValue([] as never);

    const args: RequireFields<
      OnTimePerformanceTypeStopPerformanceArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          lineIds: ["L1"],
        },
      },
    };

    let result: Partial<StopPerformanceType>[] | null = null;
    if (typeof getStopPerformance === "function") {
      result = (await getStopPerformance(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<StopPerformanceType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);
    expect(result?.[0].scheduledDepartures).toEqual(0);
    expect(result?.[1].scheduledDepartures).toEqual(0);
  });
});

describe("getServicePerformance", () => {
  const mockServiceResults = [
    {
      noc_and_line_and_servicecode: "L1",
      line_name: "1",
      operator_noc: "OP1",
      early_count: 2,
      late_count: 3,
      on_time_count: 5,
      completed: 10,
      scheduled: 12,
      count_delayed: 2,
      average_delay: 6,
      direction: "inbound",
      on_time_in_seconds: 300,
      early_in_seconds: 120,
      late_in_seconds: 180,
    },
    {
      noc_and_line_and_servicecode: "L2",
      line_name: "2",
      operator_noc: "OP2",
      early_count: 1,
      late_count: 2,
      on_time_count: 3,
      completed: 6,
      scheduled: 7,
      count_delayed: 1,
      average_delay: 2,
      direction: "outbound",
      on_time_in_seconds: 180,
      early_in_seconds: 60,
      late_in_seconds: 90,
    },
  ];

  const mockScheduledCounts = [
    {
      noc_and_line_and_servicecode: "L1",
      scheduled: 12,
      direction: "inbound",
    },
    {
      noc_and_line_and_servicecode: "L2",
      scheduled: 7,
      direction: "outbound",
    },
  ];

  const mockServices = [
    {
      service_name: "Service 1",
      noc_and_line_and_servicecode: "L1",
    },
    {
      service_name: "Service 2",
      noc_and_line_and_servicecode: "L2",
    },
  ];

  beforeEach(() => {
    mockDb.expected_services.findMany.mockResolvedValue(mockServices as never);
  });
  it("returns correct service performance stats", async () => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValueOnce(mockServiceResults)
      .mockResolvedValueOnce(mockScheduledCounts);

    const args: RequireFields<
      OnTimePerformanceTypeServicePerformanceArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
        },
      },
    };

    let result: Partial<ServicePerformanceType>[] | null = null;
    if (typeof getServicePerformance === "function") {
      result = (await getServicePerformance(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePerformanceType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      lineId: "L1",
      early: 2,
      late: 3,
      onTime: 5,
      scheduledDepartures: 12,
      actualDepartures: 10,
      countDelayed: 2,
      averageDelay: 3,
      direction: Direction.Inbound,
      onTimeInSeconds: 60,
      earlyInSeconds: 60,
      lateInSeconds: 60,
      lineInfo: {
        serviceId: "L1",
        serviceNumber: "1",
        serviceName: "Service 1",
      },
    });

    expect(result?.[1]).toEqual({
      lineId: "L2",
      early: 1,
      late: 2,
      onTime: 3,
      scheduledDepartures: 7,
      actualDepartures: 6,
      countDelayed: 1,
      averageDelay: 2,
      direction: Direction.Outbound,
      onTimeInSeconds: 60,
      earlyInSeconds: 60,
      lateInSeconds: 45,
      lineInfo: {
        serviceId: "L2",
        serviceNumber: "2",
        serviceName: "Service 2",
      },
    });
  });

  it("returns empty array when no services are found", async () => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockScheduledCounts);
    mockDb.expected_services.findMany.mockResolvedValue([] as never);

    const args: RequireFields<
      OnTimePerformanceTypeServicePerformanceArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
        },
      },
    };

    let result: Partial<ServicePerformanceType>[] | null = null;
    if (typeof getServicePerformance === "function") {
      result = (await getServicePerformance(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePerformanceType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });

  it("returns data when no scheduled count is found", async () => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValueOnce(mockServiceResults)
      .mockResolvedValueOnce([]);
    mockDb.expected_services.findMany.mockResolvedValue([] as never);

    const args: RequireFields<
      OnTimePerformanceTypeServicePerformanceArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
        },
      },
    };

    let result: Partial<ServicePerformanceType>[] | null = null;
    if (typeof getServicePerformance === "function") {
      result = (await getServicePerformance(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePerformanceType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);
    expect(result?.[0].scheduledDepartures).toEqual(0);
    expect(result?.[1].scheduledDepartures).toEqual(0);
  });
});

describe("compareThresholds", () => {
  beforeEach(() => {
    (jest.spyOn(kyselyLib, "executeQueryTakeFirst") as jest.Mock)
      .mockImplementationOnce(() => ({ otp_count: 5 })) // Early
      .mockImplementationOnce(() => ({ otp_count: 7 })) // Late
      .mockImplementationOnce(() => ({ otp_count: 12 })); // OnTime
  });
  it("compares the thresholds correctly", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityOverviewArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          onTimeMinMinutes: 1,
          onTimeMaxMinutes: 10,
        },
      },
    };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context, {} as GraphQLResolveInfo);
    }

    const queryArg = (kyselyLib.executeQueryTakeFirst as unknown as jest.Mock)
      .mock.calls[0] as SelectQueryBuilder<DB, never, unknown>[];

    const compiled = queryArg[0].compile();

    expect(result).not.toBeNull();
    expect(result?.early).toBe(5);
    expect(result?.late).toBe(7);
    expect(result?.onTime).toBe(12);

    expect(compiled.sql).toContain("time_diff_minutes");
  });

  it("Admin area filter to be included", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityOverviewArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          onTimeMinMinutes: 1,
          onTimeMaxMinutes: 10,
          adminAreaIds: ["1", "2"],
        },
      },
    };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context, {} as GraphQLResolveInfo);
    }

    const queryArg = (kyselyLib.executeQueryTakeFirst as unknown as jest.Mock)
      .mock.calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(result).not.toBeNull();
    expect(result?.early).toBe(5);
    expect(result?.late).toBe(7);
    expect(result?.onTime).toBe(12);

    expect(compiled.sql).toContain("time_diff_minutes");
    expect(compiled.sql).toContain("admin_areas && ARRAY[$4, $5]::int4[]");
  });

  it("Start time and end time filters are included", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityOverviewArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          onTimeMinMinutes: 1,
          onTimeMaxMinutes: 6,
          startTime: "10:00",
          endTime: "20:59",
        },
      },
    };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context, {} as GraphQLResolveInfo);
    }

    const queryArg = (kyselyLib.executeQueryTakeFirst as unknown as jest.Mock)
      .mock.calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(result).not.toBeNull();
    expect(result?.early).toBe(5);
    expect(result?.late).toBe(7);
    expect(result?.onTime).toBe(12);

    expect(compiled.sql).toContain("hour");
    expect(compiled.parameters[3]).toBe(10);
    expect(compiled.parameters[4]).toBe(20);
  });
});
