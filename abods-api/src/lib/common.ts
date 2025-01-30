import { Kysely } from "kysely";
import { DB } from "../kysely";
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

export enum RouteType {
  valid = "VALID",
  invalid_no_route_points = "INVALID_NO_ROUTE_POINTS",
}

export interface AtcoStopType {
  stopId: string;
  lon: number;
  lat: number;
}

export interface GeoJSONLineString {
  type: "LineString";
  coordinates: number[][];
}

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

    if (link) {
      const linestring = JSON.parse(link.geometry) as GeoJSONLineString;

      serviceLinks.push({
        fromStop: stops[i - 1].stopId,
        toStop: stops[i].stopId,
        distance: link.distance,
        routeValidity: RouteType.valid,
        linkRoute: JSON.stringify(linestring.coordinates),
      });
      continue;
    }

    const currentStop = stops[i];
    const previousStop = stops[i - 1];
    const currentStopPoint = point(currentStop.lon, currentStop.lat);
    const previousStopPoint = point(previousStop.lon, previousStop.lat);

    serviceLinks.push({
      fromStop: previousStop.stopId,
      toStop: currentStop.stopId,
      distance: haversineDistance(previousStopPoint, currentStopPoint),
      routeValidity: RouteType.invalid_no_route_points,
      linkRoute: JSON.stringify([currentStopPoint, previousStopPoint]),
    });
  }

  return serviceLinks;
};
