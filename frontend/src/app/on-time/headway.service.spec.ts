import { SpectatorService } from '@ngneat/spectator/lib/spectator-service/spectator-service';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { createServiceFactory } from '@ngneat/spectator';
import {
  HeadwayFrequentServiceInfoDocument,
  HeadwayFrequentServicesDocument,
  HeadwayOverviewDocument,
  HeadwayTimeSeriesDocument,
} from '../../generated/graphql';
import { HeadwayParams, HeadwayService } from './headway.service';
import { PerformanceParams } from './on-time.service';
import { waitForAsync } from '@angular/core/testing';
import objectContaining = jasmine.objectContaining;

describe('HeadwayService', () => {
  let spectator: SpectatorService<HeadwayService>;
  let controller: ApolloTestingController;
  const serviceFactory = createServiceFactory({
    service: HeadwayService,
    imports: [ApolloTestingModule],
  });

  beforeEach(() => {
    spectator = serviceFactory();
    controller = spectator.inject(ApolloTestingController);
  });

  it('should query headway performance', () => {
    const params: HeadwayParams = {
      fromTimestamp: '2022-01-31T00:00:00',
      toTimestamp: '2022-02-04T23:59:59',
      filters: {
        operatorIds: ['OP01'],
        lineIds: ['LN12345'],
      },
    };
    spectator.service.fetchTimeSeries(params).subscribe((actual) => {
      expect(actual).not.toBeNull();
      expect(actual.length).toEqual(1);
      expect(actual[0].ts).toEqual('2022-02-04T12:00:00');
      expect(actual[0].actual).toEqual(90);
      expect(actual[0].scheduled).toEqual(80);
      expect(actual[0].excess).toEqual(10);
    });

    const op = controller.expectOne(HeadwayTimeSeriesDocument);

    expect(op.operation.variables.params.fromTimestamp).toEqual('2022-01-31T00:00:00');
    expect(op.operation.variables.params.toTimestamp).toEqual('2022-02-04T23:59:59');
    expect(op.operation.variables.params.filters).toEqual(
      objectContaining({
        operatorIds: ['OP01'],
        lineIds: ['LN12345'],
      })
    );

    op.flush({
      data: {
        headwayMetrics: {
          headwayTimeSeries: [
            {
              ts: '2022-02-04T12:00:00',
              actual: 90,
              scheduled: 80,
              excess: 10,
            },
          ],
        },
      },
    });

    controller.verify();
  });

  it('should query headway overview stats', () => {
    const params: HeadwayParams = {
      fromTimestamp: '2022-02-08T00:00:00',
      toTimestamp: '2022-03-07T23:59:59',
      filters: {
        operatorIds: ['OP01'],
        lineIds: ['LN12345'],
      },
    };
    spectator.service.fetchOverview(params).subscribe((actual) => {
      expect(actual).not.toBeNull();
      expect(actual.actual).toEqual(125);
      expect(actual.scheduled).toEqual(105);
      expect(actual.excess).toEqual(20);
    });

    const op = controller.expectOne(HeadwayOverviewDocument);

    expect(op.operation.variables.params.fromTimestamp).toEqual('2022-02-08T00:00:00');
    expect(op.operation.variables.params.toTimestamp).toEqual('2022-03-07T23:59:59');
    expect(op.operation.variables.params.filters).toEqual(
      objectContaining({
        operatorIds: ['OP01'],
        lineIds: ['LN12345'],
      })
    );

    op.flush({
      data: {
        headwayMetrics: {
          headwayOverview: {
            actual: 125,
            scheduled: 105,
            excess: 20,
          },
        },
      },
    });

    controller.verify();
  });

  it('should fetch frequent services', () => {
    const params = {
      fromTimestamp: '2022-02-08T00:00:00',
      toTimestamp: '2022-03-07T23:59:59',
      filters: {
        operatorIds: ['OP01'] as [string],
      },
    };
    spectator.service.fetchFrequentServices(params).subscribe((actual) => {
      expect(actual).not.toBeNull();
      expect(actual.length).toEqual(3);
      expect(actual[0].serviceId).toEqual('LN12345');
    });

    const op = controller.expectOne(HeadwayFrequentServicesDocument);

    expect(op.operation.variables.operatorId).toEqual('OP01');
    expect(op.operation.variables.fromTimestamp).toEqual('2022-02-08T00:00:00');
    expect(op.operation.variables.toTimestamp).toEqual('2022-03-07T23:59:59');

    op.flush({
      data: {
        headwayMetrics: {
          frequentServices: [{ serviceId: 'LN12345' }, { serviceId: 'LN23456' }, { serviceId: 'LN34567' }],
        },
      },
    });

    controller.verify();
  });

  it('should fetch frequent service info', () => {
    const params = {
      fromTimestamp: '2022-02-08T00:00:00',
      toTimestamp: '2022-03-07T23:59:59',
      filters: {
        operatorIds: ['OP01'] as [string],
        lineIds: ['LN12345'] as [string],
      },
    };
    spectator.service.fetchFrequentServiceInfo(params).subscribe((actual) => {
      expect(actual).not.toBeNull();
      expect(actual.numHours).toEqual(85);
      expect(actual.totalHours).toEqual(100);
    });

    const op = controller.expectOne(HeadwayFrequentServiceInfoDocument);

    expect(op.operation.variables.inputs.filters.operatorId).toEqual('OP01');
    expect(op.operation.variables.inputs.filters.lineId).toEqual('LN12345');
    expect(op.operation.variables.inputs.fromTimestamp).toEqual('2022-02-08T00:00:00');
    expect(op.operation.variables.inputs.toTimestamp).toEqual('2022-03-07T23:59:59');

    op.flush({
      data: {
        headwayMetrics: {
          frequentServiceInfo: { numHours: 85, totalHours: 100 },
        },
      },
    });

    controller.verify();
  });

  // ABOD-487
  it(
    'should exclude unsupported properties',
    waitForAsync(() => {
      const params: PerformanceParams = {
        fromTimestamp: '2022-01-31T00:00:00',
        toTimestamp: '2022-02-04T23:59:59',
        filters: {
          operatorIds: ['OP01'],
          lineIds: ['LN12345'],
          timingPointsOnly: true,
          adminAreaIds: ['AA100'],
        },
      };
      spectator.service.fetchTimeSeries(params).subscribe((actual) => {
        expect(actual).not.toBeNull();
      });

      const op = controller.expectOne(HeadwayTimeSeriesDocument);

      expect(op.operation.variables.params.filters.timingPointsOnly).not.toBeDefined();
      expect(op.operation.variables.params.filters.adminAreaIds).not.toBeDefined();

      op.flush({
        data: {
          headwayMetrics: {
            headwayTimeSeries: [],
          },
        },
      });

      controller.verify();
    })
  );
});
