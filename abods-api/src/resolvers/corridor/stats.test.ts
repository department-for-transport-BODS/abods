import {
  getServiceLinks,
  getSummaryStats,
  getTransitDayOfWeekStats,
  getTransitStatsHistogram,
  getTransitStatsPerService,
  getTransitTimeOfDayStats,
  getTransitTimeStats,
} from "./stats";
import {
  CorridorGranularity,
  CorridorStatsDayOfWeekType,
  CorridorStatsHistogramType,
  CorridorStatsInputType,
  CorridorStatsPerServiceType,
  CorridorStatsTimeOfDayType,
  CorridorStatsType,
  CorridorSummaryStatsType,
  CorridorTransitTimeStatsType,
  MatchType,
  RouteType,
  ServiceLinkType,
} from "../../types/generated";
import { RequestContext, StatsCache, TimetableType } from "../../types/extra";
import { GraphQLResolveInfo } from "graphql";
import {
  Dialect,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { DB } from "../../kysely";
import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { createResponse, createRequest } from "node-mocks-http";
import * as kyselyLib from "../../lib/dbKysely";
import * as commonLib from "../../lib/common";

const inputs: CorridorStatsInputType = {
  matchType: MatchType.Estimated,
  corridorId: "test-corridor",
  fromTimestamp: "2025-09-01T00:00:00.000Z",
  toTimestamp: "2025-09-02T00:00:00.000Z",
  granularity: CorridorGranularity.Hour,
  stopList: ["101", "102"],
};

describe("getSummaryStats", () => {
  it("calculates stats for valid transits", async () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-01T08:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:05:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:15:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-01T09:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T09:05:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-01T09:10:00.000Z"),
          expected_departure_time: new Date("2025-09-01T09:15:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
    ];

    const parent: StatsCache = {
      corridorTransits,
      inputs,
    };

    let result: CorridorSummaryStatsType | null = null;
    if (typeof getSummaryStats === "function") {
      result = await getSummaryStats(
        parent as Partial<CorridorStatsType>,
        {},
        {} as RequestContext,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result?.scheduledTransits).toBe(2);
    expect(result?.totalTransits).toBe(2);
    expect(result?.averageTransitTime).toBe(600); // (10min each, avg = 600s)
    expect(result?.numberOfServices).toBe(2);
  });

  it("ignores transits with missing departure times", async () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: null,
          expected_departure_time: new Date("2025-09-01T08:05:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: null,
          expected_departure_time: new Date("2025-09-01T08:15:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
    ];

    const parent: StatsCache = {
      corridorTransits,
      inputs,
    };

    let result: CorridorSummaryStatsType | null = null;
    if (typeof getSummaryStats === "function") {
      result = await getSummaryStats(
        parent as Partial<CorridorStatsType>,
        {},
        {} as RequestContext,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result?.scheduledTransits).toBe(1);
    expect(result?.totalTransits).toBe(0); // No valid transit times
    expect(result?.averageTransitTime).toBe(0);
    expect(result?.numberOfServices).toBe(1);
  });

  it("returns zero stats for empty corridorTransits", async () => {
    const parent: StatsCache = {
      corridorTransits: [],
      inputs,
    };

    let result: CorridorSummaryStatsType | null = null;
    if (typeof getSummaryStats === "function") {
      result = await getSummaryStats(
        parent as Partial<CorridorStatsType>,
        {},
        {} as RequestContext,
        {} as GraphQLResolveInfo,
      );
    }
    expect(result?.scheduledTransits).toBe(0);
    expect(result?.totalTransits).toBe(0);
    expect(result?.averageTransitTime).toBe(0);
    expect(result?.numberOfServices).toBe(0);
  });

  it("counts multiple transits for the same service only once", async () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-01T08:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:05:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:15:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
      [
        {
          atco_code: "103",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-01T09:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T09:05:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "104",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-01T09:10:00.000Z"),
          expected_departure_time: new Date("2025-09-01T09:15:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
    ];

    const parent: StatsCache = {
      corridorTransits,
      inputs,
    };

    let result: CorridorSummaryStatsType | null = null;
    if (typeof getSummaryStats === "function") {
      result = await getSummaryStats(
        parent as Partial<CorridorStatsType>,
        {},
        {} as RequestContext,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result?.scheduledTransits).toBe(2);
    expect(result?.totalTransits).toBe(2);
    expect(result?.averageTransitTime).toBe(600);
    expect(result?.numberOfServices).toBe(1); // Only one unique service
  });
});

describe("getTransitTimeOfDayStats", () => {
  it("returns transit time stats grouped by hour of day", async () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-01T08:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:00:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-01T09:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T09:00:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-01T09:10:00.000Z"),
          expected_departure_time: new Date("2025-09-01T09:10:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
    ];

    const parent: StatsCache = {
      corridorTransits,
      inputs,
    };

    let result: CorridorStatsTimeOfDayType[] | null = null;
    if (typeof getTransitTimeOfDayStats === "function") {
      result = (await getTransitTimeOfDayStats(
        parent as Partial<CorridorStatsType>,
        {},
        {} as RequestContext,
        {} as GraphQLResolveInfo,
      )) as CorridorStatsTimeOfDayType[];
    }

    // Should have stats for hour 9 and hour 10 BST
    const hours = result?.map((r) => r.hour);
    expect(hours).toContain(9);
    expect(hours).toContain(10);

    // Check avgTransitTime for each hour
    const hour9 = result?.find((r) => r.hour === 9);
    const hour10 = result?.find((r) => r.hour === 10);

    expect(hour9?.avgTransitTime).toBe(600); // 10min in seconds
    expect(hour10?.avgTransitTime).toBe(600); // 10min in seconds
  });

  it("returns transit time stats grouped by hour of day for winter", async () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-02-01T08:00:00.000Z"),
          expected_departure_time: new Date("2025-02-01T08:00:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-02-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-02-01T08:10:00.000Z"),
          expected_departure_time: new Date("2025-02-01T08:10:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-02-01"),
          timestamp_after_estimate: null,
        },
      ],
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-02-01T09:00:00.000Z"),
          expected_departure_time: new Date("2025-02-01T09:00:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-02-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-02-01T09:10:00.000Z"),
          expected_departure_time: new Date("2025-02-01T09:10:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-02-01"),
          timestamp_after_estimate: null,
        },
      ],
    ];

    const parent: StatsCache = {
      corridorTransits,
      inputs,
    };

    let result: CorridorStatsTimeOfDayType[] | null = null;
    if (typeof getTransitTimeOfDayStats === "function") {
      result = (await getTransitTimeOfDayStats(
        parent as Partial<CorridorStatsType>,
        {},
        {} as RequestContext,
        {} as GraphQLResolveInfo,
      )) as CorridorStatsTimeOfDayType[];
    }

    // Should have stats for hour 8 and hour 9 GMT
    const hours = result?.map((r) => r.hour);
    expect(hours).toContain(8);
    expect(hours).toContain(9);

    // Check avgTransitTime for each hour
    const hour8 = result?.find((r) => r.hour === 8);
    const hour9 = result?.find((r) => r.hour === 9);

    expect(hour9?.avgTransitTime).toBe(600); // 10min in seconds
    expect(hour8?.avgTransitTime).toBe(600); // 10min in seconds
  });

  it("returns empty array if no valid transits", async () => {
    const parent: StatsCache = {
      corridorTransits: [],
      inputs,
    };

    let result: CorridorStatsTimeOfDayType[] | null = null;
    if (typeof getTransitTimeOfDayStats === "function") {
      result = (await getTransitTimeOfDayStats(
        parent as Partial<CorridorStatsType>,
        {},
        {} as RequestContext,
        {} as GraphQLResolveInfo,
      )) as CorridorStatsTimeOfDayType[];
    }
    expect(result).toEqual([]);
  });

  it("ignores transits with missing departure times", async () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: null,
          expected_departure_time: new Date("2025-09-01T08:00:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: null,
          expected_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
    ];

    const parent: StatsCache = {
      corridorTransits,
      inputs,
    };

    let result: CorridorStatsTimeOfDayType[] | null = null;
    if (typeof getTransitTimeOfDayStats === "function") {
      result = (await getTransitTimeOfDayStats(
        parent as Partial<CorridorStatsType>,
        {},
        {} as RequestContext,
        {} as GraphQLResolveInfo,
      )) as CorridorStatsTimeOfDayType[];
    }
    expect(result).toEqual([]);
  });
});

