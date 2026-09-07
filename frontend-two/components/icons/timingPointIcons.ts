import { Map } from "mapbox-gl";
import TimingSvgImport from "@/assets/icons/timing.svg";
import {
  ensureMapImage,
  resolveSvgMarkup,
  type SvgModule,
} from "@/utils/mapImage";

const TimingSvg = TimingSvgImport as unknown as SvgModule;

const TIMING_POINT_ICON_COLOURS = {
  red: "#d4351c",
  yellow: "#ffdd00",
  turquoise: "#28a197",
  noData: "#b1b4b6",
} as const;

const TIMING_POINT_ICON_SVG = resolveSvgMarkup(TimingSvg);

const tintTimingPointIconSvg = (colour: string) =>
  TIMING_POINT_ICON_SVG.replace(/currentColor/g, colour);

export const registerTimingPointIcons = async (map: Map) => {
  const timingPointIcons = {
    "timing-no-data-map": tintTimingPointIconSvg(
      TIMING_POINT_ICON_COLOURS.noData,
    ),
    "otp-timing-map-red": tintTimingPointIconSvg(TIMING_POINT_ICON_COLOURS.red),
    "otp-timing-map-yellow": tintTimingPointIconSvg(
      TIMING_POINT_ICON_COLOURS.yellow,
    ),
    "otp-timing-map-turquoise": tintTimingPointIconSvg(
      TIMING_POINT_ICON_COLOURS.turquoise,
    ),
  } as const;

  await Promise.all(
    Object.entries(timingPointIcons).map(([id, svg]) =>
      ensureMapImage(map, id, svg),
    ),
  );
};
