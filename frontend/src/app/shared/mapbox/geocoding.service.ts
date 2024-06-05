import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MAPBOX_API_KEY } from 'ngx-mapbox-gl';
import { Observable } from 'rxjs';
import { Coordinates, dataTypes, ForwardParams, GeocodingResult, ReverseParams } from './geocoding.types';

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  constructor(private httpClient: HttpClient, @Inject(MAPBOX_API_KEY) private mapboxToken: string) {}

  private params(extras?: ForwardParams & ReverseParams) {
    let params = <{ [param: string]: string }>{
      access_token: this.mapboxToken,
      country: 'GB',
    };

    if (extras?.types || extras?.excludeTypes) {
      params = {
        ...params,
        types: (extras.types ?? dataTypes.filter((type) => !extras.excludeTypes?.includes(type))).join(','),
      };
    }

    if (extras?.proximity) {
      params = { ...params, proximity: extras.proximity.toArray().join(',') };
    }
    return params;
  }

  forward(searchText: string, extras?: ForwardParams): Observable<GeocodingResult> {
    const params = this.params(extras);

    return this.httpClient.get<GeocodingResult>(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchText}.json`,
      { params }
    );
  }

  reverse(location: Coordinates, extras?: ReverseParams): Observable<GeocodingResult> {
    const { longitude, latitude } = location;
    const params = this.params(extras);

    return this.httpClient.get<GeocodingResult>(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,
      { params }
    );
  }
}
