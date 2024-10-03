import bbox from '@turf/bbox';
import { BBox, BBox2d } from '@turf/helpers/dist/js/lib/geojson';
import { Position } from 'geojson';
import { LngLatBounds } from 'mapbox-gl';

export const BRITISH_ISLES_BBOX: BBox2d = [-7.57216793459, 49.959999905, 1.68153079591, 58.6350001085];

export const asBbox = (bounds: LngLatBounds): BBox2d => [
  bounds.getWest(),
  bounds.getSouth(),
  bounds.getEast(),
  bounds.getNorth(),
];

export const position: (obj: { lon: number; lat: number }) => Position = (obj) => [obj.lon, obj.lat];

// Rip-off turf-js
export const combineBounds = (bounds: BBox2d[]): BBox2d => {
  const result: BBox = [Infinity, Infinity, -Infinity, -Infinity];
  bounds.forEach((bbox) => {
    if (result[0] > bbox[0]) {
      result[0] = bbox[0];
    }
    if (result[1] > bbox[1]) {
      result[1] = bbox[1];
    }
    if (result[2] < bbox[2]) {
      result[2] = bbox[2];
    }
    if (result[3] < bbox[3]) {
      result[3] = bbox[3];
    }
  });
  return result;
};

export const bbox2d = (geojson: any): BBox2d => bbox(geojson) as BBox2d;
