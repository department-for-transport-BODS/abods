import {
  Dialect,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  SelectQueryBuilder,
} from "kysely";
import {
  MatchType,
  OnTimePerformanceTypePunctualityDayOfWeekArgs,
  PunctualityDayOfWeekType,
  RequireFields,
} from "../../../src/types/generated";
import { DB } from "../../../src/kysely";
import { getPunctualityDayOfWeek } from "../../../src/resolvers/otpFunctions";
import * as kysely from "../../../src/lib/kysely";
import { jest } from "@jest/globals";

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
  jest.spyOn(kysely, "executeQuery").mockResolvedValue([
    { day_of_week: 0, early_count: 1, late_count: 2, on_time_count: 3 },
    { day_of_week: 1, early_count: 0, late_count: 0, on_time_count: 0 },
    { day_of_week: 2, early_count: 4, late_count: 5, on_time_count: 6 },
    { day_of_week: 3, early_count: 1, late_count: 7, on_time_count: 5 },
    { day_of_week: 4, early_count: 7, late_count: 0, on_time_count: 0 },
    { day_of_week: 5, early_count: 2, late_count: 1, on_time_count: 6 },
    { day_of_week: 6, early_count: 0, late_count: 0, on_time_count: 0 },
  ]);
});

describe("getPunctualityDayOfWeek", () => {
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
    const context = { kysely: dummyKysely };

    let result: Partial<PunctualityDayOfWeekType>[] | null = null;
    if (typeof getPunctualityDayOfWeek === "function") {
      result = (await getPunctualityDayOfWeek(
        {},
        args,
        context as any,
        {} as any,
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
    const context = { kysely: dummyKysely };

    let result: Partial<PunctualityDayOfWeekType>[] | null = null;
    if (typeof getPunctualityDayOfWeek === "function") {
      result = (await getPunctualityDayOfWeek(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<PunctualityDayOfWeekType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(5);

    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    expect(compiled.sql).toContain("hour");
    expect(compiled.parameters[3]).toBe(8);
    expect(compiled.parameters[4]).toBe(18);
  });

  it("returns empty array when no stats are present", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([]);

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
    const context = { kysely: dummyKysely };

    let result: Partial<PunctualityDayOfWeekType>[] | null = null;
    if (typeof getPunctualityDayOfWeek === "function") {
      result = (await getPunctualityDayOfWeek(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<PunctualityDayOfWeekType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });
});
