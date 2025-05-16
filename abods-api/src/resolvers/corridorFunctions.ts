import { Prisma, PrismaClient, Timetable } from "@prisma/client";
import {
  CorridorTransitServiceStatsType,
  CorridorTransitStatsOption,
  CorridorResultsType,
  deleteCorridorDb,
  deleteCorridorStops,
  distinctRoutes,
  getCorridor,
  getCorridorList,
  getStopDepartureTime,
  getOrgAdminAreas,
  isCorridorMappedToUserOrg,
  returnCorridor,
  returnCorridorType,
  updateCorridorDb,
} from "../lib/corridor.js";
import {
  CorridorGranularity,
  CorridorTransitTimeStatsType,
  CorridorNamespaceResolvers,
  CorridorStatsDayOfWeekType,
  CorridorStatsHistogramType,
  CorridorStatsInputType,
  CorridorStatsPerServiceType,
  CorridorStatsTimeOfDayType,
  CorridorStatsType,
  CorridorStatsTypeResolvers,
  CorridorSummaryStatsType,
  CorridorType,
  MatchType,
  Maybe,
  MutationResolvers,
  MutationResponseType,
  Resolvers,
  ServiceLinkType,
  StopType,
} from "../types/generated.js";
import {
  standardFormat,
  toUkTime,
  userSelectedDateAsUtc,
} from "../lib/dayjs.js";
import { getPercentile } from "../lib/utils.js";
import { emptyResolver, requireUserSession } from "./helpers.js";
import { listServiceLinks } from "../lib/common.js";
import dayjs from "dayjs";

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
    throw "Invalid inputs";
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
        adminAreaName: "",
        stopId: stop.id.toString(),
        stopName: stop.common_name,
        lon: Number(stop.longitude),
        lat: Number(stop.latitude),
        localityName: stop.locality.name,
        localityId: stop.locality_id,
        sourceId: stop.atco_code,
      }));
    }

    return [];
  };

export const createCorridor: MutationResolvers["createCorridor"] = async (
  _,
  args,
  context,
): Promise<MutationResponseType> => {
  const user = await requireUserSession(context);
  if (!args.payload?.name || !args.payload.stopIds) throw "Bad Request";

  const corridor = await context.db.corridor.create({
    data: {
      corridor_name: args.payload.name,
      // Not good. Should be changed later
      // This won't be visible to any other orgs they are assigned to.
      // Visibility will be somewhat random, though consistent because we sort the org numbers
      organisation_id: user.orgIds[0],
      user_id: user.id,
    },
    select: {
      corridor_id: true,
    },
  });

  await insertCorridorStops(
    corridor.corridor_id,
    args.payload.stopIds.map(String),
    context.db,
  );

  return {
    success: true,
  };
};

const insertCorridorStops = async (
  corridor_id: number,
  stopIds: string[],
  db: PrismaClient,
) => {
  const numberStopsList = stopIds.map(Number);

  const records: {
    corridor_id: number;
    corridor_index: number;
    stop_id: number;
  }[] = [];

  numberStopsList.map((stop, index) => {
    records.push({
      corridor_id: Number(corridor_id),
      corridor_index: index,
      stop_id: stop,
    });
  });

  await db.corridor_stops.createMany({
    data: records,
  });
};

export const deleteCorridor: MutationResolvers["deleteCorridor"] = async (
  _,
  args,
  context,
): Promise<MutationResponseType> => {
  const user = await requireUserSession(context);
  if (
    !(await isCorridorMappedToUserOrg(
      Number(args.corridorId),
      user,
      context.db,
    ))
  ) {
    throw "Not Authorized";
  }

  if (!args.corridorId) throw "Bad Request";

  await Promise.all([
    deleteCorridorDb(args.corridorId, context.db),
    deleteCorridorStops(args.corridorId, context.db),
  ]);

  return {
    success: true,
  };
};

