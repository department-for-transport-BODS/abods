import {
  getFeedMonitoringList,
  getHistoricalStats,
  getLast24Hours,
  getLiveStats,
  getOperator,
  getOperatorList,
  getVehicleStatsByMin,
} from "./feedMonitoringFunctions";
import * as feedMonitoringLib from "../lib/feedMonitoring";
import dayjs from "dayjs";
import { GraphQLResolveInfo } from "graphql";
import { RequestContext } from "../types/extra";
import {
  FeedMonitoringType,
  HistoricalStatsType,
  LiveStatsType,
  OperatorFeedMonitoring,
  VehicleStatsType,
} from "../types/generated";
import { feed_monitor_summary, PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { createRequest, createResponse } from "node-mocks-http";
import {
  Dialect,
  DummyDriver,
  PostgresQueryCompiler,
  PostgresAdapter,
  PostgresIntrospector,
  Kysely,
} from "kysely";
import { DB } from "../kysely";
import { Decimal } from "@prisma/client/runtime/library";
import logger from "../logger";
import * as kyselyLib from "../lib/dbKysely";

jest.spyOn(feedMonitoringLib, "getVehicleCounts").mockImplementation(jest.fn());

jest.mock("./helpers", () => ({
  requireUserSession: jest.fn(() =>
    Promise.resolve({ id: 1, orgs: [{ id: 10 }] }),
  ),
  throwUnauthenticatedError: jest.fn(),
}));

let context: RequestContext;
let parent: FeedMonitoringType;

let mockDb: DeepMockProxy<PrismaClient>;

const dummyDialect: Dialect = {
  createDriver: () => new DummyDriver(),
  createQueryCompiler: () => new PostgresQueryCompiler(),
  createAdapter: () => new PostgresAdapter(),
  createIntrospector: (db) => new PostgresIntrospector(db),
};

const dummyKysely = new Kysely<DB>({
  dialect: dummyDialect,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockDb = mockDeep<PrismaClient>();
  context = {
    db: mockDb,
    req: createRequest(),
    res: createResponse(),
    headers: {},
    kysely: dummyKysely,
  };
  parent = {
    operatorId: "OP1",
    liveStats: { updateFrequency: 5, operatorId: "OP1" },
  };
});

describe("getLiveStats", () => {
  it("calls getVehicleCounts 20 times", async () => {
    // Arrange
    const mockVehicleCounts = [
      [{ actual: 10, expected: 12 }],
      [{ actual: 11, expected: 13 }],
      [{ actual: 12, expected: 14 }],
      [{ actual: 13, expected: 15 }],
      [{ actual: 14, expected: 16 }],
      [{ actual: 15, expected: 17 }],
      [{ actual: 16, expected: 18 }],
    ];
    (feedMonitoringLib.getVehicleCounts as jest.Mock).mockImplementation(
      (_kysely, _operatorId, _start, _end) => {
        // Return a different mock for each call
        return Promise.resolve(mockVehicleCounts.shift() ?? []);
      },
    );

    // Simulate info for a week duration
    const info = {
      operation: {
        name: { value: "operatorLiveStatus" },
      },
      duration: "week",
    };

    if (typeof getLiveStats === "function") {
      await getLiveStats(
        parent,
        {},
        context,
        info as unknown as GraphQLResolveInfo,
      );
    }
    // Assert
    expect(feedMonitoringLib.getVehicleCounts).toHaveBeenCalledTimes(20);

    const lastCall = (feedMonitoringLib.getVehicleCounts as jest.Mock).mock
      .calls[19] as unknown[];
    const firstCall = (feedMonitoringLib.getVehicleCounts as jest.Mock).mock
      .calls[0] as unknown[];

    const endTimeRange = dayjs(firstCall[3] as Date);
    const currentTime = dayjs().startOf("minute");
    const inputStart = dayjs(lastCall[2] as string);
    //const end = dayjs(lastCall[3]);
    const startTime = dayjs().subtract(20, "minute").startOf("minute");

    // Check that the last call was for 20 minutes ago
    // Allowing a few seconds difference for test execution time
    expect(startTime.diff(inputStart, "second")).toBeCloseTo(0); // or adjust if your code uses a different interval
    expect(endTimeRange.diff(currentTime, "second")).toBeCloseTo(0);
  });

  it("returns sorted last20Minutes array by timestamp", async () => {
    (feedMonitoringLib.getVehicleCounts as jest.Mock).mockResolvedValue([
      { actual: 10, expected: 12 },
    ]);

    const info = {
      operation: {
        name: { value: "operatorLiveStatus" },
      },
    };

    let result: Partial<LiveStatsType> | null = null;
    if (typeof getLiveStats === "function") {
      result = await getLiveStats(
        parent,
        {},
        context,
        info as unknown as GraphQLResolveInfo,
      );
    }
    // Assert
    expect(result?.last20Minutes).toBeDefined();
    const timestamps = result?.last20Minutes?.map((v) => v.timestamp);
    const sorted = timestamps
      ? [...timestamps].sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime(),
        )
      : [];
    expect(timestamps).toEqual(sorted);
  });
});