describe("getTransitDayOfWeekStats", () => {
  it("groups transit times by day of week", () => {
    // Monday (dayjs day() === 1) and Tuesday (dayjs day() === 2)
    const corridorTransits: TimetableType[][] = [
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-01T08:00:00.000Z"), // Monday
          expected_departure_time: new Date("2025-09-01T08:00:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-02T09:00:00.000Z"), // Tuesday
          expected_departure_time: new Date("2025-09-02T09:00:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-09-02"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-02T09:10:00.000Z"),
          expected_departure_time: new Date("2025-09-02T09:10:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-09-02"),
          timestamp_after_estimate: null,
        },
      ],
    ];

    const parent: StatsCache = {
      corridorTransits,
      inputs,
    };

    const result: CorridorStatsDayOfWeekType[] =
      typeof getTransitDayOfWeekStats === "function"
        ? (getTransitDayOfWeekStats(
            parent as Partial<CorridorStatsType>,
            {},
            {} as RequestContext,
            {} as GraphQLResolveInfo,
          ) as CorridorStatsDayOfWeekType[])
        : [];

    // Should have stats for Monday (1) and Tuesday (2)
    const dows = result.map((r) => r.dow);
    expect(dows).toContain(1);
    expect(dows).toContain(2);

    // Check avgTransitTime for each day
    const monday = result.find((r) => r.dow === 1);
    const tuesday = result.find((r) => r.dow === 2);

    expect(monday?.avgTransitTime).toBe(600); // 10min in seconds
    expect(tuesday?.avgTransitTime).toBe(600); // 10min in seconds
  });

  it("returns empty array if no valid transits", () => {
    const parent: StatsCache = {
      corridorTransits: [],
      inputs,
    };

    const result: CorridorStatsDayOfWeekType[] =
      typeof getTransitDayOfWeekStats === "function"
        ? (getTransitDayOfWeekStats(
            parent as Partial<CorridorStatsType>,
            {},
            {} as RequestContext,
            {} as GraphQLResolveInfo,
          ) as CorridorStatsDayOfWeekType[])
        : [];
    expect(result).toEqual([]);
  });

  it("ignores transits with missing departure times", () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: null,
          expected_departure_time: new Date("2025-09-01T08:00:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: null,
          expected_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
    ];

    const parent: StatsCache = {
      corridorTransits,
      inputs,
    };

    const result: CorridorStatsDayOfWeekType[] =
      typeof getTransitDayOfWeekStats === "function"
        ? (getTransitDayOfWeekStats(
            parent as Partial<CorridorStatsType>,
            {},
            {} as RequestContext,
            {} as GraphQLResolveInfo,
          ) as CorridorStatsDayOfWeekType[])
        : [];
    expect(result).toEqual([]);
  });
});

