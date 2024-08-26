import {
  byLabel,
  byText,
  byTextContent,
  createRoutingFactory,
  createSpyObject,
  SpectatorRouting,
} from '@ngneat/spectator';
import { SharedModule } from '../../shared/shared.module';
import { LayoutModule } from '../../layout/layout.module';
import { RouterTestingModule } from '@angular/router/testing';
import { CorridorsService, CorridorStatsViewParams } from '../corridors.service';
import { of } from 'rxjs';
import { fakeAsync, flush, tick } from '@angular/core/testing';
import { ViewCorridorComponent } from './view-corridor.component';
import { DateTime, Settings } from 'luxon';
import { CorridorGranularity } from '../../../generated/graphql';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { AgGridModule } from 'ag-grid-angular';
import { LuxonModule } from 'luxon-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SegmentSelectorComponent } from '../segment-selector/segment-selector.component';
import { CorridorNotFoundView } from '../corridor-not-found-view.model';
import { Custom } from 'src/app/shared/components/date-range/date-range.types';
import { FeatureIdentifier, LngLatBounds, LngLatBoundsLike, LngLatLike, Map } from 'mapbox-gl';
import { MapComponent } from 'ngx-mapbox-gl';
import { EventEmitter, Input, Output, OnInit, Component, forwardRef, ChangeDetectorRef } from '@angular/core';
import bbox from '@turf/bbox';
import { BBox2d } from '@turf/helpers/dist/js/lib/geojson';
import { lineString } from '@turf/helpers';

const corridor = {
  id: 123,
  name: 'Test corridor',
  stops: [
    {
      stopId: 'ST1234',
      stopName: 'Station road',
      lat: 50,
      lon: 0,
      naptan: '1234',
      intId: 1,
    },
    {
      stopId: 'ST2345',
      stopName: 'Something street',
      lat: 50,
      lon: 0,
      naptan: '2345',
      intId: 2,
    },
    {
      stopId: 'ST3456',
      stopName: 'Tyburn road',
      lat: 50,
      lon: 0,
      naptan: '3456',
      intId: 3,
    },
  ],
};

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'mgl-map',
  template: ``,
  providers: [{ provide: MapComponent, useExisting: forwardRef(() => StubMapComponent) }],
})
export class StubMapComponent implements OnInit {
  @Output() moveEnd = new EventEmitter<void>();
  @Input() bounds?: LngLatBounds;
  @Output() mapLoad = new EventEmitter<Map>();

  mapInstance = createSpyObject(Map, {
    fitBounds: (bounds: LngLatBoundsLike) => {
      this.bounds = LngLatBounds.convert(bounds);
      this.cdr.detectChanges();
      this.moveEnd.emit();
    },
    getSource: () => true,
  });
  move = (sw: LngLatLike, ne: LngLatLike) => {
    this.bounds = new LngLatBounds(sw, ne);
    this.moveEnd.emit();
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  setFeatureState = (feature: FeatureIdentifier | mapboxgl.MapboxGeoJSONFeature, state: { [key: string]: any }) => {};

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.mapLoad.emit(this.mapInstance);
  }
}

