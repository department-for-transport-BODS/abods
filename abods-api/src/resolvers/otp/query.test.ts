import {
  getAdminAreas,
  getLines,
  getOperatorList,
  getServiceInfo,
  getServicePatterns,
} from "./query";
import { jest } from "@jest/globals";
import {
  AdminAreasType,
  LineType,
  OperatorType,
  RouteType,
  ServiceInfoType,
  ServicePatternType,
} from "../../../src/types/generated";
import {
  Dialect,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { RequestContext } from "../../types/extra.js";
import { GraphQLResolveInfo } from "graphql";
import { createRequest, createResponse } from "node-mocks-http";

import { PrismaClient } from "@prisma/client";
import { DB } from "../../kysely";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import * as common from "../../lib/common";
import * as kyselyLib from "../../lib/dbKysely.js";
import * as operatorLib from "../../lib/operators.js";
import logger from "../../logger";

jest.mock("../../resolvers/helpers", () => ({
  requireUserSession: jest.fn(() =>
    Promise.resolve({ id: 1, orgs: [{ id: 10 }] }),
  ),
}));

jest.spyOn(operatorLib, "getUserOperatorIds").mockResolvedValue(["OP1", "OP2"]);

const mockAdminAreaRecords = [
  { national_operator_code: "OP1", adminarea_id: 101 },
  { national_operator_code: "OP2", adminarea_id: 102 },
];

const mockAdminAreas = [
  { id: 101, name: "Area 1", st_asgeojson: '{"type":"Polygon"}' },
  { id: 102, name: "Area 2", st_asgeojson: '{"type":"Polygon"}' },
];

let mockDb: DeepMockProxy<PrismaClient>;
let context: RequestContext;

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
    res: createResponse(),
    req: createRequest(),
    headers: {},
    db: mockDb,
    kysely: dummyKysely,
  };
});

