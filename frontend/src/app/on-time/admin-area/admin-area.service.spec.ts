import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';

import { AdminAreaService } from './admin-area.service';
import { GetAdminAreasDocument } from '../../../generated/graphql';
import { SpectatorService } from '@ngneat/spectator/lib/spectator-service/spectator-service';
import { createServiceFactory, mockProvider } from '@ngneat/spectator';
import { geometry, polygon } from '@turf/helpers';
import { OperatorService } from '../../shared/services/operator.service';
import { of } from 'rxjs';
import flip from '@turf/flip';
import { waitForAsync } from '@angular/core/testing';

const DERBYSHIRE_BOUNDARY_SHAPE = [
  [-2.02690601, 53.3680458],
  [-1.82813036, 52.9045258],
  [-1.69209635, 52.7352142],
  [-1.69203734, 52.7351685],
  [-1.63121402, 52.7139664],
  [-1.57442915, 52.7125931],
  [-1.25723732, 52.8888206],
  [-1.17243993, 53.2825508],
  [-1.17240739, 53.2834587],
  [-1.30053258, 53.3302841],
  [-1.85361552, 53.5030289],
  [-1.97595978, 53.4718971],
  [-1.98201668, 53.4700737],
  [-2.01974869, 53.4256248],
  [-2.02690601, 53.3680458],
];

describe('AdminAreaService', () => {
  let spectator: SpectatorService<AdminAreaService>;
  let controller: ApolloTestingController;
  const serviceFactory = createServiceFactory({
    service: AdminAreaService,
    imports: [ApolloTestingModule],
    providers: [
      mockProvider(OperatorService, {
        fetchOperators: () =>
          of([
            {
              name: 'Op A',
              nocCode: 'AAA',
              operatorId: '001',
              adminAreaIds: [],
            },
            {
              name: 'Op B',
              nocCode: 'BBB',
              operatorId: '002',
              adminAreaIds: ['1', '2'],
            },
            {
              name: 'Stagecoach East Midlands',
              nocCode: 'SCEM',
              operatorId: 'OP01',
              adminAreaIds: ['AA100', 'AA370', 'AA910'],
            },
          ]),
      }),
    ],
  });

  beforeEach(() => {
    spectator = serviceFactory();
    controller = spectator.inject(ApolloTestingController);
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it(
    'should fetch admin areas',
    waitForAsync(() => {
      spectator.service.fetchAdminAreas().subscribe((actual) => {
        expect(actual).not.toBeNull();
        expect(actual.length).toEqual(2);
        expect(actual[0].id).toEqual('AA100');
        expect(actual[0].name).toEqual('Derbyshire');
      });

      const op = controller.expectOne(GetAdminAreasDocument);

      op.flush({
        data: {
          adminAreas: [
            { id: 'AA0', name: 'Default0', shape: JSON.stringify(polygon([])) },
            { id: 'AA100', name: 'Derbyshire', shape: JSON.stringify(polygon([])) },
            { id: 'AA370', name: 'South Yorkshire', shape: JSON.stringify(polygon([])) },
            { id: 'AA910', name: 'National - National Rail', shape: JSON.stringify(polygon([])) },
          ],
        },
      });

      controller.verify();
    })
  );

  it(
    'should fetch admin area boundaries',
    waitForAsync(() => {
      spectator.service.fetchAdminAreaBoundaries().subscribe((actual) => {
        expect(actual).not.toBeNull();
        expect(actual.type).toEqual('FeatureCollection');
        expect(actual.bbox).toEqual([-2.02690601, 52.7125931, -1.17240739, 53.5030289]);
        expect(actual.features.length).toEqual(2);
        expect(actual.features[0].properties.name).toEqual('Derbyshire');
        expect(actual.features[0].geometry.coordinates).toEqual([DERBYSHIRE_BOUNDARY_SHAPE]);
      });

      const op = controller.expectOne(GetAdminAreasDocument);

      op.flush({
        data: {
          adminAreas: [
            {
              id: 'AA100',
              name: 'Derbyshire',
              // Remember to flip() the coordinates to lat-lon to match the backend
              shape: JSON.stringify(flip(geometry('Polygon', [DERBYSHIRE_BOUNDARY_SHAPE]))),
            },
            { id: 'AA370', name: 'South Yorkshire', shape: JSON.stringify(geometry('Polygon', [])) },
            { id: 'AA910', name: 'National - National Rail', shape: JSON.stringify(geometry('Polygon', [])) },
          ],
        },
      });

      controller.verify();
    })
  );

  describe('fetchAdminAreasForOperator', () => {
    it(
      'should return empty array if operator is empty string',
      waitForAsync(() => {
        spectator.service.fetchAdminAreasForOperator('').subscribe((data) => {
          expect(data).toEqual([]);
        });
      })
    );

    it(
      'should return empty array if operator not found',
      waitForAsync(() => {
        spectator.service.fetchAdminAreasForOperator('ZZZ').subscribe((data) => {
          expect(data).toEqual([]);
        });
      })
    );

    it(
      'should return empty array if operator found but no admin areas',
      waitForAsync(() => {
        spectator.service.fetchAdminAreasForOperator('AAA').subscribe((data) => {
          expect(data).toEqual([]);
        });
      })
    );

    it(
      'should return array of admin areas if operator found',
      waitForAsync(() => {
        const expected = [
          {
            name: 'Area 1',
            id: '1',
            shape: '',
          },
          {
            name: 'Area 2',
            id: '2',
            shape: '',
          },
        ];
        spectator.service.fetchAdminAreasForOperator('BBB').subscribe((data) => {
          expect(data).toEqual(expected);
        });
      })
    );
  });
});
