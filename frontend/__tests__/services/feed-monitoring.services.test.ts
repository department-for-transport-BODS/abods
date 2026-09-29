import { feedMonitoringService } from "@/services/feed-monitoring/feed-monitoring.services";
import {
  EventsDocument,
  EventStatsDocument,
  FeedMonitoringListDocument,
  OperatorHistoricStatsDocument,
  OperatorLiveStatusDocument,
  OperatorSparklineStatsDocument,
} from "@/src/generated/graphql";

const mockQuery = vi.fn();

vi.mock("@/services/apolloClient", () => ({
  apolloClient: {
    query: (...args: unknown[]) => mockQuery(...args),
  },
}));

describe("feedMonitoringService", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe("fetchFeedMonitoringList", () => {
    it("should fetch the feed monitoring list", async () => {
      const mockOperators = [
        {
          operatorId: "OP001",
          name: "Operator 1",
          nocCode: "NOC001",
          feedMonitoring: {
            feedStatus: null,
            availability: null,
            lastOutage: null,
            unavailableSince: null,
            liveStats: { updateFrequency: null },
          },
        },
        {
          operatorId: "OP002",
          name: "Operator 2",
          nocCode: "NOC002",
          feedMonitoring: {
            feedStatus: null,
            availability: null,
            lastOutage: null,
            unavailableSince: null,
            liveStats: { updateFrequency: null },
          },
        },
      ];

      mockQuery.mockResolvedValue({
        data: { operatorsFeedMonitoring: mockOperators },
      });

      const result = await feedMonitoringService.fetchFeedMonitoringList();

      expect(mockQuery).toHaveBeenCalledWith({
        query: FeedMonitoringListDocument,
      });
      expect(result.length).toBe(2);
      expect(result[0]).toMatchObject({
        operatorId: "OP001",
        name: "Operator 1",
        nocCode: "NOC001",
      });
      expect(result[1]).toMatchObject({
        operatorId: "OP002",
        name: "Operator 2",
        nocCode: "NOC002",
      });
    });

    it("should return an empty array when operatorsFeedMonitoring is null", async () => {
      mockQuery.mockResolvedValue({
        data: { operatorsFeedMonitoring: null },
      });

      const result = await feedMonitoringService.fetchFeedMonitoringList();

      expect(result).toEqual([]);
    });

    it("should return an empty array when the query throws an error", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      const result = await feedMonitoringService.fetchFeedMonitoringList();

      expect(result).toEqual([]);
    });
  });

  describe("fetchOperatorSparklines", () => {
    const operatorIds = ["OP001", "OP002"];

    it("should fetch sparkline stats for operators", async () => {
      mockQuery.mockResolvedValue({
        data: {
          operatorsFeedMonitoring: [
            {
              operatorId: "OP001",
              feedMonitoring: {
                liveStats: {
                  last24Hours: [
                    {
                      actual: 10,
                      expected: 12,
                      timestamp: "2021-05-01T00:00:00Z",
                    },
                    {
                      actual: 12,
                      expected: 14,
                      timestamp: "2021-05-01T01:00:00Z",
                    },
                  ],
                },
              },
            },
            {
              operatorId: "OP002",
              feedMonitoring: {
                liveStats: {
                  last24Hours: [
                    {
                      actual: 5,
                      expected: 6,
                      timestamp: "2021-05-01T00:00:00Z",
                    },
                    {
                      actual: 7,
                      expected: 8,
                      timestamp: "2021-05-01T01:00:00Z",
                    },
                  ],
                },
              },
            },
          ],
        },
      });

      const result =
        await feedMonitoringService.fetchOperatorSparklines(operatorIds);

      expect(mockQuery).toHaveBeenCalledWith({
        query: OperatorSparklineStatsDocument,
        variables: { operatorIds },
      });
      expect(result.length).toBe(2);
      expect(result[0].operatorId).toBe("OP001");
      expect(result[0].last24Hours.length).toBe(2);
      expect(result[1].operatorId).toBe("OP002");
      expect(result[1].last24Hours.length).toBe(2);
    });

    it("should return an empty last24Hours array when feedMonitoring is null", async () => {
      mockQuery.mockResolvedValue({
        data: {
          operatorsFeedMonitoring: [
            { operatorId: "OP001", feedMonitoring: null },
          ],
        },
      });

      const result = await feedMonitoringService.fetchOperatorSparklines([
        "OP001",
      ]);

      expect(result[0].last24Hours).toEqual([]);
    });

    it("should return an empty array when operatorsFeedMonitoring is null", async () => {
      mockQuery.mockResolvedValue({
        data: { operatorsFeedMonitoring: null },
      });

      const result =
        await feedMonitoringService.fetchOperatorSparklines(operatorIds);

      expect(result).toEqual([]);
    });

    it("should return an empty array when the query throws an error", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      const result =
        await feedMonitoringService.fetchOperatorSparklines(operatorIds);

      expect(result).toEqual([]);
    });
  });

  describe("fetchOperatorLiveStatus", () => {
    it("should fetch operator live status", async () => {
      const mockOperator = {
        operatorId: "OP001",
        name: "Operator 1",
        nocCode: "NOC001",
        feedMonitoring: {
          feedStatus: null,
          availability: null,
          lastOutage: null,
          unavailableSince: null,
          liveStats: {
            updateFrequency: null,
            currentVehicles: null,
            expectedVehicles: null,
            last24Hours: null,
            last20Minutes: null,
          },
        },
      };

      mockQuery.mockResolvedValue({
        data: { operatorFeedMonitoring: mockOperator },
      });

      const result =
        await feedMonitoringService.fetchOperatorLiveStatus("OP001");

      expect(mockQuery).toHaveBeenCalledWith({
        query: OperatorLiveStatusDocument,
        variables: { operatorId: "OP001" },
      });
      expect(result).toMatchObject({
        operatorId: "OP001",
        name: "Operator 1",
        nocCode: "NOC001",
      });
    });

    it("should return null when operator is not found", async () => {
      mockQuery.mockResolvedValue({
        data: { operatorFeedMonitoring: null },
      });

      const result =
        await feedMonitoringService.fetchOperatorLiveStatus("OP999");

      expect(result).toBeNull();
    });

    it("should return null when the query throws an error", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      const result =
        await feedMonitoringService.fetchOperatorLiveStatus("OP001");

      expect(result).toBeNull();
    });
  });

  describe("fetchOperatorHistory", () => {
    const historyArgs = {
      operatorId: "OP001",
      date: "2021-05-05",
      start: "2021-05-05T00:00:00.000Z",
      end: "2021-05-05T23:59:59.000Z",
    };

    it("should fetch operator historic stats", async () => {
      const mockHistory = {
        operatorId: "OP001",
        name: "Operator 1",
        nocCode: "NOC001",
        feedMonitoring: {
          historicalStats: { updateFrequency: null, availability: null },
          vehicleStats: [],
        },
      };

      mockQuery.mockResolvedValue({
        data: { operatorFeedMonitoring: mockHistory },
      });

      const result = await feedMonitoringService.fetchOperatorHistory(
        historyArgs.operatorId,
        historyArgs.date,
        historyArgs.start,
        historyArgs.end,
      );

      expect(mockQuery).toHaveBeenCalledWith({
        query: OperatorHistoricStatsDocument,
        variables: {
          operatorId: historyArgs.operatorId,
          date: historyArgs.date,
          start: historyArgs.start,
          end: historyArgs.end,
        },
      });
      expect(result).toMatchObject({
        operatorId: "OP001",
        name: "Operator 1",
        nocCode: "NOC001",
      });
    });

    it("should return null when operatorFeedMonitoring is null", async () => {
      mockQuery.mockResolvedValue({
        data: { operatorFeedMonitoring: null },
      });

      const result = await feedMonitoringService.fetchOperatorHistory(
        historyArgs.operatorId,
        historyArgs.date,
        historyArgs.start,
        historyArgs.end,
      );

      expect(result).toBeNull();
    });

    it("should return null when the query throws an error", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      const result = await feedMonitoringService.fetchOperatorHistory(
        historyArgs.operatorId,
        historyArgs.date,
        historyArgs.start,
        historyArgs.end,
      );

      expect(result).toBeNull();
    });
  });

  describe("fetchEvents", () => {
    const eventsArgs = {
      operatorId: "OP001",
      start: "2021-05-01T00:00:00.000Z",
      end: "2021-05-05T23:59:59.000Z",
    };

    it("should fetch events for a date range", async () => {
      const mockEvents = [
        {
          type: "ALERT",
          timestamp: "2021-05-02T10:00:00",
          data: { message: "Alert message 1" },
        },
        {
          type: "WARNING",
          timestamp: "2021-05-03T15:30:00",
          data: { message: "Warning message 2" },
        },
      ];

      mockQuery.mockResolvedValue({
        data: { events: { items: mockEvents } },
      });

      const result = await feedMonitoringService.fetchEvents(
        eventsArgs.operatorId,
        eventsArgs.start,
        eventsArgs.end,
      );

      expect(mockQuery).toHaveBeenCalledWith({
        query: EventsDocument,
        variables: {
          operatorId: eventsArgs.operatorId,
          start: eventsArgs.start,
          end: eventsArgs.end,
        },
      });
      expect(result.length).toBe(2);
      expect(result[0]).toMatchObject({
        type: "ALERT",
        timestamp: "2021-05-02T10:00:00",
      });
      expect(result[1]).toMatchObject({
        type: "WARNING",
        timestamp: "2021-05-03T15:30:00",
      });
    });

    it("should return an empty array when events is null", async () => {
      mockQuery.mockResolvedValue({ data: { events: null } });

      const result = await feedMonitoringService.fetchEvents(
        eventsArgs.operatorId,
        eventsArgs.start,
        eventsArgs.end,
      );

      expect(result).toEqual([]);
    });

    it("should return an empty array when the query throws", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      const result = await feedMonitoringService.fetchEvents(
        eventsArgs.operatorId,
        eventsArgs.start,
        eventsArgs.end,
      );

      expect(result).toEqual([]);
    });
  });

  describe("fetchEventStats", () => {
    const statsArgs = {
      operatorId: "OP001",
      start: "2021-03-05T00:00:00.000Z",
      end: "2021-05-05T00:00:00.000Z",
    };

    it("should fetch event stats for a date range", async () => {
      const mockStats = [
        { day: "2021-03-05", count: 5 },
        { day: "2021-04-05", count: 3 },
        { day: "2021-05-05", count: 7 },
      ];

      mockQuery.mockResolvedValue({ data: { eventStats: mockStats } });

      const result = await feedMonitoringService.fetchEventStats(
        statsArgs.operatorId,
        statsArgs.start,
        statsArgs.end,
      );

      expect(mockQuery).toHaveBeenCalledWith({
        query: EventStatsDocument,
        variables: {
          operatorId: statsArgs.operatorId,
          start: statsArgs.start,
          end: statsArgs.end,
        },
      });
      expect(result.length).toBe(3);
    });

    it("should return an empty array when eventStats is null", async () => {
      mockQuery.mockResolvedValue({ data: { eventStats: null } });

      const result = await feedMonitoringService.fetchEventStats(
        statsArgs.operatorId,
        statsArgs.start,
        statsArgs.end,
      );

      expect(result).toEqual([]);
    });

    it("should return an empty array when the query throws", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      const result = await feedMonitoringService.fetchEventStats(
        statsArgs.operatorId,
        statsArgs.start,
        statsArgs.end,
      );

      expect(result).toEqual([]);
    });
  });
});
