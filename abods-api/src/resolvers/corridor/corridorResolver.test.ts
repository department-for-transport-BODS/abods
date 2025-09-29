import { getCorridors, getStats, getSubsequentStops } from "./corridorResolver";
import { jest } from "@jest/globals";
import {
  CorridorGranularity,
  CorridorType,
  MatchType,
  StopType,
} from "../../types/generated";
import * as corridor from "../../lib/corridor";
import { CorridorResultsType } from "../../lib/corridor";
import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import {
  Dialect,
  DummyDriver,
  PostgresQueryCompiler,
  PostgresAdapter,
  PostgresIntrospector,
  Kysely,
} from "kysely";
import { createResponse, createRequest } from "node-mocks-http";
import { DB } from "../../kysely";
import { RequestContext, TimetableType } from "../../types/extra";
import { GraphQLResolveInfo } from "graphql";
import * as kyselyLib from "../../lib/dbKysely";
import * as corridorLib from "../../lib/corridor";

const mockUser = { id: 1, orgs: [{ id: 10 }] };

jest.mock("../../../src/resolvers/helpers", () => ({
  requireUserSession: jest.fn(() => Promise.resolve(mockUser)),
}));

jest.mock("../../../src/lib/corridor", () => {
  const actual = jest.requireActual("../../../src/lib/corridor");
  return {
    ...(actual as Record<string, unknown>),
    distinctRoutes: jest.fn(),
    getOrgAdminAreas: jest.fn(),
    getCorridor: jest.fn(),
    isCorridorMappedToUserOrg: jest.fn(() => Promise.resolve(true)),
  };
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
    kysely: dummyKysely,
  };

  mockDb.naptan_stoppoint_latlong.findMany.mockResolvedValue([] as never);
  mockDb.corridor.findUnique.mockResolvedValue(null);
});

const mockCorridorResult: CorridorResultsType = {
  user_id: 1,
  corridor_id: 1,
  corridor_name: "Test Corridor",
  organisation_id: 123,
  corridor_stops: [
    {
      stop_id: 101,
      corridor_id: 1,
      corridor_index: 1,
      naptan_stop: {
        id: 101,
        naptan_code: "NPT101",
        street: "Street A",
        stop_areas: [],
        bus_stop_type: "K",
        indicator: "Y",
        admin_area_id: 301,
        stop_type: "B",
        atco_code: "SRC101",
        latitude: 51.501,
        longitude: -0.141,
        common_name: "Stop A",
        locality_id: "201",
        locality: {
          gazetteer_id: "201",
          name: "Locality A",
          admin_area_id: BigInt("301"),
          easting: 123456,
          northing: 654321,
          district_id: null,
          admin_area: {
            id: BigInt(301),
            name: "Admin Area A",
            atco_code: "AAA",
            traveline_region_id: "1",
            ui_lta_id: null,
          },
        },
      },
    },
    {
      stop_id: 102,
      corridor_id: 1,
      corridor_index: 2,
      naptan_stop: {
        id: 102,
        naptan_code: "NPT201",
        street: "Street B",
        stop_areas: [],
        bus_stop_type: "K",
        indicator: "Y",
        admin_area_id: 302,
        stop_type: "B",
        atco_code: "SRC102",
        latitude: 51.502,
        longitude: -0.142,
        common_name: "Stop B",
        locality_id: "201",
        locality: {
          gazetteer_id: "201",
          name: "Locality A",
          admin_area_id: BigInt("301"),
          easting: 123456,
          northing: 654321,
          district_id: null,
          admin_area: {
            id: BigInt(301),
            name: "Admin Area A",
            atco_code: "AAA",
            traveline_region_id: "1",
            ui_lta_id: null,
          },
        },
      },
    },
  ],
};

jest.mock("../../../src/resolvers/helpers", () => ({
  requireUserSession: jest.fn(() => Promise.resolve(mockUser)),
}));

jest
  .spyOn(corridor, "getCorridor")
  .mockResolvedValue(mockCorridorResult as never);

