import { kyselyFilterForAdminIds } from "../../../src/resolvers/otpFunctions";
import { sql } from "kysely";
import { jest } from "@jest/globals";
import {
  Dialect,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { DB } from "../../../src/kysely";

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
    const result = kyselyFilterForAdminIds(mockQuery as any, adminAreaIds);

    const compiledQuery = result.compile();

    expect(compiledQuery.sql).toContain(
      "admin_areas && ARRAY[$1, $2, $3]::int4[]",
    );
    expect(compiledQuery.parameters).toEqual(["1", "2", "3"]);
  });

  it("returns original query when adminAreaIds is empty", () => {
    const mockQuery = dummyKysely.selectFrom("timetable_summary_operator_t");

    const adminAreaIds: string[] = [];
    const result = kyselyFilterForAdminIds(mockQuery as any, adminAreaIds);

    const compiledQuery = result.compile();
    expect(compiledQuery.sql).not.toContain("admin_areas");
    expect(compiledQuery.parameters).toEqual([]);
  });
});
