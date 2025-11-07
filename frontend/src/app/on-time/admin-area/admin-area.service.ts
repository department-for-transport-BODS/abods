import { Injectable } from "@angular/core";
import bbox from "@turf/bbox";
import flip from "@turf/flip";
import { feature, featureCollection } from "@turf/helpers";
import { BBox2d } from "@turf/helpers/dist/js/lib/geojson";
import { FeatureCollection, Polygon } from "geojson";
import {
  flatMap as _flatMap,
  sortBy as _sortBy,
  uniq as _uniq,
} from "lodash-es";
import { combineLatestWith, Observable } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { GetAdminAreasGQL, OperatorType } from "../../../generated/graphql";
import { nonNullishArray } from "../../shared/array-operators";
import { combineBounds } from "../../shared/geo";
import { OperatorService } from "../../shared/services/operator.service";

export interface AdminArea {
  id: string;
  name: string;
  shape: string;
}

/**
 * ITO admin area codes are just NaPTAN administrative area codes (ATCOAreaCode) prefixed with 'AA'
 * @see http://naptan.dft.gov.uk/naptan/schema/2.4/doc/NaPTANSchemaGuide-2.4-v0.57.pdf
 * 0 is the default area code, and doesn't correspond to a location
 * 9XX series area codes denote a national authority and not a geographical one
 */
const isNonGeographicalAdminAreaId = (adminAreaId: string) =>
  adminAreaId === "AA0" || /AA9\d{2}/.exec(adminAreaId);

@Injectable({
  providedIn: "root",
})
export class AdminAreaService {
  constructor(
    private getAdminAreasGQL: GetAdminAreasGQL,
    private operatorService: OperatorService,
  ) {}

  private _fetchAdminAreasByOperators(
    project: (operators: OperatorType[]) => string[],
  ) {
    return this.getAdminAreasGQL.fetch({}).pipe(
      map((result) => nonNullishArray(result.data?.adminAreas)),
      map((adminAreas) =>
        adminAreas.filter(
          (adminArea) => !isNonGeographicalAdminAreaId(adminArea.id),
        ),
      ),
      combineLatestWith(
        this.operatorService.fetchOperators().pipe(map((ops) => project(ops))),
      ),
      map(([adminAreas, adminAreaIds]) =>
        _sortBy(
          adminAreas.filter((adminArea: AdminArea) =>
            adminAreaIds.includes(adminArea.id),
          ),
          "name",
        ),
      ),
    );
  }

  fetchAdminAreas(): Observable<AdminArea[]> {
    return this._fetchAdminAreasByOperators((operators) =>
      _uniq(_flatMap(operators, "adminAreaIds")),
    );
  }

  fetchAdminAreasForOperator(operatorId: string): Observable<AdminArea[]> {
    const test = this._fetchAdminAreasByOperators(
      (operators) =>
        operators.find((operator) => operator?.operatorId === operatorId)
          ?.adminAreaIds ?? [],
    );

    return test;
  }

  fetchAdminAreaBoundaries(): Observable<
    FeatureCollection<Polygon, AdminArea>
  > {
    return this.fetchAdminAreas().pipe(
      map(computeAdminAreaBoundaries),
      shareReplay(),
    );
  }
}

export const computeAdminAreaBoundaries = (adminAreas: AdminArea[]) => {
  const features = adminAreas.map(computeAreaBoundary);
  const boundaries = featureCollection(features);
  boundaries.bbox = combineBounds(features.map((f) => f.bbox as BBox2d));
  return boundaries;
};

const computeAreaBoundary = (adminArea: AdminArea) => {
  const boundaryPolygon = feature(JSON.parse(adminArea.shape), adminArea);

  // The GeoJSON spec specifies the coordinate order lon-lat (or easting-northing), however
  // the backend produces lat-lon, so we need to flip it. Do it in-place for performance.
  // @see https://macwright.com/lonlat/
  // @see https://www.npmjs.com/package/@turf/flip
  // TODO convince the backend team to please change this
  flip(boundaryPolygon, { mutate: true });

  boundaryPolygon.bbox = bbox(boundaryPolygon);
  return boundaryPolygon;
};