describe("getCorridors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns corridor when found", async () => {
    const args = { corridorId: 1 };

    let result: Partial<CorridorType> | null = null;
    if (typeof getCorridors === "function") {
      result = await getCorridors({}, args, context, {} as GraphQLResolveInfo);
    }

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(1);
    expect(result?.name).toEqual("Test Corridor");
    expect(result?.stops?.length).toBe(2);
    expect(result?.stops?.[0].stopId).toEqual("101");
    expect(result?.stops?.[1].stopId).toEqual("102");
  });

  it("returns null when corridor is not found", async () => {
    const args = { corridorId: 999 };

    // Mock getCorridor to return null
    jest.spyOn(corridor, "getCorridor").mockResolvedValueOnce(null);

    let result: Partial<CorridorType> | null = null;
    if (typeof getCorridors === "function") {
      result = await getCorridors({}, args, context, {} as GraphQLResolveInfo);
    }

    expect(result).toBeNull();
  });
});

describe("getSubsequentStops", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns subsequent stops when routes and admin areas are found", async () => {
    jest
      .spyOn(corridor, "distinctRoutes")
      .mockResolvedValueOnce([
        { route: "A,B,C,D" },
        { route: "A,B,C,E" },
      ] as never);
    jest
      .spyOn(corridor, "getOrgAdminAreas")
      .mockResolvedValueOnce([
        { adminarea_id: 1 },
        { adminarea_id: 2 },
      ] as never);

    mockDb.naptan_stoppoint_latlong.findMany.mockResolvedValue([
      {
        id: 201,
        admin_area_id: 1,
        atco_code: "C",
        common_name: "Stop C",
        longitude: -0.1,
        latitude: 51.5,
        locality: { name: "Loc C" },
        locality_id: 301,
      },
      {
        id: 202,
        admin_area_id: 2,
        atco_code: "D",
        common_name: "Stop D",
        longitude: -0.2,
        latitude: 51.6,
        locality: { name: "Loc D" },
        locality_id: 302,
      },
    ] as never);

    const args = { stopList: ["A", "B"] };

    let result: Partial<StopType>[] | null = null;
    if (typeof getSubsequentStops === "function") {
      result = (await getSubsequentStops(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<StopType>[];
    }

    expect(result).toEqual([
      {
        adminAreaId: "1",
        stopId: "201",
        stopName: "Stop C",
        lon: -0.1,
        lat: 51.5,
        localityName: "Loc C",
        sourceId: "C",
      },
      {
        adminAreaId: "2",
        stopId: "202",
        stopName: "Stop D",
        lon: -0.2,
        lat: 51.6,
        localityName: "Loc D",
        sourceId: "D",
      },
    ] as StopType[]);

    expect(corridor.distinctRoutes).toHaveBeenCalled();
    expect(corridor.getOrgAdminAreas).toHaveBeenCalled();
  });

  it("returns empty array if stops does not match a route", async () => {
    jest.spyOn(corridor, "distinctRoutes").mockResolvedValueOnce([] as never);
    jest
      .spyOn(corridor, "getOrgAdminAreas")
      .mockResolvedValueOnce([{ adminarea_id: 1 }] as never);

    mockDb.naptan_stoppoint_latlong.findMany.mockResolvedValue([] as never);

    const args = { stopList: ["A", "C"] };

    let result: Partial<StopType>[] | null = null;
    if (typeof getSubsequentStops === "function") {
      result = (await getSubsequentStops(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<StopType>[];
    }

    expect(result).toEqual([]);
    expect(corridor.distinctRoutes).toHaveBeenCalled();
    expect(corridor.getOrgAdminAreas).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.naptan_stoppoint_latlong.findMany).not.toHaveBeenCalled();
  });

  it("returns empty array if no new stops found", async () => {
    jest.spyOn(corridor, "distinctRoutes").mockResolvedValueOnce([] as never);
    jest
      .spyOn(corridor, "getOrgAdminAreas")
      .mockResolvedValueOnce([{ adminarea_id: 1 }] as never);
    mockDb.naptan_stoppoint_latlong.findMany.mockResolvedValue([] as never);

    const args = { stopList: ["A", "B"] };

    let result: Partial<StopType>[] | null = null;
    if (typeof getSubsequentStops === "function") {
      result = (await getSubsequentStops(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<StopType>[];
    }

    expect(result).toEqual([]);
    expect(corridor.distinctRoutes).toHaveBeenCalled();
    expect(corridor.getOrgAdminAreas).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.naptan_stoppoint_latlong.findMany).not.toHaveBeenCalled();
  });
});

describe("getStats", () => {
  it("returns corridor stats for valid input", async () => {
    const stop = ["101", "102", "103"];
    const args = {
      inputs: {
        corridorId: "1",
        fromTimestamp: "2025-09-01T00:00:00.000Z",
        toTimestamp: "2025-09-02T00:00:00.000Z",
        stopList: stop,
        granularity: CorridorGranularity.Hour,
        matchType: MatchType.Estimated,
      },
    };

    const mockTimetableResults = stop.map((atco_code: string, idx: number) => ({
      atco_code,
      stop_index: idx,
      actual_departure_time: `2025-09-01T08:${idx * 10}:00.000Z`,
      expected_departure_time: `2025-09-01T08:${idx * 10 + 5}:00.000Z`,
      operator_noc: "OP1",
      service_code: "SC1",
      line_name: "Line 1",
      vehiclejourney_id: "VJ1",
      group_id: "G1",
      date_of_journey: "2025-09-01",
    }));

    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue(mockTimetableResults as never);

    let result: { corridorTransits: TimetableType[][] } | null = null;
    if (typeof getStats === "function") {
      result = (await getStats(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as { corridorTransits: TimetableType[][] };
    }

    expect(result).toHaveProperty("corridorTransits");
    expect(result?.corridorTransits[0].length).toEqual(3);
    expect(result?.corridorTransits[0][0].atco_code).toEqual("101");
    expect(result?.corridorTransits[0][2].atco_code).toEqual("103");
    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(1);
    expect(corridorLib.isCorridorMappedToUserOrg).toHaveBeenCalledWith(
      Number(args.inputs.corridorId),
      mockUser,
      mockDb,
    );
  });

  it("throws error if stopList is empty", async () => {
    const args = {
      inputs: {
        corridorId: "1",
        fromTimestamp: "2025-09-01T00:00:00.000Z",
        toTimestamp: "2025-09-02T00:00:00.000Z",
        stopList: [],
        granularity: CorridorGranularity.Hour,
        matchType: MatchType.Estimated,
      },
    };

    if (typeof getStats === "function") {
      await expect(
        getStats({}, args, context, {} as GraphQLResolveInfo),
      ).rejects.toThrow("No stop array passed for corridor stats");
      return;
    }

    fail("No error thrown when stopList is empty");
  });

  it("throws error if corridor is not mapped to user org", async () => {
    (corridorLib.isCorridorMappedToUserOrg as jest.Mock).mockResolvedValueOnce(
      false as never,
    );

    const args = {
      inputs: {
        corridorId: "1",
        fromTimestamp: "2025-09-01T00:00:00.000Z",
        toTimestamp: "2025-09-02T00:00:00.000Z",
        stopList: ["101", "102"],
        granularity: CorridorGranularity.Hour,
        matchType: MatchType.Estimated,
      },
    };

    if (typeof getStats === "function") {
      await expect(
        getStats({}, args, context, {} as GraphQLResolveInfo),
      ).rejects.toThrow("Not Authorized");
      return;
    }

    fail("No error thrown when corridor is not mapped to user org");
  });

  it("does not return corridor stats for journeys not matching stop order", async () => {
    // Arrange
    const stop = ["101", "104", "103", "102"];
    const args = {
      inputs: {
        corridorId: "1",
        fromTimestamp: "2025-09-01T00:00:00.000Z",
        toTimestamp: "2025-09-02T00:00:00.000Z",
        stopList: ["101", "102", "103"],
        granularity: CorridorGranularity.Hour,
        matchType: MatchType.Estimated,
      },
    };

    const mockTimetableResults = stop.map((atco_code: string, idx: number) => ({
      atco_code,
      stop_index: idx,
      actual_departure_time: `2025-09-01T08:${idx * 10}:00.000Z`,
      expected_departure_time: `2025-09-01T08:${idx * 10 + 5}:00.000Z`,
      operator_noc: "OP1",
      service_code: "SC1",
      line_name: "Line 1",
      vehiclejourney_id: "VJ1",
      group_id: "G1",
      date_of_journey: "2025-09-01",
    }));

    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue(mockTimetableResults as never);

    let result: { corridorTransits: TimetableType[][] } | null = null;
    if (typeof getStats === "function") {
      result = (await getStats(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as { corridorTransits: TimetableType[][] };
    }

    expect(result).toHaveProperty("corridorTransits");
    expect(result?.corridorTransits.length).toEqual(0);
    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(1);
  });

  it("returns journeys when the direction of stops matches stopList", async () => {
    // Arrange
    const stop = ["101", "104", "102", "103"];
    const args = {
      inputs: {
        corridorId: "1",
        fromTimestamp: "2025-09-01T00:00:00.000Z",
        toTimestamp: "2025-09-02T00:00:00.000Z",
        stopList: ["101", "102", "103"],
        granularity: CorridorGranularity.Hour,
        matchType: MatchType.Estimated,
      },
    };

    const mockTimetableResults = stop.map((atco_code: string, idx: number) => ({
      atco_code,
      stop_index: idx,
      actual_departure_time: `2025-09-01T08:${idx * 10}:00.000Z`,
      expected_departure_time: `2025-09-01T08:${idx * 10 + 5}:00.000Z`,
      operator_noc: "OP1",
      service_code: "SC1",
      line_name: "Line 1",
      vehiclejourney_id: "VJ1",
      group_id: "G1",
      date_of_journey: "2025-09-01",
    }));

    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue(mockTimetableResults as never);

    let result: { corridorTransits: TimetableType[][] } | null = null;
    if (typeof getStats === "function") {
      result = (await getStats(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as { corridorTransits: TimetableType[][] };
    }

    expect(result).toHaveProperty("corridorTransits");
    expect(result?.corridorTransits[0].length).toEqual(3);
    expect(result?.corridorTransits[0][0].atco_code).toEqual("101");
    expect(result?.corridorTransits[0][2].atco_code).toEqual("103");
    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(1);
  });

  it("returns stops for cyclic journeys", async () => {
    const stop = ["101", "102", "104", "101", "102"];
    const args = {
      inputs: {
        corridorId: "1",
        fromTimestamp: "2025-09-01T00:00:00.000Z",
        toTimestamp: "2025-09-02T00:00:00.000Z",
        stopList: ["101", "102"],
        granularity: CorridorGranularity.Hour,
        matchType: MatchType.Estimated,
      },
    };

    const mockTimetableResults = stop.map((atco_code: string, idx: number) => ({
      atco_code,
      stop_index: idx,
      actual_departure_time: `2025-09-01T08:${idx * 10}:00.000Z`,
      expected_departure_time: `2025-09-01T08:${idx * 10 + 5}:00.000Z`,
      operator_noc: "OP1",
      service_code: "SC1",
      line_name: "Line 1",
      vehiclejourney_id: "VJ1",
      group_id: "G1",
      date_of_journey: "2025-09-01",
    }));

    jest
      .spyOn(kyselyLib, "executeQuery")
      .mockResolvedValue(mockTimetableResults as never);

    let result: { corridorTransits: TimetableType[][] } | null = null;
    if (typeof getStats === "function") {
      result = (await getStats(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as { corridorTransits: TimetableType[][] };
    }

    expect(result).toHaveProperty("corridorTransits");
    expect(result?.corridorTransits.length).toEqual(2);
    expect(result?.corridorTransits[0].length).toEqual(2);
    expect(result?.corridorTransits[1].length).toEqual(2);
    expect(result?.corridorTransits[0][0].atco_code).toEqual("101");
    expect(result?.corridorTransits[1][1].atco_code).toEqual("102");
    expect(kyselyLib.executeQuery).toHaveBeenCalledTimes(1);
  });
});
