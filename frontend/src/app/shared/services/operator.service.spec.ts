import { SpectatorService } from '@ngneat/spectator/lib/spectator-service/spectator-service';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { createServiceFactory } from '@ngneat/spectator';
import {
  OperatorLinesDocument,
  OperatorLinesQuery,
  OperatorListDocument,
  OperatorListQuery,
} from '../../../generated/graphql';
import { OperatorService } from './operator.service';
import { waitForAsync } from '@angular/core/testing';

describe('OperatorService', () => {
  let spectator: SpectatorService<OperatorService>;
  let controller: ApolloTestingController;
  const serviceFactory = createServiceFactory({
    service: OperatorService,
    imports: [ApolloTestingModule],
  });

  beforeEach(() => {
    spectator = serviceFactory();
    controller = spectator.inject(ApolloTestingController);
  });

  it(
    'should query operators',
    waitForAsync(() => {
      spectator.service.fetchOperators().subscribe((actual) => {
        expect(actual).not.toBeNull();
        expect(actual.length).toEqual(1);
        expect(actual[0].nocCode).toEqual('SCEM');
        expect(actual[0].name).toEqual('Stagecoach East Midlands');
      });

      const op = controller.expectOne(OperatorListDocument);

      op.flush({
        data: {
          operators: {
            items: [
              {
                name: 'Stagecoach East Midlands',
                nocCode: 'SCEM',
                operatorId: 'OP01',
                adminAreas: [
                  {
                    adminAreaId: 'AA270',
                  },
                ],
              },
            ],
          },
        } as OperatorListQuery,
      });

      controller.verify();
    })
  );

  it(
    'should query lines',
    waitForAsync(() => {
      spectator.service.fetchLines('OP01').subscribe((actual) => {
        expect(actual).not.toBeNull();
        expect(actual.length).toEqual(1);
        expect(actual[0].id).toEqual('LI12345');
        expect(actual[0].name).toEqual('Worksop to Chesterfield');
        expect(actual[0].number).toEqual('77');
      });

      const op = controller.expectOne(OperatorLinesDocument);

      expect(op.operation.variables.operatorId).toEqual('OP01');

      op.flush({
        data: {
          operator: {
            transitModel: {
              lines: {
                items: [
                  {
                    id: 'LI12345',
                    name: 'Worksop to Chesterfield',
                    number: '77',
                  },
                ],
              },
            },
          },
        } as OperatorLinesQuery,
      });

      controller.verify();
    })
  );

  it(
    'should filter operators by name',
    waitForAsync(() => {
      spectator.service.searchOperators('East').subscribe((actual) => {
        expect(actual).not.toBeNull();
        expect(actual.length).toEqual(1);
        expect(actual[0].nocCode).toEqual('SCEM');
        expect(actual[0].name).toEqual('Stagecoach East Midlands');
      });

      const op = controller.expectOne(OperatorListDocument);

      op.flush({
        data: {
          operators: {
            items: [
              {
                name: 'Stagecoach East Midlands',
                nocCode: 'SCEM',
                operatorId: 'OP01',
                adminAreas: [
                  {
                    adminAreaId: 'AA270',
                  },
                ],
              },
              {
                name: 'D & G Bus',
                nocCode: 'DAGC',
                operatorId: 'OP02',
                adminAreas: [
                  {
                    adminAreaId: 'AA280',
                  },
                ],
              },
            ],
          },
        } as OperatorListQuery,
      });

      controller.verify();
    })
  );

  it(
    'should filter operators by noc',
    waitForAsync(() => {
      spectator.service.searchOperators('SCEM').subscribe((actual) => {
        expect(actual).not.toBeNull();
        expect(actual.length).toEqual(1);
        expect(actual[0].nocCode).toEqual('SCEM');
        expect(actual[0].name).toEqual('Stagecoach East Midlands');
      });

      const op = controller.expectOne(OperatorListDocument);

      op.flush({
        data: {
          operators: {
            items: [
              {
                name: 'Stagecoach East Midlands',
                nocCode: 'SCEM',
                operatorId: 'OP01',
                adminAreas: [
                  {
                    adminAreaId: 'AA270',
                  },
                ],
              },
              {
                name: 'D & G Bus',
                nocCode: 'DAGC',
                operatorId: 'OP02',
                adminAreas: [
                  {
                    adminAreaId: 'AA280',
                  },
                ],
              },
            ],
          },
        } as OperatorListQuery,
      });

      controller.verify();
    })
  );

  it(
    'should return all operators if term is empty string',
    waitForAsync(() => {
      spectator.service.searchOperators('').subscribe((actual) => {
        expect(actual).not.toBeNull();
        expect(actual.length).toEqual(2);
        expect(actual[0].nocCode).toEqual('SCEM');
        expect(actual[0].name).toEqual('Stagecoach East Midlands');
        expect(actual[1].nocCode).toEqual('DAGC');
        expect(actual[1].name).toEqual('D & G Bus');
      });

      const op = controller.expectOne(OperatorListDocument);

      op.flush({
        data: {
          operators: {
            items: [
              {
                name: 'Stagecoach East Midlands',
                nocCode: 'SCEM',
                operatorId: 'OP01',
                adminAreas: [
                  {
                    adminAreaId: 'AA270',
                  },
                ],
              },
              {
                name: 'D & G Bus',
                nocCode: 'DAGC',
                operatorId: 'OP02',
                adminAreas: [
                  {
                    adminAreaId: 'AA280',
                  },
                ],
              },
            ],
          },
        } as OperatorListQuery,
      });

      controller.verify();
    })
  );

  it(
    'should filter operators with ampersand in name',
    waitForAsync(() => {
      spectator.service.searchOperators('d & g').subscribe((actual) => {
        expect(actual).not.toBeNull();
        expect(actual.length).toEqual(1);
        expect(actual[0].nocCode).toEqual('DAGC');
        expect(actual[0].name).toEqual('D & G Bus');
      });

      const op = controller.expectOne(OperatorListDocument);

      op.flush({
        data: {
          operators: {
            items: [
              {
                name: 'Stagecoach East Midlands',
                nocCode: 'SCEM',
                operatorId: 'OP01',
                adminAreas: [
                  {
                    adminAreaId: 'AA270',
                  },
                ],
              },
              {
                name: 'D & G Bus',
                nocCode: 'DAGC',
                operatorId: 'OP02',
                adminAreas: [
                  {
                    adminAreaId: 'AA280',
                  },
                ],
              },
            ],
          },
        } as OperatorListQuery,
      });

      controller.verify();
    })
  );
});
