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
  OnTimePerformanceTypePunctualityTimeOfDayArgs,
  PunctualityTimeOfDayType,
  RequireFields,
} from "../../../src/types/generated";
import { DB } from "../../../src/kysely";
import { getPunctualityTimeOfDay } from "../../../src/resolvers/otpFunctions";
import * as kysely from "../../../src/lib/kysely";
import { jest } from "@jest/globals";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

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
    { hour: 8, early_count: 1, late_count: 2, on_time_count: 3 },
    { hour: 9, early_count: 0, late_count: 0, on_time_count: 0 },
    { hour: 10, early_count: 4, late_count: 5, on_time_count: 6 },
    { hour: 11, early_count: 1, late_count: 7, on_time_count: 5 },
    { hour: 12, early_count: 7, late_count: 0, on_time_count: 0 },
    { hour: 13, early_count: 2, late_count: 1, on_time_count: 6 },
    { hour: 14, early_count: 0, late_count: 0, on_time_count: 0 },
  ]);
});

describe("getPunctualityTimeOfDay", () => {
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
    const context = { kysely: dummyKysely };

    let result: Partial<PunctualityTimeOfDayType>[] | null = null;
    if (typeof getPunctualityTimeOfDay === "function") {
      result = (await getPunctualityTimeOfDay(
        {},
        args,
        context as any,
        {} as any,
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
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([
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
    const context = { kysely: dummyKysely };

    let result: Partial<PunctualityTimeOfDayType>[] | null = null;
    if (typeof getPunctualityTimeOfDay === "function") {
      result = (await getPunctualityTimeOfDay(
        {},
        args,
        context as any,
        {} as any,
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
    const context = { kysely: dummyKysely };

    let result: Partial<PunctualityTimeOfDayType>[] | null = null;
    if (typeof getPunctualityTimeOfDay === "function") {
      result = (await getPunctualityTimeOfDay(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<PunctualityTimeOfDayType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBeGreaterThan(0);

    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    expect(compiled.sql).toContain("hour");
    expect(compiled.parameters[3]).toBe(8);
    expect(compiled.parameters[4]).toBe(18);
  });

  it("returns empty array when no stats are present", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([]);

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
    const context = { kysely: dummyKysely };

    let result: Partial<PunctualityTimeOfDayType>[] | null = null;
    if (typeof getPunctualityTimeOfDay === "function") {
      result = (await getPunctualityTimeOfDay(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<PunctualityTimeOfDayType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });
});
