import { createServiceFactory, SpectatorService } from "@ngneat/spectator";
import { of, throwError } from "rxjs";
import { HeadwayOverviewType } from "../../generated/graphql";
import { HeadwayService } from "./headway.service";
import {
  OnTimeService,
  PerformanceParams,
  PunctualityOverview,
  ServicePerformance,
} from "./on-time.service";
import { PerformanceService } from "./performance.service";

describe("PerformanceService", () => {
  let spectator: SpectatorService<PerformanceService>;
  let onTimeService: jasmine.SpyObj<OnTimeService>;
  let headwayService: jasmine.SpyObj<HeadwayService>;

  const serviceFactory = createServiceFactory({
    service: PerformanceService,
    mocks: [OnTimeService, HeadwayService],
  });

  beforeEach(() => {
    spectator = serviceFactory();
    onTimeService = spectator.inject(
      OnTimeService,
    ) as jasmine.SpyObj<OnTimeService>;
    headwayService = spectator.inject(
      HeadwayService,
    ) as jasmine.SpyObj<HeadwayService>;

    // Set default return values for spies to prevent null errors
    headwayService.fetchOverview.and.returnValue(of({} as HeadwayOverviewType));
  });

  it("should be created", () => {
    expect(spectator.service).toBeTruthy();
  });

  describe("fetchServicePerformance", () => {
    const mockParams: PerformanceParams = {
      filters: {
        lineIds: ["LN001", "LN002"],
      },
      fromTimestamp: "2024-01-01T00:00:00Z",
      toTimestamp: "2024-01-31T23:59:59Z",
    };

    const mockOnTimeData: ServicePerformance[] = [
      {
        lineInfo: {
          serviceId: "SV001",
          lineName: "Line 1",
          serviceNumber: "1",
          serviceName: "Service 1",
        },
        early: 10,
        onTime: 80,
        late: 10,
        total: 100,
        onTimeRatio: 0.8,
        earlyRatio: 0.1,
        lateRatio: 0.1,
        completedRatio: 1.0,
        actualDepartures: 100,
        scheduledDepartures: 100,
      } as ServicePerformance,
      {
        lineInfo: {
          serviceId: "SV002",
          lineName: "Line 2",
          serviceNumber: "2",
          serviceName: "Service 2",
        },
        early: 5,
        onTime: 70,
        late: 25,
        total: 100,
        onTimeRatio: 0.7,
        earlyRatio: 0.05,
        lateRatio: 0.25,
        completedRatio: 1.0,
        actualDepartures: 100,
        scheduledDepartures: 100,
      } as ServicePerformance,
      {
        lineInfo: {
          serviceId: "SV003",
          lineName: "Line 3",
          serviceNumber: "3",
          serviceName: "Service 3",
        },
        early: 15,
        onTime: 75,
        late: 10,
        total: 100,
        onTimeRatio: 0.75,
        earlyRatio: 0.15,
        lateRatio: 0.1,
        completedRatio: 1.0,
        actualDepartures: 100,
        scheduledDepartures: 100,
      } as ServicePerformance,
    ];

    const mockHeadwayData = [
      { serviceId: "SV001", avgHeadway: 10 },
      { serviceId: "SV003", avgHeadway: 12 },
    ];

    it("should merge on-time and headway data with frequent flag", (done: DoneFn) => {
      onTimeService.fetchOnTimePerformanceList.and.returnValue(
        of(mockOnTimeData),
      );
      headwayService.fetchFrequentServices.and.returnValue(of(mockHeadwayData));

      spectator.service
        .fetchServicePerformance(mockParams)
        .subscribe((result) => {
          expect(result.length).toBe(3);
          expect(result[0].frequent).toBe(true); // SV001 is frequent
          expect(result[1].frequent).toBe(false); // SV002 is not frequent
          expect(result[2].frequent).toBe(true); // SV003 is frequent
          expect(onTimeService.fetchOnTimePerformanceList).toHaveBeenCalledWith(
            mockParams,
          );
          expect(headwayService.fetchFrequentServices).toHaveBeenCalledWith(
            mockParams,
          );
          done();
        });
    });

    it("should handle empty frequent services", (done: DoneFn) => {
      onTimeService.fetchOnTimePerformanceList.and.returnValue(
        of(mockOnTimeData),
      );
      headwayService.fetchFrequentServices.and.returnValue(of([]));

      spectator.service
        .fetchServicePerformance(mockParams)
        .subscribe((result) => {
          expect(result.length).toBe(3);
          expect(result.every((item) => item.frequent === false)).toBe(true);
          done();
        });
    });

    it("should handle empty on-time data", (done: DoneFn) => {
      onTimeService.fetchOnTimePerformanceList.and.returnValue(of([]));
      headwayService.fetchFrequentServices.and.returnValue(of(mockHeadwayData));

      spectator.service
        .fetchServicePerformance(mockParams)
        .subscribe((result) => {
          expect(result.length).toBe(0);
          done();
        });
    });
  });

  describe("fetchOverviewStats", () => {
    const mockParams: PerformanceParams = {
      filters: {
        lineIds: ["LN001"],
      },
      fromTimestamp: "2024-01-01T00:00:00Z",
      toTimestamp: "2024-01-31T23:59:59Z",
    };

    const mockOnTimeStats: PunctualityOverview = {
      early: 100,
      onTime: 800,
      late: 100,
      scheduled: 1000,
      completed: 1000,
      incomplete: "0",
      averageDelay: 30,
    } as PunctualityOverview;

    const mockHeadwayStats: HeadwayOverviewType = {
      scheduled: 500,
      freq1: 400,
      freq2: 80,
      freq3: 20,
    } as HeadwayOverviewType;

    it("should fetch both on-time and headway stats when lineIds provided", (done: DoneFn) => {
      onTimeService.fetchOnTimeStats.and.returnValue(of(mockOnTimeStats));
      headwayService.fetchOverview.and.returnValue(of(mockHeadwayStats));

      spectator.service.fetchOverviewStats(mockParams).subscribe((result) => {
        expect(result.onTime).toEqual(mockOnTimeStats);
        expect(result.headway).toEqual(mockHeadwayStats);
        expect(onTimeService.fetchOnTimeStats).toHaveBeenCalledWith(mockParams);
        expect(headwayService.fetchOverview).toHaveBeenCalledWith(mockParams);
        done();
      });
    });

    it("should return undefined headway when no lineIds provided", (done: DoneFn) => {
      const paramsNoLines = {
        ...mockParams,
        filters: { lineIds: [] },
      };
      onTimeService.fetchOnTimeStats.and.returnValue(of(mockOnTimeStats));

      spectator.service
        .fetchOverviewStats(paramsNoLines)
        .subscribe((result) => {
          expect(result.onTime).toEqual(mockOnTimeStats);
          expect(result.headway).toBeUndefined();
          done();
        });
    });

    it("should return undefined headway when lineIds is undefined", (done: DoneFn) => {
      const paramsUndefinedLines = {
        ...mockParams,
        filters: {},
      };
      onTimeService.fetchOnTimeStats.and.returnValue(of(mockOnTimeStats));

      spectator.service
        .fetchOverviewStats(paramsUndefinedLines)
        .subscribe((result) => {
          expect(result.onTime).toEqual(mockOnTimeStats);
          expect(result.headway).toBeUndefined();
          done();
        });
    });

    it("should handle on-time stats error gracefully", (done: DoneFn) => {
      onTimeService.fetchOnTimeStats.and.returnValue(
        throwError(() => new Error("On-time error")),
      );
      headwayService.fetchOverview.and.returnValue(of(mockHeadwayStats));

      spectator.service.fetchOverviewStats(mockParams).subscribe((result) => {
        expect(result.onTime).toBeUndefined();
        expect(result.headway).toEqual(mockHeadwayStats);
        done();
      });
    });

    it("should handle headway stats error gracefully", (done: DoneFn) => {
      onTimeService.fetchOnTimeStats.and.returnValue(of(mockOnTimeStats));
      headwayService.fetchOverview.and.returnValue(
        throwError(() => new Error("Headway error")),
      );

      spectator.service.fetchOverviewStats(mockParams).subscribe((result) => {
        expect(result.onTime).toEqual(mockOnTimeStats);
        expect(result.headway).toBeUndefined();
        done();
      });
    });

    it("should handle both stats erroring gracefully", (done: DoneFn) => {
      onTimeService.fetchOnTimeStats.and.returnValue(
        throwError(() => new Error("On-time error")),
      );
      headwayService.fetchOverview.and.returnValue(
        throwError(() => new Error("Headway error")),
      );

      spectator.service.fetchOverviewStats(mockParams).subscribe((result) => {
        expect(result.onTime).toBeUndefined();
        expect(result.headway).toBeUndefined();
        done();
      });
    });
  });

  describe("fetchOnTimeOverviewStats", () => {
    const mockParams: PerformanceParams = {
      filters: {
        lineIds: ["LN001"],
      },
      fromTimestamp: "2024-01-01T00:00:00Z",
      toTimestamp: "2024-01-31T23:59:59Z",
    };

    const mockOnTimeStats: PunctualityOverview = {
      early: 100,
      onTime: 800,
      late: 100,
      scheduled: 1000,
      completed: 1000,
      incomplete: "0",
      averageDelay: 30,
    } as PunctualityOverview;

    it("should fetch on-time overview stats", (done: DoneFn) => {
      onTimeService.fetchOnTimeStats.and.returnValue(of(mockOnTimeStats));

      spectator.service
        .fetchOnTimeOverviewStats(mockParams)
        .subscribe((result) => {
          expect(result).toEqual(mockOnTimeStats);
          expect(onTimeService.fetchOnTimeStats).toHaveBeenCalledWith(
            mockParams,
          );
          done();
        });
    });

    it("should return undefined on error", (done: DoneFn) => {
      onTimeService.fetchOnTimeStats.and.returnValue(
        throwError(() => new Error("Fetch error")),
      );

      spectator.service
        .fetchOnTimeOverviewStats(mockParams)
        .subscribe((result) => {
          expect(result).toBeUndefined();
          done();
        });
    });
  });

  describe("fetchHeadwayOverviewStats", () => {
    const mockParams: PerformanceParams = {
      filters: {
        lineIds: ["LN001"],
      },
      fromTimestamp: "2024-01-01T00:00:00Z",
      toTimestamp: "2024-01-31T23:59:59Z",
    };

    const mockHeadwayStats: HeadwayOverviewType = {
      scheduled: 500,
      freq1: 400,
      freq2: 80,
      freq3: 20,
    } as HeadwayOverviewType;

    it("should fetch headway overview stats", (done: DoneFn) => {
      headwayService.fetchOverview.and.returnValue(of(mockHeadwayStats));

      spectator.service
        .fetchHeadwayOverviewStats(mockParams)
        .subscribe((result) => {
          expect(result).toEqual(mockHeadwayStats);
          expect(headwayService.fetchOverview).toHaveBeenCalledWith(mockParams);
          done();
        });
    });
  });
});
