import { LngLat } from 'mapbox-gl';
import { Feature, Point } from 'geojson';

export interface GeocodingResult {
  type: 'FeatureCollection';
  features: GeocodingFeature[];
  query: string[];
  attribution: string;
}

export interface GeocodingFeature extends Feature<Point, GeocodingProperties> {
  place_type: string[];
  relevance: number;
  address: string;
  text: string;
  place_name: string;
  bbox: [number, number, number, number];
  center: [number, number];
  context: GeocodingContext[];
}

export interface GeocodingProperties {
  accuracy?: string;
  address?: string;
  category?: string;
  maki?: string;
  wikidata?: string;
  short_code?: string;
}

export interface GeocodingContext {
  id: string;
  text: string;
  wikidata?: string;
  short_code?: string;
}

export interface ForwardParams {
  types?: DataType[];
  excludeTypes?: DataType[];
  proximity?: LngLat;
}

export interface ReverseParams {
  types?: DataType[];
  excludeTypes?: DataType[];
}

export const dataTypes = [
  'poi',
  'address',
  'neighborhood',
  'locality',
  'place',
  'district',
  'postcode',
  'region',
  'country',
] as const;

export type DataType = typeof dataTypes[number];

export interface Coordinates {
  latitude: number;
  longitude: number;
}
