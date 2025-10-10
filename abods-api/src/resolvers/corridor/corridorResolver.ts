import { Prisma } from "@prisma/client";
import {
  CorridorResultsType,
  distinctRoutes,
  getCorridor,
  getCorridorList,
  getOrgAdminAreas,
  isCorridorMappedToUserOrg,
  returnCorridor,
  returnCorridorType,
} from "../../lib/corridor.js";
import {
  CorridorNamespaceResolvers,
  CorridorStatsType,
  CorridorType,
  Maybe,
  Resolvers,
  StopType,
} from "../../types/generated.js";
import { userSelectedDateAsUtc } from "../../lib/dayjs.js";
import { emptyResolver, requireUserSession } from "../helpers.js";
import { TimetableType } from "../../types/extra.js";
import { executeQuery } from "../../lib/dbKysely.js";

export const listCorridors: CorridorNamespaceResolvers["corridorList"] = async (
  _,
  __,
  context,
): Promise<CorridorType[]> => {
  const user = await requireUserSession(context);

  const results: CorridorResultsType[] = await getCorridorList(
    context.db,
    user,
  );

  return returnCorridorType(results);
};

export const getCorridors: CorridorNamespaceResolvers["getCorridor"] = async (
  _,
  args,
  context,
): Promise<Maybe<CorridorType>> => {
  const user = await requireUserSession(context);
  const corridor: CorridorResultsType | null = await getCorridor(
    args.corridorId,
    context.db,
    user,
  );
  return corridor ? returnCorridor(corridor) : null;
};

export const getStops: CorridorNamespaceResolvers["addFirstStop"] = async (
  _,
  args,
  context,
): Promise<StopType[]> => {
  const user = await requireUserSession(context);

  if (!args.inputs) {
    throw Error("Invalid inputs");
  }
  const { boundingBox, searchString } = args.inputs;

  const where: Prisma.naptan_stoppoint_latlongWhereInput = {};

  if (searchString) {
    where.OR = [
      {
        atco_code: {
          contains: searchString,
        },
      },
      {
        common_name: {
          contains: searchString,
          mode: "insensitive",
        },
      },
    ];
  } else {
    where.latitude = {
      gte: boundingBox?.minLatitude ?? 0,
      lte: boundingBox?.maxLatitude ?? 0,
    };

    where.longitude = {
      gte: boundingBox?.minLongitude ?? 0,
      lte: boundingBox?.maxLongitude ?? 0,
    };
  }

  const adminAreas = await getOrgAdminAreas(context.db, user);

  where.admin_area_id = {
    in: adminAreas.map((admin) => admin.adminarea_id),
  };

  const results = await context.db.naptan_stoppoint_latlong.findMany({
    where: where,
    include: {
      locality: true,
    },
  });

  return results.map((stop) => ({
    stopId: stop.id.toString(),
    stopName: stop.common_name,
    lat: Number(stop.latitude),
    lon: Number(stop.longitude),
    localityName: stop.locality.name,
    adminAreaId: stop.admin_area_id.toString(),
    sourceId: stop.atco_code,
  }));
};

export const getSubsequentStops: CorridorNamespaceResolvers["addSubsequentStops"] =
  async (_, args, context): Promise<StopType[]> => {
    const user = await requireUserSession(context);

    const stopList = args.stopList || [];

    if (stopList.length === 0) {
      throw Error("No stops passed to obtain distinct routes");
    }
    stopList.push(""); // Push blank to add comma at the end
    const stopsPattern = stopList.join(",");
    const [routes, adminAreas] = await Promise.all([
      distinctRoutes(context.db, stopsPattern),
      getOrgAdminAreas(context.db, user),
    ]);

    const newStopList: string[] = [];
    routes.map((data) => {
      const stopIndex = data.route.indexOf(stopsPattern);
      let matchStopPattern = stopsPattern;
      if (stopIndex > 0) {
        matchStopPattern = `,${matchStopPattern}`;
      }
      const matches = data.route.match(matchStopPattern.concat("(.*)"));
      if (matches?.[1]) {
        const commaIndex = matches[1].indexOf(",");
        const nextStop =
          commaIndex !== -1 ? matches[1].substring(0, commaIndex) : matches[1];

        if (!newStopList.includes(nextStop)) {
          newStopList.push(nextStop);
        }
      }
    });

    if (newStopList.length > 0) {
      const stops = await context.db.naptan_stoppoint_latlong.findMany({
        where: {
          atco_code: {
            in: newStopList,
          },
          admin_area_id: {
            in: adminAreas.map((admin) => admin.adminarea_id),
          },
        },
        include: {
          locality: true,
        },
      });

      return stops.map((stop) => ({
        adminAreaId: stop.admin_area_id.toString(),
        stopId: stop.id.toString(),
        stopName: stop.common_name,
        lon: Number(stop.longitude),
        lat: Number(stop.latitude),
        localityName: stop.locality.name,
        sourceId: stop.atco_code,
      }));
    }

    return [];
  };