describe('ViewCorridorComponent', () => {
  let spectator: SpectatorRouting<ViewCorridorComponent>;
  let service: CorridorsService;

  const createComponent = (data?: any) =>
    createRoutingFactory({
      component: ViewCorridorComponent,
      data: data,
      imports: [
        SharedModule,
        LayoutModule,
        NgxTippyModule,
        LuxonModule,
        FormsModule,
        ReactiveFormsModule,
        ApolloTestingModule,
        RouterTestingModule,
        AgGridModule,
        HttpClientTestingModule,
      ],
      declarations: [SegmentSelectorComponent, StubMapComponent],
      providers: [CorridorsService],
      detectChanges: true,
    });

  const createComponentWithCorridorData = createComponent({ corridor: corridor });
  const createComponentWithCorridorNotFound = createComponent({ corridor: new CorridorNotFoundView() });

  describe('view corridor', () => {
    beforeEach(() => {
      Settings.now = () => 1630494000000; // 2021-09-01T12:00:00

      spectator = createComponentWithCorridorData();
      service = spectator.inject(CorridorsService);
      spectator.component.ngOnInit();
      spectator.detectChanges();
    });

    it('should fetch stats', async () => {
      const spy = spyOn(service, 'fetchStats').and.returnValue(
        of({
          summaryStats: {
            scheduledTransits: 100,
            averageJourneyTime: 90,
            totalTransits: 90,
            numberOfServices: 5,
          },
          journeyTimeDayOfWeekStats: [],
          journeyTimeHistogram: [],
          journeyTimePerServiceStats: [],
          journeyTimeStats: [],
          journeyTimeTimeOfDayStats: [],
          serviceLinks: [],
        })
      );

      await spectator.fixture.whenRenderingDone();

      spectator.selectOption(byLabel('Preset'), 'last28');

      await spectator.fixture.whenStable();

      spectator.fixture.detectChanges();

      const expectedParams: CorridorStatsViewParams = {
        corridorId: '123',
        from: DateTime.fromISO('2021-08-04'),
        to: DateTime.fromISO('2021-09-01'),
        granularity: CorridorGranularity.Day,
        stops: [corridor.stops[0], corridor.stops[1], corridor.stops[2]],
      };

      expect(spy).toHaveBeenCalledWith(expectedParams);
      expect(spectator.query(byTextContent('Total transits90', { selector: '.stat' }))).toBeVisible();
      expect(spectator.query(byTextContent('Services5', { selector: '.stat' }))).toBeVisible();
      expect(spectator.query(byTextContent('Average journey time01:30', { selector: '.stat' }))).toBeVisible();
      expect(spectator.query(byTextContent('Missing transits10', { selector: '.stat' }))).toBeVisible();
    });

    it('should fetch stats with stops selected', async () => {
      const spy = spyOn(service, 'fetchStats').and.returnValue(
        of({
          summaryStats: {
            scheduledTransits: 100,
            averageJourneyTime: 90,
            totalTransits: 90,
            numberOfServices: 5,
          },
          journeyTimeDayOfWeekStats: [],
          journeyTimeHistogram: [],
          journeyTimePerServiceStats: [],
          journeyTimeStats: [],
          journeyTimeTimeOfDayStats: [],
          serviceLinks: [],
        })
      );

      await spectator.fixture.whenRenderingDone();

      spectator.selectOption(byLabel('Preset'), 'last28');
      spectator.component.selectedStops$.next([corridor.stops[1], corridor.stops[2]]);

      await spectator.fixture.whenStable();

      spectator.fixture.detectChanges();

      const expectedParams: CorridorStatsViewParams = {
        corridorId: '123',
        from: DateTime.fromISO('2021-08-04'),
        to: DateTime.fromISO('2021-09-01'),
        granularity: CorridorGranularity.Day,
        stops: [corridor.stops[1], corridor.stops[2]],
      };

      expect(spy).toHaveBeenCalledWith(expectedParams);
      expect(spectator.query(byTextContent('Total transits90', { selector: '.stat' }))).toBeVisible();
      expect(spectator.query(byTextContent('Services5', { selector: '.stat' }))).toBeVisible();
      expect(spectator.query(byTextContent('Average journey time01:30', { selector: '.stat' }))).toBeVisible();
      expect(spectator.query(byTextContent('Missing transits10', { selector: '.stat' }))).toBeVisible();
    });

    it('should select day granularity for a 5 day period', async () => {
      const spy = spyOn(service, 'fetchStats').and.returnValue(
        of({
          summaryStats: {
            scheduledTransits: 100,
            averageJourneyTime: 90,
            totalTransits: 90,
            numberOfServices: 5,
          },
          journeyTimeDayOfWeekStats: [],
          journeyTimeHistogram: [],
          journeyTimePerServiceStats: [],
          journeyTimeStats: [],
          journeyTimeTimeOfDayStats: [],
          serviceLinks: [],
        })
      );

      await spectator.fixture.whenRenderingDone();

      const from = DateTime.fromISO('2021-08-25');
      const to = DateTime.fromISO('2021-08-30');
      const trendFrom = DateTime.fromISO('2021-08-20');
      const trendTo = DateTime.fromISO('2021-08-25');

      spectator.component.dateRange.setValue({
        from,
        to,
        trendFrom,
        trendTo,
        preset: Custom.Custom,
      });

      await spectator.fixture.whenStable();

      spectator.fixture.detectChanges();

      const expectedParams: Partial<CorridorStatsViewParams> = {
        from,
        to,
        granularity: CorridorGranularity.Day,
        stops: [corridor.stops[0], corridor.stops[1], corridor.stops[2]],
      };

      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining(expectedParams));
    });

    it('should display service breakdown grid', fakeAsync(() => {
      spyOn(service, 'fetchCorridorById').and.returnValue(of(corridor));

      spyOn(service, 'fetchStats').and.returnValue(
        of({
          summaryStats: {},
          journeyTimeDayOfWeekStats: [],
          journeyTimeHistogram: [],
          journeyTimePerServiceStats: [
            {
              lineName: '53',
              servicePatternName: 'Sheffield to Mansfield',
              noc: 'SCEM',
              operatorName: 'Stagecoach East Midlands',
              scheduledTransits: 25,
              recordedTransits: 24,
              totalJourneyTime: 60,
            },
            {
              lineName: '77',
              servicePatternName: 'Chesterfield to Worksop',
              noc: 'SCEM',
              operatorName: 'Stagecoach East Midlands',
              scheduledTransits: 50,
              recordedTransits: 45,
              totalJourneyTime: 30,
            },
          ],
          journeyTimeStats: [],
          journeyTimeTimeOfDayStats: [],
          serviceLinks: [],
        })
      );

      spectator.setRouteParam('corridorId', '155');
      spectator.detectChanges();
      tick(100);

      spectator.selectOption(byLabel('Preset'), 'last28');

      spectator.detectChanges();
      tick(100);

      const cellContent = spectator.query('[role="row"][row-index="0"] [role="gridcell"][col-id="0"]')?.textContent;

      expect(cellContent).toEqual('53: Sheffield to Mansfield');
      flush();
    }));

    it('should set coordinates using service link data', fakeAsync(() => {
      spyOn(service, 'fetchStats').and.returnValue(
        of({
          summaryStats: {},
          journeyTimeDayOfWeekStats: [],
          journeyTimeHistogram: [],
          journeyTimePerServiceStats: [],
          journeyTimeStats: [],
          journeyTimeTimeOfDayStats: [],
          serviceLinks: [
            {
              fromStop: 'ST1234',
              toStop: 'ST2345',
              distance: 360,
              routeValidity: 'VALID',
              linkRoute: '[[1, 0], [2, 0], [3, 0]]',
            },
          ],
        })
      );

      spectator.selectOption(byLabel('Preset'), 'last28');
      spectator.detectChanges();
      tick(100);

      const result = spectator.component.setCoordinates(corridor.stops);

      expect(result).toEqual([
        [1, 0],
        [2, 0],
        [3, 0],
      ]);
      flush();
    }));

    it('should set coordinates if service link data unavailable', () => {
      const result = spectator.component.setCoordinates(corridor.stops);

      expect(result).toEqual([
        [0, 50],
        [0, 50],
      ]);
    });

    it('onSelectSegment() should set map selected state', () => {
      spectator.component.onSelectSegment([corridor.stops[0], corridor.stops[1]]);
      spectator.detectChanges();

      expect(spectator.component.map?.mapInstance.setFeatureState).toHaveBeenCalledWith(
        { source: 'corridor-line', id: corridor.stops[0].stopId + corridor.stops[1].stopId },
        { selected: true }
      );
    });

    it('onSelectSegment() should set select all to true if no segment passed', fakeAsync(() => {
      spyOn(service, 'fetchStats').and.returnValue(
        of({
          summaryStats: {},
          journeyTimeDayOfWeekStats: [],
          journeyTimeHistogram: [],
          journeyTimePerServiceStats: [],
          journeyTimeStats: [],
          journeyTimeTimeOfDayStats: [],
          serviceLinks: [],
        })
      );

      spectator.selectOption(byLabel('Preset'), 'last28');
      spectator.detectChanges();
      tick(100);

      spectator.component.onSelectSegment([]);
      spectator.detectChanges();

      expect(spectator.component.selectAll).toEqual(true);
    }));

    it('clearMapSelectedState() should clear map selected state', () => {
      spectator.component.clearMapSelectedState([corridor.stops[0], corridor.stops[1]]);
      spectator.detectChanges();

      expect(spectator.component.map?.mapInstance.removeFeatureState).toHaveBeenCalledWith(
        { source: 'corridor-line', id: corridor.stops[0].stopId + corridor.stops[1].stopId },
        'selected'
      );
    });

    it('clearMapSelectedState() should set select all to false if no segment passed', () => {
      spectator.component.clearMapSelectedState([]);
      spectator.detectChanges();

      expect(spectator.component.selectAll).toEqual(false);
    });

    it('setMapHoverState() should set map hover state', () => {
      spectator.component.loadingStats = false;
      spectator.component.setMapHoverState(corridor.stops[0]);
      spectator.detectChanges();

      expect(spectator.component.map?.mapInstance.setFeatureState).toHaveBeenCalledWith(
        { source: 'corridor-stops', id: corridor.stops[0].stopId },
        { hover: true }
      );
    });

    it('clearMapHoverState() should clear map hover state', () => {
      spectator.component.loadingStats = false;
      spectator.component.clearMapHoverState(corridor.stops[0]);
      spectator.detectChanges();

      expect(spectator.component.map?.mapInstance.removeFeatureState).toHaveBeenCalledWith(
        { source: 'corridor-stops', id: corridor.stops[0].stopId },
        'hover'
      );
    });

    it('centreMapBounds() should set bounds value based on corridorLine bbox', fakeAsync(() => {
      spyOn(service, 'fetchStats').and.returnValue(
        of({
          summaryStats: {},
          journeyTimeDayOfWeekStats: [],
          journeyTimeHistogram: [],
          journeyTimePerServiceStats: [],
          journeyTimeStats: [],
          journeyTimeTimeOfDayStats: [],
          serviceLinks: [],
        })
      );

      spectator.selectOption(byLabel('Preset'), 'last28');
      spectator.detectChanges();
      tick(100);

      spectator.component.centreMapBounds();

      expect(spectator.component.bounds).toEqual(bbox(spectator.component.corridorLine) as BBox2d);
      flush();
    }));

    it('centreMapBounds() should set bounds value based on currently selected segment', fakeAsync(() => {
      spyOn(service, 'fetchStats').and.returnValue(
        of({
          summaryStats: {},
          journeyTimeDayOfWeekStats: [],
          journeyTimeHistogram: [],
          journeyTimePerServiceStats: [],
          journeyTimeStats: [],
          journeyTimeTimeOfDayStats: [],
          serviceLinks: [],
        })
      );

      spectator.selectOption(byLabel('Preset'), 'last28');
      spectator.detectChanges();
      tick(100);

      spectator.component.onSelectSegment([corridor.stops[0], corridor.stops[1]]);
      spectator.detectChanges();

      spectator.component.centreMapBounds();
      spectator.detectChanges();

      expect(spectator.component.bounds).toEqual(
        bbox(
          lineString([
            [corridor.stops[0].lon, corridor.stops[0].lat],
            [corridor.stops[1].lon, corridor.stops[1].lat],
          ])
        ) as BBox2d
      );
      flush();
    }));
  });

  describe('corridor not found', () => {
    beforeEach(() => {
      spectator = createComponentWithCorridorNotFound();
      service = spectator.inject(CorridorsService);
      spectator.component.ngOnInit();
      spectator.detectChanges();
    });

    it('should show error message if no corridor is found', () => {
      expect(spectator.query(byText('Not found'))).toBeVisible();
      expect(spectator.query('.govuk-body')?.innerHTML).toContain(
        'Corridor not found, or you do not have permission to view.'
      );
    });
  });
});
