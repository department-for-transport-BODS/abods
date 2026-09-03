import { createElement, type ComponentType, type SVGProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Map as MapboxMap } from "mapbox-gl";

export type SvgModule = string | ComponentType<SVGProps<SVGSVGElement>>;

export const resolveSvgMarkup = (svg: SvgModule) =>
  typeof svg === "string"
    ? svg
    : renderToStaticMarkup(
        createElement(svg, { focusable: "false", "aria-hidden": true }),
      );

const ensureSvgDimensions = (svg: string, fallbackSize = 16): string => {
  if (/<svg[^>]*\swidth=/.test(svg)) {
    return svg;
  }

  const viewBoxMatch = svg.match(/viewBox=["']\s*([\d.\s-]+)["']/);
  let width = fallbackSize;
  let height = fallbackSize;

  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/\s+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      width = parts[2];
      height = parts[3];
    }
  }

  return svg.replace(/<svg\b/, `<svg width="${width}" height="${height}"`);
};

interface LoadSvgOptions {
  normaliseDimensions?: boolean;
}

export const loadImageFromSvg = async (
  svg: string,
  options: LoadSvgOptions = {},
) => {
  const markup = options.normaliseDimensions ? ensureSvgDimensions(svg) : svg;

  const image = new Image();

  const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load map icon SVG"));
  });

  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  return await loadPromise;
};

interface EnsureMapImageOptions {
  pixelRatio?: number;
  normaliseDimensions?: boolean;
}

const imageRegistrations = new WeakMap<MapboxMap, Map<string, Promise<void>>>();

export const ensureMapImage = async (
  map: MapboxMap,
  id: string,
  svg: SvgModule,
  options: EnsureMapImageOptions = {},
) => {
  if (map.hasImage(id)) return;

  const registrations = imageRegistrations.get(map) ?? new Map();
  imageRegistrations.set(map, registrations);

  const registration = registrations.get(id);
  if (registration) {
    await registration;
    return;
  }

  const loadAndRegister = loadImageFromSvg(resolveSvgMarkup(svg), {
    normaliseDimensions: options.normaliseDimensions,
  }).then((image) => {
    if (!map.hasImage(id)) {
      if (options.pixelRatio !== undefined) {
        map.addImage(id, image, { pixelRatio: options.pixelRatio });
      } else {
        map.addImage(id, image);
      }
    }
  });

  registrations.set(id, loadAndRegister);

  try {
    await loadAndRegister;
  } finally {
    registrations.delete(id);
  }
};
