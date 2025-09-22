import { getOperatorPerformance } from "../../../src/resolvers/otpFunctions";
import {
  Dialect,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { jest } from "@jest/globals";
import {
  OperatorPerformancePage,
  MatchType,
  RequireFields,
  OnTimePerformanceTypeOperatorPerformanceArgs,
  OperatorPerformanceType,
} from "../../../src/types/generated";
import { DB } from "../../../src/kysely";

import * as otp from "../../../src/lib/otp";
import * as kysely from "../../../src/lib/kysely";
import { PrismaClient } from "@prisma/client";

// Mock user session
jest.mock("../../../src/resolvers/helpers", () => ({
  requireUserSession: jest.fn(() =>
    Promise.resolve({ id: 1, orgs: [{ id: 10 }] }),
  ),
}));

jest.spyOn(otp, "getOperatorsForUser").mockResolvedValue([
  { operatorref: "OP1", name: "Operator One" },
  { operatorref: "OP2", name: "Operator Two" },
]);

jest.spyOn(kysely, "executeQuery").mockResolvedValue([
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

describe("getOperatorPerformance", () => {
  const dummyDialect: Dialect = {
    createDriver: () => new DummyDriver(),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createAdapter: () => new PostgresAdapter(),
    createIntrospector: (db) => new PostgresIntrospector(db),
  };

  const mockKysely = new Kysely<DB>({
    dialect: dummyDialect,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns operator performance page with correct stats", async () => {
    const context = {
      db: {} as PrismaClient,
      kysely: mockKysely,
    };

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
        context as any,
        {} as any,
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
    jest.spyOn(otp, "getOperatorsForUser").mockResolvedValue([]);
    const context = {
      db: {} as PrismaClient,
      kysely: mockKysely,
    };

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
        context as any,
        {} as any,
      );
    }

    expect(result).not.toBeNull();
    expect(result?.items?.length).toBe(0);
  });
});
