import { Kysely } from "kysely";
import { DB } from "../kysely";
import { AtcoStopType, GeoJSONLineString, RouteType } from "../types/extra.js";
import { ServiceLinkType } from "../types/generated";
import haversineDistance from "haversine-distance";

export const getTracksData = async (stop_atcos: string[], db: Kysely<DB>) => {
  return db
    .selectFrom("transmodel_tracks")
    .select(["id", "from_atco_code", "to_atco_code", "geometry", "distance"])
    .where("from_atco_code", "in", stop_atcos)
    .execute();
};

const point = (x: number, y: number): [number, number] => [x, y];

export const listServiceLinks = async (
  stops: AtcoStopType[],
  db: Kysely<DB>,
) => {
  const serviceLinks: ServiceLinkType[] = [];

  const tracks = await getTracksData(
    stops.map((stop) => stop.stopId),
    db,
  );

  for (let i = 1; i < stops.length; i++) {
    const link = tracks.find(
      (track) =>
        track.from_atco_code === stops[i - 1].stopId &&
        track.to_atco_code === stops[i].stopId,
    );

    let coordinates: number[][] | [number, number][];
    const currentStop = stops[i];
    const previousStop = stops[i - 1];
    const currentStopPoint = point(currentStop.lon, currentStop.lat);
    const previousStopPoint = point(previousStop.lon, previousStop.lat);

    if (link) {
      const linestring = JSON.parse(link.geometry) as GeoJSONLineString;

      coordinates = linestring.coordinates;
    } else {
      coordinates = [currentStopPoint, previousStopPoint];
    }

    const distance = link
      ? link.distance
      : haversineDistance(previousStopPoint, currentStopPoint);

    const routeValidity = link
      ? RouteType.valid
      : RouteType.invalid_no_route_points;

    serviceLinks.push({
      fromStop: previousStop.stopId,
      toStop: currentStop.stopId,
      distance,
      routeValidity,
      linkRoute: JSON.stringify(coordinates),
    });
  }

  return serviceLinks;
};
