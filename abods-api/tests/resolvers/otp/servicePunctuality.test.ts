import { getServicePunctuality } from "../../../src/resolvers/otpFunctions";

import { jest } from "@jest/globals";
import * as kysely from "../../../src/lib/kysely";
import {
  ServicePunctualityType,
  RequireFields,
  OnTimePerformanceTypeServicePunctualityArgs,
  RankingOrder,
} from "../../../src/types/generated";
import { DB } from "../../../src/kysely";
import { PrismaClient } from "@prisma/client";
import {
  Dialect,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  SelectQueryBuilder,
} from "kysely";

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
});

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

const mockDb = {
  expected_services: {
    findMany: jest.fn().mockResolvedValue(mockServices as never),
  },
};

describe("getServicePunctuality", () => {
  it("returns correct punctuality stats for services", async () => {
    jest
      .spyOn(kysely, "executeQuery")
      .mockResolvedValue(mockPerformanceMetrics);

    const context = {
      db: mockDb,
      kysely: dummyKysely,
    };

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
        context as any,
        {} as any,
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

    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    expect(compiled.sql).toContain("asc");
  });

  it("returns correct punctuality stats for services when order is descending", async () => {
    jest
      .spyOn(kysely, "executeQuery")
      .mockResolvedValue(mockPerformanceMetrics);

    const context = {
      db: mockDb,
      kysely: dummyKysely,
    };

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
        context as any,
        {} as any,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    expect(compiled.sql).toContain("desc");
  });

  it("period type set to last 7 days", async () => {
    jest
      .spyOn(kysely, "executeQuery")
      .mockResolvedValue(mockPerformanceMetrics);

    const context = {
      db: mockDb,
      kysely: dummyKysely,
    };

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
        context as any,
        {} as any,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    expect(compiled.parameters[3]).toContain("last_7_days");
  });

  it("period type set to last 28 days", async () => {
    jest
      .spyOn(kysely, "executeQuery")
      .mockResolvedValue(mockPerformanceMetrics);

    const context = {
      db: mockDb,
      kysely: dummyKysely,
    };

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
        context as any,
        {} as any,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    expect(compiled.parameters[3]).toContain("last_28_days");
  });

  it("period type set to month to date", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-09-12T12:00:00+01:00"));
    jest
      .spyOn(kysely, "executeQuery")
      .mockResolvedValue(mockPerformanceMetrics);

    const context = {
      db: mockDb,
      kysely: dummyKysely,
    };

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
        context as any,
        {} as any,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    expect(compiled.parameters[3]).toContain("month_to_date");
    jest.useRealTimers();
  });

  it("period type set to last month", async () => {
    jest
      .spyOn(kysely, "executeQuery")
      .mockResolvedValue(mockPerformanceMetrics);
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-09-12T12:00:00+01:00"));
    const context = {
      db: mockDb,
      kysely: dummyKysely,
    };

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
        context as any,
        {} as any,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    expect(compiled.parameters[3]).toContain("last_month");

    jest.useRealTimers();
  });

  it("returns empty array when no services are found", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([]);

    const context = {
      db: mockDb,
      kysely: dummyKysely,
    };

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
        context as any,
        {} as any,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });

  it("returns empty array when user is not mapped to the expected operators", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([]);

    const context = {
      db: mockDb,
      kysely: dummyKysely,
    };

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
        context as any,
        {} as any,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });

  it("timing points only is set to true when passed", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-09-12T12:00:00+01:00"));
    jest
      .spyOn(kysely, "executeQuery")
      .mockResolvedValue(mockPerformanceMetrics);

    const context = {
      db: mockDb,
      kysely: dummyKysely,
    };

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
        context as any,
        {} as any,
      )) as Partial<ServicePunctualityType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();

    expect(compiled.parameters[4]).toBe(true);
    jest.useRealTimers();
  });
});
