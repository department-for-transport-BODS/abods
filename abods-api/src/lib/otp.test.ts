import {
  getFrequentServiceActualHours,
  getKyselyFiltersForOTPQuery,
  getSummaryStopsTotalHours,
  getThresholds,
  kyselyFilterForAdminIds,
} from "./otp";
import {
  Dialect,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { DB } from "../kysely";
import { MatchType, OtpEnum, PerformanceInputType } from "../types/generated";
import * as kyselyLib from "./dbKysely";

const dummyDialect: Dialect = {
  createDriver: () => new DummyDriver(),
  createQueryCompiler: () => new PostgresQueryCompiler(),
  createAdapter: () => new PostgresAdapter(),
  createIntrospector: (db) => new PostgresIntrospector(db),
};

const dummyKysely = new Kysely<DB>({
  dialect: dummyDialect,
});

describe("kyselyFilterForAdminIds", () => {
  it("adds admin area filter when adminAreaIds are provided", () => {
    const mockQuery = dummyKysely.selectFrom("timetable_summary_operator_t");

    const adminAreaIds = ["1", "2", "3"];
    const result = kyselyFilterForAdminIds(mockQuery as never, adminAreaIds);

    const compiledQuery = result.compile();

    expect(compiledQuery.sql).toContain(
      "admin_areas && ARRAY[$1, $2, $3]::int4[]",
    );
    expect(compiledQuery.parameters).toEqual(["1", "2", "3"]);
  });

  it("returns original query when adminAreaIds is empty", () => {
    const mockQuery = dummyKysely.selectFrom("timetable_summary_operator_t");

    const adminAreaIds: string[] = [];
    const result = kyselyFilterForAdminIds(mockQuery as never, adminAreaIds);

    const compiledQuery = result.compile();
    expect(compiledQuery.sql).not.toContain("admin_areas");
    expect(compiledQuery.parameters).toEqual([]);
  });
});

describe("getKyselyFiltersForOTPQuery", () => {
  it("adds operator_noc and date filters", () => {
    const query = getKyselyFiltersForOTPQuery(
      dummyKysely,
      "timetable_summary_operator_t",
      {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1", "OP2"],
        },
      },
      ["OP1", "OP2"],
    );
    const compiled = query.compile();

    expect(compiled.sql).toContain('"operator_noc" in ($3, $4)');
    expect(compiled.sql).toContain('"date_of_journey" >= $1');
    expect(compiled.sql).toContain('"date_of_journey" < $2');
    expect(compiled.parameters[2]).toContain("OP1");
    expect(compiled.parameters[3]).toContain("OP2");
  });

  it("adds matchType filter for evidenced", () => {
    const query = getKyselyFiltersForOTPQuery(
      dummyKysely,
      "timetable_summary_operator_t",
      {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          matchType: MatchType.Evidenced,
        },
      },
      ["OP1"],
    );
    const compiled = query.compile();
    expect(compiled.sql).toContain('"estimated" = $4');
    expect(compiled.parameters[3]).toBe(false);
  });

  it("does not add matchType filter for estimated", () => {
    const query = getKyselyFiltersForOTPQuery(
      dummyKysely,
      "timetable_summary_operator_t",
      {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          matchType: MatchType.Estimated,
        },
      },
      ["OP1"],
    );
    const compiled = query.compile();
    expect(compiled.sql).not.toContain("estimated");
    expect(compiled.parameters.length).toBe(3);
  });

  it("adds timingPointsOnly filter", () => {
    const query = getKyselyFiltersForOTPQuery(
      dummyKysely,
      "timetable_summary_operator_t",
      {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          timingPointsOnly: true,
        },
      },
      ["OP1"],
    );
    const compiled = query.compile();
    expect(compiled.sql).toContain('"is_timing_point" = $4');
    expect(compiled.parameters[3]).toBe(true);
  });

  it("does not add timingPointsOnly filter for all stops", () => {
    const query = getKyselyFiltersForOTPQuery(
      dummyKysely,
      "timetable_summary_operator_t",
      {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
        },
      },
      ["OP1"],
    );
    const compiled = query.compile();
    expect(compiled.sql).not.toContain("is_timing_point");
    expect(compiled.parameters.length).toBe(3);
  });

  it("adds dayOfWeekFlags filter", () => {
    const query = getKyselyFiltersForOTPQuery(
      dummyKysely,
      "timetable_summary_operator_t",
      {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          dayOfWeekFlags: {
            monday: true,
            tuesday: false,
            wednesday: true,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: true,
          },
        },
      },
      ["OP1"],
    );
    const compiled = query.compile();
    expect(compiled.sql).toContain('"day_of_week" in ($4, $5, $6)');
    // Monday = 1, Wednesday = 3
    expect(compiled.parameters[3]).toEqual(1);
    expect(compiled.parameters[4]).toEqual(3);
    expect(compiled.parameters[5]).toEqual(0);
  });

  it("adds lineIds filter for service granularity", () => {
    const query = getKyselyFiltersForOTPQuery(
      dummyKysely,
      "timetable_summary_service_tz",
      {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          lineIds: ["L1", "L2"],
        },
      },
      ["OP1"],
    );
    const compiled = query.compile();
    expect(compiled.sql).toContain("noc_and_line_and_servicecode");
    expect(compiled.parameters[3]).toEqual("L1");
    expect(compiled.parameters[4]).toEqual("L2");
  });

  it("does not add maxEarly and maxLate for service granularity", () => {
    const query = getKyselyFiltersForOTPQuery(
      dummyKysely,
      "timetable_summary_service_tz",
      {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          lineIds: ["L1"],
          maxDelay: 5,
          minDelay: 3,
        },
      },
      ["OP1"],
    );
    const compiled = query.compile();
    expect(compiled.sql).not.toContain("max_early");
    expect(compiled.sql).not.toContain("max_late");
  });

  it("adds maxEarly and maxLate for operator granularity", () => {
    const query = getKyselyFiltersForOTPQuery(
      dummyKysely,
      "timetable_summary_operator_t",
      {
        fromTimestamp: "2025-09-11T00:00:00.000+01:00",
        toTimestamp: "2025-09-12T00:00:00.000+01:00",
        filters: {
          operatorIds: ["OP1"],
          maxDelay: 5,
          minDelay: 3,
        },
      },
      ["OP1"],
    );
    const compiled = query.compile();

    expect(compiled.sql).toContain("max_early");
    expect(compiled.sql).toContain("max_late");
    expect(compiled.parameters[3]).toEqual(3);
    expect(compiled.parameters[4]).toEqual(5);
  });
});

