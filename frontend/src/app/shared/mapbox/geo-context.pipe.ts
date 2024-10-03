import { Pipe, PipeTransform } from '@angular/core';
import { DataType, GeocodingFeature } from './geocoding.types';
import { isArray } from 'lodash-es';

/**
 * Returns the first element in the specified feature's context that matches the provided types
 */
@Pipe({
  name: 'geoContext',
})
export class GeoContextPipe implements PipeTransform {
  transform(feature: GeocodingFeature, types: DataType | DataType[]): string | undefined {
    if (!isArray(types)) {
      types = [types];
    }
    return feature.context.find((ctx) => types.includes(ctx.id.split('.')[0] as DataType))?.text;
  }
}
