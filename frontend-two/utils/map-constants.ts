import type {
  Feature,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
} from "geojson";
import { LngLatBoundsLike } from "mapbox-gl";

export type AdminAreaShape = {
  id: string;
  name: string;
  shape: string;
};

export const BRITISH_ISLES_BOUNDS: [[number, number], [number, number]] = [
  [-10.5, 49.5],
  [2.0, 61.0],
];

export const ADMIN_AREA_HIDDEN_ZOOM = 12;
export const ADMIN_AREA_HIDDEN_ZOOM_THRESHOLD = 11;

export const BRITISH_ISLES_BBOX: [number, number, number, number] = [-10.5, 49.5, 2.0, 61.0];

export const RED_THRESHOLD = 0.6;
export const GREEN_THRESHOLD = 0.8;

export const POINT_COLOURS = [
  "case",
  ["==", ["get", "completedDepartures"], 0],
  "#b1b4b6",
  [
    "step",
    ["/", ["get", "onTime"], ["get", "completedDepartures"]],
    "#d4351c",
    RED_THRESHOLD,
    "#ffdd00",
    GREEN_THRESHOLD,
    "#28a197",
  ],
] as NonNullable<mapboxgl.CirclePaint>["circle-color"];

export const CLUSTER_PROPERTIES = {
  early: ["+", ["get", "early"]] as [string, mapboxgl.ExpressionSpecification],
  onTime: ["+", ["get", "onTime"]] as [
    string,
    mapboxgl.ExpressionSpecification,
  ],
  late: ["+", ["get", "late"]] as [string, mapboxgl.ExpressionSpecification],
  completedDepartures: ["+", ["get", "completedDepartures"]] as [
    string,
    mapboxgl.ExpressionSpecification,
  ],
  scheduledDepartures: ["+", ["get", "scheduledDepartures"]] as [
    string,
    mapboxgl.ExpressionSpecification,
  ],
};

export type ClipableGeometry =
  | LineString
  | MultiLineString
  | Polygon
  | MultiPolygon;
export type ClipableFeature = Feature<ClipableGeometry>;

export const isClipableFeature = (
  feature: Feature,
): feature is ClipableFeature => {
  const geometryType = feature.geometry?.type;
  return (
    geometryType === "LineString" ||
    geometryType === "MultiLineString" ||
    geometryType === "Polygon" ||
    geometryType === "MultiPolygon"
  );
};