describe("getTransitTimeStats", () => {
  it("groups transit times by day when granularity is day", async () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-01T08:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:05:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:15:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-02T09:00:00.000Z"),
          expected_departure_time: new Date("2025-09-02T09:05:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-09-02"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-02T09:10:00.000Z"),
          expected_departure_time: new Date("2025-09-02T09:15:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-09-02"),
          timestamp_after_estimate: null,
        },
      ],
    ];

    const parent: StatsCache = {
      corridorTransits,
      inputs: { ...inputs, granularity: CorridorGranularity.Day },
    };

    let result: CorridorTransitTimeStatsType[] | null = null;
    if (typeof getTransitTimeStats === "function") {
      result = (await getTransitTimeStats(
        parent as Partial<CorridorStatsType>,
        {},
        {} as RequestContext,
        {} as GraphQLResolveInfo,
      )) as CorridorTransitTimeStatsType[];
    }

    // Should have stats for two days
    expect(result?.length).toBe(2);
    // Check that the transit times are correct
    expect(result?.[0].avgTransitTime).toBe(600); // 10min in seconds
    expect(result?.[1].avgTransitTime).toBe(600); // 10min in seconds
    expect(result?.[0].ts).toMatch(/2025-09-01/);
    expect(result?.[1].ts).toMatch(/2025-09-02/);
  });

  it("groups transit times by hour when granularity is hour", async () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-01T08:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:00:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-01T09:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T09:00:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-01T09:10:00.000Z"),
          expected_departure_time: new Date("2025-09-01T09:10:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
    ];

    const parent: StatsCache = {
      corridorTransits,
      inputs: { ...inputs, granularity: CorridorGranularity.Hour },
    };

    let result: CorridorStatsTimeOfDayType[] | null = null;
    if (typeof getTransitTimeOfDayStats === "function") {
      result = (await getTransitTimeOfDayStats(
        parent as Partial<CorridorStatsType>,
        {},
        {} as RequestContext,
        {} as GraphQLResolveInfo,
      )) as CorridorStatsTimeOfDayType[];
    }

    // Should have stats for hour 9 and hour 10 BST
    const hours = result?.map((r) => r.hour);
    expect(hours).toContain(9);
    expect(hours).toContain(10);

    // Check avgTransitTime for each hour
    const hour9 = result?.find((r) => r.hour === 9);
    const hour10 = result?.find((r) => r.hour === 10);

    expect(hour9?.avgTransitTime).toBe(600); // 10min in seconds
    expect(hour10?.avgTransitTime).toBe(600); // 10min in seconds
  });

  it("groups transit times by hour when granularity is hour for winter", async () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-02-01T08:00:00.000Z"),
          expected_departure_time: new Date("2025-02-01T08:00:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-02-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-02-01T08:10:00.000Z"),
          expected_departure_time: new Date("2025-02-01T08:10:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-02-01"),
          timestamp_after_estimate: null,
        },
      ],
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-02-01T09:00:00.000Z"),
          expected_departure_time: new Date("2025-02-01T09:00:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-02-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-02-01T09:10:00.000Z"),
          expected_departure_time: new Date("2025-02-01T09:10:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-02-01"),
          timestamp_after_estimate: null,
        },
      ],
    ];

    const parent: StatsCache = {
      corridorTransits,
      inputs: { ...inputs, granularity: CorridorGranularity.Hour },
    };

    let result: CorridorStatsTimeOfDayType[] | null = null;
    if (typeof getTransitTimeOfDayStats === "function") {
      result = (await getTransitTimeOfDayStats(
        parent as Partial<CorridorStatsType>,
        {},
        {} as RequestContext,
        {} as GraphQLResolveInfo,
      )) as CorridorStatsTimeOfDayType[];
    }

    // Should have stats for hour 8 and hour 9 GMT
    const hours = result?.map((r) => r.hour);
    expect(hours).toContain(8);
    expect(hours).toContain(9);

    // Check avgTransitTime for each hour
    const hour8 = result?.find((r) => r.hour === 8);
    const hour9 = result?.find((r) => r.hour === 9);

    expect(hour8?.avgTransitTime).toBe(600); // 10min in seconds
    expect(hour9?.avgTransitTime).toBe(600); // 10min in seconds
  });

  it("returns empty array if no valid transits", async () => {
    const parent: StatsCache = {
      corridorTransits: [],
      inputs,
    };

    let result: CorridorTransitTimeStatsType[] | null = null;
    if (typeof getTransitTimeStats === "function") {
      result = (await getTransitTimeStats(
        parent as Partial<CorridorStatsType>,
        {},
        {} as RequestContext,
        {} as GraphQLResolveInfo,
      )) as CorridorTransitTimeStatsType[];
    }
    expect(result).toEqual([]);
  });

  it("ignores transits with missing departure times", async () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: null,
          expected_departure_time: new Date("2025-09-01T08:00:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: null,
          expected_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
    ];

    const parent: StatsCache = {
      corridorTransits,
      inputs,
    };

    let result: CorridorTransitTimeStatsType[] | null = null;
    if (typeof getTransitTimeStats === "function") {
      result = (await getTransitTimeStats(
        parent as Partial<CorridorStatsType>,
        {},
        {} as RequestContext,
        {} as GraphQLResolveInfo,
      )) as CorridorTransitTimeStatsType[];
    }
    expect(result).toEqual([]);
  });
});

