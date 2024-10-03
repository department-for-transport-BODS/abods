import { CreateCorridorComponent } from './create-corridor.component';
import {
  byLabel,
  byText,
  byTextContent,
  byValue,
  createRoutingFactory,
  createSpyObject,
  SpectatorRouting,
  SpyObject,
} from '@ngneat/spectator';
import { SharedModule } from '../../shared/shared.module';
import { LayoutModule } from '../../layout/layout.module';
import { RouterTestingModule } from '@angular/router/testing';
import { Corridor, CorridorsService } from '../corridors.service';
import { EMPTY, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { GeocodingService } from '../../shared/mapbox/geocoding.service';
import { featureCollection, point, points, Position } from '@turf/helpers';
import { NgSelectModule } from '@ng-select/ng-select';
import { LngLatBounds, LngLatBoundsLike, LngLatLike, Map } from 'mapbox-gl';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EventEmitter, Input, Output } from '@angular/core';
import { GeocodingContext, GeocodingFeature, GeocodingResult } from '../../shared/mapbox/geocoding.types';
import { CommonModule } from '@angular/common';
import { BBox2d } from '@turf/helpers/dist/js/lib/geojson';
import { StopSearchListComponent } from './stop-search-list/stop-search-list.component';
import { CorridorMapComponent } from './corridor-map/corridor-map.component';
import { DeleteCorridorModalComponent } from '../delete-corridor-modal/delete-corridor-modal.component';
import { CorridorStopListComponent } from './corridor-stop-list/corridor-stop-list.component';
import { CorridorNotFoundView } from '../corridor-not-found-view.model';

const testStop1 = { stopId: 'ST012345', naptan: '012345', stopName: 'Station Road', lat: 50, lon: 0, intId: 0 };
const testStop2 = { stopId: 'ST023456', naptan: '023456', stopName: 'High Street', lat: 51, lon: 0, intId: 1 };
const testStop3 = {
  stopId: 'ST987654',
  naptan: '987654',
  stopName: 'Sheffield Interchange/A1',
  lat: 53.381,
  lon: -1.465,
  intId: 2,
};
const testStop4 = { stopId: 'ST789123', naptan: '789123', stopName: 'Darcy Road', lat: 53.308, lon: -1.366, intId: 3 };

const corridor = <Corridor>{
  name: 'test corridor',
  id: 123,
  stops: [testStop1, testStop2, testStop3],
};

const geocodingResult = (coordinates: Position, bbox: BBox2d, text: string, context: GeocodingContext[] = []) => {
  const result = featureCollection([point(coordinates, {}, { bbox })]) as GeocodingResult;
  result.features[0].text = text;
  result.features[0].context = context;
  return result;
};

class StubMapComponent {
  @Output() moveEnd = new EventEmitter<void>();
  @Input() bounds?: LngLatBounds;

  mapInstance = createSpyObject(Map, {
    getBounds: () => this.bounds,
    fitBounds: (bounds: LngLatBoundsLike) => {
      this.bounds = LngLatBounds.convert(bounds);
      this.moveEnd.emit();
    },
  });
  move = (sw: LngLatLike, ne: LngLatLike) => {
    this.bounds = new LngLatBounds(sw, ne);
    this.moveEnd.emit();
  };
}

