import * as journey from "./vehicleJourneyFunctions";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";
import { createRequest, createResponse } from "node-mocks-http";
import { RequestContext } from "../types/extra";
import * as helpers from "./helpers";
import {
  Journey,
  JourneyResult,
  ServicePatternDistanceResult,
} from "../types/generated";
import { GraphQLResolveInfo } from "graphql";
import dayjs from "dayjs";
import {
  Dialect,
  DummyDriver,
  PostgresQueryCompiler,
  PostgresAdapter,
  PostgresIntrospector,
  Kysely,
} from "kysely";
import { DB } from "../kysely";
import * as kyselyLib from "../lib/dbKysely";

// Mock stops data (simulate what your resolver would fetch)
const stopsData = [
  {
    stop_id: 1,
    common_name: "Stop A",
    stop_latitude: 51.5,
    stop_longitude: -0.1,
    expected_departure_time: new Date("2025-09-01T08:00:00.000Z"),
    actual_departure_time: new Date("2025-09-01T08:01:00.000Z"),
    timestamp_after_estimate: new Date("2025-09-01T08:02:00.000Z"),
    is_timing_point: true,
    direction: "inbound",
    incomplete_reason: 0,
    set_down: false,
    stop_index: 0,
    otp_state: "OnTime",
  },
  {
    stop_id: 2,
    common_name: "Stop B",
    stop_latitude: 51.6,
    stop_longitude: -0.2,
    expected_departure_time: new Date("2025-09-01T08:10:00.000Z"),
    actual_departure_time: new Date("2025-09-01T08:11:00.000Z"),
    timestamp_after_estimate: new Date("2025-09-01T08:12:00.000Z"),
    is_timing_point: false,
    direction: "inbound",
    incomplete_reason: 0,
    set_down: false,
    stop_index: 1,
    otp_state: "Late",
  },
];

jest.mock("./helpers", () => ({
  requireUserSession: jest.fn(),
}));

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
    db: mockDb,
    req: createRequest(),
    res: createResponse(),
    headers: {},
    kysely: dummyKysely,
  };
});

describe("getAvlData", () => {
  const mockResults = [
    {
      latitude: 51.5,
      longitude: -0.1,
      recorded_at_time: new Date("2025-09-30T08:00:00.000Z"),
      vehicle_ref: "V1",
      direction_ref: "inbound",
    },
    {
      latitude: 51.6,
      longitude: -0.2,
      recorded_at_time: new Date("2025-09-30T08:10:00.000Z"),
      vehicle_ref: "V2",
      direction_ref: "outbound",
    },
  ];
  beforeEach(() => {
    jest.clearAllMocks();
    //jest.spyOn(prismaMockDb.siriVMPositions, "findMany").mockResolvedValue(mockResults as never);
  });
  it("returns mapped AVL data for valid input", async () => {
    jest
      .spyOn(mockDb.siriVMPositions, "findMany")
      .mockResolvedValue(mockResults as never);

    const dateString = "2025-09-30";
    const newGroupId = "G1|2025-09-30";
    const minRange = dayjs("2025-09-30T07:00:00.000Z");
    const maxRange = dayjs("2025-09-30T09:00:00.000Z");

    let result: unknown[] | null = null;
    if (typeof journey.getAvlData === "function") {
      result = await journey.getAvlData(
        mockDb,
        dateString,
        newGroupId,
        minRange,
        maxRange,
      );
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      latitude: 51.5,
      longitude: -0.1,
      recordedAtTimeUtc: "2025-09-30T08:00:00.000Z",
      vehicleRef: "V1",
      directionRef: "inbound",
    });
    expect(result?.[1]).toEqual({
      latitude: 51.6,
      longitude: -0.2,
      recordedAtTimeUtc: "2025-09-30T08:10:00.000Z",
      vehicleRef: "V2",
      directionRef: "outbound",
    });
  });

  it("returns empty array when no AVL data found", async () => {
    mockDb.siriVMPositions.findMany.mockResolvedValue([] as never);

    const dateString = "2025-09-30";
    const newGroupId = "G1|2025-09-30";
    const minRange = dayjs("2025-09-30T07:00:00.000Z");
    const maxRange = dayjs("2025-09-30T09:00:00.000Z");

    let result: unknown[] | null = null;
    if (typeof journey.getAvlData === "function") {
      result = await journey.getAvlData(
        mockDb,
        dateString,
        newGroupId,
        minRange,
        maxRange,
      );
    }

    expect(result).toEqual([]);
  });

  it("maps null latitude/longitude to 0", async () => {
    const mockResults = [
      {
        latitude: null,
        longitude: null,
        recorded_at_time: new Date("2025-09-30T08:00:00.000Z"),
        vehicle_ref: "V1",
        direction_ref: null,
      },
    ];
    mockDb.siriVMPositions.findMany.mockResolvedValue(mockResults as never);

    const dateString = "2025-09-30";
    const newGroupId = "G1|2025-09-30";
    const minRange = dayjs("2025-09-30T07:00:00.000Z");
    const maxRange = dayjs("2025-09-30T09:00:00.000Z");

    let result: unknown[] | null = null;
    if (typeof journey.getAvlData === "function") {
      result = await journey.getAvlData(
        mockDb,
        dateString,
        newGroupId,
        minRange,
        maxRange,
      );
    }

    expect(result?.[0]).toEqual({
      latitude: 0,
      longitude: 0,
      recordedAtTimeUtc: "2025-09-30T08:00:00.000Z",
      vehicleRef: "V1",
      directionRef: "unknown",
    });
  });
});