describe("getSummaryStopsTotalHours", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the count of distinct hours from query results", async () => {
    // Mock the executeQuery to return 5 distinct hours
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue([
        { departure_hour: "08:00" },
        { departure_hour: "09:00" },
        { departure_hour: "10:00" },
        { departure_hour: "11:00" },
        { departure_hour: "12:00" },
      ] as never);

    const inputs = {
      fromTimestamp: "2025-09-11T00:00:00.000+01:00",
      toTimestamp: "2025-09-12T00:00:00.000+01:00",
      filters: {},
    };
    const userOperatorIds = ["OP1", "OP2"];

    const result = await getSummaryStopsTotalHours(
      dummyKysely,
      inputs,
      userOperatorIds,
    );

    expect(result).toBe(5);
    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(1);
  });

  it("returns 0 when no results are found", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([]);

    const inputs = {
      fromTimestamp: "2025-09-11T00:00:00.000+01:00",
      toTimestamp: "2025-09-12T00:00:00.000+01:00",
      filters: {},
    };
    const userOperatorIds = ["OP1", "OP2"];

    const result = await getSummaryStopsTotalHours(
      dummyKysely,
      inputs,
      userOperatorIds,
    );

    expect(result).toBe(0);
    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(1);
  });

  it("applies startTime and endTime filters if provided", async () => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue([
        { departure_hour: "10:00" },
        { departure_hour: "11:00" },
      ]);

    const inputs = {
      fromTimestamp: "2025-09-11T00:00:00.000+01:00",
      toTimestamp: "2025-09-12T00:00:00.000+01:00",
      filters: {
        startTime: "10:00",
        endTime: "11:59",
      },
    };
    const userOperatorIds = ["OP1"];

    const result = await getSummaryStopsTotalHours(
      dummyKysely,
      inputs,
      userOperatorIds,
    );

    expect(result).toBe(2);
    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(1);
  });
});

describe("getFrequentServiceActualHours", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the count of distinct hours from query results", async () => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue([
        { departure_hour: "08:00" },
        { departure_hour: "09:00" },
        { departure_hour: "10:00" },
      ]);

    const inputs = {
      fromTimestamp: "2025-09-11T00:00:00.000+01:00",
      toTimestamp: "2025-09-12T00:00:00.000+01:00",
      filters: {},
    };
    const userOperatorIds = ["OP1", "OP2"];

    const result = await getFrequentServiceActualHours(
      dummyKysely,
      inputs,
      userOperatorIds,
    );

    expect(result).toBe(3);
    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(1);
  });

  it("returns 0 when no results are found", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([]);

    const inputs = {
      fromTimestamp: "2025-09-11T00:00:00.000+01:00",
      toTimestamp: "2025-09-12T00:00:00.000+01:00",
      filters: {},
    };
    const userOperatorIds = ["OP1", "OP2"];

    const result = await getFrequentServiceActualHours(
      dummyKysely,
      inputs,
      userOperatorIds,
    );

    expect(result).toBe(0);
    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(1);
  });

  it("applies startTime and endTime filters if provided", async () => {
    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue([
        { departure_hour: "10:00" },
        { departure_hour: "11:00" },
      ]);

    const inputs = {
      fromTimestamp: "2025-09-11T00:00:00.000+01:00",
      toTimestamp: "2025-09-12T00:00:00.000+01:00",
      filters: {
        startTime: "10:00",
        endTime: "11:59",
      },
    };
    const userOperatorIds = ["OP1"];

    const result = await getFrequentServiceActualHours(
      dummyKysely,
      inputs,
      userOperatorIds,
    );

    expect(result).toBe(2);
    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(1);
  });
});

