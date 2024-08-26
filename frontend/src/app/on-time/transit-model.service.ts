import { ServicePatternType, TransitModelServicePatternStopsGQL } from '../../generated/graphql';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Definitely, nonNullishArray } from '../shared/array-operators';

export type ServicePattern = Definitely<Omit<ServicePatternType, '__typename' | 'direction' | 'direction_id'>>;

@Injectable({ providedIn: 'root' })
export class TransitModelService {
  constructor(private servicePatternStopsQuery: TransitModelServicePatternStopsGQL) {}

  fetchServicePatternStops(operatorId: string | null, lineId: string | null): Observable<ServicePattern[]> {
    return this.servicePatternStopsQuery
      .fetch({
        operatorId: operatorId ? operatorId : '',
        lineId: lineId ? lineId : '',
      })
      .pipe(
        map((result) => nonNullishArray(result.data?.operator?.transitModel?.lines?.items?.[0]?.servicePatterns)),
        map((patterns) =>
          patterns.map((pattern) => ({
            ...pattern,
            stops: nonNullishArray(pattern.stops),
            serviceLinks: nonNullishArray(pattern.serviceLinks),
          }))
        )
      );
  }
}