describe("getTransitStatsHistogram", () => {
  it("returns histogram bins for transit times", () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-01T08:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:05:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:15:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-01T09:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T09:05:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-01T09:10:00.000Z"),
          expected_departure_time: new Date("2025-09-01T09:15:00.000Z"),
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          vehiclejourney_id: 2,
          group_id: "G2",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
      // This transit has a different duration (e.g. 20 minutes)
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: new Date("2025-09-01T10:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T10:05:00.000Z"),
          operator_noc: "OP3",
          service_code: "SC3",
          line_name: "Line 3",
          vehiclejourney_id: 3,
          group_id: "G3",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: new Date("2025-09-01T10:20:00.000Z"),
          expected_departure_time: new Date("2025-09-01T10:25:00.000Z"),
          operator_noc: "OP3",
          service_code: "SC3",
          line_name: "Line 3",
          vehiclejourney_id: 3,
          group_id: "G3",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
    ];

    const parent: StatsCache = {
      corridorTransits,
      inputs,
    };

    const result: CorridorStatsHistogramType[] =
      typeof getTransitStatsHistogram === "function"
        ? (getTransitStatsHistogram(
            parent as Partial<CorridorStatsType>,
            {},
            {} as RequestContext,
            {} as GraphQLResolveInfo,
          ) as CorridorStatsHistogramType[])
        : [];

    expect(result.length).toBe(1);
    expect(result[0].hist.length).toBeGreaterThan(0);

    // Check that bins and frequencies are correct
    // First two transits: 10 minutes each (600 seconds, so 10 minutes bin)
    // Third transit: 20 minutes (1200 seconds, so 20 minutes bin)
    const bins = result[0].hist.map((h) => h.bin);
    expect(bins).toContain(10);
    expect(bins).toContain(20);

    const freq10 = result[0].hist.find((h) => h.bin === 10)?.freq;
    const freq20 = result[0].hist.find((h) => h.bin === 20)?.freq;
    expect(freq10).toBe(2);
    expect(freq20).toBe(1);
  });

  it("returns empty histogram if no valid transits", () => {
    const parent: StatsCache = {
      corridorTransits: [],
      inputs,
    };

    const result: CorridorStatsHistogramType[] =
      typeof getTransitStatsHistogram === "function"
        ? (getTransitStatsHistogram(
            parent as Partial<CorridorStatsType>,
            {},
            {} as RequestContext,
            {} as GraphQLResolveInfo,
          ) as CorridorStatsHistogramType[])
        : [];

    expect(result.length).toBe(1);
    expect(result[0].hist).toEqual([]);
  });

  it("ignores transits with missing departure times", () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          atco_code: "101",
          stop_index: 0,
          actual_departure_time: null,
          expected_departure_time: new Date("2025-09-01T08:00:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
        {
          atco_code: "102",
          stop_index: 1,
          actual_departure_time: null,
          expected_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          vehiclejourney_id: 1,
          group_id: "G1",
          date_of_journey: new Date("2025-09-01"),
          timestamp_after_estimate: null,
        },
      ],
    ];

    const parent: StatsCache = {
      corridorTransits,
      inputs,
    };

    const result: CorridorStatsHistogramType[] =
      typeof getTransitStatsHistogram === "function"
        ? (getTransitStatsHistogram(
            parent as Partial<CorridorStatsType>,
            {},
            {} as RequestContext,
            {} as GraphQLResolveInfo,
          ) as CorridorStatsHistogramType[])
        : [];

    expect(result.length).toBe(1);
    expect(result[0].hist).toEqual([]);
  });
});