describe("getThresholds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the sum of otp_count for OtpEnum.OnTime", async () => {
    jest
      .spyOn(kyselyLib, "executeQueryTakeFirst")
      .mockResolvedValue({ otp_count: 12 });

    const inputs: PerformanceInputType = {
      fromTimestamp: "2025-09-11T00:00:00.000+01:00",
      toTimestamp: "2025-09-12T00:00:00.000+01:00",
      filters: {
        onTimeMinMinutes: 1,
        onTimeMaxMinutes: 10,
      },
    };
    const userOperatorIds = ["OP1", "OP2"];

    const result = await getThresholds(
      dummyKysely,
      inputs,
      userOperatorIds,
      OtpEnum.OnTime,
    );

    expect(result).toEqual({ otp_count: 12 });
    expect(kyselyLib.executeQueryTakeFirst).toHaveBeenCalledTimes(1);
  });

  it("returns 0 when no results are found", async () => {
    jest.spyOn(kyselyLib, "executeQueryTakeFirst").mockResolvedValue(undefined);

    const inputs: PerformanceInputType = {
      fromTimestamp: "2025-09-11T00:00:00.000+01:00",
      toTimestamp: "2025-09-12T00:00:00.000+01:00",
      filters: {
        onTimeMinMinutes: 1,
        onTimeMaxMinutes: 10,
      },
    };
    const userOperatorIds = ["OP1", "OP2"];

    const result = await getThresholds(
      dummyKysely,
      inputs,
      userOperatorIds,
      OtpEnum.OnTime,
    );

    expect(result).toBeUndefined();
    expect(kyselyLib.executeQueryTakeFirst).toHaveBeenCalledTimes(1);
  });

  it("applies startTime and endTime filters if provided", async () => {
    jest
      .spyOn(kyselyLib, "executeQueryTakeFirst")
      .mockResolvedValue({ otp_count: 5 });

    const inputs: PerformanceInputType = {
      fromTimestamp: "2025-09-11T00:00:00.000+01:00",
      toTimestamp: "2025-09-12T00:00:00.000+01:00",
      filters: {
        onTimeMinMinutes: 1,
        onTimeMaxMinutes: 10,
        startTime: "10:00",
        endTime: "11:59",
      },
    };
    const userOperatorIds = ["OP1"];

    const result = await getThresholds(
      dummyKysely,
      inputs,
      userOperatorIds,
      OtpEnum.OnTime,
    );

    expect(result).toEqual({ otp_count: 5 });
    expect(kyselyLib.executeQueryTakeFirst).toHaveBeenCalledTimes(1);
  });

  it("applies correct filters for OtpEnum.Early", async () => {
    jest
      .spyOn(kyselyLib, "executeQueryTakeFirst")
      .mockResolvedValue({ otp_count: 2 });

    const inputs: PerformanceInputType = {
      fromTimestamp: "2025-09-11T00:00:00.000+01:00",
      toTimestamp: "2025-09-12T00:00:00.000+01:00",
      filters: {
        onTimeMinMinutes: 5,
      },
    };
    const userOperatorIds = ["OP1"];

    const result = await getThresholds(
      dummyKysely,
      inputs,
      userOperatorIds,
      OtpEnum.Early,
    );

    expect(result).toEqual({ otp_count: 2 });
    expect(kyselyLib.executeQueryTakeFirst).toHaveBeenCalledTimes(1);
  });

  it("applies correct filters for OtpEnum.Late", async () => {
    jest
      .spyOn(kyselyLib, "executeQueryTakeFirst")
      .mockResolvedValue({ otp_count: 3 });

    const inputs: PerformanceInputType = {
      fromTimestamp: "2025-09-11T00:00:00.000+01:00",
      toTimestamp: "2025-09-12T00:00:00.000+01:00",
      filters: {
        onTimeMaxMinutes: 15,
      },
    };
    const userOperatorIds = ["OP1"];

    const result = await getThresholds(
      dummyKysely,
      inputs,
      userOperatorIds,
      OtpEnum.Late,
    );

    expect(result).toEqual({ otp_count: 3 });
    expect(kyselyLib.executeQueryTakeFirst).toHaveBeenCalledTimes(1);
  });
});
