import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { DateTime } from 'luxon';
import { of } from 'rxjs';
import {
  ServicePatternsDocument,
  VehicleJourneyDocument,
  VehicleJourneyTimingPatternDocument,
} from '../../../generated/graphql';
import { VehicleJourneyViewParams } from './vehicle-journey-view.model';

import { VehicleJourneysViewService } from './vehicle-journeys-view.service';

describe('VehicleJourneysViewService', () => {
  let service: VehicleJourneysViewService;
  let controller: ApolloTestingController;

  const journeyId = 'VJ7eb0894c0ed7613e55fc516103b05db9408cdd05';
  const startTime = '20220818T1122Z';
  const servicePatternId = 'abc1223';
  const viewParams = <VehicleJourneyViewParams>{};

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule],
    });
    service = TestBed.inject(VehicleJourneysViewService);
    controller = TestBed.inject(ApolloTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getVehicleJourneyView', () => {
    it('should call getVehicleJourneyView with journeyId and startTime', () => {
      service.getVehicleJourneyView(journeyId, DateTime.fromISO(startTime), viewParams).subscribe();
      const op = controller.expectOne(VehicleJourneyDocument);

      expect(op.operation.variables.journeyId).toEqual(journeyId);
      expect(op.operation.variables.startTime).toEqual(DateTime.fromISO(startTime).toUTC().toISO());

      op.flush({
        data: {
          vehicleReplay: {
            getJourney: [
              {
                servicePatternId: servicePatternId,
              },
            ],
          },
        },
      });

      controller.verify();
    });

    it('should throw error if no journey is returned', fakeAsync(() => {
      service.getVehicleJourneyView(journeyId, DateTime.fromISO(startTime), viewParams).subscribe({
        error: (error: any) => {
          expect(error).toEqual(new Error('Journey not found'));
        },
      });
      const op = controller.expectOne(VehicleJourneyDocument);

      op.flush({
        data: {
          vehicleReplay: {
            getJourney: [],
          },
        },
      });

      controller.verify();
      flush();
    }));

    it('should return VehicleJourneyView', fakeAsync(() => {
      spyOn(service, 'getStopList').and.returnValue(
        of([
          {
            stopId: 'ST43000158103',
            stopName: 'Solihull Town Centre',
            lon: -1.78000522,
            lat: 52.4139824,
            startTime: DateTime.fromISO(startTime),
            timingPoint: false,
          },
        ])
      );
      service.getVehicleJourneyView(journeyId, DateTime.fromISO(startTime), viewParams).subscribe((view) => {
        expect(view).toBeTruthy();
        expect(view?.stopList.length).toEqual(1);
      });
      const op = controller.expectOne(VehicleJourneyDocument);

      op.flush({
        data: {
          vehicleReplay: {
            getJourney: [
              {
                servicePatternId: servicePatternId,
              },
            ],
            __typename: 'vehicleReplayShadowNamespace',
          },
        },
      });

      controller.verify();
      flush();

      expect(service.getStopList).toHaveBeenCalledWith([servicePatternId], journeyId, DateTime.fromISO(startTime));
    }));
  });

  describe('getStopList', () => {
    it('should call getStopList with servicePatternIds', () => {
      service.getStopList([servicePatternId], journeyId, DateTime.fromISO(startTime)).subscribe();
      const op = controller.expectOne(ServicePatternsDocument);

      expect(op.operation.variables.servicePatternIds).toEqual([servicePatternId]);

      op.flush({
        data: {
          servicePatternsInfo: [
            {
              stops: [],
            },
          ],
        },
      });

      controller.verify();
    });

    it('should return empty array if no stops data', fakeAsync(() => {
      service.getStopList([servicePatternId], journeyId, DateTime.fromISO(startTime)).subscribe((data) => {
        expect(data).toEqual([]);
      });
      const op = controller.expectOne(ServicePatternsDocument);

      op.flush({});

      controller.verify();
      flush();
    }));
  });

  describe('getVehicleJourney', () => {
    it('should call with journeyId and startTime', () => {
      service.getVehicleJourney(journeyId, DateTime.fromISO(startTime)).subscribe();
      const op = controller.expectOne(VehicleJourneyDocument);

      expect(op.operation.variables.journeyId).toEqual(journeyId);
      expect(op.operation.variables.startTime).toEqual(DateTime.fromISO(startTime).toUTC().toISO());

      op.flush({
        data: {
          vehicleReplay: {
            getJourney: [
              {
                servicePatternId: servicePatternId,
              },
            ],
          },
        },
      });

      controller.verify();
    });

    it('should return empty array if no journey data', fakeAsync(() => {
      service.getVehicleJourney(journeyId, DateTime.fromISO(startTime)).subscribe((data) => {
        expect(data).toEqual([]);
      });
      const op = controller.expectOne(VehicleJourneyDocument);

      op.flush({});

      controller.verify();
      flush();
    }));

    it('should return array sorted by timestamp', fakeAsync(() => {
      const t1 = '2022-08-18T11:20:00.000+01:00';
      const t2 = '2022-08-18T11:21:00.000+01:00';
      const t3 = '2022-08-18T11:22:00.000+01:00';

      service.getVehicleJourney(journeyId, DateTime.fromISO(startTime)).subscribe((data) => {
        expect(data[0].ts).toEqual(t1);
        expect(data[1].ts).toEqual(t2);
        expect(data[2].ts).toEqual(t3);
      });
      const op = controller.expectOne(VehicleJourneyDocument);

      expect(op.operation.variables.journeyId).toEqual(journeyId);
      expect(op.operation.variables.startTime).toEqual(DateTime.fromISO(startTime).toUTC().toISO());

      op.flush({
        data: {
          vehicleReplay: {
            getJourney: [
              {
                ts: t3,
              },
              {
                ts: t1,
              },
              {
                ts: t2,
              },
            ],
          },
        },
      });

      controller.verify();
      flush();
    }));
  });

  describe('getTimingPatternForVehicleJourney', () => {
    it('should call with vehicleJourneyId', () => {
      service.getTimingPatternForVehicleJourney(journeyId).subscribe();
      const op1 = controller.expectOne(VehicleJourneyTimingPatternDocument);

      expect(op1.operation.variables.vehicleJourneyId).toEqual(journeyId);

      op1.flush({
        data: {
          vehicleJourney: [{ timingPatternId: '1234' }],
        },
      });

      controller.verify();
    });
  });
});
