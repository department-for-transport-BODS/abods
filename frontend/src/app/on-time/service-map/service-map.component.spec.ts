import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { OnTimeModule } from '../on-time.module';
import { ServiceMapComponent } from './service-map.component';
import { ServicePattern, TransitModelService } from '../transit-model.service';
import { of } from 'rxjs';
import { ServiceLinkType, StopType } from '../../../generated/graphql';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { MockModule } from 'ng-mocks';
import { DateTime } from 'luxon';
import { OnTimeService } from '../on-time.service';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { Feature } from 'geojson';
import { LineString } from '@turf/helpers';

describe('ServiceMapComponent', () => {
  let spectator: Spectator<ServiceMapComponent>;
  let component: ServiceMapComponent;
  let transitModelService: TransitModelService;
  let onTimeService: OnTimeService;

  const createComponent = createComponentFactory({
    component: ServiceMapComponent,
    imports: [OnTimeModule, SharedModule, LayoutModule, ApolloTestingModule],
    overrideModules: [
      [OnTimeModule, { remove: { imports: [NgxMapboxGLModule] }, add: { imports: [MockModule(NgxMapboxGLModule)] } }],
    ],
  });

  const stops: StopType[] = [
    { stopId: 'ST0000001', stopName: 'Mansfield', lat: 53.1472, lon: 1.1987 },
    { stopId: 'ST0000002', stopName: 'Sheffield', lat: 53.383331, lon: -1.466667 },
  ];
  const serviceLinks: ServiceLinkType[] = [
    {
      fromStop: 'ST0000001',
      toStop: 'ST0000002',
      distance: 100,
      routeValidity: 'VALID',
      linkRoute: '[[1.1987, 53.1472],[-1.466667, 53.383331],[-1.2, 53.4231]]',
    },
    {
      fromStop: 'ST0000002',
      toStop: 'ST0000001',
      distance: 100,
      routeValidity: 'INVALID_NO_ROUTE_POINTS',
      linkRoute: '[[-1.466667, 53.383331],[1.1987, 53.1472]]',
    },
  ];
  const servicePatterns: ServicePattern[] = [
    { serviceLinks: [serviceLinks[0]], servicePatternId: 'SVC0000000001', name: 'Mansfield to Sheffield', stops },
    {
      serviceLinks: [serviceLinks[1]],
      servicePatternId: 'SVC0000000002',
      name: 'Sheffield to Mansfield',
      stops: stops.slice().reverse(),
    },
  ];

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    transitModelService = spectator.inject(TransitModelService);
    onTimeService = spectator.inject(OnTimeService);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should generate service patterns feature', () => {
    const tmSpy = spyOn(transitModelService, 'fetchServicePatternStops').and.returnValue(of(servicePatterns));
    const otpSpy = spyOn(onTimeService, 'fetchStopPerformanceList').and.returnValue(of([]));

    const fromTimestamp = DateTime.fromISO('2021-07-01T00:00:00Z');
    const toTimestamp = DateTime.fromISO('2021-07-31T23:59:59.999Z');
    component.params = {
      fromTimestamp,
      toTimestamp,
      filters: { operatorIds: ['OP152'], lineIds: ['LN12345'], adminAreaIds: ['AA050'] },
    };
    spectator.fixture.detectChanges();

    expect(tmSpy).toHaveBeenCalledWith('OP152', 'LN12345');
    expect(otpSpy).toHaveBeenCalledWith({
      fromTimestamp,
      toTimestamp,
      filters: {
        operatorIds: ['OP152'],
        lineIds: ['LN12345'],
      },
    });

    expect(spectator.component.servicePatterns).toBeTruthy();
    expect(spectator.component.servicePatterns?.type).toEqual('FeatureCollection');
    expect(spectator.component.servicePatterns?.features?.length).toEqual(2);
    expect(spectator.component.servicePatterns?.features?.[0].geometry?.coordinates).toEqual([
      [1.1987, 53.1472],
      [-1.466667, 53.383331],
      [-1.2, 53.4231],
    ]);

    expect(spectator.component.servicePatterns?.features?.[1].geometry?.coordinates).toEqual([
      [-1.466667, 53.383331],
      [1.1987, 53.1472],
    ]);

    expect(spectator.component.stops).toBeTruthy();
    expect(spectator.component.stops?.type).toEqual('FeatureCollection');
    expect(spectator.component.stops?.features?.length).toEqual(2);
    expect(spectator.component.stops?.features?.[0].geometry?.coordinates).toEqual([1.1987, 53.1472]);
    expect(spectator.component.stops?.features?.[0].properties?.naptan).toEqual('0000001');
    expect(spectator.component.stops?.features?.[0].properties?.stopName).toEqual('Mansfield');
    expect(spectator.component.stops?.features?.[1].geometry?.coordinates).toEqual([-1.466667, 53.383331]);
    expect(spectator.component.stops?.features?.[1].properties?.naptan).toEqual('0000002');
    expect(spectator.component.stops?.features?.[1].properties?.stopName).toEqual('Sheffield');
  });

  it('setCoordinates() should set coordinates using service link data', () => {
    const features: Feature<LineString>[] = [];
    const result = spectator.component.setCoordinates(stops, serviceLinks, features);

    expect(result).toEqual([
      [1.1987, 53.1472],
      [-1.466667, 53.383331],
      [-1.2, 53.4231],
    ]);
  });

  it('setCoordinates() should return undefined when serviceLink is not available and feature is already present', () => {
    const features: Feature<LineString>[] = [
      {
        type: 'Feature',
        geometry: { coordinates: [], type: 'LineString' },
        properties: { dashedLine: true, segmentId: 'ST0000001ST0000002', servicePatternId: '' },
      },
    ];
    const result = spectator.component.setCoordinates(stops, [], features);

    expect(result).toEqual(undefined);
  });
});
