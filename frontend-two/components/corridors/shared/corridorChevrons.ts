import mapboxgl from "mapbox-gl";

const CORRIDOR_CHEVRON_ICON_ID = "map-chevron-large";
const CORRIDOR_CHEVRON_ICON_URL = "/assets/icons/map-chevron.svg";
const CORRIDOR_CHEVRON_LAYER_ID = "corridor-chevrons";

const loadImageFromMap = (map: mapboxgl.Map, url: string) =>
  new Promise<ImageData | HTMLImageElement | ImageBitmap>((resolve, reject) => {
    map.loadImage(url, (error, image) => {
      if (error || !image) {
        reject(error ?? new Error("Unable to load corridor chevron icon"));
        return;
      }

      resolve(image);
    });
  });

export const displayCorridorChevrons = async (
  map: mapboxgl.Map,
  beforeLayerId: string,
) => {
  if (!map.hasImage(CORRIDOR_CHEVRON_ICON_ID)) {
    map.addImage(
      CORRIDOR_CHEVRON_ICON_ID,
      await loadImageFromMap(map, CORRIDOR_CHEVRON_ICON_URL),
    );
  }

  if (map.getLayer(CORRIDOR_CHEVRON_LAYER_ID)) {
    return;
  }

  map.addLayer(
    {
      id: CORRIDOR_CHEVRON_LAYER_ID,
      type: "symbol",
      source: "corridor-line",
      layout: {
        "icon-image": CORRIDOR_CHEVRON_ICON_ID,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "symbol-placement": "line",
        "symbol-spacing": 150,
      },
    },
    beforeLayerId,
  );
};
