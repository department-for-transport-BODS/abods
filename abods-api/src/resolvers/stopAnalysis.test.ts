import { getStopAnalysis } from "./stopAnalysis";
import * as kyselyLib from "../lib/dbKysely";
import * as operatorsLib from "../lib/operators";
import {
  Kysely,
  Dialect,
  DummyDriver,
  PostgresQueryCompiler,
  PostgresAdapter,
  PostgresIntrospector,
  SelectQueryBuilder,
} from "kysely";
import { DB } from "../kysely";
import { RequestContext } from "../types/extra";
import { GraphQLResolveInfo } from "graphql";
import { createRequest, createResponse } from "node-mocks-http";
import { MatchType, StopStatistics } from "../types/generated";

jest.mock("./helpers", () => ({
  requireUserSession: jest.fn(() =>
    Promise.resolve({ id: 1, orgs: [{ id: 10 }] }),
  ),
}));
jest.mock("../lib/operators", () => ({
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

let context: RequestContext;

const args = {
  inputs: {
    fromTimestamp: "2025-09-01T00:00:00.000+01:00",
    toTimestamp: "2025-09-06T00:00:00.000+01:00",
    dayOfWeekFlags: {
      monday: true,
      tuesday: false,
      wednesday: true,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    operatorIds: ["OP1"],
    lineIds: ["L1", "L2"],
    adminAreaIds: ["1", "2"],
    matchType: MatchType.Evidenced,
    startTime: "08:00",
    endTime: "18:00",
    boundingBox: {
      minLatitude: 51.0,
      maxLatitude: 52.0,
      minLongitude: -1.0,
      maxLongitude: 0.0,
    },
  },
};

const mockNaptanStops = [
  {
    stop_id: 101,
    stopName: "Stop A",
    localityName: "Loc1",
    adminAreaName: "Area1",
    atcoCode: "A",
    latitude: 1.1,
    longitude: 2.2,
  },
  {
    stop_id: 102,
    stopName: "Stop B",
    localityName: "Loc2",
    adminAreaName: "Area2",
    atcoCode: "B",
    latitude: 3.3,
    longitude: 4.4,
  },
];

const mockSummaryResults = [
  {
    stop_id: 101,
    timingPoint: true,
    early: 2,
    late: 3,
    onTime: 5,
    completedDepartures: 10,
    totalDelay: 20,
    countDelayed: 2,
    averageDelay: 6,
    averageScheduled: 1.5,
    averageScheduledTimingPoint: 1.2,
    averageActual: 2.5,
    averageActualTimingPoint: 2.2,
    onTimeInSeconds: 60,
    lateInSeconds: 60,
    earlyInSeconds: 60,
    direction: "inbound",
  },
  {
    stop_id: 102,
    timingPoint: false,
    early: 1,
    late: 2,
    onTime: 3,
    completedDepartures: 6,
    totalDelay: 12,
    countDelayed: 1,
    averageDelay: 2,
    averageScheduled: 1.2,
    averageScheduledTimingPoint: 1.1,
    averageActual: 2.2,
    averageActualTimingPoint: 2.1,
    onTimeInSeconds: 60,
    lateInSeconds: 45,
    earlyInSeconds: 60,
    direction: "outbound",
  },
];

const mockScheduledCounts = [
  {
    stop_id: 101,
    is_timing_point: true,
    direction: "inbound",
    scheduled: 12,
  },
  {
    stop_id: 102,
    is_timing_point: false,
    direction: "outbound",
    scheduled: 7,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  context = {
    req: createRequest(),
    res: createResponse(),
    headers: {},
    db: {} as never,
    kysely: dummyKysely,
  };
});

describe("getStopAnalysis", () => {
  it("returns stop statistics and builds query with all filters", async () => {
    const executeQueryMock = jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValueOnce(mockNaptanStops) // naptanQuery
      .mockResolvedValueOnce(mockSummaryResults) // summaryPromise
      .mockResolvedValueOnce(mockScheduledCounts); // scheduledCountPromise

    let result: Partial<StopStatistics>[] | null = null;
    if (typeof getStopAnalysis === "function") {
      result = (await getStopAnalysis(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as StopStatistics[];
    }

    expect(executeQueryMock).toHaveBeenCalledTimes(3);

    const naptanQueryArg = (executeQueryMock as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const naptanCompiled = naptanQueryArg[0].compile();
    expect(naptanCompiled.sql).toBeDefined();

    // 2nd call: summaryPromise
    const summaryQueryArg = (executeQueryMock as jest.Mock).mock
      .calls[1] as SelectQueryBuilder<DB, never, unknown>[];
    const summaryCompiled = summaryQueryArg[0].compile();
    expect(summaryCompiled.sql).toBeDefined();
    expect(summaryCompiled.sql).toContain('group by "t"."stop_id"');

    // 3rd call: scheduledCountPromise
    const scheduledQueryArg = (executeQueryMock as jest.Mock).mock
      .calls[2] as SelectQueryBuilder<DB, never, unknown>[];
    const scheduledCompiled = scheduledQueryArg[0].compile();
    expect(scheduledCompiled.sql).toBeDefined();
    expect(scheduledCompiled.sql).toContain('group by "t"."stop_id"');

    // Check result shape
    expect(result).toHaveLength(2);
    expect(result?.[0]).toMatchObject({
      stop_id: 101,
      timingPoint: true,
      early: 2,
      late: 3,
      onTime: 5,
      completedDepartures: 10,
      totalDelay: 20,
      countDelayed: 2,
      averageDelay: 6,
      averageScheduled: 1.5,
      averageScheduledTimingPoint: 1.2,
      averageActual: 2.5,
      averageActualTimingPoint: 2.2,
      onTimeInSeconds: 60,
      lateInSeconds: 60,
      earlyInSeconds: 60,
      direction: "inbound",
      scheduledDepartures: 12,
      stopName: "Stop A",
      localityName: "Loc1",
      adminAreaName: "Area1",
      atcoCode: "A",
      latitude: 1.1,
      longitude: 2.2,
    });

    expect(result?.[1]).toMatchObject({
      stop_id: 102,
      timingPoint: false,
      early: 1,
      late: 2,
      onTime: 3,
      completedDepartures: 6,
      totalDelay: 12,
      countDelayed: 1,
      averageDelay: 2,
      averageScheduled: 1.2,
      averageScheduledTimingPoint: 1.1,
      averageActual: 2.2,
      averageActualTimingPoint: 2.1,
      onTimeInSeconds: 60,
      lateInSeconds: 45,
      earlyInSeconds: 60,
      direction: "outbound",
      scheduledDepartures: 7,
      stopName: "Stop B",
      localityName: "Loc2",
      adminAreaName: "Area2",
      atcoCode: "B",
      latitude: 3.3,
      longitude: 4.4,
    });
  });

  it("returns empty array when naptan query returns no data", async () => {
    const executeQueryMock = jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValueOnce([]);

    let result: Partial<StopStatistics>[] | null = null;
    if (typeof getStopAnalysis === "function") {
      result = (await getStopAnalysis(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as StopStatistics[];
    }

    expect(executeQueryMock).toHaveBeenCalledTimes(1);
    expect(result?.length).toEqual(0);
  });

  it("throws error if user has no access to selected operator data", async () => {
    (operatorsLib.getUserOperatorIds as jest.Mock).mockResolvedValue(["OP1"]);
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValueOnce(mockNaptanStops);

    if (typeof getStopAnalysis === "function") {
      await expect(
        getStopAnalysis(
          {},
          { ...args, inputs: { ...args.inputs, operatorIds: ["OP2"] } },
          context,
          {} as GraphQLResolveInfo,
        ),
      ).rejects.toThrow(
        "User does not have access to any of the selected operator data",
      );
    }
  });

  it("execute query is invoked a few times based on input dates", async () => {
    const executeQueryMock = jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValueOnce(mockNaptanStops)
      .mockResolvedValue([]);

    if (typeof getStopAnalysis === "function") {
      const _ = await getStopAnalysis(
        {},
        {
          ...args,
          inputs: {
            ...args.inputs,
            fromTimestamp: "2025-09-01T00:00:00.000+01:00",
            toTimestamp: "2025-09-26T00:00:00.000+01:00",
          },
        },
        context,
        {} as GraphQLResolveInfo,
      );
    }
    expect(executeQueryMock).toHaveBeenCalledTimes(9);
  });

  it("returns stop statistics for multiple weeks", async () => {
    const executeQueryMock = jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValueOnce(mockNaptanStops) // naptanQuery
      .mockResolvedValueOnce(mockSummaryResults) // summaryPromise
      .mockResolvedValueOnce(mockScheduledCounts)
      .mockResolvedValueOnce(mockSummaryResults) // summaryPromise
      .mockResolvedValueOnce(mockScheduledCounts); // scheduledCountPromise

    let result: Partial<StopStatistics>[] | null = null;
    if (typeof getStopAnalysis === "function") {
      result = (await getStopAnalysis(
        {},
        {
          ...args,
          inputs: {
            ...args.inputs,
            fromTimestamp: "2025-09-01T00:00:00.000+01:00",
            toTimestamp: "2025-09-10T00:00:00.000+01:00",
          },
        },
        context,
        {} as GraphQLResolveInfo,
      )) as StopStatistics[];
    }

    expect(executeQueryMock).toHaveBeenCalledTimes(5);

    // Check result shape
    expect(result).toHaveLength(2);
    expect(result?.[0]).toMatchObject({
      stop_id: 101,
      timingPoint: true,
      early: 4,
      late: 6,
      onTime: 10,
      completedDepartures: 20,
      totalDelay: 40,
      countDelayed: 4,
      averageDelay: 12,
      averageScheduled: 1.5,
      averageScheduledTimingPoint: 1.2,
      averageActual: 2.5,
      averageActualTimingPoint: 2.2,
      onTimeInSeconds: 120,
      lateInSeconds: 120,
      earlyInSeconds: 120,
      direction: "inbound",
      scheduledDepartures: 24,
      stopName: "Stop A",
      localityName: "Loc1",
      adminAreaName: "Area1",
      atcoCode: "A",
      latitude: 1.1,
      longitude: 2.2,
    });

    expect(result?.[1]).toMatchObject({
      stop_id: 102,
      timingPoint: false,
      early: 2,
      late: 4,
      onTime: 6,
      completedDepartures: 12,
      totalDelay: 24,
      countDelayed: 2,
      averageDelay: 4,
      averageScheduled: 1.2,
      averageScheduledTimingPoint: 1.1,
      averageActual: 2.2,
      averageActualTimingPoint: 2.1,
      onTimeInSeconds: 120,
      lateInSeconds: 90,
      earlyInSeconds: 120,
      direction: "outbound",
      scheduledDepartures: 14,
      stopName: "Stop B",
      localityName: "Loc2",
      adminAreaName: "Area2",
      atcoCode: "B",
      latitude: 3.3,
      longitude: 4.4,
    });
  });
});
