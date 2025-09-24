import { ApolloQueryResult } from "@apollo/client";
import {
  createServiceFactory,
  SpectatorService,
  SpyObject,
} from "@ngneat/spectator";
import { ApolloTestingModule } from "apollo-angular/testing";
import { DateTime } from "luxon";
import { of } from "rxjs";
import {
  DashboardOperatorListGQL,
  DashboardOperatorVehicleCountsListGQL,
  DashboardPerformanceStatsGQL,
  DashboardPerformanceStatsQuery,
  DashboardServiceRankingGQL,
  DashboardServiceRankingQuery,
  DashboardVehicles,
  OperatorDashboardFragment,
  RankingOrder,
} from "../../generated/graphql";
import { DashboardService } from "./dashboard.service";

fdescribe("DashboardService", () => {
  let spectator: SpectatorService<DashboardService>;
  let service: DashboardService;
  let operatorVehicleCountGql: SpyObject<DashboardOperatorVehicleCountsListGQL>;
  let operatorListGql: SpyObject<DashboardOperatorListGQL>;

  const createService = createServiceFactory({
    service: DashboardService,
    imports: [ApolloTestingModule],
    mocks: [
      DashboardOperatorListGQL,
      DashboardOperatorVehicleCountsListGQL,
      DashboardPerformanceStatsGQL,
      DashboardServiceRankingGQL,
    ],
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.service;
    operatorVehicleCountGql = spectator.inject(
      DashboardOperatorVehicleCountsListGQL,
    );
    operatorVehicleCountGql.fetch.and.returnValue(
      of({
        data: { dashboardVehicles: [] },
        loading: false,
        networkStatus: 7,
        errors: undefined,
      }),
    );

    operatorListGql = spectator.inject(DashboardOperatorListGQL);
    operatorListGql.fetch.and.returnValue(
      of({
        data: { operatorsFeedMonitoring: [] },
        loading: false,
        networkStatus: 7,
        errors: undefined,
      }),
    );
  });

  it("should be created", async () => {
    await expect(spectator.service).toBeTruthy();
  });

  describe("listOperators", () => {
    it("should call fetch on DashboardOperatorListGQL and return list of operators", () => {
      const mockResponse = [
        { name: "op1", nocCode: "OP1" } as OperatorDashboardFragment,
        { name: "op2", nocCode: "OP1" } as OperatorDashboardFragment,
      ];
      operatorListGql.fetch.and.returnValue(
        of({
          data: { operatorsFeedMonitoring: mockResponse },
          loading: false,
          networkStatus: 7,
          errors: undefined,
        }),
      );

      service.listOperators.subscribe((ops) => {
        void expect(ops).toEqual(mockResponse);
      });

      expect(operatorListGql.fetch).toHaveBeenCalledWith({});
    });

    it("should call fetch on DashboardOperatorListGQL and return empty array", () => {
      operatorListGql.fetch.and.returnValue(
        of({
          data: { operatorsFeedMonitoring: [] },
          loading: false,
          networkStatus: 7,
          errors: undefined,
        }),
      );

      service.listOperators.subscribe((ops) => {
        void expect(ops).toEqual([]);
      });

      expect(operatorListGql.fetch).toHaveBeenCalledWith({});
    });
  });

  describe("listOperatorVehicleCounts", () => {
    it("should call fetch on DashboardOperatorVehicleCountsListGQL and return list of counts", () => {
      const mockResponse = [
        {
          nocCode: "OP1",
          feedMonitoring: {
            liveStats: { currentVehicles: 3, expectedVehicles: 3 },
          },
          actual: 3,
          expected: 3,
          operatorId: "OP1",
        } as DashboardVehicles,
        {
          nocCode: "OP2",
          feedMonitoring: {
            liveStats: { currentVehicles: 0, expectedVehicles: 5 },
          },
          actual: 0,
          expected: 5,
          operatorId: "OP2",
        } as DashboardVehicles,
      ];
      const query = spectator.inject(DashboardOperatorVehicleCountsListGQL);
      query.fetch.and.returnValue(
        of({
          data: { dashboardVehicles: mockResponse },
          loading: false,
          networkStatus: 7,
          errors: undefined,
        }),
      );

      service.listOperatorVehicleCounts.subscribe((ops) => {
        void expect(ops).toEqual(mockResponse);
      });

      expect(query.fetch).toHaveBeenCalledWith({});
    });

    it("should call fetch on DashboardOperatorVehicleCountsListGQL and return empty array", () => {
      operatorVehicleCountGql.fetch.and.returnValue(
        of({
          data: { dashboardVehicles: [] },
          loading: false,
          networkStatus: 7,
        }),
      );

      service.listOperatorVehicleCounts.subscribe((ops) => {
        void expect(ops).toEqual([]);
      });

      expect(operatorVehicleCountGql.fetch).toHaveBeenCalledWith({});
    });
  });

  describe("getPunctualityStats", () => {
    it("should call fetch on DashboardPerformanceStatsGQL and return punctuality result", () => {
      const mockResponse = {
        onTime: 5,
        late: 10,
        early: 3,
      };
      const query = spectator.inject(DashboardPerformanceStatsGQL);
      query.fetch.and.returnValue(
        of({
          data: { onTimePerformance: { punctualityOverview: mockResponse } },
          loading: false,
          networkStatus: 7,
          errors: undefined,
        } as ApolloQueryResult<DashboardPerformanceStatsQuery>),
      );

      const filters = {
        nocCodes: ["OP1"],
        timingPointsOnly: true,
      };
      const from = DateTime.now().toUTC();
      const to = DateTime.now().plus({ days: 28 }).toUTC();
      service.getPunctualityStats(filters, from, to).subscribe((ops) => {
        void expect(ops).toEqual({ result: mockResponse, success: true });
      });

      expect(query.fetch).toHaveBeenCalledWith(
        {
          params: {
            fromTimestamp: from.toISO(),
            toTimestamp: to.toISO(),
            filters,
          },
        },
        { fetchPolicy: "no-cache" },
      );
    });

    it("should call fetch on DashboardPerformanceStatsGQL and return null", () => {
      const query = spectator.inject(DashboardPerformanceStatsGQL);
      query.fetch.and.returnValue(
        of({
          data: {
            onTimePerformance: { punctualityOverview: undefined },
          },
          loading: false,
          networkStatus: 7,
          errors: [{ message: "error" }],
        } as ApolloQueryResult<DashboardPerformanceStatsQuery>),
      );

      const filters = {
        nocCodes: ["OP1"],
        timingPointsOnly: true,
      };
      const from = DateTime.now().toUTC();
      const to = DateTime.now().plus({ days: 28 }).toUTC();
      service.getPunctualityStats(filters, from, to).subscribe((ops) => {
        void expect(ops).toEqual({ result: null, success: false });
      });

      expect(query.fetch).toHaveBeenCalledWith(
        {
          params: {
            fromTimestamp: from.toISO(),
            toTimestamp: to.toISO(),
            filters,
          },
        },
        { fetchPolicy: "no-cache" },
      );
    });
  });

  describe("getServiceRanking", () => {
    it("should call fetch on DashboardServiceRankingGQL and return list of service punctuality", () => {
      const mockResponse = [
        {
          nocCode: "OP167",
          lineId: "LI849",
          lineInfo: {
            serviceId: "LI849",
            serviceName: "West Bridge - Glenfield",
            serviceNumber: "13W",
          },
          onTime: 34,
          early: 0,
          late: 0,
          trend: {
            onTime: 330,
            early: 1,
            late: 3,
          },
        },
        {
          nocCode: "OP140",
          lineId: "LI5997",
          lineInfo: {
            serviceId: "LI5997",
            serviceName: "Gamston - Clifton",
            serviceNumber: "23",
          },
          onTime: 12,
          early: 0,
          late: 0,
          trend: {
            onTime: 2992,
            early: 728,
            late: 598,
          },
        },
      ];
      const query = spectator.inject(DashboardServiceRankingGQL);
      query.fetch.and.returnValue(
        of({
          data: { onTimePerformance: { servicePunctuality: mockResponse } },
          loading: false,
          networkStatus: 7,
          errors: undefined,
        }),
      );

      const filters = {
        nocCodes: ["OP1"],
        timingPointsOnly: true,
      };
      const from = DateTime.now().toUTC();
      const to = DateTime.now().plus({ days: 28 }).toUTC();
      const order = RankingOrder.Ascending;
      const trendFrom = DateTime.now().minus({ days: 28 }).toUTC();
      const trendTo = DateTime.now().minus({ days: 1 }).toUTC();
      service
        .getServiceRanking(filters, from, to, order, trendFrom, trendTo)
        .subscribe((ops) => {
          void expect(ops).toEqual(mockResponse);
        });

      expect(query.fetch).toHaveBeenCalledWith(
        {
          params: {
            fromTimestamp: from.toISO(),
            toTimestamp: to.toISO(),
            order,
            filters,
          },
          trendFrom: trendFrom.toISO(),
          trendTo: trendTo.toISO(),
        },
        { fetchPolicy: "no-cache" },
      );
    });

    it("should call fetch on DashboardPerformanceStatsGQL and return undefined", () => {
      const query = spectator.inject(DashboardServiceRankingGQL);
      query.fetch.and.returnValue(
        of({
          data: {},
          loading: false,
          networkStatus: 7,
          errors: [{ message: "error" }],
        } as ApolloQueryResult<DashboardServiceRankingQuery>),
      );

      const filters = {
        nocCodes: ["OP1"],
        timingPointsOnly: true,
      };
      const from = DateTime.now().toUTC();
      const to = DateTime.now().plus({ days: 28 }).toUTC();
      const order = RankingOrder.Ascending;
      const trendFrom = DateTime.now().minus({ days: 28 }).toUTC();
      const trendTo = DateTime.now().minus({ days: 1 }).toUTC();
      service
        .getServiceRanking(filters, from, to, order, trendFrom, trendTo)
        .subscribe((ops) => {
          void expect(ops).toEqual(undefined);
        });

      expect(query.fetch).toHaveBeenCalledWith(
        {
          params: {
            fromTimestamp: from.toISO(),
            toTimestamp: to.toISO(),
            order,
            filters,
          },
          trendFrom: trendFrom.toISO(),
          trendTo: trendTo.toISO(),
        },
        { fetchPolicy: "no-cache" },
      );
    });
  });
});
