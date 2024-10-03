import { DateTime, Settings } from 'luxon';
import { GpsFeedJourneyStatus } from '../../../generated/graphql';
import { ApolloGpsFeedType, StopDetails } from './vehicle-journeys-view.service';
import { VehicleJourneyView, VehicleJourneyViewParams } from './vehicle-journey-view.model';
import { OnTimePerformanceEnum } from './on-time-performance.enum';

describe('VehicleJourneyView', () => {
  const t1 = '2022-08-18T11:20:00.000+01:00';
  const t2 = '2022-08-18T11:21:00.000+01:00';
  const startTime = '2022-08-18T11:20:00.000+01:00';
  const mockStops = (): StopDetails[] => [
    {
      stopId: 'ST43000158103',
      stopName: 'Solihull Town Centre',
      lon: -1.78000522,
      lat: 52.4139824,
      startTime: DateTime.fromISO(startTime),
      timingPoint: true,
      departureTimeOffset: 0,
    },
    {
      stopId: 'ST43000139402',
      stopName: 'Whitefields Rd',
      lon: -1.77750742,
      lat: 52.407795,
      startTime: DateTime.fromISO(startTime),
      timingPoint: false,
      departureTimeOffset: 1,
    },
    {
      stopId: 'ST43000139302',
      stopName: 'Solihull Sixth Form College',
      lon: -1.77633333,
      lat: 52.4044762,
      startTime: DateTime.fromISO(startTime),
      timingPoint: false,
      departureTimeOffset: 2,
    },
  ];
  const mockJourney: ApolloGpsFeedType[] = [
    {
      ts: t1,
      lat: 52.4139834,
      lon: -1.78000502,
      vehicleId: 'ABC-123',
      vehicleJourneyId: 'xyz987',
      servicePatternId: '456',
      delay: 120,
      startTime: startTime,
      scheduledDeparture: startTime,
      feedStatus: null,
      journeyStatus: GpsFeedJourneyStatus.Started,
      isTimingPoint: true,
      operatorInfo: {
        operatorId: 'op1',
        operatorName: 'Operator 1',
        nocCode: 'NOC1',
      },
      serviceInfo: {
        serviceId: 's5',
        serviceName: 'Solihull - Birmingham',
        serviceNumber: '5',
      },
      previousStopInfo: {
        stopId: 'ST43000158103',
        stopName: 'Solihull Town Centre',
      },
    },
    {
      ts: t2,
      lat: 52.4139838,
      lon: -1.78000505,
      vehicleId: 'ABC-123',
      vehicleJourneyId: 'xyz987',
      servicePatternId: '456',
      delay: 120,
      startTime: startTime,
      scheduledDeparture: startTime,
      feedStatus: null,
      journeyStatus: GpsFeedJourneyStatus.Started,
      isTimingPoint: false,
      operatorInfo: {
        operatorId: 'op1',
        operatorName: 'Operator 1',
        nocCode: 'NOC1',
      },
      serviceInfo: {
        serviceId: 's5',
        serviceName: 'Solihull - Birmingham',
        serviceNumber: '5',
      },
      previousStopInfo: {
        stopId: 'ST43000158103',
        stopName: 'Solihull Town Centre',
      },
    },
  ];
  const viewParams = <VehicleJourneyViewParams>{};

  beforeEach(() => {
    Settings.defaultZone = 'utc';
    Settings.now = () => 1659312000000; // 2022-08-01
    viewParams.timingPointsOnly = false;
  });

  it('should createView with 3 stops', () => {
    const view = VehicleJourneyView.createView(mockStops(), mockJourney, viewParams);

    expect(view).toBeTruthy();
    expect(view.stopList.length).toEqual(3);
  });

  describe('stopList', () => {
    it('should add a VehiclePingStop for the nearest previous stop ping', () => {
      const view = VehicleJourneyView.createView(mockStops(), mockJourney, viewParams);

      expect(view.stopList[0].id).toEqual('ST43000158103');
      expect(view.stopList[0].stopName).toEqual('Solihull Town Centre');
      expect(view.stopList[0].isTimingPoint).toEqual(true);
      expect(view.stopList[0].scheduledDeparture).toEqual(DateTime.fromISO(startTime));
      expect(view.stopList[0].actualDeparture).toEqual(DateTime.fromISO(startTime).plus({ seconds: 120 }));
      expect(view.stopList[0].lat).toEqual(52.4139824);
      expect(view.stopList[0].lon).toEqual(-1.78000522);
      expect(view.stopList[0].ts).toEqual(DateTime.fromISO(t1));
      expect(view.stopList[0].onTimePerformance).toEqual(OnTimePerformanceEnum.OnTime);
    });

    it('should create no data stop if there is no nearest previous stop ping', () => {
      const journey: ApolloGpsFeedType[] = [
        {
          ts: t1,
          lat: 52.4139834,
          lon: -1.78000502,
          vehicleId: 'ABC-123',
          vehicleJourneyId: 'xyz987',
          servicePatternId: '456',
          delay: 120,
          startTime: startTime,
          scheduledDeparture: startTime,
          feedStatus: null,
          journeyStatus: GpsFeedJourneyStatus.Started,
          isTimingPoint: true,
          operatorInfo: {
            operatorId: 'op1',
            operatorName: 'Operator 1',
            nocCode: 'NOC1',
          },
          serviceInfo: {
            serviceId: 's5',
            serviceName: 'Solihull - Birmingham',
            serviceNumber: '5',
          },
          previousStopInfo: null,
        },
      ];
      const view = VehicleJourneyView.createView(mockStops(), journey, viewParams);

      expect(view.stopList.length).toEqual(3);
      expect(view.stopList[0].onTimePerformance).toEqual(OnTimePerformanceEnum.NoData);
      expect(view.stopList[1].onTimePerformance).toEqual(OnTimePerformanceEnum.NoData);
      expect(view.stopList[2].onTimePerformance).toEqual(OnTimePerformanceEnum.NoData);
    });

    it('should create a stop list with hidden stops if timing points only', () => {
      viewParams.timingPointsOnly = true;
      const view = VehicleJourneyView.createView(mockStops(), mockJourney, viewParams);

      expect(view.stopList.length).toEqual(3);
      expect(view.stopList[0].isHidden).toBeFalse();
      expect(view.stopList[1].isHidden).toBeTrue();
      expect(view.stopList[2].isHidden).toBeTrue();
    });
  });

  describe('journeyInfo', () => {
    it('should create journeyInfo', () => {
      const view = VehicleJourneyView.createView(mockStops(), mockJourney, viewParams);

      expect(view.journeyInfo.operatorInfo?.operatorId).toEqual('op1');
      expect(view.journeyInfo.operatorInfo?.operatorName).toEqual('Operator 1');
      expect(view.journeyInfo.operatorInfo?.nocCode).toEqual('NOC1');
      expect(view.journeyInfo.serviceInfo?.serviceId).toEqual('s5');
      expect(view.journeyInfo.serviceInfo?.serviceName).toEqual('Solihull - Birmingham');
      expect(view.journeyInfo.serviceInfo?.serviceNumber).toEqual('5');
      expect(view.journeyInfo.vehicleId).toEqual(mockJourney[0].vehicleId);
      expect(view.journeyInfo.startTime).toEqual(DateTime.fromISO(mockJourney[0].startTime));
    });
  });
});
