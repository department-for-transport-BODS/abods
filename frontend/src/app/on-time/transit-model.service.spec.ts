import { createServiceFactory } from '@ngneat/spectator';
import { SpectatorService } from '@ngneat/spectator/lib/spectator-service/spectator-service';
import { TransitModelService } from './transit-model.service';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { ServicePatternType, TransitModelServicePatternStopsDocument } from '../../generated/graphql';

describe('StopPerformanceService', () => {
  let spectator: SpectatorService<TransitModelService>;
  let controller: ApolloTestingController;
  const serviceFactory = createServiceFactory({
    service: TransitModelService,
    imports: [ApolloTestingModule],
  });

  beforeEach(() => {
    spectator = serviceFactory();
    controller = spectator.inject(ApolloTestingController);
  });

  it('should fetch transit model data', () => {
    const expected: ServicePatternType = {
      servicePatternId: '123',
      serviceLinks: [],
      name: 'High Wycombe to Chesham',
      stops: [{ stopId: 'ST0000001', stopName: 'Railway Station', lat: 52, lon: 0 }],
    };

    spectator.service.fetchServicePatternStops('OP1', 'LI12345').subscribe(([actual]) => {
      expect(actual).not.toBeNull();
      expect(actual.servicePatternId).toEqual('123');
      expect(actual.name).toEqual('High Wycombe to Chesham');
      expect(actual.stops[0]).toEqual(jasmine.objectContaining({ ...expected.stops[0] }));
    });

    const op = controller.expectOne(TransitModelServicePatternStopsDocument);

    expect(op.operation.variables.operatorId).toEqual('OP1');
    expect(op.operation.variables.lineId).toEqual('LI12345');

    op.flush({
      data: {
        operator: { transitModel: { lines: { items: [{ servicePatterns: [expected] }] } } },
      },
    });

    controller.verify();
  });

  it('should cope with empty array in graphql response', () => {
    spectator.service.fetchServicePatternStops('OP2', 'LI34567').subscribe((actual) => {
      expect(actual).toHaveSize(0);
    });

    const op = controller.expectOne(TransitModelServicePatternStopsDocument);

    expect(op.operation.variables.operatorId).toEqual('OP2');
    expect(op.operation.variables.lineId).toEqual('LI34567');

    op.flush({
      data: {
        operator: { transitModel: { lines: { items: [] } } },
      },
    });

    controller.verify();
  });
});