describe("getServiceLinks", () => {
  const dummyDialect: Dialect = {
    createDriver: () => new DummyDriver(),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createAdapter: () => new PostgresAdapter(),
    createIntrospector: (db) => new PostgresIntrospector(db),
  };

  const dummyKysely = new Kysely<DB>({
    dialect: dummyDialect,
  });

  let mockDb: DeepMockProxy<PrismaClient>;
  let context: RequestContext;

  const stopsResult = [
    {
      corridor_index: 0,
      atco_code: "A",
      latitude: 51.5,
      longitude: -0.1,
    },
    {
      corridor_index: 1,
      atco_code: "B",
      latitude: 51.6,
      longitude: -0.2,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = mockDeep<PrismaClient>();
    context = {
      res: createResponse(),
      req: createRequest(),
      headers: {},
      db: mockDb,
      kysely: dummyKysely,
    };

    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue(stopsResult as never);
  });

  it("returns valid service links when tracks exist", async () => {
    // Mock getTracksData to return a valid track
    jest.spyOn(commonLib, "getTracksData").mockResolvedValueOnce([
      {
        from_atco_code: "A",
        to_atco_code: "B",
        geometry: JSON.stringify({
          type: "LineString",
          coordinates: [
            [-0.1, 51.5],
            [-0.2, 51.6],
          ],
        }),
        distance: 1234,
      },
    ] as never);

    const parent: StatsCache = {
      corridorTransits: [],
      inputs,
    };

    const result =
      typeof getServiceLinks === "function"
        ? await getServiceLinks(
            parent as Partial<CorridorStatsType>,
            {},
            context,
            {} as GraphQLResolveInfo,
          )
        : [];

    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      fromStop: "A",
      toStop: "B",
      distance: 1234,
      routeValidity: RouteType.Valid,
      linkRoute: JSON.stringify([
        [-0.1, 51.5],
        [-0.2, 51.6],
      ]),
    });
    expect(commonLib.getTracksData).toHaveBeenCalledTimes(1);
    expect(commonLib.getTracksData).toHaveBeenCalledWith(["A", "B"], {});
  });

  it("returns invalid service link when no track exists", async () => {
    // Mock getTracksData to return no tracks
    jest.spyOn(commonLib, "getTracksData").mockResolvedValueOnce([]);

    const parent: StatsCache = {
      corridorTransits: [],
      inputs,
    };

    const result =
      typeof getServiceLinks === "function"
        ? ((await getServiceLinks(
            parent as Partial<CorridorStatsType>,
            {},
            context,
            {} as GraphQLResolveInfo,
          )) as ServiceLinkType[])
        : [];

    expect(result.length).toBe(1);
    expect(result[0].fromStop).toBe("A");
    expect(result[0].toStop).toBe("B");
    expect(result[0].routeValidity).toBe(RouteType.InvalidNoRoutePoints);
    expect(result[0].distance).toBeGreaterThan(0);
    expect(JSON.parse(result[0].linkRoute ?? "")).toEqual([
      [-0.1, 51.5],
      [-0.2, 51.6],
    ]);
  });

  it("returns empty array when no stops found", async () => {
    jest.spyOn(commonLib, "getTracksData").mockResolvedValueOnce([]);
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([] as never);

    const parent: StatsCache = {
      corridorTransits: [],
      inputs,
    };

    const result =
      typeof getServiceLinks === "function"
        ? await getServiceLinks(
            parent as Partial<CorridorStatsType>,
            {},
            context,
            {} as GraphQLResolveInfo,
          )
        : [];

    expect(result).toEqual([]);
  });
});

