import { Map } from "mapbox-gl";
import ChevronSvgImport from "../../public/assets/icons/map-chevron.svg";
import {
  ensureMapImage,
  resolveSvgMarkup,
  type SvgModule,
} from "@/utils/mapImage";

const ChevronSvg = ChevronSvgImport as unknown as SvgModule;

const MAP_CHEVRON_SVG = resolveSvgMarkup(ChevronSvg);

export const registerMapChevronIcon = async (map: Map) => {
  await ensureMapImage(map, "map-chevron", MAP_CHEVRON_SVG, {
    normaliseDimensions: true,
    pixelRatio: 1,
  });
};
