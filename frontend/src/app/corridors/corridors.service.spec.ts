import { createServiceFactory, SpyObject } from '@ngneat/spectator';
import { SpectatorService } from '@ngneat/spectator/lib/spectator-service/spectator-service';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import {
  CorridorGranularity,
  CorridorsListDocument,
  CorridorsStopSearchDocument,
  CorridorsSubsequentStopsDocument,
  CorridorStatsDocument,
  CorridorStatsType,
  CreateCorridorDocument,
  DeleteCorridorDocument,
  GetCorridorDocument,
  ICorridorJourneyTimeStats,
  ServiceLinkType,
  UpdateCorridorDocument,
} from '../../generated/graphql';
import {
  CorridorsService,
  CorridorStatsViewParams,
  filterServiceLinksByStopsOrReturnServiceLinks,
  Stop,
} from './corridors.service';
import { DateTime, Settings } from 'luxon';
import { fakeAsync, flush } from '@angular/core/testing';
import objectContaining = jasmine.objectContaining;
import { OperatorService } from '../shared/services/operator.service';
import { of } from 'rxjs';

const journeyTime: ICorridorJourneyTimeStats = {
  avgTransitTime: 5,
  minTransitTime: 1,
  maxTransitTime: 10,
  percentile5: 2,
  percentile25: 3,
  percentile75: 7,
  percentile95: 9,
};

const params: CorridorStatsViewParams = {
  corridorId: '150',
  from: DateTime.fromISO('2023-03-03', { zone: 'Europe/London' }),
  to: DateTime.fromISO('2023-03-30', { zone: 'Europe/London' }),
  granularity: CorridorGranularity.Day,
  stops: [{ stopId: 'ST0001', stopName: 'A' } as Stop, { stopId: 'ST0002', stopName: 'B' } as Stop],
};

const stats: CorridorStatsType = {
  summaryStats: {
    scheduledTransits: 100,
    averageJourneyTime: 90,
    totalTransits: 95,
    numberOfServices: 5,
  },
  journeyTimeStats: [{ ts: DateTime.fromISO('2023-03-03').toISO({ suppressMilliseconds: true }), ...journeyTime }],
  journeyTimeTimeOfDayStats: [{ hour: 9, ...journeyTime }],
  journeyTimeDayOfWeekStats: [{ dow: 1, ...journeyTime }],
  journeyTimeHistogram: [
    {
      hist: [
        { bin: 89, freq: 3 },
        { bin: 90, freq: 6 },
        { bin: 92, freq: 1 },
      ],
    },
  ],
  journeyTimePerServiceStats: [
    {
      lineName: 'Sheffield to Mansfield',
      noc: 'OP01',
      operatorName: 'Stagecoach East Midlands',
      totalJourneyTime: 810,
      scheduledTransits: 10,
      recordedTransits: 9,
      servicePatternName: '',
    },
  ],
  serviceLinks: [],
};

const serviceLinks = [
  {
    fromStop: 'ST0100BRP90312',
    toStop: 'ST0100BRA10796',
    distance: 100,
    routeValidity: '',
  },
  {
    fromStop: 'ST0100BRA10796',
    toStop: 'ST0100BRA10807',
    distance: 200,
    routeValidity: '',
  },
  {
    fromStop: 'ST0100BRA10807',
    toStop: 'ST0100BRP90340',
    distance: 300,
    routeValidity: '',
  },
  {
    fromStop: 'ST0100BRP90340',
    toStop: 'ST0100BRP90345',
    distance: 400,
    routeValidity: '',
  },
  {
    fromStop: 'ST0100BRP90345',
    toStop: 'ST0100BRP90003',
    distance: 500,
    routeValidity: '',
  },
];

const paramStopsFound = [
  {
    stopId: 'ST0100BRP90312',
    stopName: '',
    lat: 0,
    lon: 1,
    naptan: '',
    intId: 0,
  },
  {
    stopId: 'ST0100BRA10796',
    stopName: '',
    lat: 0,
    lon: 1,
    naptan: '',
    intId: 0,
  },
];
const paramStopsNotFound = [
  {
    stopId: 'ST0100',
    stopName: '',
    lat: 0,
    lon: 1,
    naptan: '',
    intId: 0,
  },
  {
    stopId: 'ST0200',
    stopName: '',
    lat: 0,
    lon: 1,
    naptan: '',
    intId: 0,
  },
];

