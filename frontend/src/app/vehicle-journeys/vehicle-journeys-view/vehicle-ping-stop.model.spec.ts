import { DateTime, Settings } from 'luxon';
import { GpsFeedJourneyStatus } from '../../../generated/graphql';
import { OnTimePerformanceEnum } from './on-time-performance.enum';
import { ApolloGpsFeedType, StopDetails } from './vehicle-journeys-view.service';
import { VehiclePingStop } from './vehicle-ping-stop.model';

describe('VehiclePingStop', () => {
  const t1 = '2022-08-18T11:20:00.000+01:00';
  const startTime = '2022-08-18T11:20:00.000+01:00';
  let stop: StopDetails;
  const ping: ApolloGpsFeedType = {
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
  };

  beforeEach(() => {
    Settings.defaultZone = 'Europe/London';
    Settings.now = () => 1664578800; // 2022-10-01 GMT+01:00, i.e. during BST
    stop = {
      stopId: 'ST43000158103',
      stopName: 'Solihull Town Centre',
      lon: -1.78000522,
      lat: 52.4139824,
      startTime: DateTime.fromISO(startTime),
      timingPoint: true,
      departureTimeOffset: 0,
    };
  });

  it('should set actual departure by adding delay to scheduled departure', () => {
    ping.delay = 0;
    let vps = VehiclePingStop.createVehiclePingStop(ping, stop);

    expect(vps.actualDeparture?.toISO()).toEqual(DateTime.fromISO(startTime).toISO());

    ping.delay = 120;
    vps = VehiclePingStop.createVehiclePingStop(ping, stop);

    expect(vps.actualDeparture).toEqual(DateTime.fromISO(startTime).plus({ seconds: 120 }));
  });

  it('should create an On Time stop if delay is less than 360', () => {
    ping.delay = 359;
    const vps = VehiclePingStop.createVehiclePingStop(ping, stop);

    expect(vps.onTimePerformance).toEqual(OnTimePerformanceEnum.OnTime);
  });

  it('should create an On Time stop if delay is greater than -61', () => {
    ping.delay = -60;
    const vps = VehiclePingStop.createVehiclePingStop(ping, stop);

    expect(vps.onTimePerformance).toEqual(OnTimePerformanceEnum.OnTime);
  });

  it('should create an Early stop if delay is less than -60', () => {
    ping.delay = -61;
    const vps = VehiclePingStop.createVehiclePingStop(ping, stop);

    expect(vps.onTimePerformance).toEqual(OnTimePerformanceEnum.Early);
  });

  it('should create a Late stop if delay is greater than 359', () => {
    ping.delay = 360;
    const vps = VehiclePingStop.createVehiclePingStop(ping, stop);

    expect(vps.onTimePerformance).toEqual(OnTimePerformanceEnum.Late);
  });

  it('should create a No Data stop if no delay', () => {
    ping.delay = null;
    const vps = VehiclePingStop.createVehiclePingStop(ping, stop);

    expect(vps.onTimePerformance).toEqual(OnTimePerformanceEnum.NoData);
  });

  it('should create a No Data stop', () => {
    const vps = VehiclePingStop.createNoDataStop(stop);

    expect(vps.onTimePerformance).toEqual(OnTimePerformanceEnum.NoData);
  });

  it('should set timing point to false', () => {
    stop.timingPoint = false;
    const vps = VehiclePingStop.createNoDataStop(stop);

    expect(vps.isTimingPoint).toEqual(false);
  });

  it('should set timing point to true', () => {
    stop.timingPoint = true;
    const vps = VehiclePingStop.createNoDataStop(stop);

    expect(vps.isTimingPoint).toEqual(true);
  });
});
