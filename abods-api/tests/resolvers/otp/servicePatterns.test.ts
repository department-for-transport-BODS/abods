import { getServicePatterns } from "../../../src/resolvers/otpFunctions";
import { Kysely } from "kysely";
import { jest } from "@jest/globals";
import * as commonLib from "../../../src/lib/common";
import { RouteType, ServicePatternType } from "../../../src/types/generated";
import { GraphQLResolveInfo } from "graphql";

jest.mock("../../../src/resolvers/helpers", () => ({
  requireUserSession: jest.fn(() =>
    Promise.resolve({ id: 1, orgs: [{ id: 10 }] }),
  ),
}));

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
    jest.spyOn(commonLib, "getTracksData").mockResolvedValue(mockTracksData);

    const mockDb = {
      distinct_routes: {
        findMany: jest.fn().mockResolvedValue(mockDistinctRoutes as never),
      },
      naptan_stoppoint_latlong: {
        findMany: jest.fn().mockResolvedValue(mockStopQueryResults as never),
      },
    };
    const context = {
      db: mockDb,
      kysely: {} as Kysely<any>, // not used in this test
      req: {} as any,
      res: {} as any,
      headers: {} as any,
    };
    const args = { lineId: "test-line-id", operatorId: "test-operator-id" };

    let result: Partial<ServicePatternType>[] | null | undefined;
    //const resolver = getServicePatterns;
    if (typeof getServicePatterns === "function") {
      result = (await getServicePatterns!(
        {},
        args,
        context as any,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePatternType>[];
    }

    expect(result?.length).toBe(2);

    // First route: A,B,C
    expect(result![0].stops?.map((s: any) => s.stopId)).toEqual([
      "A",
      "B",
      "C",
    ]);
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
    expect(result![1].stops?.map((s: any) => s.stopId)).toEqual(["C", "D"]);
    expect(result![1]?.servicePatternId).toBe("2");
    expect(result![1]?.serviceLinks![0]).toEqual({
      fromStop: "C",
      toStop: "D",
      distance: 300,
      routeValidity: RouteType.Valid,
      linkRoute: "[[5.5,6.6],[7.7,8.8]]",
    });

    // Ensure mocks were called
    expect(mockDb.distinct_routes.findMany).toHaveBeenCalledTimes(1);
    expect(mockDb.naptan_stoppoint_latlong.findMany).toHaveBeenCalledTimes(1);
    expect(commonLib.getTracksData).toHaveBeenCalled();
  });

  it("returns invalid links when no connecting routes found", async () => {
    jest.spyOn(commonLib, "getTracksData").mockResolvedValue(mockTracksData);
    mockDistinctRoutes = [{ id: 1, route: "A,E" }];

    const mockStopQueryResults = [
      { common_name: "Stop A", atco_code: "A", longitude: 1.1, latitude: 2.2 },
      { common_name: "Stop E", atco_code: "E", longitude: 3.3, latitude: 4.4 },
    ];
    const mockDb = {
      distinct_routes: {
        findMany: jest.fn().mockResolvedValue(mockDistinctRoutes as never),
      },
      naptan_stoppoint_latlong: {
        findMany: jest.fn().mockResolvedValue(mockStopQueryResults as never),
      },
    };
    const context = {
      db: mockDb,
      kysely: {} as Kysely<any>, // not used in this test
      req: {} as any,
      res: {} as any,
      headers: {} as any,
    };
    const args = { lineId: "test-line-id", operatorId: "test-operator-id" };

    let result: Partial<ServicePatternType>[] | null | undefined;

    if (typeof getServicePatterns === "function") {
      result = (await getServicePatterns!(
        {},
        args,
        context as any,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePatternType>[];
    }

    expect(result?.length).toBe(1);

    // First route: A,E
    expect(result![0].stops?.map((s: any) => s.stopId)).toEqual(["A", "E"]);
    expect(result![0]?.serviceLinks![0].routeValidity).toEqual(
      RouteType.InvalidNoRoutePoints,
    );
  });

  it("When a stop is missing no service links should be returned", async () => {
    jest.spyOn(commonLib, "getTracksData").mockResolvedValue(mockTracksData);
    mockDistinctRoutes = [{ id: 1, route: "A,E" }];

    const mockStopQueryResults = [
      { common_name: "Stop A", atco_code: "A", longitude: 1.1, latitude: 2.2 },
    ];
    const mockDb = {
      distinct_routes: {
        findMany: jest.fn().mockResolvedValue(mockDistinctRoutes as never),
      },
      naptan_stoppoint_latlong: {
        findMany: jest.fn().mockResolvedValue(mockStopQueryResults as never),
      },
    };
    const context = {
      db: mockDb,
      kysely: {} as Kysely<any>, // not used in this test
      req: {} as any,
      res: {} as any,
      headers: {} as any,
    };
    const args = { lineId: "test-line-id", operatorId: "test-operator-id" };

    let result: Partial<ServicePatternType>[] | null | undefined;

    if (typeof getServicePatterns === "function") {
      result = (await getServicePatterns!(
        {},
        args,
        context as any,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePatternType>[];
    }

    expect(result?.length).toBe(1);

    expect(result![0].stops?.map((s: any) => s.stopId)).toEqual(["A"]);
    expect(result![0]?.serviceLinks).toEqual([]);
  });

  it("When no distinct routes exist then empty array should be returned", async () => {
    jest.spyOn(commonLib, "getTracksData").mockResolvedValue(mockTracksData);
    mockDistinctRoutes = [];

    const mockDb = {
      distinct_routes: {
        findMany: jest.fn().mockResolvedValue(mockDistinctRoutes as never),
      },
      naptan_stoppoint_latlong: {
        findMany: jest.fn().mockResolvedValue(mockStopQueryResults as never),
      },
    };
    const context = {
      db: mockDb,
      kysely: {} as Kysely<any>, // not used in this test
      req: {} as any,
      res: {} as any,
      headers: {} as any,
    };
    const args = { lineId: "test-line-id", operatorId: "test-operator-id" };

    let result: Partial<ServicePatternType>[] | null | undefined;

    if (typeof getServicePatterns === "function") {
      result = (await getServicePatterns!(
        {},
        args,
        context as any,
        {} as GraphQLResolveInfo,
      )) as Partial<ServicePatternType>[];
    }
    expect(result?.length).toBe(0);
  });
});
