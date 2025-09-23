import { getHeadwayTimeSeries } from "../../../src/resolvers/otpFunctions";
import { jest } from "@jest/globals";
import * as kysely from "../../../src/lib/kysely";
import {
  HeadwayTimeSeriesType,
  RequireFields,
  HeadwayInputType,
  Granularity,
  HeadwayMetricsTypeHeadwayTimeSeriesArgs,
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
});

describe("getHeadwayTimeSeries", () => {
  it("returns correct headway time series stats", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([
      {
        departure_hour: "2025-09-11T08:00:00.000Z",
        actual_headway: 6,
        expected_headway: 5,
        excess_wait_time: 2,
        headway_stops_count: 2,
      },
      {
        departure_hour: "2025-09-11T09:00:00.000Z",
        actual_headway: 8,
        expected_headway: 7,
        excess_wait_time: 3,
        headway_stops_count: 4,
      },
    ]);

    const args: RequireFields<
      HeadwayMetricsTypeHeadwayTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          granularity: Granularity.Hour,
        },
      },
    };
    const context = { kysely: dummyKysely };

    let result: Partial<HeadwayTimeSeriesType>[] | null = null;
    if (typeof getHeadwayTimeSeries === "function") {
      result = (await getHeadwayTimeSeries(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<HeadwayTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      ts: new Date("2025-09-11T08:00:00.000Z"),
      actual: 6,
      scheduled: 5,
      excess: 2,
    });
    expect(result?.[1]).toEqual({
      ts: new Date("2025-09-11T09:00:00.000Z"),
      actual: 8,
      scheduled: 7,
      excess: 3,
    });
  });

  it("includes startTime and endTime filters in the query", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([
      {
        departure_hour: "2025-09-11T08:00:00.000Z",
        actual_headway: 6,
        expected_headway: 5,
        excess_wait_time: 2,
        headway_stops_count: 2,
      },
    ]);

    const args: RequireFields<
      HeadwayMetricsTypeHeadwayTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          startTime: "08:00",
          endTime: "18:00",
          granularity: Granularity.Hour,
        },
      },
    };
    const context = { kysely: dummyKysely };

    let result: Partial<HeadwayTimeSeriesType>[] | null = null;
    if (typeof getHeadwayTimeSeries === "function") {
      result = (await getHeadwayTimeSeries(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<HeadwayTimeSeriesType>[];
    }

    const queryArg = (kysely.executeQuery as jest.Mock).mock.calls[0][0];
    const compiled = (queryArg as SelectQueryBuilder<DB, any, any>).compile();
    expect(compiled.sql).toContain("hour");
    expect(compiled.parameters).toContain(8);
    expect(compiled.parameters).toContain(18);
  });

  it("returns sorted headway time series by ts", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([
      {
        departure_hour: "2025-09-11T15:00:00.000Z",
        actual_headway: 4,
        expected_headway: 3,
        excess_wait_time: 1,
        headway_stops_count: 1,
      },
      {
        departure_hour: "2025-09-11T08:00:00.000Z",
        actual_headway: 6,
        expected_headway: 5,
        excess_wait_time: 2,
        headway_stops_count: 2,
      },
      {
        departure_hour: "2025-09-11T09:00:00.000Z",
        actual_headway: 8,
        expected_headway: 7,
        excess_wait_time: 3,
        headway_stops_count: 4,
      },
    ]);

    const args: RequireFields<
      HeadwayMetricsTypeHeadwayTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          granularity: Granularity.Hour,
        },
      },
    };
    const context = { kysely: dummyKysely };

    let result: Partial<HeadwayTimeSeriesType>[] | null = null;
    if (typeof getHeadwayTimeSeries === "function") {
      result = (await getHeadwayTimeSeries(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<HeadwayTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(3);

    // Sorted by ts: 08:00, 09:00, 15:00
    expect(
      dayjs(result?.[0].ts).isSame(dayjs("2025-09-11T08:00:00.000Z")),
    ).toBe(true);
    expect(
      dayjs(result?.[1].ts).isSame(dayjs("2025-09-11T09:00:00.000Z")),
    ).toBe(true);
    expect(
      dayjs(result?.[2].ts).isSame(dayjs("2025-09-11T15:00:00.000Z")),
    ).toBe(true);
  });

  //   it("verifies ts value is correct during British Winter (GMT)", async () => {
  //     jest.spyOn(kysely, "executeQuery").mockResolvedValue([
  //       {
  //         departure_hour: "2025-02-11T08:00:00.000Z",
  //         actual_headway: 6,
  //         expected_headway: 5,
  //         excess_wait_time: 2,
  //         headway_stops_count: 2,
  //       },
  //       {
  //         departure_hour: "2025-02-11T09:00:00.000Z",
  //         actual_headway: 8,
  //         expected_headway: 7,
  //         excess_wait_time: 3,
  //         headway_stops_count: 4,
  //       },
  //     ]);

  //     const args: RequireFields<HeadwayMetricsTypeHeadwayTimeSeriesArgs, "inputs"> = {
  //       inputs: {
  //         fromTimestamp: "2025-02-11T00:00:00.000+01:00",
  //         toTimestamp: "2025-02-12T00:00:00.000+01:00",
  //         filters: {
  //           operatorIds: ["OP1"],
  //           granularity: Granularity.Hour,
  //         },
  //       },
  //     };
  //     const context = { kysely: dummyKysely };

  //     let result: Partial<HeadwayTimeSeriesType>[] | null = null;
  //     if (typeof getHeadwayTimeSeries === "function") {
  //       result = await getHeadwayTimeSeries({}, args, context as any, {} as any) as Partial<HeadwayTimeSeriesType>[];
  //     }

  //     expect(result).not.toBeNull();
  //     expect(result?.length).toBe(2);

  //     // ts should be +00:00 for GMT
  //     expect(dayjs(result?.[0].ts).tz("Europe/London").format("YYYY-MM-DDTHH:mm:ssZ")).toBe("2025-02-11T08:00:00+00:00");
  //     expect(dayjs(result?.[1].ts).tz("Europe/London").format("YYYY-MM-DDTHH:mm:ssZ")).toBe("2025-02-11T09:00:00+00:00");
  //   });
});