describe('CreateCorridorComponent', () => {
  let spectator: SpectatorRouting<CreateCorridorComponent>;
  let corridorsService: CorridorsService;
  let geocodingService: SpyObject<GeocodingService>;
  let router: Router;

  const createComponent = (data?: any) =>
    createRoutingFactory({
      component: CreateCorridorComponent,
      data: data,
      imports: [
        SharedModule,
        CommonModule,
        LayoutModule,
        RouterTestingModule,
        ApolloTestingModule,
        NgSelectModule,
        FormsModule,
        ReactiveFormsModule,
      ],
      declarations: [
        CorridorMapComponent,
        StopSearchListComponent,
        CorridorStopListComponent,
        DeleteCorridorModalComponent,
      ],
      providers: [CorridorsService],
      mocks: [GeocodingService],
      detectChanges: true,
    });
  const createComponentWithNoData = createComponent();
  const createComponentWithCorridorData = createComponent({ corridor: corridor });
  const createComponentWithCorridorNotFound = createComponent({ corridor: new CorridorNotFoundView() });

  describe('create new corridor', () => {
    beforeEach(() => {
      spectator = createComponentWithNoData();
      corridorsService = spectator.inject(CorridorsService);
      geocodingService = spectator.inject(GeocodingService);
      router = spectator.inject(Router);
      spectator.component.corridorMap.map = new StubMapComponent().mapInstance;
      spectator.detectChanges();
    });

    it('should search for stops', async () => {
      const spy = spyOn(corridorsService, 'queryStops').and.returnValue(of({ orgStops: [testStop1], nonOrgStops: [] }));

      await spectator.fixture.whenRenderingDone();

      // Must select stop mode
      spectator.selectOption(byLabel('Search for the first stop in your corridor'), 'stop');
      await spectator.fixture.whenStable();

      spectator.typeInElement('station', '#stop-query');

      await spectator.fixture.whenStable();
      spectator.fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith('station', undefined);
      expect(spectator.component.matchingStops?.features?.length).toEqual(1);
      expect(spectator.query(byText('Station Road'))).toBeVisible();
    });

    it('should set loading to false and noData to true if api call errors', async () => {
      const spy = spyOn(corridorsService, 'queryStops').and.returnValue(throwError(() => 'error'));

      // Must select stop mode
      spectator.selectOption(byLabel('Search for the first stop in your corridor'), 'stop');
      await spectator.fixture.whenStable();

      spectator.typeInElement('station', '#stop-query');

      await spectator.fixture.whenStable();

      expect(spy).toHaveBeenCalledWith('station', undefined);
      expect(spectator.component.noData).toBeTrue();
      expect(spectator.component.loading).toBeFalse();
    });

    it('should find additional stops', async () => {
      const spy = spyOn(corridorsService, 'fetchSubsequentStops').and.returnValues(of([testStop2]));

      await spectator.fixture.whenRenderingDone();

      spectator.component.setStopList([testStop1]);
      spectator.fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith(['ST012345']);
      expect(spectator.component.matchingStops?.features?.length).toEqual(1);
      expect(spectator.query(byText('High Street'))).toBeVisible();
    });

    it('should save corridor', async () => {
      spyOn(corridorsService, 'fetchSubsequentStops').and.returnValue(of([]));
      const serviceSpy = spyOn(corridorsService, 'createCorridor').and.returnValue(of(undefined));

      spectator.component.setStopList([testStop1, testStop2]);
      spectator.typeInElement('test corridor', byLabel('Enter a corridor name'));

      await spectator.fixture.whenStable();

      spectator.click(byText('Finish'));

      await spectator.fixture.whenStable();

      expect(serviceSpy).toHaveBeenCalledWith('test corridor', ['ST012345', 'ST023456']);
      expect(router.navigate).toHaveBeenCalledWith(['/corridors']);
    });

    it('should prevent duplicate submissions', async () => {
      spyOn(corridorsService, 'fetchSubsequentStops').and.returnValue(of([]));
      const serviceSpy = spyOn(corridorsService, 'createCorridor').and.returnValue(of(undefined));

      spectator.component.setStopList([testStop1, testStop2]);
      spectator.typeInElement('duplicate corridor', byLabel('Enter a corridor name'));

      await spectator.fixture.whenStable();

      for (let i = 0; i < 10; i++) {
        spectator.click('#finish-btn');
        await spectator.fixture.whenStable();
      }

      expect(serviceSpy).toHaveBeenCalledOnceWith('duplicate corridor', ['ST012345', 'ST023456']);
      expect(router.navigate).toHaveBeenCalledTimes(1);
    });

    it('should show empty list if user deletes search query', async () => {
      const spy = spyOn(corridorsService, 'queryStops').and.returnValue(EMPTY);
      spectator.component.stopQuery.patchValue('some prior query');

      spectator.typeInElement('', byLabel('Search for the first stop in the corridor'));

      await spectator.fixture.whenStable();
      await spectator.fixture.whenRenderingDone();

      expect(spy).not.toHaveBeenCalledWith('');
      expect(spectator.component.matchingStops?.features?.length).toBeFalsy();
      expect(spectator.query('.create_corridor__stop')).toBeNull();
    });

    it('should not search if 3 or less characters', async () => {
      const spy = spyOn(corridorsService, 'queryStops').and.returnValue(EMPTY);

      spectator.typeInElement('', byLabel('abc'));

      await spectator.fixture.whenStable();
      await spectator.fixture.whenRenderingDone();

      expect(spy).not.toHaveBeenCalledWith('');
      expect(spectator.component.matchingStops?.features?.length).toBeFalsy();
      expect(spectator.query('.create_corridor__stop')).toBeNull();
    });

    it('should display custom error message if submit call errors', () => {
      spyOn(corridorsService, 'createCorridor').and.returnValue(throwError(() => 'error'));
      spectator.component.corridorForm.get('name')?.patchValue('test');
      spectator.component.createCorridor();
      spectator.fixture.detectChanges();

      expect(corridorsService.createCorridor).toHaveBeenCalledWith('test', []);
      expect(spectator.query('.govuk-error-summary__body')).toContainText(
        `We're having trouble creating your corridor. Please try again later.`
      );
    });

    it('should look up locations using geocoding service', async () => {
      const spy = geocodingService.forward.and.returnValue(of(points([[53.397, -1.407]])));

      // Wait for the mode selector to init
      await spectator.fixture.whenRenderingDone();

      // Must select location mode
      spectator.selectOption(byLabel('Search for the first stop in your corridor'), 'location');

      // Trigger typeahead query
      spectator.typeInElement('arundel gate', '#location-query');
      await spectator.fixture.whenStable();

      expect(spy).toHaveBeenCalledWith('arundel gate', {
        excludeTypes: ['poi', 'region', 'country'],
        proximity: null,
      });
    });

    it('should search for stops by location', async () => {
      const eckington = geocodingResult(
        [-1.355794, 53.308984],
        [-1.387216112, 53.293773104, -1.334991807, 53.317192882],
        'Eckington',
        [{ id: 'place.9644111', text: 'Sheffield' }]
      );
      geocodingService.forward.and.returnValue(of(eckington));
      const spy = spyOn(corridorsService, 'queryStops').and.returnValue(of({ orgStops: [testStop4], nonOrgStops: [] }));

      // Wait for the mode selector to init
      await spectator.fixture.whenRenderingDone();

      // Must select location mode
      spectator.selectOption(byLabel('Search for the first stop in your corridor'), 'location');
      await spectator.fixture.whenStable();

      // Trigger typeahead query
      spectator.typeInElement('eckington', byLabel('Location name or postcode'));
      await spectator.fixture.whenStable();
      spectator.detectChanges();

      spectator.click(byTextContent('Eckington Sheffield', { selector: '.ng-option' }));
      // Simulate map move event
      spectator.component.corridorMap.boundsChanged.emit(
        new LngLatBounds([-1.387216112, 53.293773104], [-1.334991807, 53.317192882])
      );
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spy).toHaveBeenCalledWith(
        undefined,
        new LngLatBounds([-1.387216112, 53.293773104], [-1.334991807, 53.317192882])
      );

      expect(spectator.query(byText('Darcy Road'))).toBeVisible();
    });

    it('should search for stops by location when map moves', async () => {
      const spy = spyOn(corridorsService, 'queryStops').and.returnValue(of({ orgStops: [testStop3], nonOrgStops: [] }));

      // Wait for the mode selector to init
      await spectator.fixture.whenRenderingDone();

      // Must be in location mode
      spectator.selectOption(byLabel('Search for the first stop in your corridor'), 'location');
      await spectator.fixture.whenStable();

      // Simulate map move event
      spectator.component.corridorMap.boundsChanged.emit(new LngLatBounds([-1.47, 53.37], [-1.46, 53.39]));

      // Wait for the virtual scroll viewport to render
      spectator.detectChanges();
      await spectator.fixture.whenRenderingDone();

      expect(spy).toHaveBeenCalledWith(undefined, new LngLatBounds([-1.47, 53.37], [-1.46, 53.39]));
      expect(spectator.component.matchingStops?.features?.length).toEqual(1);
      expect(spectator.query(byText('Sheffield Interchange/A1'))).toBeVisible();
    });

    it('should clear hover state when loading new stops', async () => {
      spectator.component.corridorMap.hoveredStop = point([50, 0], testStop1);
      spyOn(corridorsService, 'queryStops').and.returnValue(of({ orgStops: [testStop1], nonOrgStops: [] }));

      await spectator.fixture.whenRenderingDone();

      // Must select stop mode
      spectator.selectOption(byLabel('Search for the first stop in your corridor'), 'stop');
      await spectator.fixture.whenStable();

      spectator.typeInElement('station', '#stop-query');

      await spectator.fixture.whenStable();
      spectator.fixture.detectChanges();

      expect(spectator.component.corridorMap.hoveredStop).toBeUndefined();
    });

    it('should not load stops in location mode when zoomed out too far', async () => {
      const scotland = geocodingResult(
        [-4.09589210432502, 56.7342822950963],
        [-8.749787485, 54.575824601, -0.625266204, 60.9093509],
        'Scotland'
      );
      geocodingService.forward.and.returnValue(of(scotland));
      const spy = spyOn(corridorsService, 'queryStops').and.returnValue(EMPTY);

      // Wait for the mode selector to init
      await spectator.fixture.whenRenderingDone();

      // Must select location mode
      spectator.selectOption(byLabel('Search for the first stop in your corridor'), 'location');
      await spectator.fixture.whenStable();

      // Trigger typeahead query
      spectator.typeInElement('scotland', byLabel('Location name or postcode'));
      await spectator.fixture.whenStable();
      spectator.detectChanges();

      spectator.click(byText('Scotland'));
      await spectator.fixture.whenStable();
      spectator.detectChanges();

      expect(spy).not.toHaveBeenCalled();
      expect(spectator.query(byText('Search area too large, please zoom in to show stops'))).toBeVisible();
    });

    it('setMapBounds() should call fitBounds() if value passed is of type array', () => {
      const spy = spyOn(spectator.component.corridorMap?.map as Map, 'fitBounds');
      const bbox = [1, 2, 3, 4] as BBox2d;
      const FIT_BOUNDS_OPTIONS = { padding: 50, maxZoom: 16, duration: 0 };
      spectator.component.setMapBounds(bbox, FIT_BOUNDS_OPTIONS);
      spectator.detectChanges();

      expect(spy).toHaveBeenCalledWith(bbox, FIT_BOUNDS_OPTIONS);
    });

    it('setMapBounds() should call flyTo() if value passed is of type object', () => {
      const geocodingFeature = {} as GeocodingFeature;
      spectator.component.setMapBounds(geocodingFeature);
      spectator.detectChanges();

      expect(spectator.component.corridorMap?.map?.flyTo).toHaveBeenCalledWith({
        duration: 0,
        zoom: 15,
      });
    });

    it('centreMapBounds() should call setMapBounds() if currentBounds are present', () => {
      const spy = spyOn(spectator.component, 'setMapBounds');
      const FIT_BOUNDS_OPTIONS = { padding: 50, maxZoom: 16, duration: 0 };

      spectator.component.currentBounds = [1, 2, 3, 4];
      spectator.component.centreMapBounds();
      spectator.detectChanges();

      expect(spy).toHaveBeenCalledWith(spectator.component.currentBounds, FIT_BOUNDS_OPTIONS);
    });

    it('centreMapBounds() should resolve to null if no currentBounds are present', () => {
      spectator.component.centreMapBounds();
      spectator.detectChanges();

      expect(spectator.component.centreMapBounds()).toEqual(null);
    });
  });

  describe('corridor not found', () => {
    beforeEach(() => {
      spectator = createComponentWithCorridorNotFound();
      corridorsService = spectator.inject(CorridorsService);
      geocodingService = spectator.inject(GeocodingService);
      router = spectator.inject(Router);
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

  describe('edit corridor', () => {
    beforeEach(() => {
      spectator = createComponentWithCorridorData();
      corridorsService = spectator.inject(CorridorsService);
      geocodingService = spectator.inject(GeocodingService);
      router = spectator.inject(Router);
      spectator.component.corridorMap.map = new StubMapComponent().mapInstance;
      spyOn(corridorsService, 'fetchSubsequentStops').and.returnValue(of([testStop4]));
      spectator.component.ngOnInit();
      spectator.detectChanges();
    });

    it('should set isEdit to true if corridorId provided in route', () => {
      expect(spectator.component.isEdit).toBeTrue();
    });

    it('should show delete button', () => {
      expect(spectator.query(byText('Delete this corridor'))).toBeVisible();
    });

    it('should populate corridor name field', () => {
      expect(spectator.query(byValue('test corridor'))).toBeVisible();
    });

    it('should show corridor stops', () => {
      expect(spectator.query(byText('Station Road'))).toBeVisible();
      expect(spectator.query(byText('High Street'))).toBeVisible();
      expect(spectator.query(byText('Sheffield Interchange/A1'))).toBeVisible();
    });

    it('should save corridor as new', () => {
      const serviceSpy = spyOn(corridorsService, 'createCorridor').and.returnValue(of(undefined));

      spectator.click(byText('Save as new'));

      expect(serviceSpy).toHaveBeenCalledWith('test corridor', ['ST012345', 'ST023456', 'ST987654']);
      expect(router.navigate).toHaveBeenCalledWith(['/corridors']);
    });

    it('should show confirm delete modal on delete click', async () => {
      spectator.click(byText('Delete this corridor'));
      await spectator.fixture.whenStable();
      spectator.detectChanges();

      expect(spectator.query(byText('Delete corridor?'))).toBeVisible();
      expect(spectator.query('#delete-modal-body')?.innerHTML).toContain(
        'Are you sure you want to delete the corridor <strong>test corridor</strong>? This operation cannot be undone.'
      );
    });

    it('should delete corridor', async () => {
      spyOn(corridorsService, 'deleteCorridor').and.returnValue(of(undefined));

      spectator.click(byText('Delete this corridor'));
      await spectator.fixture.whenStable();
      spectator.detectChanges();

      spectator.click(byText('Delete corridor'));

      expect(corridorsService.deleteCorridor).toHaveBeenCalledWith(123);
      expect(router.navigate).toHaveBeenCalledWith(['/corridors']);
    });

    it('should not delete corridor if no corridor loaded', async () => {
      spectator.component.corridor = undefined;
      spyOn(corridorsService, 'deleteCorridor').and.returnValue(of());

      spectator.click(byText('Delete this corridor'));
      await spectator.fixture.whenStable();
      spectator.detectChanges();

      spectator.click(byText('Delete corridor'));

      expect(corridorsService.deleteCorridor).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should show error message if delete corridor errored', async () => {
      spyOn(corridorsService, 'deleteCorridor').and.returnValue(throwError(() => 'error'));

      spectator.click(byText('Delete this corridor'));
      await spectator.fixture.whenStable();
      spectator.detectChanges();

      spectator.click(byText('Delete corridor'));

      expect(
        spectator.query(byText(`We're having trouble deleting your corridor. Please try again later.`))
      ).toBeVisible();
    });

    it('should update corridor', async () => {
      spyOn(corridorsService, 'updateCorridor').and.returnValue(of(undefined));

      spectator.component.setStopList([testStop1, testStop2]);
      spectator.typeInElement('test corridor 2', byLabel('Enter a corridor name'));

      await spectator.fixture.whenStable();

      spectator.click(byText('Save'));

      expect(corridorsService.updateCorridor).toHaveBeenCalledWith({
        name: 'test corridor 2',
        id: 123,
        stopList: ['ST012345', 'ST023456'],
      });
    });

    it('navigateToPreviousView() should navigate to previous view', async () => {
      spectator.router.navigate(['/corridors/1000']);
      spectator.router.navigate(['/corridors/edit/1000']);

      spectator.component.navigateToPreviousView();

      await spectator.fixture.whenStable();

      expect(router.navigate).toHaveBeenCalledWith(['/corridors/1000']);
    });

    it('navigateToPreviousView() should navigate to corridors if no previous view available', async () => {
      spectator.component.navigateToPreviousView();

      await spectator.fixture.whenStable();

      expect(router.navigate).toHaveBeenCalledWith(['/corridors']);
    });

    it('should show error message if update corridor errored', async () => {
      spyOn(corridorsService, 'updateCorridor').and.returnValue(throwError(() => 'error'));

      await spectator.fixture.whenStable();

      spectator.click(byText('Save'));

      expect(
        spectator.query(byText(`We're having trouble updating your corridor. Please try again later.`))
      ).toBeVisible();
    });
  });
});
