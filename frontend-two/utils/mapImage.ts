import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Map as MapboxMap } from "mapbox-gl";

export type SvgModule =
  | string
  | ComponentType<{ focusable?: string; "aria-hidden"?: string | boolean }>;

export const resolveSvgMarkup = (svg: SvgModule) =>
  typeof svg === "string"
    ? svg
    : renderToStaticMarkup(
        createElement(svg, { focusable: "false", "aria-hidden": true }),
      );

export const loadImageFromSvg = async (svg: string) => {
  const image = new Image();
  const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load map icon SVG"));
  });

  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return await loadPromise;
};

const imageRegistrations = new WeakMap<
  MapboxMap,
  Map<string, Promise<void>>
>();

export const ensureMapImage = async (
  map: MapboxMap,
  id: string,
  svg: SvgModule,
) => {
  if (map.hasImage(id)) return;

  const registrations = imageRegistrations.get(map) ?? new Map();
  imageRegistrations.set(map, registrations);

  const registration = registrations.get(id);
  if (registration) {
    await registration;
    return;
  }

  const loadAndRegister = loadImageFromSvg(resolveSvgMarkup(svg)).then(
    (image) => {
      if (!map.hasImage(id)) {
        map.addImage(id, image);
      }
    },
  );
  registrations.set(id, loadAndRegister);

  try {
    await loadAndRegister;
  } finally {
    registrations.delete(id);
  }
};
