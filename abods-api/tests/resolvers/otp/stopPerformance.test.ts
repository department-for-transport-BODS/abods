import { getStopPerformance } from "../../../src/resolvers/otpFunctions";
import { jest } from "@jest/globals";
import * as kysely from "../../../src/lib/kysely";
import {
  StopPerformanceType,
  RequireFields,
  OnTimePerformanceTypeStopPerformanceArgs,
  Direction,
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

const mockStopResults = [
  {
    stop_id: 101,
    common_name: "Stop A",
    is_timing_point: true,
    early_count: 2,
    late_count: 3,
    on_time_count: 5,
    completed: 10,
    scheduled: 12,
    count_delayed: 2,
    average_delay: 6,
    direction: "inbound",
    diff_sched_time_to_stop: 1.5,
    diff_actual_time_to_stop: 2.5,
    on_time_in_seconds: 300,
    early_in_seconds: 120,
    late_in_seconds: 180,
  },
  {
    stop_id: 102,
    common_name: "Stop B",
    is_timing_point: false,
    early_count: 1,
    late_count: 2,
    on_time_count: 3,
    completed: 6,
    scheduled: 7,
    count_delayed: 1,
    average_delay: 2,
    direction: "outbound",
    diff_sched_time_to_stop: 1.2,
    diff_actual_time_to_stop: 2.2,
    on_time_in_seconds: 180,
    early_in_seconds: 60,
    late_in_seconds: 90,
  },
];

const mockStops = [
  {
    id: 101,
    longitude: 1.1,
    latitude: 2.2,
    atco_code: "A",
    locality: {
      gazetteer_id: "G1",
      name: "Loc1",
      admin_area: { name: "Area1" },
    },
  },
  {
    id: 102,
    longitude: 3.3,
    latitude: 4.4,
    atco_code: "B",
    locality: {
      gazetteer_id: "G2",
      name: "Loc2",
      admin_area: { name: "Area2" },
    },
  },
];

const mockDb = {
  naptan_stoppoint_latlong: {
    findMany: jest.fn().mockResolvedValue(mockStops as never),
  },
};

describe("getStopPerformance", () => {
  it("returns correct stop performance stats", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue(mockStopResults);

    const context = {
      db: mockDb,
      kysely: dummyKysely,
    };

    const args: RequireFields<
      OnTimePerformanceTypeStopPerformanceArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          lineIds: ["L1"],
        },
      },
    };

    let result: Partial<StopPerformanceType>[] | null = null;
    if (typeof getStopPerformance === "function") {
      result = (await getStopPerformance(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<StopPerformanceType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      lineId: "L1",
      stopId: "A",
      early: 2,
      late: 3,
      onTime: 5,
      actualDepartures: 10,
      scheduledDepartures: 12,
      averageDelay: 3,
      countDelayed: 2,
      timingPoint: true,
      direction: Direction.Inbound,
      averageActual: 2.5,
      averageScheduled: 1.5,
      onTimeInSeconds: 60,
      earlyInSeconds: 60,
      lateInSeconds: 60,
      stopInfo: {
        stopId: "A",
        stopName: "Stop A",
        stopLocality: {
          localityId: "",
          localityName: "Loc1",
          localityAreaId: "",
          localityAreaName: "Area1",
        },
        sourceId: "A",
        stopLocation: {
          longitude: 1.1,
          latitude: 2.2,
        },
      },
    });

    expect(result?.[1]).toEqual({
      lineId: "L1",
      stopId: "B",
      early: 1,
      late: 2,
      onTime: 3,
      actualDepartures: 6,
      scheduledDepartures: 7,
      averageDelay: 2,
      countDelayed: 1,
      timingPoint: false,
      direction: Direction.Outbound,
      averageScheduled: 1.2,
      averageActual: 2.2,
      onTimeInSeconds: 60,
      earlyInSeconds: 60,
      lateInSeconds: 45,
      stopInfo: {
        stopId: "B",
        stopName: "Stop B",
        stopLocality: {
          localityId: "",
          localityName: "Loc2",
          localityAreaId: "",
          localityAreaName: "Area2",
        },
        sourceId: "B",
        stopLocation: {
          longitude: 3.3,
          latitude: 4.4,
        },
      },
    });
  });

  it("returns empty array when no stops are found", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([]);
    mockDb.naptan_stoppoint_latlong.findMany.mockResolvedValue([] as never);

    const context = {
      db: mockDb,
      kysely: dummyKysely,
    };

    const args: RequireFields<
      OnTimePerformanceTypeStopPerformanceArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-18T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          lineIds: ["L1"],
        },
      },
    };

    let result: Partial<StopPerformanceType>[] | null = null;
    if (typeof getStopPerformance === "function") {
      result = (await getStopPerformance(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<StopPerformanceType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });
});