describe('CorridorsService', () => {
  let spectator: SpectatorService<CorridorsService>;
  let controller: ApolloTestingController;
  let opService: SpyObject<OperatorService>;
  const serviceFactory = createServiceFactory({
    service: CorridorsService,
    imports: [ApolloTestingModule],
    mocks: [OperatorService],
  });

  beforeEach(() => {
    Settings.defaultZone = 'Europe/London';
    Settings.now = () => 1664578800; // 2022-10-01 GMT+01:00, i.e. during BST

    spectator = serviceFactory();
    controller = spectator.inject(ApolloTestingController);
    opService = spectator.inject(OperatorService);
  });

  it('should query stops', () => {
    opService.fetchAdminAreaIds.and.returnValue(of(['001', '002']));

    spectator.service.queryStops('station').subscribe((actual) => {
      expect(actual).not.toBeNull();
      expect(actual.orgStops.length).toEqual(2);
      expect(actual.orgStops[0].stopId).toEqual('ST00001');
      expect(actual.orgStops[0].stopName).toEqual('Station Road');
      expect(actual.orgStops[1].stopId).toEqual('ST00002');
      expect(actual.orgStops[1].stopName).toEqual('Bus Station');
      expect(actual.nonOrgStops.length).toEqual(1);
      expect(actual.nonOrgStops[0].stopId).toEqual('ST00003');
      expect(actual.nonOrgStops[0].stopName).toEqual('Temple Way');
    });

    const op = controller.expectOne(CorridorsStopSearchDocument);

    expect(op.operation.variables.inputs).toEqual({
      searchString: 'station',
      boundingBox: undefined,
    });

    op.flush({
      data: {
        corridor: {
          addFirstStop: [
            {
              stopId: 'ST00001',
              stopName: 'Station Road',
              lat: 50,
              lon: 0,
              adminAreaId: '001',
            },
            {
              stopId: 'ST00002',
              stopName: 'Bus Station',
              lat: 50,
              lon: 0,
              adminAreaId: '002',
            },
            {
              stopId: 'ST00003',
              stopName: 'Temple Way',
              lat: 50,
              lon: 0,
              adminAreaId: '003',
            },
          ],
        },
      },
    });

    controller.verify();
  });

  it('should fetch subsequent stops', fakeAsync(() => {
    spectator.service.fetchSubsequentStops(['ST012345']).subscribe((actual) => {
      expect(actual).not.toBeNull();
      expect(actual.length).toEqual(1);
      expect(actual[0].stopId).toEqual('ST023456');
      expect(actual[0].stopName).toEqual('High Street');
    });
    const op = controller.expectOne(CorridorsSubsequentStopsDocument);

    expect(op.operation.variables.stopList).toEqual(['ST012345']);

    op.flush({
      data: {
        corridor: {
          addSubsequentStops: [
            {
              stopId: 'ST023456',
              stopName: 'High Street',
              lat: 51,
              lon: 0,
            },
          ],
        },
      },
    });

    controller.verify();
    flush();
  }));

  it('should save corridors', () => {
    spectator.service.createCorridor('my new corridor', ['ST012345']).subscribe();

    controller.expectOne((operation) => {
      expect(operation.query.definitions).toEqual(CreateCorridorDocument.definitions);
      expect(operation.variables.name).toEqual('my new corridor');
      expect(operation.variables.stopIds).toEqual(['ST012345']);
      return true;
    });

    controller.verify();
  });

  it('should fetch corridors', fakeAsync(() => {
    spectator.service.fetchCorridors().subscribe((actual) => {
      expect(actual).not.toBeNull();
      expect(actual.length).toEqual(1);
      expect(actual[0].id).toEqual(234);
      expect(actual[0].name).toEqual('Test corridor');
      expect(actual[0].numStops).toEqual(2);
    });

    const op = controller.expectOne(CorridorsListDocument);

    op.flush({
      data: {
        corridor: {
          corridorList: [
            {
              id: 234,
              name: 'Test corridor',
              stops: [{ stopId: 'ST000001' }, { stopId: 'ST000002' }],
            },
          ],
        },
      },
    });

    controller.verify();
    flush();
  }));

  it('should fetch corridors by id', fakeAsync(() => {
    spectator.service.fetchCorridorById(150).subscribe((actual) => {
      expect(actual).not.toBeNull();
      expect(actual.id).toEqual(150);
      expect(actual.name).toEqual('Test corridor');
      expect(actual.stops.length).toEqual(2);
      expect(actual.stops[0].stopId).toEqual('ST000001');
      expect(actual.stops[1].stopId).toEqual('ST000002');
      expect(actual.stops[0].naptan).toEqual('000001');
      expect(actual.stops[1].naptan).toEqual('000002');
    });

    const op = controller.expectOne(GetCorridorDocument);

    expect(op.operation.variables.corridorId).toEqual(150);

    op.flush({
      data: {
        corridor: {
          getCorridor: {
            id: 150,
            name: 'Test corridor',
            stops: [
              { stopId: 'ST000001', stopName: 'Foo street', stopLocation: { latitude: 50, longitude: 0 } },
              { stopId: 'ST000002', stopName: 'Bar road', stopLocation: { latitude: 51, longitude: 0 } },
            ],
          },
        },
      },
    });

    controller.verify();
    flush();
  }));

  it('should fetch corridor stats', () => {
    spectator.service.fetchStats(params).subscribe((actual) => {
      expect(actual.summaryStats.numberOfServices).toEqual(5);
    });

    const op = controller.expectOne(CorridorStatsDocument);

    expect(op.operation.variables.params).toEqual(
      objectContaining({
        corridorId: '150',
        fromTimestamp: '2023-03-03T00:00:00.000+00:00',
        toTimestamp: '2023-03-30T00:00:00.000+01:00',
        granularity: CorridorGranularity.Day,
        stopList: ['ST0001', 'ST0002'],
      })
    );

    op.flush({ data: { corridor: { stats } } });

    controller.verify();
  });

  it('should convert corridor stats', () => {
    const actual = spectator.service.convertStats(stats, params);

    expect(actual.journeyTimeStats[0].ts).toEqual('2023-03-03T00:00:00+00:00');
    expect(actual.journeyTimeStats[actual.journeyTimeStats.length - 1].ts).toEqual('2023-03-30T00:00:00+01:00');
    expect(actual.journeyTimeStats.length).toEqual(28);
    expect(actual.journeyTimeTimeOfDayStats.length).toEqual(25);
    expect(actual.journeyTimeDayOfWeekStats.length).toEqual(7);
    expect(actual.journeyTimeHistogram.length).toEqual(5);
    expect(actual.journeyTimePerServiceStats.length).toEqual(1);

    // from midnight to midnight, inclusive
    expect(actual.journeyTimeTimeOfDayStats[0].hour).toEqual(0);
    expect(actual.journeyTimeTimeOfDayStats[24].hour).toEqual(24);

    // Monday to Sunday
    expect(actual.journeyTimeDayOfWeekStats[0].category).toEqual('Mon');
    expect(actual.journeyTimeDayOfWeekStats[6].category).toEqual('Sun');

    expect(actual.journeyTimePerServiceStats[0].noc).toEqual('OP01');
    expect(actual.journeyTimePerServiceStats[0].operatorName).toEqual('Stagecoach East Midlands');
  });

  it('should delete corridors', () => {
    spectator.service.deleteCorridor(1234).subscribe();

    controller.expectOne((operation) => {
      expect(operation.query.definitions).toEqual(DeleteCorridorDocument.definitions);
      expect(operation.variables.corridorId).toEqual(1234);
      return true;
    });

    controller.verify();
  });

  describe('filterServiceLinksByStopsOrReturnServiceLinks', () => {
    it('should return a single service link section where fromStop and toStop matches', () => {
      params.stops = paramStopsFound;
      const result = filterServiceLinksByStopsOrReturnServiceLinks(serviceLinks as ServiceLinkType[], params.stops);

      expect(result[0].distance).toEqual(100);
      expect(result[0].fromStop).toEqual(params.stops[0].stopId);
      expect(result[0].toStop).toEqual(params.stops[1].stopId);
    });

    it('should return all service links if params undefined', () => {
      const result = filterServiceLinksByStopsOrReturnServiceLinks(serviceLinks as ServiceLinkType[], undefined);

      expect(result.length).toEqual(serviceLinks.length);
    });

    it('should return all service links if params stop list empty', () => {
      params.stops = [];
      const result = filterServiceLinksByStopsOrReturnServiceLinks(serviceLinks as ServiceLinkType[], params.stops);

      expect(result.length).toEqual(serviceLinks.length);
    });

    it('should return all service links if no match params stop list empty', () => {
      params.stops = paramStopsNotFound;
      const result = filterServiceLinksByStopsOrReturnServiceLinks(serviceLinks as ServiceLinkType[], params.stops);

      expect(result.length).toEqual(serviceLinks.length);
    });

    afterAll(() => {
      params.stops = [{ stopId: 'ST0001', stopName: 'A' } as Stop, { stopId: 'ST0002', stopName: 'B' } as Stop];
    });
  });

  it('should update corridor', () => {
    spectator.service
      .updateCorridor({ name: 'my updated corridor', id: 123, stopList: ['ST012345', 'ST67890'] })
      .subscribe();

    controller.expectOne((operation) => {
      expect(operation.query.definitions).toEqual(UpdateCorridorDocument.definitions);
      expect(operation.variables.inputs.name).toEqual('my updated corridor');
      expect(operation.variables.inputs.id).toEqual(123);
      expect(operation.variables.inputs.stopList).toEqual(['ST012345', 'ST67890']);
      return true;
    });

    controller.verify();
  });
});
