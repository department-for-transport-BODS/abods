import { SpectatorService } from '@ngneat/spectator/lib/spectator-service/spectator-service';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { createServiceFactory } from '@ngneat/spectator';
import { JourneysDocument, JourneysQuery } from '../../../generated/graphql';
import { VehicleJourneysSearchService } from './vehicle-journeys-search.service';
import { DateTime, Settings } from 'luxon';
import { waitForAsync } from '@angular/core/testing';

// The real data has duplicates, as we are only selecting a small subset of fields
const data = {
  vehicleReplay: {
    findJourneys: [
      {
        vehicleJourneyId: 'VJ0c5bcd05',
        startTime: '2022-09-01T08:35:00',
        serviceInfo: { serviceName: 'Chesterfield - Worksop', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ0c5bcd05',
        startTime: '2022-09-01T08:35:00',
        serviceInfo: { serviceName: 'Chesterfield - Worksop', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ0c5bcd05',
        startTime: '2022-09-01T08:35:00',
        serviceInfo: { serviceName: 'Chesterfield - Worksop', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ0c5bcd04',
        startTime: '2022-09-01T08:35:00',
        serviceInfo: { serviceName: 'Chesterfield - Worksop', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ0c5bcd04',
        startTime: '2022-09-01T08:35:00',
        serviceInfo: { serviceName: 'Chesterfield - Worksop', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ0c5bcd04',
        startTime: '2022-09-01T08:35:00',
        serviceInfo: { serviceName: 'Chesterfield - Worksop', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ0c5bcd04',
        startTime: '2022-09-01T08:35:00',
        serviceInfo: { serviceName: 'Chesterfield - Worksop', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ0c5bcd04',
        startTime: '2022-09-01T08:35:00',
        serviceInfo: { serviceName: 'Chesterfield - Worksop', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ41f09c9c',
        startTime: '2022-09-01T08:55:00',
        serviceInfo: { serviceName: 'Worksop - Chesterfield', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ41f09c9c',
        startTime: '2022-09-01T08:55:00',
        serviceInfo: { serviceName: 'Worksop - Chesterfield', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ41f09c9c',
        startTime: '2022-09-01T08:55:00',
        serviceInfo: { serviceName: 'Worksop - Chesterfield', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ41f09c9c',
        startTime: '2022-09-01T08:55:00',
        serviceInfo: { serviceName: 'Worksop - Chesterfield', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ41f09c9c',
        startTime: '2022-09-01T08:55:00',
        serviceInfo: { serviceName: 'Worksop - Chesterfield', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ9be619bc',
        startTime: '2022-09-01T07:35:00',
        serviceInfo: { serviceName: 'Chesterfield - Worksop', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ9be619bc',
        startTime: '2022-09-01T07:35:00',
        serviceInfo: { serviceName: 'Chesterfield - Worksop', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ9be619bc',
        startTime: '2022-09-01T07:35:00',
        serviceInfo: { serviceName: 'Chesterfield - Worksop', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ9be619bc',
        startTime: '2022-09-01T07:35:00',
        serviceInfo: { serviceName: 'Chesterfield - Worksop', serviceNumber: '77' },
      },
      {
        vehicleJourneyId: 'VJ9be619bc',
        startTime: '2022-09-01T07:35:00',
        serviceInfo: { serviceName: 'Chesterfield - Worksop', serviceNumber: '77' },
      },
    ],
  },
} as JourneysQuery;

describe('VehicleJourneysSearchService', () => {
  let spectator: SpectatorService<VehicleJourneysSearchService>;
  let controller: ApolloTestingController;
  const serviceFactory = createServiceFactory({
    service: VehicleJourneysSearchService,
    imports: [ApolloTestingModule],
  });

  beforeEach(() => {
    Settings.defaultZone = 'utc';
    Settings.now = () => 1663286400000; // 2022-09-16

    spectator = serviceFactory();
    controller = spectator.inject(ApolloTestingController);
  });

  it(
    'should query journeys',
    waitForAsync(() => {
      spectator.service
        .fetchJourneys(DateTime.fromISO('2022-09-01T00:00'), DateTime.fromISO('2022-09-02T00:00'), 'LI12345')
        .subscribe((actual) => {
          expect(actual).not.toBeNull();
          expect(actual.length).toEqual(4);
          expect(actual[0].vehicleJourneyId).toEqual('VJ9be619bc');
          expect(actual[0].startTime).toEqual(DateTime.fromISO('2022-09-01T07:35:00'));
          expect(actual[0].servicePattern).toEqual('Chesterfield - Worksop');
          expect(actual[0].lineNumber).toEqual('77');
          expect(actual[1].vehicleJourneyId).toEqual('VJ0c5bcd05');
          expect(actual[1].startTime).toEqual(DateTime.fromISO('2022-09-01T08:35:00'));
          expect(actual[1].servicePattern).toEqual('Chesterfield - Worksop');
          expect(actual[1].lineNumber).toEqual('77');
          expect(actual[2].vehicleJourneyId).toEqual('VJ0c5bcd04');
          expect(actual[2].startTime).toEqual(DateTime.fromISO('2022-09-01T08:35:00'));
          expect(actual[2].servicePattern).toEqual('Chesterfield - Worksop');
          expect(actual[2].lineNumber).toEqual('77');
          expect(actual[3].vehicleJourneyId).toEqual('VJ41f09c9c');
          expect(actual[3].startTime).toEqual(DateTime.fromISO('2022-09-01T08:55:00'));
          expect(actual[3].servicePattern).toEqual('Worksop - Chesterfield');
          expect(actual[3].lineNumber).toEqual('77');
        });

      const op = controller.expectOne(JourneysDocument);

      expect(op.operation.variables.fromTimestamp).toEqual('2022-09-01T00:00:00.000Z');
      expect(op.operation.variables.toTimestamp).toEqual('2022-09-02T00:00:00.000Z');
      expect(op.operation.variables.lineId).toEqual('LI12345');

      op.flush({ data });

      controller.verify();
    })
  );

  it(
    'should find next and previous journeys',
    waitForAsync(() => {
      spectator.service
        .fetchNextPrevJourneys(DateTime.fromISO('20220901T0835Z'), 'LI12345', 'VJ0c5bcd04')
        .subscribe((actual) => {
          expect(actual).not.toBeNull();
          expect(actual.length).toEqual(2);

          const [prev, next] = actual;

          expect(prev?.vehicleJourneyId).toEqual('VJ0c5bcd05');
          expect(prev?.startTime).toEqual(DateTime.fromISO('2022-09-01T08:35:00'));

          expect(next?.vehicleJourneyId).toEqual('VJ41f09c9c');
          expect(next?.startTime).toEqual(DateTime.fromISO('2022-09-01T08:55:00'));
        });

      const op = controller.expectOne(JourneysDocument);

      expect(op.operation.variables.fromTimestamp).toEqual('2022-09-01T00:00:00.000Z');
      expect(op.operation.variables.toTimestamp).toEqual('2022-09-02T00:00:00.000Z');
      expect(op.operation.variables.lineId).toEqual('LI12345');

      op.flush({ data });

      controller.verify();
    })
  );
});
