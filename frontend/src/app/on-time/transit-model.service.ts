import {
  ServicePatternType,
  TransitModelServicePatternStopsGQL,
} from "../../generated/graphql";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { Injectable } from "@angular/core";
import { Definitely } from "../shared/array-operators";

export type ServicePattern = Definitely<
  Omit<ServicePatternType, "__typename" | "direction" | "direction_id">
>;

@Injectable({ providedIn: "root" })
export class TransitModelService {
  constructor(
    private servicePatternStopsQuery: TransitModelServicePatternStopsGQL,
  ) {}

  fetchServicePatternStops(
    operatorId: string | null,
    lineId: string | null,
  ): Observable<ServicePattern[]> {
    return this.servicePatternStopsQuery
      .fetch({
        operatorId: operatorId ? operatorId : "",
        lineId: lineId ? lineId : "",
      })
      .pipe(map((result) => result.data.servicePatterns));
  }
}
