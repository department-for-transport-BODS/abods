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
  OnTimePerformanceTypeDelayFrequencyArgs,
  DelayFrequencyType,
  RequireFields,
} from "../../../src/types/generated";
import { DB } from "../../../src/kysely";
import { getDelayFrequency } from "../../../src/resolvers/otpFunctions";
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
  getUserOperatorIds: jest.fn(() => Promise.resolve(["OP1", "OP2"])),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(kysely, "executeQuery").mockResolvedValue([
    { time_diff_minutes: 0, otp_count: 5 },
    { time_diff_minutes: 1, otp_count: 10 },
    { time_diff_minutes: 2, otp_count: 7 },
    { time_diff_minutes: 3, otp_count: 0 },
  ]);
});

describe("getDelayFrequency", () => {
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
    const context = { kysely: dummyKysely };

    let result: Partial<DelayFrequencyType>[] | null = null;
    if (typeof getDelayFrequency === "function") {
      result = (await getDelayFrequency(
        {},
        args,
        context as any,
        {} as any,
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
    const context = { kysely: dummyKysely };

    let result: Partial<DelayFrequencyType>[] | null = null;
    if (typeof getDelayFrequency === "function") {
      result = (await getDelayFrequency(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<DelayFrequencyType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(4);

    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

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
    const context = { kysely: dummyKysely };

    let result: Partial<DelayFrequencyType>[] | null = null;
    if (typeof getDelayFrequency === "function") {
      result = (await getDelayFrequency(
        {},
        args,
        context as any,
        {} as any,
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
    const context = { kysely: dummyKysely };

    let result: Partial<DelayFrequencyType>[] | null = null;
    if (typeof getDelayFrequency === "function") {
      result = (await getDelayFrequency(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<DelayFrequencyType>[];
    }

    expect(result).toBeNull();
  });

  it("returns sorted buckets", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([
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
    const context = { kysely: dummyKysely };

    let result: Partial<DelayFrequencyType>[] | null = null;
    if (typeof getDelayFrequency === "function") {
      result = (await getDelayFrequency(
        {},
        args,
        context as any,
        {} as any,
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
