import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { DateTime } from 'luxon';
import { of } from 'rxjs';
import {
  DashboardOperatorListGQL,
  DashboardOperatorVehicleCountsListGQL,
  DashboardPerformanceStatsGQL,
  DashboardServiceRankingGQL,
  OperatorDashboardFragment,
  OperatorDashboardVehicleCountsFragment,
  RankingOrder,
} from '../../generated/graphql';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let spectator: SpectatorService<DashboardService>;
  let service: DashboardService;

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
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('listOperators', () => {
    it('should call fetch on DashboardOperatorListGQL and return list of operators', () => {
      const mockResponse = [
        <OperatorDashboardFragment>{ name: 'op1', nocCode: 'OP1' },
        <OperatorDashboardFragment>{ name: 'op2', nocCode: 'OP1' },
      ];
      const query = spectator.inject(DashboardOperatorListGQL);
      query.fetch.and.returnValue(of({ data: { operators: { items: mockResponse } } }));

      service.listOperators.subscribe((ops) => {
        expect(ops).toEqual(mockResponse);
      });

      expect(query.fetch).toHaveBeenCalledWith();
    });

    it('should call fetch on DashboardOperatorListGQL and return empty array', () => {
      const query = spectator.inject(DashboardOperatorListGQL);
      query.fetch.and.returnValue(of({}));

      service.listOperators.subscribe((ops) => {
        expect(ops).toEqual([]);
      });

      expect(query.fetch).toHaveBeenCalledWith();
    });
  });

  describe('listOperatorVehicleCounts', () => {
    it('should call fetch on DashboardOperatorVehicleCountsListGQL and return list of counts', () => {
      const mockResponse = [
        <OperatorDashboardVehicleCountsFragment>{
          nocCode: 'OP1',
          feedMonitoring: { liveStats: { currentVehicles: 3, expectedVehicles: 3 } },
        },
        <OperatorDashboardVehicleCountsFragment>{
          nocCode: 'OP2',
          feedMonitoring: { liveStats: { currentVehicles: 0, expectedVehicles: 5 } },
        },
      ];
      const query = spectator.inject(DashboardOperatorVehicleCountsListGQL);
      query.fetch.and.returnValue(of({ data: { operators: { items: mockResponse } } }));

      service.listOperatorVehicleCounts.subscribe((ops) => {
        expect(ops).toEqual(mockResponse);
      });

      expect(query.fetch).toHaveBeenCalledWith();
    });

    it('should call fetch on DashboardOperatorVehicleCountsListGQL and return empty array', () => {
      const query = spectator.inject(DashboardOperatorVehicleCountsListGQL);
      query.fetch.and.returnValue(of({}));

      service.listOperatorVehicleCounts.subscribe((ops) => {
        expect(ops).toEqual([]);
      });

      expect(query.fetch).toHaveBeenCalledWith();
    });
  });

  describe('getPunctualityStats', () => {
    it('should call fetch on DashboardPerformanceStatsGQL and return punctuality result', () => {
      const mockResponse = {
        onTime: 5,
        late: 10,
        early: 3,
      };
      const query = spectator.inject(DashboardPerformanceStatsGQL);
      query.fetch.and.returnValue(of({ data: { onTimePerformance: { punctualityOverview: mockResponse } } }));

      const filters = {
        nocCodes: ['OP1'],
        timingPointsOnly: true,
      };
      const from = DateTime.now().toUTC();
      const to = DateTime.now().plus({ days: 28 }).toUTC();
      service.getPunctualityStats(filters, from, to).subscribe((ops) => {
        expect(ops).toEqual({ result: mockResponse, success: true });
      });

      expect(query.fetch).toHaveBeenCalledWith(
        {
          params: { fromTimestamp: from.toJSDate(), toTimestamp: to.toJSDate(), filters },
        },
        { fetchPolicy: 'no-cache' }
      );
    });

    it('should call fetch on DashboardPerformanceStatsGQL and return null', () => {
      const query = spectator.inject(DashboardPerformanceStatsGQL);
      query.fetch.and.returnValue(of({ errors: [{ message: 'error' }] }));

      const filters = {
        nocCodes: ['OP1'],
        timingPointsOnly: true,
      };
      const from = DateTime.now().toUTC();
      const to = DateTime.now().plus({ days: 28 }).toUTC();
      service.getPunctualityStats(filters, from, to).subscribe((ops) => {
        expect(ops).toEqual({ result: null, success: false });
      });

      expect(query.fetch).toHaveBeenCalledWith(
        {
          params: { fromTimestamp: from.toJSDate(), toTimestamp: to.toJSDate(), filters },
        },
        { fetchPolicy: 'no-cache' }
      );
    });
  });

  describe('getServiceRanking', () => {
    it('should call fetch on DashboardServiceRankingGQL and return list of service punctuality', () => {
      const mockResponse = [
        {
          nocCode: 'OP167',
          lineId: 'LI849',
          lineInfo: {
            serviceId: 'LI849',
            serviceName: 'West Bridge - Glenfield',
            serviceNumber: '13W',
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
          nocCode: 'OP140',
          lineId: 'LI5997',
          lineInfo: {
            serviceId: 'LI5997',
            serviceName: 'Gamston - Clifton',
            serviceNumber: '23',
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
      query.fetch.and.returnValue(of({ data: { onTimePerformance: { servicePunctuality: mockResponse } } }));

      const filters = {
        nocCodes: ['OP1'],
        timingPointsOnly: true,
      };
      const from = DateTime.now().toUTC();
      const to = DateTime.now().plus({ days: 28 }).toUTC();
      const order = RankingOrder.Ascending;
      const trendFrom = DateTime.now().minus({ days: 28 }).toUTC();
      const trendTo = DateTime.now().minus({ days: 1 }).toUTC();
      service.getServiceRanking(filters, from, to, order, trendFrom, trendTo).subscribe((ops) => {
        expect(ops).toEqual(mockResponse);
      });

      expect(query.fetch).toHaveBeenCalledWith(
        {
          params: { fromTimestamp: from.toJSDate(), toTimestamp: to.toJSDate(), order, filters },
          trendFrom: trendFrom.toJSDate(),
          trendTo: trendTo.toJSDate(),
        },
        { fetchPolicy: 'no-cache' }
      );
    });

    it('should call fetch on DashboardPerformanceStatsGQL and return undefined', () => {
      const query = spectator.inject(DashboardServiceRankingGQL);
      query.fetch.and.returnValue(of({ errors: [{ message: 'error' }] }));

      const filters = {
        nocCodes: ['OP1'],
        timingPointsOnly: true,
      };
      const from = DateTime.now().toUTC();
      const to = DateTime.now().plus({ days: 28 }).toUTC();
      const order = RankingOrder.Ascending;
      const trendFrom = DateTime.now().minus({ days: 28 }).toUTC();
      const trendTo = DateTime.now().minus({ days: 1 }).toUTC();
      service.getServiceRanking(filters, from, to, order, trendFrom, trendTo).subscribe((ops) => {
        expect(ops).toEqual(undefined);
      });

      expect(query.fetch).toHaveBeenCalledWith(
        {
          params: { fromTimestamp: from.toJSDate(), toTimestamp: to.toJSDate(), order, filters },
          trendFrom: trendFrom.toJSDate(),
          trendTo: trendTo.toJSDate(),
        },
        { fetchPolicy: 'no-cache' }
      );
    });
  });
});
