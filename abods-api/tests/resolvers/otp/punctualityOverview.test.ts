import {
  Direction,
  MatchType,
  OnTimePerformanceTypePunctualityOverviewArgs,
  PunctualityTotalsType,
  RequireFields,
} from "../../../src/types/generated";

import { jest } from "@jest/globals";
import {
  Kysely,
  DummyDriver,
  Dialect,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  SelectQueryBuilder,
} from "kysely";
import { DB } from "../../../src/kysely";
import { getPunctualityOverview } from "../../../src/resolvers/otpFunctions";
import * as kysely from "../../../src/lib/kysely";

const mockExecuteQueryResults = [
  // Happy path, estimated = false, reasonId = 1
  {
    scheduled: 20,
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
    scheduled: 15,
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
    scheduled: 10,
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
    scheduled: 8,
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
    scheduled: 25,
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
    scheduled: 12,
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
    scheduled: 7,
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
    scheduled: 18,
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
    scheduled: 30,
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
    scheduled: 5,
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
    scheduled: 14,
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
    scheduled: 16,
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
jest.mock("../../../src/lib/otp", () => ({
  compareThresholds: jest.fn(() =>
    Promise.resolve({ early: 1, late: 2, onTime: 3 }),
  ),
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

jest.spyOn(kysely, "executeQuery").mockResolvedValue(mockExecuteQueryResults);

describe("getPunctualityOverview", () => {
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
    const context = { kysely: dummyKysely };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context as any, {} as any);
    }

    // index defines the mock call - 0 index for first call
    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    expect(result?.scheduled).toBe(180);
    expect(result?.early).toBe(26);
    expect(result?.onTime).toBe(76);
    expect(result?.completed).toBe(119);
    expect(result?.averageDelay).toBe(3);

    const incompleteReasons = JSON.parse(result?.incomplete ?? "{}");
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
    const context = { kysely: dummyKysely };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context as any, {} as any);
    }

    // index defines the mock call - 1 index for second call
    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[1][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    expect(result?.scheduled).toBe(180);
    expect(result?.early).toBe(38);
    expect(result?.onTime).toBe(93);
    expect(result?.completed).toBe(146);
    expect(result?.averageDelay).toBe(3);

    const incompleteReasons = JSON.parse(result?.incomplete ?? "{}");
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
    const context = { kysely: dummyKysely };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context as any, {} as any);
    }

    // index defines the mock call - 2 index for third call
    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[2][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    const incompleteReasons = JSON.parse(result?.incomplete ?? "{}");
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
    const context = { kysely: dummyKysely };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context as any, {} as any);
    }

    // index defines the mock call - 3 index for fourth call
    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[3][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    const incompleteReasons = JSON.parse(result?.incomplete ?? "{}");
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
    const context = { kysely: dummyKysely };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context as any, {} as any);
    }

    // index defines the mock call - 4 index for 5th call
    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[4][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    const incompleteReasons = JSON.parse(result?.incomplete ?? "{}");
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
    const context = { kysely: dummyKysely };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context as any, {} as any);
    }

    // index defines the mock call - 5 index for 6th call
    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[5][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    const incompleteReasons = JSON.parse(result?.incomplete ?? "{}");
    expect(incompleteReasons["2"]).toBe(15);

    // All directions means no direction filter
    expect(compiled.parameters[2]).toBe(10);
    expect(compiled.parameters[3]).toBe(20);
  });
});

afterAll(() => {
  jest.resetModules();
});
