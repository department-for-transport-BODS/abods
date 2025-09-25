import { getAdminAreas, getServicePatterns } from "./query";
import { jest } from "@jest/globals";
import {
  AdminAreasType,
  RouteType,
  ServicePatternType,
} from "../../../src/types/generated";
import { Kysely } from "kysely";
import { RequestContext } from "../../types/extra.js";
import { GraphQLResolveInfo } from "graphql";
import { createRequest, createResponse } from "node-mocks-http";

import { PrismaClient } from "@prisma/client";
import { DB } from "../../kysely";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import * as common from "../../../src/lib/common";

jest.mock("../../../src/resolvers/helpers", () => ({
  requireUserSession: jest.fn(() =>
    Promise.resolve({ id: 1, orgs: [{ id: 10 }] }),
  ),
}));
jest.mock("../../../src/lib/operators", () => ({
  getUserOperatorIds: jest.fn(() => Promise.resolve(["OP1", "OP2"])),
}));

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
beforeEach(() => {
  jest.clearAllMocks();
  mockDb = mockDeep<PrismaClient>();
  context = {
    res: createResponse(),
    req: createRequest(),
    headers: {},
    db: mockDb,
    kysely: {} as unknown as Kysely<DB>,
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