export const updateCorridor: MutationResolvers["updateCorridor"] = async (
  _,
  args,
  context,
): Promise<MutationResponseType> => {
  if (!args.inputs) throw "Bad Request";
  const user = await requireUserSession(context);
  if (
    !(await isCorridorMappedToUserOrg(Number(args.inputs.id), user, context.db))
  ) {
    throw "Not Authorized";
  }

  if (!args.inputs.id || !args.inputs.name || !args.inputs.stopList)
    throw "Bad Request";

  await Promise.all([
    updateCorridorDb(args.inputs.id, args.inputs.name, context.db),
    deleteCorridorStops(args.inputs.id, context.db),
  ]);

  await insertCorridorStops(
    args.inputs.id,
    args.inputs.stopList.map(String),
    context.db,
  );

  return {
    success: true,
  };
};

interface StatsCache {
  inputs: CorridorStatsInputType;
  corridorTransits: TimetableType[][];
}

export type TimetableType = Pick<
  Timetable,
  | "atco_code"
  | "stop_index"
  | "actual_departure_time"
  | "timestamp_after_estimate"
  | "expected_departure_time"
  | "operator_noc"
  | "service_code"
  | "line_name"
  | "date_of_journey"
  | "vehiclejourney_id"
  | "group_id"
>;

export const getStats: CorridorNamespaceResolvers["stats"] = async (
  _,
  args,
  context,
): Promise<CorridorStatsType> => {
  const { corridorId, fromTimestamp, stopList, toTimestamp } = args.inputs;
  const user = await requireUserSession(context);

  if (stopList.length < 1) {
    throw "No stop array passed for corridor stats";
  }

  if (
    !(await isCorridorMappedToUserOrg(Number(corridorId), user, context.db))
  ) {
    throw "Not Authorized";
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

  const results: TimetableType[] = await timetables.execute();

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

export const getSummaryStats: CorridorStatsTypeResolvers["summaryStats"] = (
  parent,
): CorridorSummaryStatsType => {
  // Data was cached in the output of getStats, and will be removed later
  const data = parent as StatsCache;
  const scheduledTransits = data.corridorTransits.length;
  let totalTransits = 0;
  let totalTransitTime = 0;
  const services = new Set();
  data.corridorTransits.map((transit) => {
    const firstDeparture = getStopDepartureTime(
      transit[0],
      data.inputs.matchType,
    );

    const lastDeparture = getStopDepartureTime(
      transit[transit.length - 1],
      data.inputs.matchType,
    );

    if (firstDeparture && lastDeparture) {
      totalTransits += 1;
      totalTransitTime +=
        (lastDeparture.getTime() - firstDeparture.getTime()) / 1000; //In seconds
    }

    const serviceCode = `${transit[0].operator_noc}${transit[0].service_code}${transit[0].line_name}`;
    if (!services.has(serviceCode)) {
      services.add(serviceCode);
    }
  });

  const averageTransitTime =
    totalTransits > 0 ? Math.ceil(totalTransitTime / totalTransits) : 0;
  return {
    scheduledTransits,
    totalTransits,
    averageTransitTime: averageTransitTime,
    numberOfServices: services.size,
  };
};

export const getTransitTimeOfDayStats: CorridorStatsTypeResolvers["transitTimeTimeOfDayStats"] =
  (
    parent,
  ): (CorridorTransitTimeStatsType &
    CorridorStatsTimeOfDayType &
    CorridorStatsDayOfWeekType)[] => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    return getTransitStats(
      data.corridorTransits,
      CorridorTransitStatsOption.hourAsNumber,
      data.inputs.matchType,
    );
  };

export const getTransitDayOfWeekStats: CorridorStatsTypeResolvers["transitTimeDayOfWeekStats"] =
  (
    parent,
  ): (CorridorTransitTimeStatsType &
    CorridorStatsTimeOfDayType &
    CorridorStatsDayOfWeekType)[] => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    return getTransitStats(
      data.corridorTransits,
      CorridorTransitStatsOption.dayOfWeek,
      data.inputs.matchType,
    );
  };

