import { createServiceFactory } from '@ngneat/spectator';
import { StopPerformance } from './on-time.service';
import { StopPerformanceService } from './stop-performance.service';
import { SpectatorService } from '@ngneat/spectator/lib/spectator-service/spectator-service';
import { ServicePattern } from './transit-model.service';
import objectContaining = jasmine.objectContaining;

const stopPerf = (early: number, onTime: number, late: number, stopId = 'S00001'): StopPerformance => ({
  lineId: 'LN001',
  stopId,
  stopInfo: {
    sourceId: '',
    stopName: 'Bus stop',
    stopId: stopId,
    stopLocation: { latitude: 56.7686, longitude: 0.4567 },
    stopLocality: { localityId: 'L001', localityAreaId: 'LA001', localityName: 'Area', localityAreaName: 'Town' },
  },
  early,
  onTime,
  late,
  earlyRatio: early / (early + onTime + late),
  onTimeRatio: onTime / (early + onTime + late),
  lateRatio: late / (early + onTime + late),
  total: early + onTime + late,
  actualDepartures: early + onTime + late,
  scheduledDepartures: early + onTime + late,
  timingPoint: false,
  averageDelay: 60,
  completedRatio: 0,
});

describe('StopPerformanceService', () => {
  let spectator: SpectatorService<StopPerformanceService>;
  const serviceFactory = createServiceFactory(StopPerformanceService);

  beforeEach(() => (spectator = serviceFactory()));

  it('should merge OTP and transit model data', () => {
    const otpModel: StopPerformance[] = [
      stopPerf(2, 1, 3, 'ST00001'),
      stopPerf(4, 5, 6, 'ST00002'),
      stopPerf(7, 8, 9, 'ST00003'),
    ];
    const transitModel: ServicePattern[] = [
      {
        servicePatternId: '001',
        name: 'A to B',
        stops: [
          { stopId: 'ST00001', stopName: 'A', lat: 50, lon: 0 },
          { stopId: 'ST00002', stopName: 'B', lat: 51, lon: 0 },
          { stopId: 'ST00003', stopName: 'C', lat: 52, lon: 0 },
          { stopId: 'ST09999', stopName: 'Unknown', lat: 54, lon: 0 },
        ],
        serviceLinks: [],
      },
    ];

    const actual = spectator.service.mergeStops(otpModel, transitModel);

    expect(actual?.length).toBeDefined();

    const stop1 = actual.find((stop) => stop.stopId === 'ST00001');

    expect(stop1).toBeDefined();
    expect(stop1).toEqual(objectContaining({ stopId: 'ST00001', lat: 50, lon: 0, early: 2, noData: false }));

    const unknownStop = actual.find((stop) => stop.stopId === 'ST09999');

    expect(unknownStop).toBeDefined();
    expect(unknownStop).toEqual(objectContaining({ stopId: 'ST09999', lat: 54, lon: 0, noData: true }));
  });

  it('should produce normalized values', () => {
    const stopPerformance: StopPerformance[] = [stopPerf(2, 1, 7), stopPerf(1, 7, 2), stopPerf(3, 6, 1)];

    const actual = spectator.service.normalize(stopPerformance);

    expect(actual).toBeDefined();
    expect(actual.length).toEqual(3);
    expect(actual[0].earlyNorm).toEqual(0);
    expect(actual[1].earlyNorm).toBeLessThan(0);
    expect(actual[2].earlyNorm).toBeGreaterThan(0);
    expect(actual[0].lateNorm).toBeGreaterThan(1);
  });

  it('should not produce normalized value of NaN when there is zero total lateness', () => {
    const stopPerformance: StopPerformance[] = [stopPerf(3, 7, 0), stopPerf(1, 9, 0), stopPerf(2, 8, 0)];

    const actual = spectator.service.normalize(stopPerformance);

    expect(actual).toBeDefined();
    expect(actual.length).toEqual(3);
    expect(actual[0].lateNorm).not.toBeNaN();
    expect(actual[1].lateNorm).not.toBeNaN();
    expect(actual[2].lateNorm).not.toBeNaN();
  });

  it('should not produce normalized value of NaN when a stop is 100% early or late', () => {
    const stopPerformance: StopPerformance[] = [stopPerf(3, 0, 0), stopPerf(0, 0, 2)];

    const actual = spectator.service.normalize(stopPerformance);

    expect(actual).toBeDefined();
    expect(actual.length).toEqual(2);
    expect(actual[0].earlyNorm).not.toBeNaN();
    expect(actual[1].lateNorm).not.toBeNaN();
  });

  it('should tolerate zeroes in on-time performance data', () => {
    const stopPerformance: StopPerformance[] = [
      stopPerf(1, 0, 0, 'ST00001'),
      stopPerf(0, 1, 0, 'ST00002'),
      stopPerf(0, 0, 1, 'ST00003'),
    ];
    const transitModel: ServicePattern[] = [
      {
        servicePatternId: '001',
        name: 'A to B',
        stops: [
          { stopId: 'ST00001', stopName: 'A', lat: 50, lon: 0 },
          { stopId: 'ST00002', stopName: 'B', lat: 51, lon: 0 },
          { stopId: 'ST00003', stopName: 'C', lat: 52, lon: 0 },
        ],
        serviceLinks: [],
      },
    ];

    const actual = spectator.service.mergeStops(stopPerformance, transitModel);

    expect(actual).toBeDefined();
    expect(actual.length).toEqual(3);
    expect(actual[0].noData).toBeFalse();
    expect(actual[1].noData).toBeFalse();
    expect(actual[2].noData).toBeFalse();
  });
});
