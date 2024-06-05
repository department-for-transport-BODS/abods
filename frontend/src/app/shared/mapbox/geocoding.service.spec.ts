import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { GeocodingService } from './geocoding.service';
import { MAPBOX_API_KEY } from 'ngx-mapbox-gl';
import { LngLat } from 'mapbox-gl';
import { Coordinates, ForwardParams, ReverseParams } from './geocoding.types';

describe('GeocodingService', () => {
  let spectator: SpectatorService<GeocodingService>;
  let service: GeocodingService;
  let httpTestingController: HttpTestingController;

  const createService = createServiceFactory({
    service: GeocodingService,
    imports: [HttpClientTestingModule],
    providers: [
      {
        provide: MAPBOX_API_KEY,
        useValue: 'test-key',
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.service;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should call forward geocoding with the right parameters', () => {
    const searchText = 'Test location';
    const params: ForwardParams = {
      types: ['place'],
      proximity: new LngLat(12, 34),
    };

    service.forward(searchText, params).subscribe();

    const req = httpTestingController.expectOne(
      (request) =>
        request.url.startsWith(`https://api.mapbox.com/geocoding/v5/mapbox.places/${searchText}.json`) &&
        request.method === 'GET'
    );

    expect(req.request.params.get('access_token')).toEqual('test-key');
    expect(req.request.params.get('country')).toEqual('GB');
    expect(req.request.params.get('types')).toEqual('place');
    expect(req.request.params.get('proximity')).toEqual('12,34');
  });

  it('should call reverse geocoding with the right parameters', () => {
    const coordinates: Coordinates = { latitude: 12, longitude: 34 };
    const params: ReverseParams = {
      types: ['place'],
      excludeTypes: ['country'],
    };

    service.reverse(coordinates, params).subscribe();

    const req = httpTestingController.expectOne(
      (request) =>
        request.url.startsWith(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.longitude},${coordinates.latitude}.json`
        ) && request.method === 'GET'
    );

    expect(req.request.params.get('access_token')).toEqual('test-key');
    expect(req.request.params.get('country')).toEqual('GB');
    expect(req.request.params.get('types')).toEqual('place');
    expect(req.request.params.get('excludeTypes')).toBeNull();
  });
});