export const getTransitTimeStats: CorridorStatsTypeResolvers["transitTimeStats"] =
  (
    parent,
  ): (CorridorTransitTimeStatsType &
    CorridorStatsTimeOfDayType &
    CorridorStatsDayOfWeekType)[] => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    return data.inputs?.granularity === CorridorGranularity.Day
      ? getTransitStats(
          data.corridorTransits,
          CorridorTransitStatsOption.day,
          data.inputs.matchType,
        )
      : getTransitStats(
          data.corridorTransits,
          CorridorTransitStatsOption.hour,
          data.inputs.matchType,
        );
  };

const getTransitStats = (
  corridorTransits: TimetableType[][],
  inputType: CorridorTransitStatsOption,
  matchType: MatchType,
) => {
  const transitStats = new Map<string, number[]>();
  corridorTransits.map((transit) => {
    const firstDeparture = transit[0];

    const firstStopDeparture = getStopDepartureTime(transit[0], matchType);
    const lastDeparture = getStopDepartureTime(
      transit[transit.length - 1],
      matchType,
    );

    if (firstStopDeparture && lastDeparture) {
      let dateKey = "";
      switch (inputType) {
        case CorridorTransitStatsOption.day:
          dateKey = standardFormat(toUkTime(firstDeparture.date_of_journey));
          break;

        case CorridorTransitStatsOption.dayOfWeek:
          dateKey = dayjs(firstDeparture.date_of_journey).day().toString();
          break;

        case CorridorTransitStatsOption.hour:
          dateKey = standardFormat(
            toUkTime(firstDeparture.expected_departure_time).startOf("hour"),
          );
          break;

        case CorridorTransitStatsOption.hourAsNumber:
          dateKey = toUkTime(firstDeparture.expected_departure_time)
            .hour()
            .toString();
          break;

        default:
          throw new Error("Invalid transit indicator type provided");
      }

      const transitTime = transitStats.get(dateKey) || [];
      transitTime.push(
        (lastDeparture.getTime() - firstStopDeparture.getTime()) / 1000,
      );
      transitStats.set(dateKey, transitTime);
    }
  });

  const stats: (CorridorTransitTimeStatsType &
    CorridorStatsTimeOfDayType &
    CorridorStatsDayOfWeekType)[] = [];
  transitStats.forEach((transitTimes: number[], key: string) => {
    transitTimes.sort((a, b) => a - b);

    stats.push({
      ts: key,
      hour: Number(key),
      dow: Number(key),
      avgTransitTime: Math.ceil(
        transitTimes.reduce(
          (accumulator, currentValue) => accumulator + currentValue,
          0,
        ) / transitTimes.length,
      ),
      minTransitTime: transitTimes[0],
      maxTransitTime: transitTimes[transitTimes.length - 1],
      percentile25: getPercentile(25, transitTimes),
      percentile75: getPercentile(75, transitTimes),
    });
  });

  return stats;
};