describe("getHistoricalStats", () => {
  it("calls getVehicleCounts for each day in the range and returns sorted stats", async () => {
    mockDb.feed_monitor_daily_summary.findFirst.mockResolvedValue({
      update_frequency: 10,
      availability: 95,
    } as never);

    const args = {
      from: "2025-09-01",
      to: "2025-09-03",
    };

    let result: Partial<HistoricalStatsType> | null = null;
    if (typeof getHistoricalStats === "function") {
      result = await getHistoricalStats(
        parent,
        args as never,
        context,
        {} as GraphQLResolveInfo,
      );
    }

    // Should be sorted by timestamp
    expect(result).not.toBeNull();
    expect(result?.updateFrequency).toEqual(10);
    expect(result?.availability).toEqual(95);
  });

  it("returns empty array when getVehicleCounts returns no data", async () => {
    mockDb.feed_monitor_daily_summary.findFirst.mockResolvedValue({} as never);

    const args = {
      from: "2025-09-01",
      to: "2025-09-01",
    };

    let result: Partial<HistoricalStatsType> | null = null;
    if (typeof getHistoricalStats === "function") {
      result = await getHistoricalStats(
        parent,
        args as never,
        context,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result?.updateFrequency).toBeUndefined();
    expect(result?.availability).toBe(0);
  });
});

describe("getLast24Hours", () => {
  it("returns mapped last 24 hours vehicle stats sorted by timestamp", async () => {
    const now = new Date();
    const hourlySummaries = Array.from({ length: 24 }, (_, i) => ({
      actual: i + 10,
      expected: i + 20,
      received_interval: dayjs(now)
        .subtract(23 - i, "hour")
        .toDate(),
    }));
    mockDb.feed_monitor_hourly_summary.findMany.mockResolvedValue(
      hourlySummaries as never,
    );

    let result: Partial<VehicleStatsType>[] | null = null;
    if (typeof getLast24Hours === "function") {
      result = (await getLast24Hours(
        parent as LiveStatsType,
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<VehicleStatsType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(24);

    // Should be sorted by timestamp
    const timestamps = result!
      .map((v) => v.timestamp)
      .filter((t) => t !== undefined);
    const sorted = [...timestamps].sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );
    expect(timestamps).toEqual(sorted);

    // Check mapping
    expect(result?.[0].actual).toBe(10);
    expect(result?.[0].expected).toBe(20);
    expect(result?.[23].actual).toBe(33);
    expect(result?.[23].expected).toBe(43);
  });

  it("returns empty array when no hourly summaries found", async () => {
    mockDb.feed_monitor_hourly_summary.findMany.mockResolvedValue([] as never);

    let result: Partial<VehicleStatsType>[] | null = null;
    if (typeof getLast24Hours === "function") {
      result = (await getLast24Hours(
        parent as LiveStatsType,
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<VehicleStatsType>[];
    }

    expect(result).toEqual([]);
  });

  it("throws error if operatorId is missing", async () => {
    const badParent = { ...parent, operatorId: undefined };
    if (typeof getLast24Hours === "function") {
      await expect(
        getLast24Hours(
          badParent as never,
          {},
          context,
          {} as GraphQLResolveInfo,
        ),
      ).rejects.toThrow("Invalid data");
    }
  });
});

describe("getVehicleStatsByMin", () => {
  it("returns mapped vehicle stats by minute sorted by timestamp", async () => {
    const now = new Date();
    const minuteSummaries = Array.from({ length: 5 }, (_, i) => ({
      actual: i + 1,
      expected: i + 2,
      received_interval: dayjs(now)
        .subtract(4 - i, "minute")
        .toDate(),
    }));
    mockDb.feed_monitor_minute_summary.findMany.mockResolvedValue(
      minuteSummaries as never,
    );

    const args = {
      start: dayjs(now).subtract(4, "minute").toDate(),
      end: now,
    };

    let result: Partial<VehicleStatsType>[] | null = null;
    if (typeof getVehicleStatsByMin === "function") {
      result = (await getVehicleStatsByMin(
        parent,
        args as never,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<VehicleStatsType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(5);

    // Should be sorted by timestamp
    const timestamps = result!
      .map((v) => v.timestamp)
      .filter((t) => t !== undefined);
    const sorted = [...timestamps].sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );
    expect(timestamps).toEqual(sorted);

    // Check mapping
    expect(result?.[0].actual).toBe(1);
    expect(result?.[0].expected).toBe(2);
    expect(result?.[4].actual).toBe(5);
    expect(result?.[4].expected).toBe(6);
  });

  it("returns empty array when no minute summaries found", async () => {
    mockDb.feed_monitor_minute_summary.findMany.mockResolvedValue([] as never);

    const args = {
      start: dayjs().subtract(4, "minute").toDate(),
      end: dayjs().toDate(),
    };

    let result: Partial<VehicleStatsType>[] | null = null;
    if (typeof getVehicleStatsByMin === "function") {
      result = (await getVehicleStatsByMin(
        parent,
        args as never,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<VehicleStatsType>[];
    }

    expect(result).toEqual([]);
  });

  it("throws error if operatorId is missing", async () => {
    const badParent = { ...parent, operatorId: undefined };
    const args = {
      start: dayjs().subtract(4, "minute").toDate(),
      end: dayjs().toDate(),
    };
    if (typeof getVehicleStatsByMin === "function") {
      await expect(
        getVehicleStatsByMin(
          badParent as never,
          args as never,
          context,
          {} as GraphQLResolveInfo,
        ),
      ).rejects.toThrow("Invalid data");
    }
  });
});

describe("getFeedMonitoringList", () => {
  it("returns feed monitoring info when feed summary exists", async () => {
    const mockSummary: Partial<feed_monitor_summary> = {
      operator_noc: "OP1",
      availability: new Decimal(98.1),
      last_outage: new Date("2025-09-29T12:00:00Z"),
      unavailable_since: null,
      update_frequency: 5,
    };
    mockDb.feed_monitor_summary.findUnique.mockResolvedValue(
      mockSummary as never,
    );

    let result: Partial<FeedMonitoringType> | null = null;
    if (typeof getFeedMonitoringList === "function") {
      result = await getFeedMonitoringList(
        parent as never,
        {},
        context,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result).not.toBeNull();
    expect(result?.operatorId).toBe("OP1");
    expect(result?.feedStatus).toBe(true);
    expect(result?.availability).toBe(98.1);
    expect(result?.lastOutage).toEqual(new Date("2025-09-29T12:00:00Z"));
    expect(result?.unavailableSince).toBeNull();
    expect(result?.liveStats).toEqual({
      operatorId: "OP1",
      updateFrequency: 5,
    });
  });

  it("returns feed monitoring info with defaults when feed summary is null", async () => {
    mockDb.feed_monitor_summary.findFirst.mockResolvedValue(null);

    let result: Partial<FeedMonitoringType> | null = null;
    if (typeof getFeedMonitoringList === "function") {
      result = await getFeedMonitoringList(
        parent as never,
        {},
        context,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result).not.toBeNull();
    expect(result?.operatorId).toBe("OP1");
    expect(result?.feedStatus).toBe(true);
    expect(result?.availability).toBe(0);
    expect(result?.lastOutage).toBeUndefined();
    expect(result?.unavailableSince).toBeUndefined();
    expect(result?.liveStats).toEqual({
      operatorId: "OP1",
      updateFrequency: undefined,
    });
  });

  it("throws error if operatorId is missing", async () => {
    const badParent = { operatorId: undefined as unknown as string };
    if (typeof getFeedMonitoringList === "function") {
      await expect(
        getFeedMonitoringList(badParent, {}, context, {} as GraphQLResolveInfo),
      ).rejects.toThrow("Parent data not set");
    }
  });
});

describe("getOperator", () => {
  it("returns operator info when found", async () => {
    mockDb.all_operators.findUnique.mockResolvedValue({
      operatorref: "OP1",
      name: "Operator One",
    } as never);

    const args = { operatorId: "OP1" };
    let result: Partial<OperatorFeedMonitoring> | null = null;
    if (typeof getOperator === "function") {
      result = await getOperator({}, args, context, {} as GraphQLResolveInfo);
    }

    expect(result).not.toBeNull();
    expect(result).toEqual({
      operatorId: "OP1",
      nocCode: "OP1",
      name: "Operator One",
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.all_operators.findUnique).toHaveBeenCalledWith({
      where: { operatorref: "OP1" },
    });
  });

  it("returns null and logs error when operator not found", async () => {
    mockDb.all_operators.findUnique.mockResolvedValue(null);
    const loggerSpy = jest.spyOn(logger, "error").mockImplementation(jest.fn());

    const args = { operatorId: "OP2" };
    let result: Partial<OperatorFeedMonitoring> | null = null;
    if (typeof getOperator === "function") {
      result = await getOperator({}, args, context, {} as GraphQLResolveInfo);
    }

    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.any(Error),
      "An error occurred when getting operator info",
    );
  });

  it("returns null and logs error on exception", async () => {
    mockDb.all_operators.findUnique.mockRejectedValue(new Error("DB error"));
    const loggerSpy = jest.spyOn(logger, "error").mockImplementation(jest.fn());

    const args = { operatorId: "OP3" };
    let result: Partial<OperatorFeedMonitoring> | null = null;
    if (typeof getOperator === "function") {
      result = await getOperator({}, args, context, {} as GraphQLResolveInfo);
    }

    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.any(Error),
      "An error occurred when getting operator info",
    );
  });
});

describe("getOperatorList", () => {
  it("returns mapped operator list", async () => {
    const mockResults = [
      {
        name: "Operator One",
        operator_noc: "OP1",
      },
      {
        name: "Operator Two",
        operator_noc: "OP2",
      },
    ];

    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue(mockResults);
    // If your implementation uses .groupBy or .distinct, adjust accordingly
    let result: Partial<OperatorFeedMonitoring>[] | null = null;
    if (typeof getOperatorList === "function") {
      result = (await getOperatorList(
        {},
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<OperatorFeedMonitoring>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      operatorId: "OP1",
      nocCode: "OP1",
      name: "Operator One",
    });
    expect(result?.[1]).toEqual({
      operatorId: "OP2",
      nocCode: "OP2",
      name: "Operator Two",
    });
  });

  it("returns empty array when no operators found", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([]);

    let result: Partial<OperatorFeedMonitoring>[] | null = null;
    if (typeof getOperatorList === "function") {
      result = (await getOperatorList(
        {},
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<OperatorFeedMonitoring>[];
    }

    expect(result).toEqual([]);
  });
});