describe("getJourney", () => {
  beforeEach(() => {
    jest
      .spyOn(mockDb.timetable, "findMany")
      .mockResolvedValue(stopsData as never);
  });
  it("returns journey data with stops and avls", async () => {
    // Mock user session
    (helpers.requireUserSession as jest.Mock).mockResolvedValue({
      id: 123,
      orgs: [{ id: 10 }],
    });

    // Mock avl data returned by db.siriVMPositions.findMany
    const avlData = [
      {
        recorded_at_time: new Date("2025-09-01T08:00:30.000Z"),
        latitude: 51.5,
        longitude: -0.1,
        vehicle_ref: "V1",
        direction_ref: "inbound",
      },
      {
        recorded_at_time: new Date("2025-09-01T08:11:30.000Z"),
        latitude: 51.6,
        longitude: -0.2,
        vehicle_ref: "V1",
        direction_ref: "inbound",
      },
    ];

    // Only mock db.siriVMPositions.findMany inside getAvlData
    jest
      .spyOn(mockDb.siriVMPositions, "findMany")
      .mockResolvedValueOnce(avlData as never);

    // You may need to mock how stopsData is fetched if getJourney does a DB call for stops
    // For this example, assume getJourney uses stopsData and avlData as above

    // Prepare args for getJourney
    const args = {
      groupId: "G1|L1|2025-09-01",
      lineId: "L1",
    };

    let result: Partial<JourneyResult> | null = null;
    if (typeof journey.getJourney === "function") {
      result = await journey.getJourney(
        {},
        args,
        { ...context, db: mockDb },
        {} as GraphQLResolveInfo,
      );
    }

    expect(result).not.toBeNull();
    expect(result?.stops?.length).toBe(2);
    expect(result?.stops?.[0].stopName).toBe("Stop A");
    expect(result?.stops?.[1].stopName).toBe("Stop B");
    expect(result?.avls?.length).toBe(2);
    expect(result?.avls?.[0].vehicleRef).toBe("V1");
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.siriVMPositions.findMany).toHaveBeenCalled();
  });

  it("returns empty avls if no AVL data found", async () => {
    (helpers.requireUserSession as jest.Mock).mockResolvedValue({
      id: 123,
      orgs: [{ id: 10 }],
    });
    jest.spyOn(mockDb.siriVMPositions, "findMany").mockResolvedValueOnce([]);

    const args = {
      groupId: "G1|L1|2025-09-01",
      lineId: "L1",
    };

    let result: Partial<JourneyResult> | null = null;
    if (typeof journey.getJourney === "function") {
      result = await journey.getJourney(
        {},
        args,
        { ...context, db: mockDb },
        {} as GraphQLResolveInfo,
      );
    }

    expect(result).not.toBeNull();
    expect(result?.avls).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.siriVMPositions.findMany).toHaveBeenCalled();
  });

  it("throws BAD_USER_INPUT error if groupId does not contain pipe", async () => {
    (helpers.requireUserSession as jest.Mock).mockResolvedValue({
      id: 123,
      orgs: [{ id: 10 }],
    });

    const args = {
      groupId: "G1L12025-09-01", // No pipe
      lineId: "L1",
    };

    if (typeof journey.getJourney === "function") {
      await expect(
        journey.getJourney(
          {},
          args,
          { ...context, db: mockDb },
          {} as GraphQLResolveInfo,
        ),
      ).rejects.toMatchObject({
        message: "Wrong group id format",
        extensions: {
          code: "BAD_USER_INPUT",
          http: { status: 400 },
        },
      });
    } else {
      fail("getJourney is not a function");
    }
  });

  it("calls getAvlData only for days within the buffer range", async () => {
    // Spy on getAvlData
    const getAvlData = jest
      .spyOn(
        journey,
        "getAvlData", // If getAvlData is not exported, use jest.spyOn(context.db, "siriVMPositions.findMany")
      )
      .mockResolvedValue([] as never);

    // Prepare args
    const args = {
      groupId: "prefix|2025-09-01",
      lineId: "L1",
    };

    if (typeof journey.getJourney === "function") {
      await journey.getJourney(
        {},
        args,
        { ...context, db: mockDb },
        {} as GraphQLResolveInfo,
      );
    }

    // Assert: getAvlData should be called for each day in the buffer range
    // Buffer is 4 hours before first stop and 4 hours after last stop
    const minRange = dayjs("2025-09-01T08:00:00.000Z").subtract(4, "hours");
    const maxRange = dayjs("2025-09-01T08:10:00.000Z").add(4, "hours");

    // Should call for 2025-09-01 only (since min and max are same day)
    expect(getAvlData).toHaveBeenCalledTimes(1);

    // Check the arguments for the call
    const expectedDateString = "2025-09-01";
    const expectedGroupId = "prefix|2025-09-01";
    expect(getAvlData).toHaveBeenCalledWith(
      mockDb,
      expectedDateString,
      expectedGroupId,
      minRange,
      maxRange,
    );
  });

  it("calls getAvlData only for days within the buffer range for GMT time zone", async () => {
    // Spy on getAvlData
    const getAvlData = jest
      .spyOn(
        journey,
        "getAvlData", // If getAvlData is not exported, use jest.spyOn(context.db, "siriVMPositions.findMany")
      )
      .mockResolvedValue([] as never);

    // Prepare args
    const args = {
      groupId: "prefix|2025-02-01",
      lineId: "L1",
    };

    const gmtStops = [
      {
        stop_id: 1,
        common_name: "Stop A",
        stop_latitude: 51.5,
        stop_longitude: -0.1,
        expected_departure_time: new Date("2025-02-01T08:00:00.000Z"),
        actual_departure_time: new Date("2025-02-01T08:01:00.000Z"),
        timestamp_after_estimate: new Date("2025-02-01T08:02:00.000Z"),
        is_timing_point: true,
        direction: "inbound",
        incomplete_reason: 0,
        set_down: false,
        stop_index: 0,
        otp_state: "OnTime",
      },
      {
        stop_id: 2,
        common_name: "Stop B",
        stop_latitude: 51.6,
        stop_longitude: -0.2,
        expected_departure_time: new Date("2025-02-01T08:10:00.000Z"),
        actual_departure_time: new Date("2025-02-01T08:11:00.000Z"),
        timestamp_after_estimate: new Date("2025-02-01T08:12:00.000Z"),
        is_timing_point: false,
        direction: "inbound",
        incomplete_reason: 0,
        set_down: false,
        stop_index: 1,
        otp_state: "Late",
      },
    ];

    jest
      .spyOn(mockDb.timetable, "findMany")
      .mockResolvedValue(gmtStops as never);

    if (typeof journey.getJourney === "function") {
      await journey.getJourney(
        {},
        args,
        { ...context, db: mockDb },
        {} as GraphQLResolveInfo,
      );
    }

    // Assert: getAvlData should be called for each day in the buffer range
    // Buffer is 4 hours before first stop and 4 hours after last stop
    const minRange = dayjs("2025-02-01T08:00:00.000Z").subtract(4, "hours");
    const maxRange = dayjs("2025-02-01T08:10:00.000Z").add(4, "hours");

    // Should call for 2025-02-01 only (since min and max are same day)
    expect(getAvlData).toHaveBeenCalledTimes(1);

    // Check the arguments for the call
    const expectedDateString = "2025-02-01";
    const expectedGroupId = "prefix|2025-02-01";
    expect(getAvlData).toHaveBeenCalledWith(
      mockDb,
      expectedDateString,
      expectedGroupId,
      minRange,
      maxRange,
    );
  });

  it("calls getAvlData only for days within the buffer range with min range to previous day", async () => {
    // Spy on getAvlData
    const getAvlData = jest
      .spyOn(
        journey,
        "getAvlData", // If getAvlData is not exported, use jest.spyOn(context.db, "siriVMPositions.findMany")
      )
      .mockResolvedValue([] as never);

    // Prepare args
    const args = {
      groupId: "prefix|2025-09-01",
      lineId: "L1",
    };

    const stops = [
      {
        stop_id: 1,
        common_name: "Stop A",
        stop_latitude: 51.5,
        stop_longitude: -0.1,
        expected_departure_time: new Date("2025-09-01T02:00:00.000Z"),
        actual_departure_time: new Date("2025-09-01T02:01:00.000Z"),
        timestamp_after_estimate: new Date("2025-09-01T02:02:00.000Z"),
        is_timing_point: true,
        direction: "inbound",
        incomplete_reason: 0,
        set_down: false,
        stop_index: 0,
        otp_state: "OnTime",
      },
      {
        stop_id: 2,
        common_name: "Stop B",
        stop_latitude: 51.6,
        stop_longitude: -0.2,
        expected_departure_time: new Date("2025-09-01T08:10:00.000Z"),
        actual_departure_time: new Date("2025-09-01T08:11:00.000Z"),
        timestamp_after_estimate: new Date("2025-09-01T08:12:00.000Z"),
        is_timing_point: false,
        direction: "inbound",
        incomplete_reason: 0,
        set_down: false,
        stop_index: 1,
        otp_state: "Late",
      },
    ];

    jest.spyOn(mockDb.timetable, "findMany").mockResolvedValue(stops as never);

    if (typeof journey.getJourney === "function") {
      await journey.getJourney(
        {},
        args,
        { ...context, db: mockDb },
        {} as GraphQLResolveInfo,
      );
    }

    // Assert: getAvlData should be called for each day in the buffer range
    // Buffer is 4 hours before first stop and 4 hours after last stop
    const minRange = dayjs("2025-09-01T02:00:00.000Z").subtract(4, "hours");
    const maxRange = dayjs("2025-09-01T08:10:00.000Z").add(4, "hours");

    // Should call for 2025-09-01 only (since min and max are same day)
    expect(getAvlData).toHaveBeenCalledTimes(2);

    // Check the arguments for the call
    expect(getAvlData).toHaveBeenNthCalledWith(
      1,
      mockDb,
      "2025-08-31",
      "prefix|2025-08-31",
      minRange,
      maxRange,
    );

    // Second call
    expect(getAvlData).toHaveBeenNthCalledWith(
      2,
      mockDb,
      "2025-09-01",
      "prefix|2025-09-01",
      minRange,
      maxRange,
    );
  });
});

