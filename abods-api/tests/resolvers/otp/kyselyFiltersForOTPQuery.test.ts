import { getKyselyFiltersForOTPQuery } from "../../../src/resolvers/otpFunctions";
import {
  Dialect,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { DB } from "../../../src/kysely";
import { MatchType, Granularity } from "../../../src/types/generated";

const dummyDialect: Dialect = {
  createDriver: () => new DummyDriver(),
  createQueryCompiler: () => new PostgresQueryCompiler(),
  createAdapter: () => new PostgresAdapter(),
  createIntrospector: (db) => new PostgresIntrospector(db),
};

const dummyKysely = new Kysely<DB>({
  dialect: dummyDialect,
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
