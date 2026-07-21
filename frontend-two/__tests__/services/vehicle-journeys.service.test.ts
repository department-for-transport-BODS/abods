import { DateTime, Settings } from "luxon";
import { vehicleJourneysService } from "@/services/vehicle-journeys/vehicle-journeys.service";
import {
  Direction,
  JourneyDocument,
  JourneysDocument,
  JourneysQuery,
  OperatorListDocument,
  ServicePatternDistanceGeomDocument,
} from "@/src/generated/graphql";

const mockQuery = vi.fn();

vi.mock("@/services/apolloClient", () => ({
  apolloClient: {
    query: (...args: unknown[]) => mockQuery(...args),
  },
}));

// The real data has duplicates, as we are only selecting a small subset of fields
const journeysData: JourneysQuery = {
  findJourneys: [
    {
      groupId: "VJ0c5bcd05",
      startTime: "2022-09-01T08:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 1,
    },
    {
      groupId: "VJ41f09c9c",
      startTime: "2022-09-01T08:55:00",
      serviceName: "Worksop - Chesterfield",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Outbound,
      isCancelled: false,
      vehicleJourneyId: 9,
    },
    {
      groupId: "VJ9be619bc",
      startTime: "2022-09-01T07:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 14,
    },
  ],
};

describe("vehicleJourneysService", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    Settings.defaultZone = "utc";
    Settings.now = () => 1663286400000; // 2022-09-16
  });

  describe("fetchOperators", () => {
    it("should fetch operators", async () => {
      const operators = [
        { name: "Best Buses", nocCode: "BBUS", operatorId: "OP1", adminAreaIds: [] },
      ];
      mockQuery.mockResolvedValue({ data: { operators } });

      const result = await vehicleJourneysService.fetchOperators();

      expect(mockQuery).toHaveBeenCalledWith({ query: OperatorListDocument });
      expect(result).toEqual(operators);
    });

    it("should return an empty array when the query throws an error", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      const result = await vehicleJourneysService.fetchOperators();

      expect(result).toEqual([]);
    });
  });

  describe("fetchDayJourneys", () => {
    it("should fetch and sort journeys that have already started", async () => {
      mockQuery.mockResolvedValue({ data: journeysData });

      const result = await vehicleJourneysService.fetchDayJourneys(
        "2022-09-01T00:00",
        "LI12345",
      );

      expect(mockQuery).toHaveBeenCalledWith({
        query: JourneysDocument,
        variables: { dateOfJourney: "2022-09-01T00:00", lineId: "LI12345" },
      });

      expect(result).not.toBeNull();
      expect(result?.length).toEqual(3);
      expect(result?.[0].groupId).toEqual("VJ9be619bc");
      expect(result?.[0].startTime).toEqual("2022-09-01T07:35:00");
      expect(result?.[1].groupId).toEqual("VJ0c5bcd05");
      expect(result?.[1].startTime).toEqual("2022-09-01T08:35:00");
      expect(result?.[2].groupId).toEqual("VJ41f09c9c");
      expect(result?.[2].startTime).toEqual("2022-09-01T08:55:00");
    });

    it("should exclude journeys that have not started yet", async () => {
      mockQuery.mockResolvedValue({
        data: {
          findJourneys: [
            ...journeysData.findJourneys,
            {
              groupId: "VJfuture",
              startTime: "2099-01-01T00:00:00",
              serviceName: "Chesterfield - Worksop",
              serviceNumber: "77",
              operatorName: "Stagecoach",
              operatorNoc: "OP123",
              directionRef: Direction.Inbound,
              isCancelled: false,
              vehicleJourneyId: 99,
            },
          ],
        },
      });

      const result = await vehicleJourneysService.fetchDayJourneys(
        "2022-09-01T00:00",
        "LI12345",
      );

      expect(result?.some((journey) => journey.groupId === "VJfuture")).toBe(
        false,
      );
    });

    it("should return null when the query throws an error", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      const result = await vehicleJourneysService.fetchDayJourneys(
        "2022-09-01T00:00",
        "LI12345",
      );

      expect(result).toBeNull();
    });
  });

  describe("fetchJourney", () => {
    const journey = {
      stops: [
        {
          estimatedDepartureUtc: null,
          actualDepartureUtc: null,
          scheduledDepartureUtc: "2022-09-01T08:35:00Z",
          latitude: 53.35,
          longitude: -1.42,
          stopIndex: 0,
          stopName: "Chesterfield",
          stopId: 1,
          isTimingPoint: true,
          otp: null,
          directionRef: "inbound",
          incompleteReason: 0,
          setDown: false,
        },
      ],
      avls: [
        {
          recordedAtTimeUtc: "2022-09-01T08:35:00Z",
          latitude: 53.35,
          longitude: -1.42,
          vehicleRef: "V1",
          directionRef: "inbound",
        },
      ],
    };

    it("should fetch a journey", async () => {
      mockQuery.mockResolvedValue({ data: { journey } });

      const result = await vehicleJourneysService.fetchJourney(
        "VJ0c5bcd05",
        "LI12345",
      );

      expect(mockQuery).toHaveBeenCalledWith({
        query: JourneyDocument,
        variables: { groupId: "VJ0c5bcd05", lineId: "LI12345" },
      });
      expect(result).toEqual(journey);
    });

    it("should return null when the query throws an error", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      const result = await vehicleJourneysService.fetchJourney(
        "VJ0c5bcd05",
        "LI12345",
      );

      expect(result).toBeNull();
    });
  });

  describe("fetchServicePatternDistanceGeom", () => {
    it("should fetch service pattern distance geometry successfully", async () => {
      mockQuery.mockResolvedValue({
        data: {
          getServicePatternDistanceGeom: {
            distance: 123,
            geom: [
              [0, 0],
              [1, 1],
            ],
          },
        },
      });

      const result =
        await vehicleJourneysService.fetchServicePatternDistanceGeom(
          "patternId",
        );

      expect(mockQuery).toHaveBeenCalledWith({
        query: ServicePatternDistanceGeomDocument,
        variables: { vehicleJourneyId: "patternId" },
      });
      expect(result).toEqual({
        distance: 123,
        geom: [
          [0, 0],
          [1, 1],
        ],
      });
    });

    it("should return null geom when it is not a valid route geometry", async () => {
      mockQuery.mockResolvedValue({
        data: {
          getServicePatternDistanceGeom: {
            distance: 123,
            geom: "not-a-route",
          },
        },
      });

      const result =
        await vehicleJourneysService.fetchServicePatternDistanceGeom(
          "patternId",
        );

      expect(result).toEqual({ distance: 123, geom: null });
    });

    it("should return null when there is no distance geometry", async () => {
      mockQuery.mockResolvedValue({
        data: { getServicePatternDistanceGeom: null },
      });

      const result =
        await vehicleJourneysService.fetchServicePatternDistanceGeom(
          "patternId",
        );

      expect(result).toBeNull();
    });

    it("should return null when the query throws an error", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      const result =
        await vehicleJourneysService.fetchServicePatternDistanceGeom(
          "patternId",
        );

      expect(result).toBeNull();
    });
  });
});