describe("findJourneys", () => {
  it("returns mapped journeys for valid lineId and dateOfJourney", async () => {
    mockDb.expected_journeys.findMany.mockResolvedValue([
      {
        expected_journey_start: new Date("2025-09-30T08:00:00.000Z"),
        group_id: "G1",
        journey_pattern_description: "Service Pattern 1",
        direction: "inbound",
        is_cancelled: false,
        vehicle_journey_id: "VJ1",
        expected_services: {
          line_name: "Line 1",
          expected_operator: {
            operator_noc: "OP1",
            operator_name: "Operator One",
          },
        },
      },
      {
        expected_journey_start: new Date("2025-09-30T09:00:00.000Z"),
        group_id: "G2",
        journey_pattern_description: "Service Pattern 2",
        direction: "outbound",
        is_cancelled: true,
        vehicle_journey_id: "VJ2",
        expected_services: {
          line_name: "Line 2",
          expected_operator: {
            operator_noc: "OP2",
            operator_name: "Operator Two",
          },
        },
      },
    ] as never);

    const args = {
      lineId: "OP1-L1-S1",
      dateOfJourney: "2025-09-30",
    };

    let result: Journey[] | null = null;
    if (typeof journey.findJourneys === "function") {
      result = (await journey.findJourneys(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Journey[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      groupId: "G1",
      directionRef: "inbound",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      startTime: expect.any(String),
      serviceName: "Service Pattern 1",
      serviceNumber: "Line 1",
      isCancelled: false,
      operatorNoc: "OP1",
      operatorName: "Operator One",
      vehicleJourneyId: "VJ1",
    });

    expect(result?.[1]).toEqual({
      groupId: "G2",
      directionRef: "outbound",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      startTime: expect.any(String),
      serviceName: "Service Pattern 2",
      serviceNumber: "Line 2",
      isCancelled: true,
      operatorNoc: "OP2",
      operatorName: "Operator Two",
      vehicleJourneyId: "VJ2",
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.expected_journeys.findMany).toHaveBeenCalledWith({
      where: {
        noc_and_line_and_servicecode: "OP1-L1-S1",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        date_of_journey: expect.any(Date),
      },
      select: {
        expected_journey_start: true,
        group_id: true,
        journey_pattern_description: true,
        direction: true,
        is_cancelled: true,
        vehicle_journey_id: true,
        expected_services: {
          select: {
            line_name: true,
            expected_operator: {
              select: {
                operator_noc: true,
                operator_name: true,
              },
            },
          },
        },
      },
    });
  });

  it("returns empty array when no journeys found", async () => {
    mockDb.expected_journeys.findMany.mockResolvedValue([] as never);

    const args = {
      lineId: "OP1-L1-S1",
      dateOfJourney: "2025-09-30",
    };

    let result: Journey[] | null = null;
    if (typeof journey.findJourneys === "function") {
      result = (await journey.findJourneys(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Journey[];
    }

    expect(result).toEqual([]);
  });
});

describe("getServicePatternDistanceGeom", () => {
  it("returns distance and geometry when found", async () => {
    const mockResult = {
      distance: 1234,
      geom: '{"type":"LineString","coordinates":[[1.1,2.2],[3.3,4.4]]}',
    };
    jest
      .spyOn(kyselyLib, "executeQueryTakeFirst")
      .mockResolvedValue(mockResult);

    const args = { vehicleJourneyId: "VJ1" };
    let result: Partial<ServicePatternDistanceResult> | null = null;
    if (typeof journey.getServicePatternDistanceGeom === "function") {
      result = await journey.getServicePatternDistanceGeom(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result).not.toBeNull();
    expect(result?.distance).toBe(1234);
    expect(result?.geom).toEqual([
      [1.1, 2.2],
      [3.3, 4.4],
    ]);
  });

  it("throws error when no result found", async () => {
    jest.spyOn(kyselyLib, "executeQueryTakeFirst").mockResolvedValue(null);

    const args = { vehicleJourneyId: "VJ2" };

    if (typeof journey.getServicePatternDistanceGeom === "function") {
      await expect(
        journey.getServicePatternDistanceGeom(
          {},
          args,
          context,
          {} as GraphQLResolveInfo,
        ),
      ).rejects.toThrow(
        "No service pattern distance found for vehicle journey ID VJ2",
      );
    }
  });

  it("parses empty geometry as undefined coordinates", async () => {
    const mockResult = {
      distance: 567,
      geom: "",
    };
    jest
      .spyOn(kyselyLib, "executeQueryTakeFirst")
      .mockResolvedValue(mockResult);

    const args = { vehicleJourneyId: "VJ3" };
    let result: Partial<ServicePatternDistanceResult> | null = null;
    if (typeof journey.getServicePatternDistanceGeom === "function") {
      result = await journey.getServicePatternDistanceGeom(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      );
    }

    expect(result).not.toBeNull();
    expect(result?.distance).toBe(567);
    expect((result?.geom as number[][]).length).toBe(0);
  });
});
