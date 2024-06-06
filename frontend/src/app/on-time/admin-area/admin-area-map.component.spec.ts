import { Spectator, createComponentFactory } from '@ngneat/spectator';
import { AdminAreaMapComponent } from './admin-area-map.component';
import { AdminAreaService } from './admin-area.service';
import { ConfigService } from '../../config/config.service';
import { of } from 'rxjs';
import { featureCollection } from '@turf/helpers';
import { FeatureCollection, Polygon } from 'geojson';
import { BRITISH_ISLES_BBOX } from 'src/app/shared/geo';
import { AdminArea } from './admin-area.service';

describe('AdminAreaMapComponent', () => {
  let spectator: Spectator<AdminAreaMapComponent>;
  const createComponent = createComponentFactory({
    component: AdminAreaMapComponent,
    providers: [
      {
        provide: AdminAreaService,
        useValue: {
          fetchAdminAreaBoundaries: () => of(featureCollection([])),
        },
      },
      {
        provide: ConfigService,
        useValue: {
          mapboxStyle: 'your-mapbox-style',
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should fetch admin area boundaries on initialization', () => {
    const adminAreaService = spectator.inject(AdminAreaService);
    spyOn(adminAreaService, 'fetchAdminAreaBoundaries').and.callThrough();

    spectator.component.ngOnInit();

    // eslint-disable-next-line jasmine/prefer-toHaveBeenCalledWith
    expect(adminAreaService.fetchAdminAreaBoundaries).toHaveBeenCalled();
    expect(spectator.component.adminAreas.features.length).toBe(0);
    expect(spectator.component.bounds).toEqual(BRITISH_ISLES_BBOX);
  });

  it('should recalculate bounds when adminAreaIds or adminAreas change', () => {
    const adminAreaIds = ['1', '2'];
    const adminAreas: FeatureCollection<Polygon, AdminArea> = featureCollection([]);

    spectator.component.adminAreaIds = adminAreaIds;
    spectator.component.adminAreas = adminAreas;

    spyOn(spectator.component, 'recalculateBounds').and.callThrough();

    spectator.component.recalculateBounds();

    // eslint-disable-next-line jasmine/prefer-toHaveBeenCalledWith
    expect(spectator.component.recalculateBounds).toHaveBeenCalled();
    expect(spectator.component.bounds).toEqual(BRITISH_ISLES_BBOX);

    spectator.component.adminAreaIds = adminAreaIds;
    spectator.component.adminAreas = featureCollection<Polygon, AdminArea>([
      {
        type: 'Feature',
        properties: {
          id: '1',
          name: 'Admin Area 1',
          shape: 'some shape',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        bbox: [1, 2, 3, 4],
      },
    ]);

    spectator.component.recalculateBounds();

    expect(spectator.component.bounds).toEqual([1, 2, 3, 4]);
  });

  it('should handle boundary hover event', () => {
    const mockEvent: any = {
      type: 'click',
      features: [
        {
          type: 'Feature',
          properties: {
            id: '1',
            name: 'Admin Area 1',
            shape: 'some shape',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [],
          },
          layer: {
            id: 'admin-area-boundaries',
            source: 'boundaries',
            'source-layer': 'boundaries',
            type: '',
          },
          source: 'boundaries',
          sourceLayer: 'boundaries',
          state: {},
        },
      ],
    };

    spyOn(spectator.component, 'recalculateLabelPosition').and.callThrough();
    spectator.component.boundaryHover(mockEvent);

    expect(spectator.component.hoveredAdminArea).toBeDefined();
    // eslint-disable-next-line jasmine/prefer-toHaveBeenCalledWith
    expect(spectator.component.recalculateLabelPosition).toHaveBeenCalled();
  });

  it('should clear boundary hover', () => {
    spectator.component.hoveredAdminArea = {
      type: 'Feature',
      properties: {
        id: '1',
        name: 'Admin Area 1',
        shape: 'some shape',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [],
      },
    };

    spyOn(spectator.component, 'recalculateLabelPosition').and.callThrough();

    spectator.component.clearBoundaryHover();

    expect(spectator.component.hoveredAdminArea).toBeUndefined();
    expect(spectator.component.labelPosition).toBeUndefined();
  });

  it('should emit boundaryClick event on select', () => {
    const mockEvent: any = {
      type: 'click',
      features: [
        {
          type: 'Feature',
          properties: {
            id: '1',
            name: 'Admin Area 1',
            shape: 'some shape',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [],
          },
          layer: {
            id: 'admin-area-boundaries',
            source: 'boundaries',
            'source-layer': 'boundaries',
            type: '',
          },
          source: 'boundaries',
          sourceLayer: 'boundaries',
          state: {},
        },
      ],
    };

    spyOn(spectator.component.boundaryClick, 'emit');

    spectator.component.select(mockEvent);

    expect(spectator.component.boundaryClick.emit).toHaveBeenCalledWith({
      id: '1',
      name: 'Admin Area 1',
      shape: 'some shape',
    });
  });
});
