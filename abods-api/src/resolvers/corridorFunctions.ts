import {
  CorridorTransitStatsOption,
  CorridorTransitServiceStatsType,
  deleteCorridorDb,
  deleteCorridorStops,
  distinctRoutes,
  getOrgAdminAreas,
  getStopDepartureTime,
  isCorridorMappedToUserOrg,
  updateCorridorDb,
} from "../lib/corridor.js";
import {
  CorridorGranularity,
  CorridorNamespaceResolvers,
  CorridorStatsDayOfWeekType,
  CorridorStatsHistogramType,
  CorridorStatsInputType,
  CorridorStatsPerServiceType,
  CorridorStatsTimeOfDayType,
  CorridorStatsType,
  CorridorStatsTypeResolvers,
  CorridorSummaryStatsType,
  CorridorTransitTimeStatsType,
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
import { Kysely, SelectQueryBuilder } from "kysely";
import { SessionUser } from "../types/extra.js";
import { DB } from "../kysely.js";
import { Corridor, Timetable } from "../kysely.generated.js";

type baseQueryType = SelectQueryBuilder<DB & { c: Corridor }, "c", object>;
const corridorsQuery = async (
  db: Kysely<DB>,
  user: SessionUser,
  filter?: (q: baseQueryType) => baseQueryType,
) => {
  let baseQuery: baseQueryType = db.selectFrom("corridor as c");
  if (filter) {
    baseQuery = filter(baseQuery);
  }
  const results = await baseQuery
    .where(
      "c.organisation_id",
      "in",
      user.orgIds.map((x) => x.toString()),
    )
    .leftJoin("corridor_stops as s", "s.corridor_id", "c.corridor_id")
    .innerJoin("naptan_stoppoint_latlong as n", "n.id", "s.stop_id")
    .innerJoin("naptan_locality as l", "l.gazetteer_id", "n.locality_id")
    .innerJoin("naptan_adminarea as a", "a.id", "l.admin_area_id")
    .select([
      "c.corridor_id",
      "c.corridor_name",
      "s.stop_id",
      "n.atco_code",
      "n.locality_id",
      "n.latitude",
      "n.longitude",
      "n.common_name",
      "l.name as localityName",
      "l.admin_area_id as admin_area_id",
      "a.name as admin_area_name",
    ])
    .execute();

  const map: Record<string, CorridorType> = {};
  for (const row of results) {
    if (!(row.corridor_id in map)) {
      map[row.corridor_id ?? "unknown"] = {
        id: row.corridor_id ? Number(row.corridor_id) : 0,
        name: row.corridor_name ?? "unknown",
        stops: [],
      };
    }
    if (!row.stop_id) {
      continue;
    }
    map[row.corridor_id ?? "unknown"].stops.push({
      stopId: row.stop_id.toString(),
      sourceId: row.atco_code,
      stopLocality: {
        localityAreaId: row.admin_area_id?.toString() ?? "unknown",
        localityAreaName: row.admin_area_name,
        localityId: row.locality_id,
        localityName: row.localityName,
      },
      stopLocation: {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
      },
      stopName: row.common_name ?? "unknown",
    });
  }
  return Object.values(map);
};

export const listCorridors: CorridorNamespaceResolvers["corridorList"] = async (
  _,
  __,
  context,
): Promise<CorridorType[]> => {
  const user = await requireUserSession(context);
  return await corridorsQuery(context.db, user);
};

export const getCorridors: CorridorNamespaceResolvers["getCorridor"] = async (
  _,
  args,
  context,
): Promise<Maybe<CorridorType>> => {
  const user = await requireUserSession(context);
  const corridors = await corridorsQuery(context.db, user, (q) =>
    q.where("c.corridor_id", "=", args.corridorId.toString()),
  );
  if (corridors.length === 0) {
    return null;
  }
  return corridors[0];
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

  let baseQuery = context.db
    .selectFrom("naptan_stoppoint_latlong as s")
    .innerJoin("naptan_locality as l", "l.gazetteer_id", "s.locality_id")
    .where("l.admin_area_id", "in", getOrgAdminAreas(context.db, user));
  if (searchString) {
    baseQuery = baseQuery.where((eb) =>
      eb.or([
        eb("atco_code", "like", `%${searchString}%`),
        eb(
          eb.fn<string>("lower", ["common_name"]),
          "like",
          `%${searchString.toLowerCase()}%`,
        ),
      ]),
    );
  } else {
    baseQuery = baseQuery
      .where("latitude", ">=", boundingBox?.minLatitude ?? 0)
      .where("latitude", "<=", boundingBox?.maxLatitude ?? 0)
      .where("longitude", ">=", boundingBox?.minLongitude ?? 0)
      .where("longitude", "<=", boundingBox?.maxLongitude ?? 0);
  }
  const results = await baseQuery
    .select([
      "s.id",
      "s.common_name",
      "s.latitude",
      "s.longitude",
      "s.admin_area_id",
      "s.atco_code",
      "l.name as locality_name",
    ])
    .execute();

  return results.map((stop) => ({
    stopId: stop.id?.toString() ?? "unknown",
    stopName: stop.common_name ?? "unknown",
    lat: Number(stop.latitude),
    lon: Number(stop.longitude),
    localityName: stop.locality_name,
    adminAreaId: stop.admin_area_id?.toString() ?? "unknown",
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
    const routes = await distinctRoutes(context.db, stopsPattern);

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
      const stops = await context.db
        .selectFrom("naptan_stoppoint_latlong as s")
        .innerJoin("naptan_locality as l", "l.gazetteer_id", "s.locality_id")
        .where("s.atco_code", "in", newStopList)
        .where("s.admin_area_id", "in", getOrgAdminAreas(context.db, user))
        .select([
          "s.admin_area_id",
          "s.id",
          "s.common_name",
          "s.longitude",
          "s.latitude",
          "l.name as locality_name",
          "s.locality_id",
          "s.atco_code",
        ])
        .execute();

      return stops.map((stop) => ({
        adminAreaId: stop.admin_area_id?.toString() ?? "unknown",
        adminAreaName: "",
        stopId: stop.id?.toString() ?? "unknown",
        stopName: stop.common_name ?? "unknown",
        lon: Number(stop.longitude),
        lat: Number(stop.latitude),
        localityName: stop.locality_name,
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

  const corridor = await context.db
    .insertInto("corridor")
    .values({
      corridor_name: args.payload.name,
      // Not good. Should be changed later
      // This won't be visible to any other orgs they are assigned to.
      // Visibility will be somewhat random, though consistent because we sort the org numbers
      organisation_id: user.orgIds[0],
      user_id: user.id,
    })
    .executeTakeFirst();
  if (!corridor.insertId) {
    return { success: false };
  }

  await context.db
    .insertInto("corridor_stops")
    .values(
      args.payload.stopIds.map((stop, index) => ({
        corridor_id: Number(corridor.insertId),
        corridor_index: index,
        stop_id: Number(stop),
      })),
    )
    .execute();

  return {
    success: true,
  };
};

export const deleteCorridor: MutationResolvers["deleteCorridor"] = async (
  _,
  args,
  context,
): Promise<MutationResponseType> => {
  const user = await requireUserSession(context);
  if (
    !(await isCorridorMappedToUserOrg(
      args.corridorId.toString(),
      user,
      context.db,
    ))
  ) {
    throw "Not Authorized";
  }

  if (!args.corridorId) throw "Bad Request";

  await Promise.all([
    deleteCorridorDb(args.corridorId.toString(), context.db),
    deleteCorridorStops(args.corridorId.toString(), context.db),
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
    !(await isCorridorMappedToUserOrg(
      args.inputs.id.toString(),
      user,
      context.db,
    ))
  ) {
    throw "Not Authorized";
  }

  if (!args.inputs.id || !args.inputs.name || !args.inputs.stopList)
    throw "Bad Request";

  await Promise.all([
    updateCorridorDb(args.inputs.id.toString(), args.inputs.name, context.db),
    deleteCorridorStops(args.inputs.id.toString(), context.db),
  ]);

  await context.db
    .insertInto("corridor_stops")
    .values(
      args.inputs.stopList.map((stop, index) => ({
        corridor_id: args.inputs.id,
        corridor_index: index,
        stop_id: Number(stop),
      })),
    )
    .execute();

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
  | "stop_index"
  | "operator_noc"
  | "service_code"
  | "line_name"
  | "vehiclejourney_id"
  | "group_id"
> & {
  actual_departure_time: Date | null;
  expected_departure_time: Date | null;
  timestamp_after_estimate: Date | null;
  date_of_journey: Date;
  stop_id: string | null;
};

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
    !(await isCorridorMappedToUserOrg(corridorId.toString(), user, context.db))
  ) {
    throw "Not Authorized";
  }

  const corridor = stopList;

  const timetables = context.db
    .selectFrom("Timetable")
    .where(
      "date_of_journey",
      ">=",
      userSelectedDateAsUtc(fromTimestamp).toDate(),
    )
    .where("date_of_journey", "<", userSelectedDateAsUtc(toTimestamp).toDate())
    .where("stop_id", "in", corridor);

  const journeysWithAtLeastAsManyStops = timetables
    .groupBy(["group_id", "vehiclejourney_id"])
    .having(context.db.fn.count("stop_id"), ">=", corridor.length)
    .select("group_id");

  const results: TimetableType[] = await timetables
    .where("group_id", "in", journeysWithAtLeastAsManyStops)
    .select([
      "stop_id",
      "stop_index",
      "actual_departure_time",
      "timestamp_after_estimate",
      "expected_departure_time",
      "operator_noc",
      "service_code",
      "line_name",
      "vehiclejourney_id",
      "group_id",
      "date_of_journey",
    ])
    .execute();
  const corridorTransits = extractCorridorTransits(results, corridor);

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
    const sortedJourney = journey.sort(
      (a, b) => (a.stop_index ?? 0) - (b.stop_index ?? 0),
    );
    let currentTransit: TimetableType[] = [];
    let corridorIndex = 0;
    for (const stop of sortedJourney) {
      // Ignore stops that aren't along the corridor
      if (stop.stop_id !== corridor[corridorIndex]) continue;

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

    if (transitStats.size <= 0) {
      return [];
    }
    const services = await context.db
      .selectFrom("service_details as s")
      .innerJoin("all_operators as o", "o.operatorref", "s.operator_noc")
      .where("noc_and_line_and_servicecode", "in", [...transitStats.keys()])
      .select([
        "s.noc_and_line_and_servicecode",
        "s.line_name",
        "s.operator_noc",
        "s.service_name",
        "o.name as operator_name",
      ])
      .execute();

    const stats: CorridorStatsPerServiceType[] = [];
    transitStats.forEach((transits, key) => {
      const serviceDetails = services.find(
        (service) => service.noc_and_line_and_servicecode === key,
      );
      return {
        lineName: serviceDetails?.line_name ?? "",
        operatorName: serviceDetails?.operator_name ?? "NA",
        noc: serviceDetails?.operator_noc,
        servicePatternName: serviceDetails?.service_name ?? "",
        recordedTransits: transits.recordedTransits,
        totalTransitTime: transits.totalTransitTime,
        scheduledTransits: transits.scheduledTransits,
      };
    });

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

    const results = await context.db
      .selectFrom("corridor_stops")
      .innerJoin(
        "naptan_stoppoint_latlong",
        "corridor_stops.stop_id",
        "naptan_stoppoint_latlong.id",
      )
      .where("corridor_stops.corridor_id", "=", data.inputs.corridorId)
      .select([
        "corridor_stops.corridor_index",
        "naptan_stoppoint_latlong.atco_code",
        "naptan_stoppoint_latlong.latitude",
        "naptan_stoppoint_latlong.longitude",
      ])
      .execute()
      .then((result) =>
        result.map((x) => ({
          corridorIndex: x.corridor_index ? Number(x.corridor_index) : 0,
          stopId: x.atco_code ?? "",
          lat: x.latitude ?? 0,
          lon: x.longitude ?? 0,
        })),
      );

    results.sort((a, b) => a.corridorIndex - b.corridorIndex);

    return listServiceLinks(results, context.db);
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
