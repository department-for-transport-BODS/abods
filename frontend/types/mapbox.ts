export const GEOCODING_TYPES = [
  "poi",
  "address",
  "neighborhood",
  "locality",
  "place",
  "district",
  "postcode",
  "region",
  "country",
] as const;

export type GeocodingType = (typeof GEOCODING_TYPES)[number];

export type GeocodingContext = { id: string; text: string };

export interface GeocodingFeature {
  id: string;
  text: string;
  context?: GeocodingContext[];
  center?: [number, number];
  bbox?: [number, number, number, number];
}

export const getContextText = (
  context: GeocodingContext[],
  types: GeocodingType[],
): string | undefined =>
  context.find((ctx) => types.includes(ctx.id.split(".")[0] as GeocodingType))
    ?.text;

export const buildLocationContext = (
  context: GeocodingContext[],
): string | undefined => {
  const parts = [
    getContextText(context, ["locality"]),
    getContextText(context, ["place", "district"]),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
};

export const buildLocationSearchTypes = (
  excludeTypes: GeocodingType[],
): string =>
  GEOCODING_TYPES.filter((type) => !excludeTypes.includes(type)).join(",");
