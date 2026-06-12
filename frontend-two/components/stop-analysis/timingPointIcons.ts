import mapboxgl, { Map } from "mapbox-gl";

const TIMING_POINT_ICON_SIZE = 32;

const TIMING_POINT_ICON_COLOURS = {
  red: [212, 53, 28, 255] as const,
  yellow: [255, 221, 0, 255] as const,
  turquoise: [40, 161, 151, 255] as const,
  noData: [177, 180, 182, 255] as const,
};

const distanceToSegment = (
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) => {
  const deltaX = endX - startX;
  const deltaY = endY - startY;

  if (deltaX === 0 && deltaY === 0) {
    return Math.hypot(pointX - startX, pointY - startY);
  }

  const projection =
    ((pointX - startX) * deltaX + (pointY - startY) * deltaY) /
    (deltaX * deltaX + deltaY * deltaY);
  const clampedProjection = Math.max(0, Math.min(1, projection));
  const closestX = startX + clampedProjection * deltaX;
  const closestY = startY + clampedProjection * deltaY;

  return Math.hypot(pointX - closestX, pointY - closestY);
};

const createTimingPointIcon = (
  fillColour: readonly [number, number, number, number],
) => {
  const size = TIMING_POINT_ICON_SIZE;
  const center = (size - 1) / 2;
  const outerRadius = 13;
  const innerRadius = 10.5;
  const borderColour = [47, 50, 52, 255] as const;
  const handColour = [255, 255, 255, 255] as const;
  const data = new Uint8ClampedArray(size * size * 4);

  const paintPixel = (
    pixelIndex: number,
    [red, green, blue, alpha]: readonly [number, number, number, number],
  ) => {
    data[pixelIndex] = red;
    data[pixelIndex + 1] = green;
    data[pixelIndex + 2] = blue;
    data[pixelIndex + 3] = alpha;
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const distanceFromCenter = Math.hypot(x - center, y - center);

      if (distanceFromCenter > outerRadius) {
        continue;
      }

      let colour: readonly [number, number, number, number] =
        distanceFromCenter >= innerRadius ? borderColour : fillColour;

      const hourHandDistance = distanceToSegment(
        x,
        y,
        center,
        center,
        center - 4,
        center - 5,
      );
      const minuteHandDistance = distanceToSegment(
        x,
        y,
        center,
        center,
        center + 6,
        center - 1,
      );

      if (hourHandDistance <= 0.9 || minuteHandDistance <= 0.9) {
        colour = handColour;
      }

      if (distanceFromCenter <= 1.5) {
        colour = borderColour;
      }

      paintPixel(offset, colour);
    }
  }

  return {
    width: size,
    height: size,
    data,
  };
};

export const registerTimingPointIcons = (map: Map) => {
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

  for (const [name, image] of Object.entries(timingPointIcons)) {
    if (!map.hasImage(name)) {
      map.addImage(name, image);
    }
  }
};