export const getStats: CorridorNamespaceResolvers["stats"] = async (
  _,
  args,
  context,
): Promise<CorridorStatsType> => {
  const { corridorId, fromTimestamp, stopList, toTimestamp } = args.inputs;
  const user = await requireUserSession(context);

  if (stopList.length < 1) {
    throw new Error("No stop array passed for corridor stats");
  }

  if (
    !(await isCorridorMappedToUserOrg(Number(corridorId), user, context.db))
  ) {
    throw new Error("Not Authorized");
  }

  const timetables = context.kysely
    .with("corridor_journeys", (db) =>
      db
        .selectFrom("route_to_journeys as rj")
        .innerJoin("distinct_routes as dr", "rj.distinct_route_id", "dr.id")
        .where("dr.route", "like", `%${stopList.join(",")}%`)
        .where(
          "rj.date_of_journey",
          ">=",
          userSelectedDateAsUtc(fromTimestamp).toDate(),
        )
        .where(
          "rj.date_of_journey",
          "<",
          userSelectedDateAsUtc(toTimestamp).toDate(),
        )
        .select([
          "rj.group_id as group_id",
          "rj.date_of_journey as date_of_journey",
        ]),
    )
    .with("naptan_stops", (db) =>
      db
        .selectFrom("naptan_stoppoint_latlong as nsl")
        .where("nsl.atco_code", "in", stopList)
        .select("nsl.id as naptan_id"),
    )
    .selectFrom("Timetable as t")
    .innerJoin("naptan_stops as n", "n.naptan_id", "t.stop_id")
    .innerJoin("corridor_journeys as cj", (join) =>
      join
        .onRef("cj.group_id", "=", "t.group_id")
        .onRef("cj.date_of_journey", "=", "t.date_of_journey"),
    )
    .where(
      "t.date_of_journey",
      ">=",
      userSelectedDateAsUtc(fromTimestamp).toDate(),
    )
    .where(
      "t.date_of_journey",
      "<",
      userSelectedDateAsUtc(toTimestamp).toDate(),
    )
    .select([
      "t.atco_code",
      "t.stop_index",
      "t.actual_departure_time",
      "t.timestamp_after_estimate",
      "t.expected_departure_time",
      "t.operator_noc",
      "t.service_code",
      "t.line_name",
      "t.vehiclejourney_id",
      "t.group_id",
      "t.date_of_journey",
    ]);

  const results: TimetableType[] = await executeQuery(timetables);

  const corridorTransits = extractCorridorTransits(results, stopList);
  // Not actually returning this type, but intended to stash this data we get for the next resolvers in the chain
  return {
    inputs: args.inputs,
    corridorTransits,
  } as unknown as CorridorStatsType;
};

const extractCorridorTransits = (
  stops: TimetableType[],
  corridor: string[],
) => {
  // Group stops into journeys
  const journeyMap: Record<string, TimetableType[]> = {};
  for (const stop of stops) {
    (journeyMap[`${stop.group_id}${stop.vehiclejourney_id}`] ??= []).push(stop);
  }

  const corridorTransits: TimetableType[][] = [];
  Object.values(journeyMap).forEach((journey) => {
    const sortedJourney = journey.sort((a, b) => a.stop_index - b.stop_index);
    let currentTransit: TimetableType[] = [];
    let corridorIndex = 0;
    for (const stop of sortedJourney) {
      // Ignore stops that aren't along the corridor
      // The stop_id value is actually a BigInt, while it is set as int in prisma
      if (stop.atco_code !== corridor[corridorIndex]) continue;

      currentTransit.push(stop);
      corridorIndex += 1;

      if (corridorIndex !== corridor.length) continue;

      // We're at the end of the corridor, so produce a match.
      corridorTransits.push(currentTransit);

      // The journey could transit the corridor multiple times,
      // so go back to the start of the corridor and look for another
      currentTransit = [];
      corridorIndex = 0;
    }
  });
  return corridorTransits;
};

const corridorResovlers: Resolvers = {
  Query: {
    corridor: emptyResolver,
  },
  CorridorNamespace: {
    getCorridor: getCorridors,
    corridorList: listCorridors,
    stats: getStats,
    addFirstStop: getStops,
    addSubsequentStops: getSubsequentStops,
  },
};

export default corridorResovlers;
