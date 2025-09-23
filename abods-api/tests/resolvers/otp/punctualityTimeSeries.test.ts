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
  OnTimePerformanceTypePunctualityTimeSeriesArgs,
  PunctualityTimeSeriesType,
  RequireFields,
  Granularity,
} from "../../../src/types/generated";
import { DB } from "../../../src/kysely";
import { getPunctualityTimeSeries } from "../../../src/resolvers/otpFunctions";
import * as kysely from "../../../src/lib/kysely";
import { jest } from "@jest/globals";
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
  jest.spyOn(kysely, "executeQuery").mockResolvedValue([
    {
      date_of_journey: "2025-09-11",
      early_count: 1,
      late_count: 2,
      on_time_count: 3,
    },
    {
      date_of_journey: "2025-09-12",
      early_count: 4,
      late_count: 5,
      on_time_count: 6,
    },
    {
      date_of_journey: "2025-09-13",
      early_count: 7,
      late_count: 0,
      on_time_count: 0,
    },
  ]);
});

describe("getPunctualityTimeSeries", () => {
  it("returns correct time series stats for day granularity", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-14T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          granularity: Granularity.Day,
        },
      },
    };
    const context = { kysely: dummyKysely };

    let result: Partial<PunctualityTimeSeriesType>[] | null = null;
    if (typeof getPunctualityTimeSeries === "function") {
      result = (await getPunctualityTimeSeries(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<PunctualityTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(3);

    expect(result?.[0]).toEqual({
      ts: dayjs("2025-09-11")
        .tz("Europe/London")
        .format("YYYY-MM-DDTHH:mm:ssZ"),
      early: 1,
      late: 2,
      onTime: 3,
    });
    expect(result?.[1]).toEqual({
      ts: dayjs("2025-09-12")
        .tz("Europe/London")
        .format("YYYY-MM-DDTHH:mm:ssZ"),
      early: 4,
      late: 5,
      onTime: 6,
    });
    expect(result?.[2]).toEqual({
      ts: dayjs("2025-09-13")
        .tz("Europe/London")
        .format("YYYY-MM-DDTHH:mm:ssZ"),
      early: 7,
      late: 0,
      onTime: 0,
    });
  });

  it("returns correct time series stats for hour granularity", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([
      {
        departure_hour: "2025-09-11T08:00:00.000Z",
        early_count: 2,
        late_count: 1,
        on_time_count: 5,
      },
      {
        departure_hour: "2025-09-11T09:00:00.000Z",
        early_count: 0,
        late_count: 3,
        on_time_count: 2,
      },
    ]);
    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeSeriesArgs,
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

    let result: Partial<PunctualityTimeSeriesType>[] | null = null;
    if (typeof getPunctualityTimeSeries === "function") {
      result = (await getPunctualityTimeSeries(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<PunctualityTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      ts: dayjs("2025-09-11T08:00:00.000Z").format("YYYY-MM-DDTHH:mm:ssZ"),
      early: 2,
      late: 1,
      onTime: 5,
    });
    expect(result?.[1]).toEqual({
      ts: dayjs("2025-09-11T09:00:00.000Z").format("YYYY-MM-DDTHH:mm:ssZ"),
      early: 0,
      late: 3,
      onTime: 2,
    });
  });

  it("returns correct time series stats during GMT", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([
      {
        departure_hour: "2025-02-11T08:00:00.000Z",
        early_count: 2,
        late_count: 1,
        on_time_count: 5,
      },
      {
        departure_hour: "2025-02-11T09:00:00.000Z",
        early_count: 0,
        late_count: 3,
        on_time_count: 2,
      },
    ]);
    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-02-11T00:00:00.000+01:00",
        toTimestamp: "2025-02-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          granularity: Granularity.Hour,
        },
      },
    };
    const context = { kysely: dummyKysely };

    let result: Partial<PunctualityTimeSeriesType>[] | null = null;
    if (typeof getPunctualityTimeSeries === "function") {
      result = (await getPunctualityTimeSeries(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<PunctualityTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      ts: "2025-02-11T08:00:00+00:00",
      early: 2,
      late: 1,
      onTime: 5,
    });
    expect(result?.[1]).toEqual({
      ts: "2025-02-11T09:00:00+00:00",
      early: 0,
      late: 3,
      onTime: 2,
    });
  });

  it("returns sorted time series", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([
      {
        date_of_journey: "2025-09-13",
        early_count: 7,
        late_count: 0,
        on_time_count: 0,
      },
      {
        date_of_journey: "2025-09-11",
        early_count: 1,
        late_count: 2,
        on_time_count: 3,
      },
      {
        date_of_journey: "2025-09-12",
        early_count: 4,
        late_count: 5,
        on_time_count: 6,
      },
    ]);
    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-14T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          granularity: Granularity.Day,
        },
      },
    };
    const context = { kysely: dummyKysely };

    let result: Partial<PunctualityTimeSeriesType>[] | null = null;
    if (typeof getPunctualityTimeSeries === "function") {
      result = (await getPunctualityTimeSeries(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<PunctualityTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(3);

    // Expect sorted by date: 2025-09-11, 2025-09-12, 2025-09-13
    expect(dayjs(result?.[0].ts).isSame(dayjs("2025-09-11"))).toBe(true);
    expect(dayjs(result?.[1].ts).isSame(dayjs("2025-09-12"))).toBe(true);
    expect(dayjs(result?.[2].ts).isSame(dayjs("2025-09-13"))).toBe(true);
  });

  it("returns sorted by hour", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([
      {
        departure_hour: "2025-09-11T08:00:00.000Z",
        early_count: 7,
        late_count: 0,
        on_time_count: 0,
      },
      {
        departure_hour: "2025-09-11T05:00:00.000Z",
        early_count: 1,
        late_count: 2,
        on_time_count: 3,
      },
      {
        departure_hour: "2025-09-11T15:00:00.000Z",
        early_count: 4,
        late_count: 5,
        on_time_count: 6,
      },
    ]);
    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-14T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          granularity: Granularity.Hour,
        },
      },
    };
    const context = { kysely: dummyKysely };

    let result: Partial<PunctualityTimeSeriesType>[] | null = null;
    if (typeof getPunctualityTimeSeries === "function") {
      result = (await getPunctualityTimeSeries(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<PunctualityTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(3);

    expect(dayjs(result?.[0].ts).isSame(dayjs("2025-09-11").hour(6))).toBe(
      true,
    );
    expect(dayjs(result?.[1].ts).isSame(dayjs("2025-09-11").hour(9))).toBe(
      true,
    );
    expect(dayjs(result?.[2].ts).isSame(dayjs("2025-09-11").hour(16))).toBe(
      true,
    );
  });

  it("returns null when user does not have access to operator", async () => {
    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-14T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP2"],
          granularity: Granularity.Day,
        },
      },
    };
    const context = { kysely: dummyKysely };

    let result: Partial<PunctualityTimeSeriesType>[] | null = null;
    if (typeof getPunctualityTimeSeries === "function") {
      result = (await getPunctualityTimeSeries(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<PunctualityTimeSeriesType>[];
    }

    expect(result).toBeNull();
  });

  it("returns empty array when no stats are present", async () => {
    jest.spyOn(kysely, "executeQuery").mockResolvedValue([]);

    const args: RequireFields<
      OnTimePerformanceTypePunctualityTimeSeriesArgs,
      "inputs"
    > = {
      inputs: {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-14T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          granularity: Granularity.Day,
        },
      },
    };
    const context = { kysely: dummyKysely };

    let result: Partial<PunctualityTimeSeriesType>[] | null = null;
    if (typeof getPunctualityTimeSeries === "function") {
      result = (await getPunctualityTimeSeries(
        {},
        args,
        context as any,
        {} as any,
      )) as Partial<PunctualityTimeSeriesType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });
});