describe("getTransitStatsPerService", () => {
  let mockDb: DeepMockProxy<PrismaClient>;
  let context: RequestContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = mockDeep<PrismaClient>();
    context = {
      req: createRequest(),
      res: createResponse(),
      headers: {},
      db: mockDb,
      kysely: {} as never,
    };
  });

  it("returns stats per service with correct mapping", async () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          actual_departure_time: new Date("2025-09-01T08:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:05:00.000Z"),
        },
        {
          operator_noc: "OP1",
          service_code: "SC1",
          line_name: "Line 1",
          actual_departure_time: new Date("2025-09-01T08:10:00.000Z"),
          expected_departure_time: new Date("2025-09-01T08:15:00.000Z"),
        },
      ],
      [
        {
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          actual_departure_time: new Date("2025-09-01T09:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T09:05:00.000Z"),
        },
        {
          operator_noc: "OP2",
          service_code: "SC2",
          line_name: "Line 2",
          actual_departure_time: new Date("2025-09-01T09:10:00.000Z"),
          expected_departure_time: new Date("2025-09-01T09:15:00.000Z"),
        },
      ],
    ] as TimetableType[][];

    const parent: StatsCache = {
      corridorTransits,
      inputs: {
        matchType: MatchType.Estimated,
        corridorId: "test-corridor",
        fromTimestamp: "2025-09-01T00:00:00.000Z",
        toTimestamp: "2025-09-02T00:00:00.000Z",
        granularity: CorridorGranularity.Hour,
        stopList: ["101", "102"],
      },
    };

    mockDb.service_details.findMany.mockResolvedValue([
      {
        noc_and_line_and_servicecode: "OP1-Line 1-SC1",
        line_name: "Line 1",
        operator_noc: "OP1",
        service_name: "Service 1",
        operator: { name: "Operator One" },
      },
      {
        noc_and_line_and_servicecode: "OP2-Line 2-SC2",
        line_name: "Line 2",
        operator_noc: "OP2",
        service_name: "Service 2",
        operator: { name: "Operator Two" },
      },
    ] as never);

    let result: Partial<CorridorStatsPerServiceType>[] | null = null;
    if (typeof getTransitStatsPerService === "function") {
      result = (await getTransitStatsPerService(
        parent as Partial<CorridorStatsType>,
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<CorridorStatsPerServiceType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      lineName: "Line 1",
      operatorName: "Operator One",
      noc: "OP1",
      servicePatternName: "Service 1",
      recordedTransits: 1,
      totalTransitTime: 600,
      scheduledTransits: 1,
    });

    expect(result?.[1]).toEqual({
      lineName: "Line 2",
      operatorName: "Operator Two",
      noc: "OP2",
      servicePatternName: "Service 2",
      recordedTransits: 1,
      totalTransitTime: 600,
      scheduledTransits: 1,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.service_details.findMany).toHaveBeenCalledWith({
      where: {
        noc_and_line_and_servicecode: {
          in: ["OP1-Line 1-SC1", "OP2-Line 2-SC2"],
        },
      },
      include: {
        operator: true,
      },
    });
  });

  it("returns empty array when no transit stats", async () => {
    const parent: StatsCache = {
      corridorTransits: [],
      inputs: {} as CorridorStatsInputType,
    };

    let result: Partial<CorridorStatsPerServiceType>[] | null = null;
    if (typeof getTransitStatsPerService === "function") {
      result = (await getTransitStatsPerService(
        parent as Partial<CorridorStatsType>,
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<CorridorStatsPerServiceType>[];
    }

    expect(result).toEqual([]);
  });

  it("returns stats with default values when service details missing", async () => {
    const corridorTransits: TimetableType[][] = [
      [
        {
          operator_noc: "OP3",
          service_code: "SC3",
          line_name: "Line 3",
          actual_departure_time: new Date("2025-09-01T10:00:00.000Z"),
          expected_departure_time: new Date("2025-09-01T10:05:00.000Z"),
        },
        {
          operator_noc: "OP3",
          service_code: "SC3",
          line_name: "Line 3",
          actual_departure_time: new Date("2025-09-01T10:20:00.000Z"),
          expected_departure_time: new Date("2025-09-01T10:25:00.000Z"),
        },
      ],
    ] as TimetableType[][];

    const parent: StatsCache = {
      corridorTransits,
      inputs: {} as CorridorStatsInputType,
    };

    mockDb.service_details.findMany.mockResolvedValue([] as never);

    let result: Partial<CorridorStatsPerServiceType>[] | null = null;
    if (typeof getTransitStatsPerService === "function") {
      result = (await getTransitStatsPerService(
        parent as Partial<CorridorStatsType>,
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<CorridorStatsPerServiceType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(1);

    expect(result?.[0]).toEqual({
      lineName: "",
      operatorName: "NA",
      noc: undefined,
      servicePatternName: "",
      recordedTransits: 1,
      totalTransitTime: 1200,
      scheduledTransits: 1,
    });
  });
});
