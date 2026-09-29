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

export const BRITISH_ISLES_BBOX: [number, number, number, number] = [
  -10.5, 49.5, 2.0, 61.0,
];

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

export const ON_TIME_SERVICE_MAP_IDS = {
  patternSource: "on-time-service-patterns",
  stopSource: "on-time-service-stops",
  patternLayer: "on-time-service-pattern-layer",
  directionLayer: "on-time-service-direction-layer",
  stopNamesLayer: "on-time-service-stop-names",
  stopMarkersNoDataLayer: "on-time-service-stop-markers-no-data",
  stopMarkersLayer: "on-time-service-stop-markers",
  timingPointsLayer: "on-time-service-timing-points",
} as const;

export const ON_TIME_SERVICE_PATTERN_LINE_PAINT: mapboxgl.LinePaint = {
  "line-color": "#5694ca",
  "line-width": 3,
  "line-dasharray": [
    "case",
    ["boolean", ["get", "dashedLine"], true],
    ["literal", [0.8, 1.6]],
    ["literal", [1]],
  ],
};

export const ON_TIME_SERVICE_PATTERN_LINE_LAYOUT: mapboxgl.LineLayout = {
  "line-cap": "round",
  "line-join": "round",
};

export const ON_TIME_SERVICE_DIRECTION_LAYOUT: mapboxgl.SymbolLayout = {
  "icon-image": "map-chevron",
  "symbol-placement": "line",
  "symbol-spacing": 150,
};

export const ON_TIME_SERVICE_STOP_NAMES_FILTER = [
  "has",
  "stopName",
] as mapboxgl.ExpressionSpecification;

export const ON_TIME_SERVICE_STOP_NAMES_LAYOUT: mapboxgl.SymbolLayout = {
  "text-field": "{stopName}",
  "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
  "text-size": 12,
  "text-offset": [0, 1.2],
  "text-allow-overlap": true,
  "text-anchor": "top",
};

export const ON_TIME_SERVICE_STOP_NAMES_PAINT: mapboxgl.SymbolPaint = {
  "text-color": "#747b7b",
  "text-halo-color": "#ffffff",
  "text-halo-width": 1,
  "text-halo-blur": 1,
};

export const ON_TIME_SERVICE_NO_DATA_FILTER = [
  "get",
  "noData",
] as mapboxgl.ExpressionSpecification;

export const ON_TIME_SERVICE_ON_TIME_PERCENTAGE = [
  "/",
  ["*", ["get", "onTime"], 100],
  ["get", "actualDepartures"],
] as mapboxgl.ExpressionSpecification;

export const ON_TIME_SERVICE_STOP_MARKERS_FILTER = [
  "all",
  ["has", "onTime"],
  ["!", ["get", "timingPoint"]],
] as mapboxgl.ExpressionSpecification;

export const ON_TIME_SERVICE_STOP_MARKERS_CIRCLE_RADIUS = [
  "interpolate",
  ["exponential", 0.8],
  ["zoom"],
  11,
  4,
  14,
  8,
] as mapboxgl.ExpressionSpecification;

export const ON_TIME_SERVICE_STOP_MARKERS_CIRCLE_COLOR = [
  "case",
  [">", ON_TIME_SERVICE_ON_TIME_PERCENTAGE, 80],
  "#28a197",
  [
    "all",
    [">=", ON_TIME_SERVICE_ON_TIME_PERCENTAGE, 60],
    ["<=", ON_TIME_SERVICE_ON_TIME_PERCENTAGE, 80],
  ],
  "#ffdd00",
  ["<", ON_TIME_SERVICE_ON_TIME_PERCENTAGE, 60],
  "#d4351c",
  "#b1b4b6",
] as mapboxgl.ExpressionSpecification;

export const ON_TIME_SERVICE_STOP_MARKERS_CIRCLE_STROKE_WIDTH = [
  "interpolate",
  ["exponential", 0.5],
  ["zoom"],
  11,
  2,
  14,
  3,
] as mapboxgl.ExpressionSpecification;

export const ON_TIME_SERVICE_STOP_MARKERS_CIRCLE_STROKE_COLOR =
  "#ffffff" as const;

export const ON_TIME_SERVICE_TIMING_POINTS_FILTER = [
  "get",
  "timingPoint",
] as mapboxgl.ExpressionSpecification;

export const ON_TIME_SERVICE_TIMING_POINTS_ICON_SIZE = [
  "interpolate",
  ["exponential", 0.5],
  ["zoom"],
  11,
  0.8,
  14,
  1,
] as mapboxgl.ExpressionSpecification;

export const ON_TIME_SERVICE_TIMING_POINTS_ICON_IMAGE = [
  "case",
  ["==", ["get", "actualDepartures"], 0],
  "timing-no-data-map",
  [
    "step",
    ["/", ["get", "onTime"], ["get", "actualDepartures"]],
    "otp-timing-map-red",
    RED_THRESHOLD,
    "otp-timing-map-yellow",
    GREEN_THRESHOLD,
    "otp-timing-map-turquoise",
  ],
] as mapboxgl.ExpressionSpecification;

export const getOnTimeServiceNoDataCircleRadius = (timingPointsOnly: boolean) =>
  [
    "interpolate",
    ["exponential", 0.8],
    ["zoom"],
    11,
    timingPointsOnly ? 2 : 4,
    14,
    timingPointsOnly ? 6 : 8,
  ] as mapboxgl.ExpressionSpecification;

export const getOnTimeServiceNoDataCircleStrokeWidth = (
  timingPointsOnly: boolean,
) =>
  [
    "interpolate",
    ["exponential", 0.5],
    ["zoom"],
    11,
    timingPointsOnly ? 1 : 2,
    14,
    3,
  ] as mapboxgl.ExpressionSpecification;
