import { getServicePerformance } from "../../../src/resolvers/otpFunctions";
import { jest } from "@jest/globals";
import * as kysely from "../../../src/lib/kysely";
import {
  ServicePerformanceType,
  RequireFields,
  OnTimePerformanceTypeServicePerformanceArgs,
  Direction,
  RankingOrder,
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
import { PrismaClient } from "@prisma/client";

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

const mockDb = {
  expected_services: {
    findMany: jest.fn().mockResolvedValue(mockServices as never),
  },
};

describe("getServicePerformance", () => {
  it("returns correct service performance stats", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue(mockServiceResults);

    const context = {
      db: mockDb,
      kysely: dummyKysely,
    };

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
        context as any,
        {} as any,
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
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([]);
    mockDb.expected_services.findMany.mockResolvedValue([] as never);

    const context = {
      db: mockDb,
      kysely: dummyKysely,
    };

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
        context as any,
        {} as any,
      )) as Partial<ServicePerformanceType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });
});
