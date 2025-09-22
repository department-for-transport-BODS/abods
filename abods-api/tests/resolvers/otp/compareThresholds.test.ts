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
  OnTimePerformanceTypePunctualityOverviewArgs,
  PunctualityTotalsType,
  RequireFields,
} from "../../../src/types/generated";
import { DB } from "../../../src/kysely";
import { getPunctualityOverview } from "../../../src/resolvers/otpFunctions";
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
  (jest.spyOn(kysely, "executeQueryTakeFirst") as jest.Mock)
    .mockImplementationOnce(async () => ({ otp_count: 5 })) // Early
    .mockImplementationOnce(async () => ({ otp_count: 7 })) // Late
    .mockImplementationOnce(async () => ({ otp_count: 12 })); // OnTime
});

fdescribe("compareThresholds", () => {
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
    const context = { kysely: dummyKysely };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context as any, {} as any);
    }

    const queryArg = (kysely.executeQueryTakeFirst as jest.Mock).mock
      .calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

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
    const context = { kysely: dummyKysely };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context as any, {} as any);
    }

    const queryArg = (kysely.executeQueryTakeFirst as jest.Mock).mock
      .calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

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
    const context = { kysely: dummyKysely };

    const resolver = getPunctualityOverview;
    let result: Partial<PunctualityTotalsType> | null = null;
    if (typeof resolver === "function") {
      result = await resolver({}, args, context as any, {} as any);
    }

    const queryArg = (kysely.executeQueryTakeFirst as jest.Mock).mock
      .calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    expect(result).not.toBeNull();
    expect(result?.early).toBe(5);
    expect(result?.late).toBe(7);
    expect(result?.onTime).toBe(12);

    expect(compiled.sql).toContain("hour");
    expect(compiled.parameters[3]).toBe(10);
    expect(compiled.parameters[4]).toBe(20);
  });
});
