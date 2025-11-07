import { TestBed } from "@angular/core/testing";
import { AgGridModule } from "ag-grid-angular";
import {
  ApolloTestingController,
  ApolloTestingModule,
} from "apollo-angular/testing";
import { GraphQLError } from "graphql";
import { DateTime } from "luxon";
import {
  EventStatsDocument,
  EventsDocument,
  FeedMonitoringListDocument,
  OperatorHistoricStatsDocument,
  OperatorListDocument,
  OperatorLiveStatusDocument,
  OperatorSparklineStatsDocument,
} from "../../generated/graphql";
import { FeedMonitoringService } from "./feed-monitoring.service";

describe("FeedMonitoringService", () => {
  let service: FeedMonitoringService;
  let controller: ApolloTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule, AgGridModule],
    });
    service = TestBed.inject(FeedMonitoringService);
    controller = TestBed.inject(ApolloTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it("should be created", async () => {
    await expect(service).toBeTruthy();
  });

  describe("listOperators", () => {
    it("should fetch list of operators", (done: DoneFn) => {
      service.listOperators.subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual(
          jasmine.objectContaining({
            operatorId: "OP001",
            name: "Operator 1",
          }),
        );
        expect(result[1]).toEqual(
          jasmine.objectContaining({
            operatorId: "OP002",
            name: "Operator 2",
          }),
        );
        done();
      });

      const op = controller.expectOne(OperatorListDocument);
      op.flush({
        data: {
          operators: [
            {
              __typename: "OperatorType" as const,
              operatorId: "OP001",
              name: "Operator 1",
              nocCode: "NOC001",
              adminAreaIds: ["AA001"],
            },
            {
              __typename: "OperatorType" as const,
              operatorId: "OP002",
              name: "Operator 2",
              nocCode: "NOC002",
              adminAreaIds: ["AA002"],
            },
          ],
        },
      });
    });

    it("should handle empty operators list", (done: DoneFn) => {
      service.listOperators.subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const op = controller.expectOne(OperatorListDocument);
      op.flush({
        data: {
          operators: [],
        },
      });
    });
  });

  describe("fetchFeedMonitoringList", () => {
    it("should fetch feed monitoring list", (done: DoneFn) => {
      service.fetchFeedMonitoringList().subscribe((result) => {
        expect(result?.length).toBe(2);
        expect(result?.[0]).toEqual(
          jasmine.objectContaining({
            operatorId: "OP001",
            name: "Operator 1",
            nocCode: "NOC001",
          }),
        );
        expect(result?.[1]).toEqual(
          jasmine.objectContaining({
            operatorId: "OP002",
            name: "Operator 2",
            nocCode: "NOC002",
          }),
        );
        done();
      });

      const op = controller.expectOne(FeedMonitoringListDocument);
      op.flush({
        data: {
          operatorsFeedMonitoring: [
            {
              __typename: "OperatorFeedMonitoring" as const,
              operatorId: "OP001",
              name: "Operator 1",
              nocCode: "NOC001",
              feedMonitoring: {
                __typename: "FeedMonitoringType" as const,
                feedStatus: null,
                availability: null,
                lastOutage: null,
                unavailableSince: null,
                liveStats: {
                  __typename: "LiveStatsType" as const,
                  updateFrequency: null,
                },
              },
            },
            {
              __typename: "OperatorFeedMonitoring" as const,
              operatorId: "OP002",
              name: "Operator 2",
              nocCode: "NOC002",
              feedMonitoring: {
                __typename: "FeedMonitoringType" as const,
                feedStatus: null,
                availability: null,
                lastOutage: null,
                unavailableSince: null,
                liveStats: {
                  __typename: "LiveStatsType" as const,
                  updateFrequency: null,
                },
              },
            },
          ],
        },
      });
    });

    it("should warn when no operators configured", (done: DoneFn) => {
      spyOn(console, "warn");

      service.fetchFeedMonitoringList().subscribe((result) => {
        expect(result).toEqual([]);
        expect(console.warn).toHaveBeenCalledWith(
          "No operators configured for user.",
        );
        done();
      });

      const op = controller.expectOne(FeedMonitoringListDocument);
      op.flush({
        data: {
          operatorsFeedMonitoring: [],
        },
      });
    });

    it("should return null on error", (done: DoneFn) => {
      service.fetchFeedMonitoringList().subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const op = controller.expectOne(FeedMonitoringListDocument);
      op.networkError({ name: "NetworkError", message: "Network error" });
    });
  });

  describe("fetchOperatorSparklines", () => {
    it("should fetch sparkline stats for operators", (done: DoneFn) => {
      const operatorIds = ["OP001", "OP002"];

      service.fetchOperatorSparklines(operatorIds).subscribe((result) => {
        expect(result).toBeDefined();
        expect(result?.length).toBe(2);
        expect(result?.[0].operatorId).toBe("OP001");
        expect(result?.[0].last24Hours.length).toBe(2);
        done();
      });

      const op = controller.expectOne(OperatorSparklineStatsDocument);
      expect(op.operation.variables.operatorIds).toEqual(operatorIds);
      op.flush({
        data: {
          operatorsFeedMonitoring: [
            {
              __typename: "OperatorFeedMonitoring" as const,
              nocCode: "NOC001",
              operatorId: "OP001",
              feedMonitoring: {
                __typename: "FeedMonitoringType" as const,
                liveStats: {
                  __typename: "LiveStatsType" as const,
                  last24Hours: [
                    {
                      __typename: "VehicleStatsType" as const,
                      actual: 10,
                      expected: 12,
                      timestamp: "2021-05-01T00:00:00Z",
                    },
                    {
                      __typename: "VehicleStatsType" as const,
                      actual: 12,
                      expected: 14,
                      timestamp: "2021-05-01T01:00:00Z",
                    },
                  ],
                },
              },
            },
            {
              __typename: "OperatorFeedMonitoring" as const,
              nocCode: "NOC002",
              operatorId: "OP002",
              feedMonitoring: {
                __typename: "FeedMonitoringType" as const,
                liveStats: {
                  __typename: "LiveStatsType" as const,
                  last24Hours: [
                    {
                      __typename: "VehicleStatsType" as const,
                      actual: 5,
                      expected: 6,
                      timestamp: "2021-05-01T00:00:00Z",
                    },
                    {
                      __typename: "VehicleStatsType" as const,
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
    });

    it("should warn and return null when sparkline stats fetch fails", (done: DoneFn) => {
      spyOn(console, "warn");

      service.fetchOperatorSparklines(["OP001"]).subscribe((result) => {
        expect(result).toBeNull();
        expect(console.warn).toHaveBeenCalledWith(
          "Failed to fetch sparkline stats",
          ["OP001"],
        );
        done();
      });

      const op = controller.expectOne(OperatorSparklineStatsDocument);
      op.flush({
        data: {
          operatorsFeedMonitoring: null,
        },
      });
    });

    it("should handle operators with missing feedMonitoring data", (done: DoneFn) => {
      service.fetchOperatorSparklines(["OP001"]).subscribe((result) => {
        expect(result).toBeDefined();
        expect(result?.[0].last24Hours).toEqual([]);
        done();
      });

      const op = controller.expectOne(OperatorSparklineStatsDocument);
      op.flush({
        data: {
          operatorsFeedMonitoring: [
            {
              __typename: "OperatorFeedMonitoring" as const,
              nocCode: "NOC001",
              operatorId: "OP001",
              feedMonitoring: null,
            },
          ],
        },
      });
    });
  });

  describe("fetchOperator", () => {
    it("should fetch operator live status", (done: DoneFn) => {
      service.fetchOperator("OP001").subscribe((result) => {
        expect(result).toEqual(
          jasmine.objectContaining({
            operatorId: "OP001",
            name: "Operator 1",
            nocCode: "NOC001",
            feedMonitoring: jasmine.objectContaining({
              liveStats: jasmine.anything(),
            }),
          }),
        );
        done();
      });

      const op = controller.expectOne(OperatorLiveStatusDocument);
      expect(op.operation.variables.operatorId).toBe("OP001");
      op.flush({
        data: {
          operatorFeedMonitoring: {
            __typename: "OperatorFeedMonitoring" as const,
            operatorId: "OP001",
            name: "Operator 1",
            nocCode: "NOC001",
            feedMonitoring: {
              __typename: "FeedMonitoringType" as const,
              feedStatus: null,
              availability: null,
              lastOutage: null,
              unavailableSince: null,
              liveStats: {
                __typename: "LiveStatsType" as const,
                updateFrequency: null,
                currentVehicles: null,
                expectedVehicles: null,
                last24Hours: null,
                last20Minutes: null,
              },
            },
          },
        },
      });
    });

    it("should return null when operator not found", (done: DoneFn) => {
      service.fetchOperator("OP999").subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const op = controller.expectOne(OperatorLiveStatusDocument);
      op.flush({
        data: {
          operatorFeedMonitoring: null,
        },
      });
    });

    it("should throw error when GraphQL errors present", (done: DoneFn) => {
      service.fetchOperator("OP001").subscribe({
        error: (err: Error) => {
          expect(err.message).toContain("Error 1");
          expect(err.message).toContain("Error 2");
          done();
        },
      });

      const op = controller.expectOne(OperatorLiveStatusDocument);
      op.flush({
        data: {
          operatorFeedMonitoring: null,
        },
        errors: [
          { message: "Error 1" } as GraphQLError,
          { message: "Error 2" } as GraphQLError,
        ],
      });
    });
  });

  describe("fetchOperatorHistory", () => {
    it("should fetch operator historic stats", (done: DoneFn) => {
      const date = DateTime.fromISO("2021-05-05");

      service.fetchOperatorHistory("OP001", date).subscribe((result) => {
        expect(result).toEqual(
          jasmine.objectContaining({
            operatorId: "OP001",
            name: "Operator 1",
            nocCode: "NOC001",
            feedMonitoring: jasmine.objectContaining({
              historicalStats: jasmine.anything(),
            }),
          }),
        );
        done();
      });

      const op = controller.expectOne(OperatorHistoricStatsDocument);
      expect(op.operation.variables.operatorId).toBe("OP001");
      expect(op.operation.variables.date).toBe("2021-05-05");
      expect(op.operation.variables.start).toBe(
        date.startOf("day").toUTC().toISO(),
      );
      expect(op.operation.variables.end).toBe(
        date.endOf("day").toUTC().toISO(),
      );
      op.flush({
        data: {
          operatorFeedMonitoring: {
            __typename: "OperatorFeedMonitoring" as const,
            operatorId: "OP001",
            name: "Operator 1",
            nocCode: "NOC001",
            feedMonitoring: {
              __typename: "FeedMonitoringType" as const,
              historicalStats: {
                __typename: "HistoricalStatsType" as const,
                updateFrequency: null,
                availability: null,
              },
              vehicleStats: [],
            },
          },
        },
      });
    });
  });

  describe("fetchAlerts", () => {
    it("should fetch alerts for date range", (done: DoneFn) => {
      const start = DateTime.fromISO("2021-05-01T00:00:00");
      const end = DateTime.fromISO("2021-05-05T23:59:59");

      service.fetchAlerts("OP001", start, end).subscribe((result) => {
        expect(result?.length).toBe(2);
        expect(result?.[0]).toEqual(
          jasmine.objectContaining({
            type: "ALERT",
            timestamp: "2021-05-02T10:00:00",
            data: jasmine.objectContaining({ message: "Alert message 1" }),
          }),
        );
        expect(result?.[1]).toEqual(
          jasmine.objectContaining({
            type: "WARNING",
            timestamp: "2021-05-03T15:30:00",
            data: jasmine.objectContaining({ message: "Warning message 2" }),
          }),
        );
        done();
      });

      const op = controller.expectOne(EventsDocument);
      expect(op.operation.variables.operatorId).toBe("OP001");
      expect(op.operation.variables.start).toBe(start.toUTC().toISO());
      expect(op.operation.variables.end).toBe(end.toUTC().toISO());

      op.flush({
        data: {
          events: {
            items: [
              {
                __typename: "EventType" as const,
                type: "ALERT",
                timestamp: "2021-05-02T10:00:00",
                data: { message: "Alert message 1" },
              },
              {
                __typename: "EventType" as const,
                type: "WARNING",
                timestamp: "2021-05-03T15:30:00",
                data: { message: "Warning message 2" },
              },
            ],
          },
        },
      });
    });

    it("should return null when events data is missing", (done: DoneFn) => {
      const start = DateTime.fromISO("2021-05-01");
      const end = DateTime.fromISO("2021-05-05");

      service.fetchAlerts("OP001", start, end).subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const op = controller.expectOne(EventsDocument);
      op.flush({
        data: {
          events: null,
        },
      });
    });
  });

  it("should send dates in UTC", async () => {
    service
      .fetchAlertStats(
        "OP01",
        DateTime.fromISO("2021-05-05T14:30:00.000+01:00"),
      )
      .subscribe((stats) => {
        void expect(stats).not.toBeNull();
      });

    const op = controller.expectOne(EventStatsDocument);

    await expect(op.operation.variables.operatorId).toEqual("OP01");
    await expect(op.operation.variables.start).toEqual(
      DateTime.local(2021, 2, 4).toUTC().toISO(),
    );
    await expect(op.operation.variables.end).toEqual(
      DateTime.local(2021, 5, 5).toUTC().toISO(),
    );

    op.flush({
      data: {
        eventStats: [
          {
            day: new Date(),
            count: 3,
          },
        ],
      },
    });
  });

  describe("fetchAlertStats", () => {
    it("should fetch alert stats with custom days parameter", (done: DoneFn) => {
      const end = DateTime.fromISO("2021-05-05");
      const mockStats = [
        { day: "2021-03-05", count: 5 },
        { day: "2021-04-05", count: 3 },
        { day: "2021-05-05", count: 7 },
      ];

      service.fetchAlertStats("OP001", end, 60).subscribe((result) => {
        expect(result.length).toBe(3);
        done();
      });

      const op = controller.expectOne(EventStatsDocument);
      expect(op.operation.variables.operatorId).toBe("OP001");
      expect(op.operation.variables.start).toBe(
        end.minus({ days: 60 }).startOf("day").toUTC().toISO(),
      );
      expect(op.operation.variables.end).toBe(
        end.startOf("day").toUTC().toISO(),
      );
      op.flush({
        data: {
          eventStats: mockStats,
        },
      });
    });

    it("should filter out null values from event stats", (done: DoneFn) => {
      const end = DateTime.fromISO("2021-05-05");
      const mockStats = [
        { day: "2021-05-01", count: 5 },
        null,
        { day: "2021-05-03", count: 3 },
        null,
      ];

      service.fetchAlertStats("OP001", end).subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].day).toBe("2021-05-01");
        expect(result[1].day).toBe("2021-05-03");
        done();
      });

      const op = controller.expectOne(EventStatsDocument);
      op.flush({
        data: {
          eventStats: mockStats,
        },
      });
    });
  });
});
