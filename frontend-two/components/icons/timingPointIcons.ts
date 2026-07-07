import mapboxgl, { Map } from "mapbox-gl";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TimingSvgImport from "@/assets/icons/timing.svg";

const TimingSvg = TimingSvgImport as unknown as
  | string
  | ComponentType<{ focusable?: string; "aria-hidden"?: string | boolean }>;

const TIMING_POINT_ICON_COLOURS = {
  red: "#d4351c",
  yellow: "#ffdd00",
  turquoise: "#28a197",
  noData: "#b1b4b6",
} as const;

const TIMING_POINT_ICON_SVG =
  typeof TimingSvg === "string"
    ? TimingSvg
    : renderToStaticMarkup(
        createElement(TimingSvg, {
          focusable: "false",
          "aria-hidden": true,
        }),
      );

const tintTimingPointIconSvg = (colour: string) =>
  TIMING_POINT_ICON_SVG.replace(/currentColor/g, colour);

const loadImageFromSvg = async (svg: string) => {
  const image = new Image();
  const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load timing icon SVG"));
  });

  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return await loadPromise;
};

const createTimingPointIcon = async (colour: string) =>
  loadImageFromSvg(tintTimingPointIconSvg(colour));

export const registerTimingPointIcons = async (map: Map) => {
  const timingPointIcons = {
    "timing-no-data-map": createTimingPointIcon(
      TIMING_POINT_ICON_COLOURS.noData,
    ),
    "otp-timing-map-red": createTimingPointIcon(TIMING_POINT_ICON_COLOURS.red),
    "otp-timing-map-yellow": createTimingPointIcon(
      TIMING_POINT_ICON_COLOURS.yellow,
    ),
    "otp-timing-map-turquoise": createTimingPointIcon(
      TIMING_POINT_ICON_COLOURS.turquoise,
    ),
  } as const;

  for (const [name, imagePromise] of Object.entries(timingPointIcons)) {
    if (!map.hasImage(name)) {
      map.addImage(name, await imagePromise);
    }
  }
};