describe("getAdminAreas", () => {
  it("returns admin areas for user operators", async () => {
    mockDb.noc_adminarea.findMany.mockResolvedValue(mockAdminAreaRecords);
    mockDb.naptan_adminarea_with_shape.findMany.mockResolvedValue(
      mockAdminAreas as never,
    );
    let result: Partial<AdminAreasType>[] | null = null;
    if (typeof getAdminAreas === "function") {
      result = (await getAdminAreas(
        {},
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<AdminAreasType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      id: "101",
      name: "Area 1",
      shape: '{"type":"Polygon"}',
    });
    expect(result?.[1]).toEqual({
      id: "102",
      name: "Area 2",
      shape: '{"type":"Polygon"}',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.noc_adminarea.findMany).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.naptan_adminarea_with_shape.findMany).toHaveBeenCalledTimes(
      1,
    );
  });

  it("returns null if no admin areas found", async () => {
    mockDb.noc_adminarea.findMany.mockResolvedValue([] as never);
    mockDb.naptan_adminarea_with_shape.findMany.mockResolvedValue([] as never);

    let result: Partial<AdminAreasType>[] | null = null;
    if (typeof getAdminAreas === "function") {
      result = (await getAdminAreas(
        {},
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<AdminAreasType>[];
    }

    expect(result).toEqual([]);
  });

  it("throws error if naptan_adminarea_with_shape returns null", async () => {
    mockDb.noc_adminarea.findMany.mockResolvedValue(
      mockAdminAreaRecords as never,
    );
    mockDb.naptan_adminarea_with_shape.findMany.mockResolvedValue([] as never);

    let result: Partial<AdminAreasType>[] | null = null;
    if (typeof getAdminAreas === "function") {
      result = (await getAdminAreas(
        {},
        {},
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<AdminAreasType>[];
    }

    expect(result).toEqual([]);
  });
});

describe("getServicePatterns", () => {
  let mockDistinctRoutes = [
    { id: 1, route: "A,B,C" },
    { id: 2, route: "C,D" },
  ];
  const mockStopQueryResults = [
    { common_name: "Stop A", atco_code: "A", longitude: 1.1, latitude: 2.2 },
    { common_name: "Stop B", atco_code: "B", longitude: 3.3, latitude: 4.4 },
    { common_name: "Stop C", atco_code: "C", longitude: 5.5, latitude: 6.6 },
    { common_name: "Stop D", atco_code: "D", longitude: 7.7, latitude: 8.8 },
  ];
  const mockTracksData = [
    {
      id: "0",
      from_atco_code: "A",
      to_atco_code: "B",
      geometry: '{"type":"LineString","coordinates":[[1.1,2.2],[3.3,4.4]]}',
      distance: 100,
    },
    {
      id: "1",
      from_atco_code: "B",
      to_atco_code: "C",
      geometry: '{"type":"LineString","coordinates":[[3.3,4.4],[5.5,6.6]]}',
      distance: 200,
    },
    {
      id: "2",
      from_atco_code: "C",
      to_atco_code: "D",
      geometry: '{"type":"LineString","coordinates":[[5.5,6.6],[7.7,8.8]]}',
      distance: 300,
    },
  ];

  beforeAll(() => {
    jest.clearAllMocks();
  });

  it("returns service patterns with correct stops and links", async () => {
    jest.spyOn(common, "getTracksData").mockResolvedValue(mockTracksData);

    mockDb.distinct_routes.findMany.mockResolvedValue(
      mockDistinctRoutes as never,
    );
    mockDb.naptan_stoppoint_latlong.findMany.mockResolvedValue(
      mockStopQueryResults as never,
    );

    const args = { lineId: "test-line-id", operatorId: "test-operator-id" };

    let result: Partial<ServicePatternType>[] | null | undefined;
    //const resolver = getServicePatterns;
    if (typeof getServicePatterns === "function") {
      result = (await getServicePatterns(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePatternType>[];
    }

    expect(result?.length).toBe(2);

    // First route: A,B,C
    expect(result![0].stops?.map((s) => s.stopId)).toEqual(["A", "B", "C"]);
    expect(result![0]?.servicePatternId).toBe("1");
    expect(result![0]?.serviceLinks?.length).toBe(2);
    expect(result![0]?.serviceLinks![0]).toEqual({
      fromStop: "A",
      toStop: "B",
      distance: 100,
      routeValidity: RouteType.Valid,
      linkRoute: "[[1.1,2.2],[3.3,4.4]]",
    });

    // Second route: C,D
    expect(result![1].stops?.map((s) => s.stopId)).toEqual(["C", "D"]);
    expect(result![1]?.servicePatternId).toBe("2");
    expect(result![1]?.serviceLinks![0]).toEqual({
      fromStop: "C",
      toStop: "D",
      distance: 300,
      routeValidity: RouteType.Valid,
      linkRoute: "[[5.5,6.6],[7.7,8.8]]",
    });

    // Ensure mocks were called
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.distinct_routes.findMany).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.naptan_stoppoint_latlong.findMany).toHaveBeenCalledTimes(1);
    expect(common.getTracksData).toHaveBeenCalled();
  });

  it("returns invalid links when no connecting routes found", async () => {
    jest.spyOn(common, "getTracksData").mockResolvedValue(mockTracksData);
    mockDistinctRoutes = [{ id: 1, route: "A,E" }];

    const mockStopQueryResults = [
      { common_name: "Stop A", atco_code: "A", longitude: 1.1, latitude: 2.2 },
      { common_name: "Stop E", atco_code: "E", longitude: 3.3, latitude: 4.4 },
    ];

    mockDb.distinct_routes.findMany.mockResolvedValue(
      mockDistinctRoutes as never,
    );
    mockDb.naptan_stoppoint_latlong.findMany.mockResolvedValue(
      mockStopQueryResults as never,
    );
    const args = { lineId: "test-line-id", operatorId: "test-operator-id" };

    let result: Partial<ServicePatternType>[] | null | undefined;

    if (typeof getServicePatterns === "function") {
      result = (await getServicePatterns(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePatternType>[];
    }

    expect(result?.length).toBe(1);

    // First route: A,E
    expect(result![0].stops?.map((s) => s.stopId)).toEqual(["A", "E"]);
    expect(result![0]?.serviceLinks![0].routeValidity).toEqual(
      RouteType.InvalidNoRoutePoints,
    );
  });

  it("When a stop is missing no service links should be returned", async () => {
    jest.spyOn(common, "getTracksData").mockResolvedValue(mockTracksData);
    mockDistinctRoutes = [{ id: 1, route: "A,E" }];

    const mockStopQueryResults = [
      { common_name: "Stop A", atco_code: "A", longitude: 1.1, latitude: 2.2 },
    ];
    mockDb.distinct_routes.findMany.mockResolvedValue(
      mockDistinctRoutes as never,
    );
    mockDb.naptan_stoppoint_latlong.findMany.mockResolvedValue(
      mockStopQueryResults as never,
    );

    const args = { lineId: "test-line-id", operatorId: "test-operator-id" };

    let result: Partial<ServicePatternType>[] | null | undefined;

    if (typeof getServicePatterns === "function") {
      result = (await getServicePatterns(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePatternType>[];
    }

    expect(result?.length).toBe(1);

    expect(result![0].stops?.map((s) => s.stopId)).toEqual(["A"]);
    expect(result![0]?.serviceLinks).toEqual([]);
  });

  it("When no distinct routes exist then empty array should be returned", async () => {
    jest.spyOn(common, "getTracksData").mockResolvedValue(mockTracksData);
    mockDistinctRoutes = [];

    mockDb.distinct_routes.findMany.mockResolvedValue(
      mockDistinctRoutes as never,
    );
    mockDb.naptan_stoppoint_latlong.findMany.mockResolvedValue(
      mockStopQueryResults as never,
    );

    const args = { lineId: "test-line-id", operatorId: "test-operator-id" };

    let result: Partial<ServicePatternType>[] | null | undefined;

    if (typeof getServicePatterns === "function") {
      result = (await getServicePatterns(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePatternType>[];
    }
    expect(result?.length).toBe(0);
  });
});

describe("getOperatorList", () => {
  it("returns mapped operator list", async () => {
    const mockResults = [
      {
        name: "Operator One",
        operatorId: "OP1",
        adminAreaIds: "101,102",
      },
      {
        name: "Operator Two",
        operatorId: "OP2",
        adminAreaIds: "103,104",
      },
    ];
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue(mockResults);

    const args = { filterBy: {} };
    let result: OperatorType[] | null = null;
    if (typeof getOperatorList === "function") {
      result = (await getOperatorList(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as OperatorType[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      name: "Operator One",
      operatorId: "OP1",
      nocCode: "OP1",
      adminAreaIds: ["101", "102"],
    });
    expect(result?.[1]).toEqual({
      name: "Operator Two",
      operatorId: "OP2",
      nocCode: "OP2",
      adminAreaIds: ["103", "104"],
    });

    // Ensure executeQuery was called with a SelectQueryBuilder
    expect(
      (kyselyLib.executeQuery as jest.Mock).mock.calls[0][0],
    ).toBeDefined();
  });

  it("returns filtered operator list by operatorIds", async () => {
    const mockResults = [
      {
        name: "Operator One",
        operatorId: "OP1",
        adminAreaIds: "101,102",
      },
    ];
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue(mockResults);

    const args = { filterBy: { operatorIds: ["OP1"] } };
    let result: OperatorType[] | null = null;
    if (typeof getOperatorList === "function") {
      result = (await getOperatorList(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as OperatorType[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(1);

    expect(result?.[0]).toEqual({
      name: "Operator One",
      operatorId: "OP1",
      nocCode: "OP1",
      adminAreaIds: ["101", "102"],
    });
  });

  it("returns filtered operator list by orgId", async () => {
    const mockResults = [
      {
        name: "Operator Two",
        operatorId: "OP2",
        adminAreaIds: "103,104",
      },
    ];
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue(mockResults);

    const args = { filterBy: { orgId: 10 } };
    let result: OperatorType[] | null = null;
    if (typeof getOperatorList === "function") {
      result = (await getOperatorList(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as OperatorType[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(1);

    expect(result?.[0]).toEqual({
      name: "Operator Two",
      operatorId: "OP2",
      nocCode: "OP2",
      adminAreaIds: ["103", "104"],
    });
  });

  it("returns empty array when no operators found", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([]);

    const args = { filterBy: {} };
    let result: OperatorType[] | null = null;
    if (typeof getOperatorList === "function") {
      result = (await getOperatorList(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as OperatorType[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });
});

describe("getServiceInfo", () => {
  it("returns service info when user has access", async () => {
    const mockService = {
      operator_noc: "OP1",
      line_name: "Line 1",
      service_name: "Service 1",
    };
    mockDb.expected_services.findFirst.mockResolvedValue(mockService as never);

    const args = { serviceId: "OP1-L1-S1" };
    let result: ServiceInfoType | null = null;
    if (typeof getServiceInfo === "function") {
      result = (await getServiceInfo(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as ServiceInfoType;
    }

    expect(result).not.toBeNull();
    expect(result).toEqual({
      serviceId: "OP1-L1-S1",
      serviceNumber: "Line 1",
      serviceName: "Service 1",
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.expected_services.findFirst).toHaveBeenCalledWith({
      where: { noc_and_line_and_servicecode: "OP1-L1-S1" },
      select: {
        operator_noc: true,
        line_name: true,
        service_name: true,
      },
    });
  });

  it("returns null and logs error when service not found", async () => {
    mockDb.expected_services.findFirst.mockResolvedValue(null);

    const args = { serviceId: "OP1-L1-S1" };
    const loggerSpy = jest.spyOn(logger, "error").mockImplementation(jest.fn());

    let result: ServiceInfoType | null = null;
    if (typeof getServiceInfo === "function") {
      result = (await getServiceInfo(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as ServiceInfoType;
    }

    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.any(Error),
      "An error occurred when getting service info",
    );
  });

  it("returns null and logs error when user does not have access", async () => {
    const mockService = {
      operator_noc: "OP3",
      line_name: "Line 3",
      service_name: "Service 3",
    };
    mockDb.expected_services.findFirst.mockResolvedValue(mockService as never);

    const args = { serviceId: "OP3-L3-S3" };
    const loggerSpy = jest.spyOn(logger, "error").mockImplementation(jest.fn());

    let result: ServiceInfoType | null = null;
    if (typeof getServiceInfo === "function") {
      result = (await getServiceInfo(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as ServiceInfoType;
    }

    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.any(Error),
      "An error occurred when getting service info",
    );
  });
});

describe("getLines", () => {
  it("returns mapped lines for valid operatorIds", async () => {
    const mockResults = [
      {
        id: "OP1-L1-S1",
        name: "Service 1",
        number: "Line 1",
        adminAreaIds: "101,102",
      },
      {
        id: "OP2-L2-S2",
        name: "Service 2",
        number: "Line 2",
        adminAreaIds: "103,104",
      },
    ];
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue(mockResults);

    const args = {
      operatorIds: ["OP1", "OP2"],
      inputDate: "2025-09-30",
    };
    let result: LineType[] | null = null;
    if (typeof getLines === "function") {
      result = (await getLines(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as LineType[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      id: "OP1-L1-S1",
      name: "Service 1",
      number: "Line 1",
      adminAreaIds: "101,102",
    });
    expect(result?.[1]).toEqual({
      id: "OP2-L2-S2",
      name: "Service 2",
      number: "Line 2",
      adminAreaIds: "103,104",
    });

    // Ensure executeQuery was called with a SelectQueryBuilder
    expect(
      (kyselyLib.executeQuery as jest.Mock).mock.calls[0][0],
    ).toBeDefined();
  });

  it("returns empty array when operatorIds is empty", async () => {
    const args = {
      operatorIds: [],
      inputDate: "2025-09-30",
    };
    let result: LineType[] | null = null;
    if (typeof getLines === "function") {
      result = (await getLines(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as LineType[];
    }

    expect(result).toEqual([]);
  });

  it("returns mapped lines for date range", async () => {
    const mockResults = [
      {
        id: "OP1-L1-S1",
        name: "Service 1",
        number: "Line 1",
        adminAreaIds: "101,102",
      },
    ];
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue(mockResults);

    const args = {
      operatorIds: ["OP1"],
      inputDate: "2025-09-01",
      endDate: "2025-09-30",
    };
    let result: LineType[] | null = null;
    if (typeof getLines === "function") {
      result = (await getLines(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as LineType[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(1);

    expect(result?.[0]).toEqual({
      id: "OP1-L1-S1",
      name: "Service 1",
      number: "Line 1",
      adminAreaIds: "101,102",
    });
  });

  it("returns empty array when no lines found", async () => {
    jest.spyOn(kyselyLib, "executeQuery").mockResolvedValue([]);

    const args = {
      operatorIds: ["OP1"],
      inputDate: "2025-09-30",
    };
    let result: LineType[] | null = null;
    if (typeof getLines === "function") {
      result = (await getLines(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as LineType[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(0);
  });
});
