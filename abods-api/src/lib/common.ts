import { Kysely, sql } from "kysely";
import { DB } from "../kysely";
import { AtcoStopType, GeoJSONLineString, RouteType } from "../types/extra.js";
import { ServiceLinkType } from "../types/generated";
import haversineDistance from "haversine-distance";

export const getTracksData = async (
  stop_atcos: {
    from_atco_code: string;
    to_atco_code: string;
  }[],
  db: Kysely<DB>,
) => {
  return db
    .selectFrom("transmodel_tracks")
    .select(["id", "from_atco_code", "to_atco_code", "geometry", "distance"])
    .where((eb) =>
      eb.or(
        stop_atcos.map((condition) =>
          eb.and({
            "transmodel_tracks.from_atco_code": condition.from_atco_code,
            "transmodel_tracks.to_atco_code": condition.to_atco_code,
          }),
        ),
      ),
    )
    .execute();
};

const point = (x: number, y: number): [number, number] => [x, y];

export const listServiceLinks = async (
  stops: AtcoStopType[],
  db: Kysely<DB>,
) => {
  const serviceLinks: ServiceLinkType[] = [];

  const atco_codes_filter: {
    from_atco_code: string;
    to_atco_code: string;
  }[] = [];

  for (let i = 1; i < stops.length; i++) {
    atco_codes_filter.push({
      from_atco_code: stops[i - 1].stopId,
      to_atco_code: stops[i].stopId,
    });
  }

  const tracks = await getTracksData(atco_codes_filter, db);

  for (let i = 1; i < stops.length; i++) {
    const link = tracks.find(
      (track) => track.from_atco_code === stops[i - 1].stopId,
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