export const getTransitStatsPerService: CorridorStatsTypeResolvers["transitTimePerServiceStats"] =
  async (parent, _, context): Promise<CorridorStatsPerServiceType[]> => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    const transitStats = new Map<string, CorridorTransitServiceStatsType>();
    const stats: CorridorStatsPerServiceType[] = [];
    data.corridorTransits.map((transit) => {
      const firstDeparture = transit[0];

      const firstStopDeparture = getStopDepartureTime(
        transit[0],
        data.inputs.matchType,
      );
      const lastDeparture = getStopDepartureTime(
        transit[transit.length - 1],
        data.inputs.matchType,
      );
      // noc_line_and_servicecode
      const service = `${firstDeparture.operator_noc}-${firstDeparture.line_name}-${firstDeparture.service_code}`;
      const transitTime = transitStats.get(service) || {
        totalTransitTime: 0,
        recordedTransits: 0,
        scheduledTransits: 0,
        lineName: firstDeparture.line_name,
        operatorNoc: firstDeparture.operator_noc,
        serviceCode: firstDeparture.service_code,
      };
      transitTime.scheduledTransits += 1;
      if (firstStopDeparture && lastDeparture) {
        transitTime.totalTransitTime +=
          (lastDeparture.getTime() - firstStopDeparture.getTime()) / 1000;
        transitTime.recordedTransits += 1;
      }
      transitStats.set(service, transitTime);
    });

    if (transitStats.size > 0) {
      const services = await context.db.service_details.findMany({
        where: {
          noc_and_line_and_servicecode: {
            in: [...transitStats.keys()],
          },
        },
        include: {
          operator: true,
        },
      });

      transitStats.forEach((transits, key) => {
        const serviceDetails = services.find(
          (service) => service.noc_and_line_and_servicecode === key,
        );
        stats.push({
          lineName: serviceDetails?.line_name ?? "",
          operatorName: serviceDetails?.operator?.name ?? "NA",
          noc: serviceDetails?.operator_noc,
          servicePatternName: serviceDetails?.service_name ?? "",
          recordedTransits: transits.recordedTransits,
          totalTransitTime: transits.totalTransitTime,
          scheduledTransits: transits.scheduledTransits,
        });
      });
    }

    return stats;
  };

export const getTransitStatsHistogram: CorridorStatsTypeResolvers["transitTimeHistogram"] =
  (parent): CorridorStatsHistogramType[] => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    const transitStats = new Map<string, number>();

    data.corridorTransits.map((transit) => {
      const firstStopDeparture = getStopDepartureTime(
        transit[0],
        data.inputs.matchType,
      );
      const lastDeparture = getStopDepartureTime(
        transit[transit.length - 1],
        data.inputs.matchType,
      );
      if (firstStopDeparture && lastDeparture) {
        const totalTransitTime = Math.floor(
          (lastDeparture.getTime() - firstStopDeparture.getTime()) /
            (1000 * 60),
        );

        transitStats.set(
          totalTransitTime.toString(),
          (transitStats.get(totalTransitTime.toString()) || 0) + 1,
        );
      }
    });

    return [
      {
        ts: null,
        hist: Array.from(transitStats, ([key, value]) => ({
          bin: Number(key),
          freq: value,
        })),
      },
    ];
  };

export const getServiceLinks: CorridorStatsTypeResolvers["serviceLinks"] =
  async (parent, _, context): Promise<ServiceLinkType[]> => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;

    const results = await context.kysely
      .selectFrom("corridor_stops")
      .innerJoin(
        "naptan_stoppoint_latlong",
        "corridor_stops.stop_id",
        "naptan_stoppoint_latlong.id",
      )
      .where("corridor_stops.corridor_id", "=", Number(data.inputs.corridorId))
      .select([
        "corridor_stops.corridor_index",
        "naptan_stoppoint_latlong.atco_code",
        "naptan_stoppoint_latlong.latitude",
        "naptan_stoppoint_latlong.longitude",
      ])
      .execute()
      .then((result) =>
        result.map((x) => ({
          corridorIndex: x.corridor_index,
          stopId: x.atco_code ?? "",
          lat: x.latitude ?? 0,
          lon: x.longitude ?? 0,
        })),
      );

    results.sort((a, b) => a.corridorIndex - b.corridorIndex);

    return listServiceLinks(results, context.kysely);
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
  CorridorStatsType: {
    summaryStats: getSummaryStats,
    transitTimeStats: getTransitTimeStats,
    transitTimeTimeOfDayStats: getTransitTimeOfDayStats,
    transitTimeDayOfWeekStats: getTransitDayOfWeekStats,
    transitTimeHistogram: getTransitStatsHistogram,
    transitTimePerServiceStats: getTransitStatsPerService,
    serviceLinks: getServiceLinks,
  },
  Mutation: {
    createCorridor: createCorridor,
    updateCorridor: updateCorridor,
    deleteCorridor: deleteCorridor,
  },
};

export default corridorResovlers;
