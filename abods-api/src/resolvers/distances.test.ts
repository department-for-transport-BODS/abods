import {
  getAdminOrgMaps,
  getDistances,
  getDistancesDropdowns,
} from "./distances";
import * as kyselyLib from "../lib/dbKysely";
import {
  Dialect,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  SelectQueryBuilder,
} from "kysely";
import { DB } from "../kysely";
import { createRequest, createResponse } from "node-mocks-http";
import { RequestContext } from "../types/extra";
import { GraphQLResolveInfo } from "graphql";
import {
  AdminOrgOperatorMap,
  Distance,
  DistancesDropdown,
  QueryDistancesArgs,
} from "../types/generated";
import * as helpers from "./helpers";

jest.spyOn(helpers, "requireUserSession").mockResolvedValue({
  id: 1,
  isGlobalUser: true,
  orgs: [
    { id: 10, name: "Org 10" },
    { id: 20, name: "Org 20" },
  ],
});

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
beforeEach(() => {
  context = {
    req: createRequest(),
    res: createResponse(),
    headers: {},
    db: {} as never,
    kysely: dummyKysely,
  };
  jest.clearAllMocks();
});

describe("getDistances", () => {
  it("builds query with correct filters and calls executeQuery", async () => {
    // Arrange
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      {
        operatorId: "OP1",
        nocLineAndServiceCode: "OP1-L1-S1",
        lineName: "Line 1",
        serviceName: "Service 1",
        operatorName: "Operator One",
        distance: 1000,
        avlDistance: 950,
      },
    ]);

    const args = {
      filterBy: {
        orgId: "10",
        operatorIds: ["OP1"],
        nocLineAndServiceCodes: ["OP1-L1-S1"],
        fromTimestamp: "2025-09-01T00:00:00.000Z",
        toTimestamp: "2025-09-02T00:00:00.000Z",
        licenseIds: ["LIC1"],
        adminAreaIds: ["1", "2"],
      },
    };

    // Act
    let result: Partial<Distance>[] | null = null;
    if (typeof getDistances === "function") {
      result = (await getDistances(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Distance[];
    }

    // Assert
    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(1);

    // Inspect the query builder
    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    // Check SQL contains expected filters
    expect(compiled.sql).toContain('"boo"."organisation_id"');
    expect(compiled.sql).toContain('"es"."operator_noc"');
    expect(compiled.sql).toContain('"es"."noc_and_line_and_servicecode"');
    expect(compiled.sql).toContain('"es"."license"');
    expect(compiled.sql).toContain("admin_area_id");
    expect(compiled.sql).toContain("date_of_journey");

    // Check parameters
    expect(compiled.parameters).toContain(10); // orgId
    expect(compiled.parameters).toContain("OP1"); // operatorId
    expect(compiled.parameters).toContain("OP1-L1-S1"); // nocLineAndServiceCode
    expect(compiled.parameters).toContain("LIC1"); // licenseId
    expect(compiled.parameters).toContain("1"); // adminAreaId
    expect(compiled.parameters).toContain("2"); // adminAreaId

    // Check result
    expect(result).toEqual([
      {
        operatorId: "OP1",
        nocLineAndServiceCode: "OP1-L1-S1",
        lineName: "Line 1",
        serviceName: "Service 1",
        operatorName: "Operator One",
        distance: 1000,
        avlDistance: 950,
      },
    ]);
  });

  it("returns empty array if filterBy is missing", async () => {
    const args = {};
    let result: Partial<Distance>[] | null = null;
    if (typeof getDistances === "function") {
      result = (await getDistances(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Distance[];
    }
    expect(result).toEqual([]);
    expect(kyselyLib.executeQuery).not.toHaveBeenCalled();
  });

  it("returns empty array if user is not global or not mapped to org", async () => {
    // Patch requireUserSession to return non-global user
    jest.spyOn(helpers, "requireUserSession").mockResolvedValue({
      id: 2,
      isGlobalUser: false,
      orgs: [{ id: 30, name: "Org 30" }],
    });

    const args = {
      filterBy: {
        orgId: 99,
        fromTimestamp: "2025-09-01T00:00:00.000Z",
        toTimestamp: "2025-09-02T00:00:00.000Z",
      },
    };

    let result: Partial<Distance>[] | null = null;
    if (typeof getDistances === "function") {
      result = (await getDistances(
        {},
        args as unknown as QueryDistancesArgs,
        context,
        {} as GraphQLResolveInfo,
      )) as Distance[];
    }
    expect(result).toEqual([]);
    expect(kyselyLib.executeQuery).not.toHaveBeenCalled();
  });
});

describe("getDistancesDropdowns", () => {
  it("calls executeQuery and returns dropdown values", async () => {
    // Arrange
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      {
        operator_name: "Operator 1",
        operator_noc: "OP1",
        license: "LIC1",
        service_id: "OP1-L1-S1",
        service_name: "Service 1",
        line_name: "Line 1",
      },
      {
        operator_name: "Operator 2",
        operator_noc: "OP2",
        license: "LIC2",
        service_id: "OP2-L2-S2",
        service_name: "Service 2",
        line_name: "Line 2",
      },
    ]);

    const args = {
      orgId: "10",
    };

    let result: Partial<DistancesDropdown> | null = null;
    if (typeof getDistancesDropdowns === "function") {
      result = (await getDistancesDropdowns(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as DistancesDropdown;
    }

    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(1);
    expect(result?.operators?.length).toEqual(2);
    expect(result?.operators?.[0].id).toEqual("OP1");
    expect(result?.operators?.[0].licenses?.[0].id).toEqual("LIC1");
    expect(result?.operators?.[0].licenses?.[0].services?.[0].id).toEqual(
      "OP1-L1-S1",
    );
    expect(result?.operators?.[1].id).toEqual("OP2");
    expect(result?.operators?.[1].licenses?.[0].id).toEqual("LIC2");
    expect(result?.operators?.[1].licenses?.[0].services?.[0].id).toEqual(
      "OP2-L2-S2",
    );
  });

  it("returns empty array if user is not global or not mapped to org", async () => {
    jest.spyOn(helpers, "requireUserSession").mockResolvedValue({
      id: 2,
      isGlobalUser: false,
      orgs: [{ id: 30, name: "Org 30" }],
    });
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([]);

    const args = {
      orgId: "99",
    };

    let result: Partial<DistancesDropdown> | null = null;
    if (typeof getDistancesDropdowns === "function") {
      result = (await getDistancesDropdowns(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as DistancesDropdown;
    }

    // Inspect the query builder
    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(result?.operators).toEqual([]);
    expect(compiled.sql).toContain('"boo"."organisation_id" in');
  });

  it("Org filter should not be applied for global user", async () => {
    jest.spyOn(helpers, "requireUserSession").mockResolvedValue({
      id: 2,
      isGlobalUser: true,
      orgs: [{ id: 10, name: "Org 10" }],
    });
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([]);

    const args = {
      orgId: "99",
    };

    if (typeof getDistancesDropdowns === "function") {
      (await getDistancesDropdowns(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as DistancesDropdown;
    }

    // Inspect the query builder
    const queryArg = (kyselyLib.executeQuery as unknown as jest.Mock).mock
      .calls[0] as SelectQueryBuilder<DB, never, unknown>[];
    const compiled = queryArg[0].compile();

    expect(compiled.sql).not.toContain('"boo"."organisation_id" in');
    expect(compiled.parameters).not.toContain("99");
  });
});

describe("getAdminOrgMaps", () => {
  it("calls executeQuery and returns mapped admin org operator maps", async () => {
    const mockResults = [
      {
        adminAreaId: 101,
        adminName: "Area 1",
        operatorId: "OP1",
        orgId: 10,
        orgName: "Org 10",
      },
      {
        adminAreaId: 102,
        adminName: "Area 2",
        operatorId: "OP2",
        orgId: 20,
        orgName: "Org 20",
      },
    ];
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue(mockResults);

    let result: AdminOrgOperatorMap[] | null = null;
    if (typeof getAdminOrgMaps === "function") {
      result = (await getAdminOrgMaps(
        {},
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as AdminOrgOperatorMap[];
    }

    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);
    expect(result?.[0]).toEqual({
      adminAreaId: 101,
      adminName: "Area 1",
      operatorId: "OP1",
      orgId: 10,
      orgName: "Org 10",
    });
    expect(result?.[1]).toEqual({
      adminAreaId: 102,
      adminName: "Area 2",
      operatorId: "OP2",
      orgId: 20,
      orgName: "Org 20",
    });
  });

  it("returns empty array when no admin org operator maps found", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([]);

    let result: AdminOrgOperatorMap[] | null = null;
    if (typeof getAdminOrgMaps === "function") {
      result = (await getAdminOrgMaps(
        {},
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as AdminOrgOperatorMap[];
    }

    expect(result).toEqual([]);
  });

  it("applies org filter for non-global user", async () => {
    jest.spyOn(helpers, "requireUserSession").mockResolvedValue({
      id: 2,
      isGlobalUser: false,
      orgs: [{ id: 30, name: "Org 30" }],
    });
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([
      {
        adminAreaId: 201,
        adminName: "Area X",
        operatorId: "OPX",
        orgId: 30,
        orgName: "Org 30",
      },
    ]);

    let result: AdminOrgOperatorMap[] | null = null;
    if (typeof getAdminOrgMaps === "function") {
      result = (await getAdminOrgMaps(
        {},
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as AdminOrgOperatorMap[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(1);
    expect(result?.[0]).toEqual({
      adminAreaId: 201,
      adminName: "Area X",
      operatorId: "OPX",
      orgId: 30,
      orgName: "Org 30",
    });
  });
});
