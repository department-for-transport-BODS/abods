import { Prisma, PrismaClient, Timetable } from "@prisma/client";
import {
  CorridorJourneyServiceStatsType,
  CorridorJourneyStatsOption,
  CorridorResultsType,
  deleteCorridorDb,
  deleteCorridorStops,
  distinctRoutes,
  getCorridor,
  getCorridorList,
  getJourneyDeparture,
  getOrgAdminAreas,
  isCorridorMappedToUserOrg,
  returnCorridor,
  returnCorridorType,
  updateCorridorDb,
} from "../lib/corridor.js";
import {
  CorridorGranularity,
  CorridorJourneyTimeStatsType,
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
  getDate,
  getDayFormattedDate,
  getHourFormattedDate,
  userSelectedDateAsUtc,
} from "../lib/dayjs.js";
import { getPercentile } from "../lib/utils.js";
import { emptyResolver, requireUserSession } from "./helpers.js";
import { SessionUser } from "../types/extra.js";
import { listServiceLinks } from "../lib/common.js";

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
      organisation_id: user.orgId,
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
    user,
  );

  return {
    success: true,
  };
};

const insertCorridorStops = async (
  corridor_id: number,
  stopIds: string[],
  db: PrismaClient,
  sessionUser: SessionUser,
) => {
  const numberStopsList = stopIds.map(Number);

  const records: {
    corridor_id: number;
    corridor_index: number;
    stop_id: number;
  }[] = [];

  const adminAreas = await getOrgAdminAreas(db, sessionUser);
  const stops = await db.naptan_stoppoint_latlong.findMany({
    where: {
      id: {
        in: numberStopsList,
      },
      admin_area_id: {
        in: adminAreas.map((admin) => admin.adminarea_id),
      },
    },
  });

  stops.sort(
    (a, b) =>
      numberStopsList.findIndex((stop) => stop === a.id) -
      numberStopsList.findIndex((stop) => stop === b.id),
  );

  stops.map((stop, index) => {
    records.push({
      corridor_id: Number(corridor_id),
      corridor_index: index,
      stop_id: stop.id,
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
    user,
  );

  return {
    success: true,
  };
};

interface StatsCache {
  inputs: CorridorStatsInputType;
  journeys: Map<string, TimetableType[]>;
}

export type TimetableType = Pick<
  Timetable,
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

  if (
    !(await isCorridorMappedToUserOrg(Number(corridorId), user, context.db))
  ) {
    throw "Not Authorized";
  }

  const stopsArray = stopList.map(Number);

  const timetables = context.kysely
    .selectFrom("Timetable")
    .where(
      "date_of_journey",
      ">=",
      userSelectedDateAsUtc(fromTimestamp).toDate(),
    )
    .where("date_of_journey", "<", userSelectedDateAsUtc(toTimestamp).toDate())
    .where("stop_id", "in", stopsArray);

  const groupIdsWithCorrectStopCount = timetables
    .groupBy(["group_id"])
    .having(context.kysely.fn.count("stop_id"), "=", stopsArray.length)
    .select("group_id");

  const results: TimetableType[] = await timetables
    .where("group_id", "in", groupIdsWithCorrectStopCount)
    .select([
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

  const journeyMap = new Map<string, TimetableType[]>();
  let mapKey = "";
  let existingJourneys: TimetableType[] = [];
  results.map((journey) => {
    mapKey = `${journey.group_id}${journey.vehiclejourney_id}`;
    existingJourneys = journeyMap.get(mapKey) || [];
    existingJourneys.push(journey);
    journeyMap.set(mapKey, existingJourneys);
  });

  // Not actually returning this type, but intended to stash this data we get for the next resolvers in the chain
  return { inputs: args.inputs, journeys: journeyMap } as CorridorStatsType;
};

export const getSummaryStats: CorridorStatsTypeResolvers["summaryStats"] = (
  parent,
): CorridorSummaryStatsType => {
  // Data was cached in the output of getStats, and will be removed later
  const data = parent as StatsCache;
  const scheduledTransits = data.journeys.size;
  let totalTransits = 0;
  let totalJourneyTime = 0;
  const services = new Set();
  [...data.journeys.values()].map((journeys) => {
    journeys.sort((a, b) => a.stop_index - b.stop_index);
    const firstDeparture = getJourneyDeparture(
      journeys[0],
      data.inputs.matchType,
    );

    const lastDeparture = getJourneyDeparture(
      journeys[journeys.length - 1],
      data.inputs.matchType,
    );

    if (firstDeparture && lastDeparture) {
      totalTransits += 1;
      totalJourneyTime +=
        (lastDeparture.getTime() - firstDeparture.getTime()) / 1000; //In seconds
    }

    const serviceCode = `${journeys[0].operator_noc}${journeys[0].service_code}${journeys[0].line_name}`;
    if (!services.has(serviceCode)) {
      services.add(serviceCode);
    }
  });

  const averageJourneyTime =
    totalTransits > 0 ? Math.ceil(totalJourneyTime / totalTransits) : 0;

  return {
    scheduledTransits,
    totalTransits,
    averageJourneyTime: averageJourneyTime,
    numberOfServices: services.size,
  };
};

export const getJourneyTimeOfDayStats: CorridorStatsTypeResolvers["journeyTimeTimeOfDayStats"] =
  (
    parent,
  ): (CorridorJourneyTimeStatsType &
    CorridorStatsTimeOfDayType &
    CorridorStatsDayOfWeekType)[] => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    return getJourneyStats(
      data.journeys,
      CorridorJourneyStatsOption.hourAsNumber,
      data.inputs.matchType,
    );
  };

export const getJourneyDayOfWeekStats: CorridorStatsTypeResolvers["journeyTimeDayOfWeekStats"] =
  (
    parent,
  ): (CorridorJourneyTimeStatsType &
    CorridorStatsTimeOfDayType &
    CorridorStatsDayOfWeekType)[] => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    return getJourneyStats(
      data.journeys,
      CorridorJourneyStatsOption.dayOfWeek,
      data.inputs.matchType,
    );
  };

export const getJourneyTimeStats: CorridorStatsTypeResolvers["journeyTimeStats"] =
  (
    parent,
  ): (CorridorJourneyTimeStatsType &
    CorridorStatsTimeOfDayType &
    CorridorStatsDayOfWeekType)[] => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    return data.inputs?.granularity === CorridorGranularity.Day
      ? getJourneyStats(
          data.journeys,
          CorridorJourneyStatsOption.day,
          data.inputs.matchType,
        )
      : getJourneyStats(
          data.journeys,
          CorridorJourneyStatsOption.hour,
          data.inputs.matchType,
        );
  };

const getJourneyStats = (
  journeys: Map<string, TimetableType[]>,
  inputType: CorridorJourneyStatsOption,
  matchType: MatchType,
) => {
  const journeyStats = new Map<string, number[]>();
  [...journeys.values()].map((journeys) => {
    journeys.sort((a, b) => a.stop_index - b.stop_index);

    const firstDeparture = journeys[0];

    const firstStopDeparture = getJourneyDeparture(journeys[0], matchType);
    const lastDeparture = getJourneyDeparture(
      journeys[journeys.length - 1],
      matchType,
    );

    if (firstStopDeparture && lastDeparture) {
      let dateKey = "";
      switch (inputType) {
        case CorridorJourneyStatsOption.day:
          dateKey = getDayFormattedDate(firstDeparture.date_of_journey);
          break;

        case CorridorJourneyStatsOption.dayOfWeek:
          dateKey = getDate(firstDeparture.date_of_journey).day().toString();
          break;

        case CorridorJourneyStatsOption.hour:
          dateKey = getHourFormattedDate(
            firstDeparture.expected_departure_time,
          );
          break;

        case CorridorJourneyStatsOption.hourAsNumber:
          dateKey = getDate(firstDeparture.expected_departure_time)
            .tz("Europe/London")
            .hour()
            .toString();
          break;

        default:
          throw new Error("Invalid journey indicator type provided");
      }

      const journeyTime = journeyStats.get(dateKey) || [];
      journeyTime.push(
        (lastDeparture.getTime() - firstStopDeparture.getTime()) / 1000,
      );
      journeyStats.set(dateKey, journeyTime);
    }
  });

  const stats: (CorridorJourneyTimeStatsType &
    CorridorStatsTimeOfDayType &
    CorridorStatsDayOfWeekType)[] = [];
  journeyStats.forEach((journeyTimes: number[], key: string) => {
    journeyTimes.sort((a, b) => a - b);

    stats.push({
      ts: key,
      hour: Number(key),
      dow: Number(key),
      avgTransitTime: Math.ceil(
        journeyTimes.reduce(
          (accumulator, currentValue) => accumulator + currentValue,
          0,
        ) / journeyTimes.length,
      ),
      minTransitTime: journeyTimes[0],
      maxTransitTime: journeyTimes[journeyTimes.length - 1],
      percentile25: getPercentile(25, journeyTimes),
      percentile75: getPercentile(75, journeyTimes),
    });
  });

  return stats;
};

export const getJourneyStatsPerService: CorridorStatsTypeResolvers["journeyTimePerServiceStats"] =
  async (parent, _, context): Promise<CorridorStatsPerServiceType[]> => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    const journeyStats = new Map<string, CorridorJourneyServiceStatsType>();
    const stats: CorridorStatsPerServiceType[] = [];
    [...data.journeys.values()].map((journeys) => {
      journeys.sort((a, b) => a.stop_index - b.stop_index);
      const firstDeparture = journeys[0];

      const firstStopDeparture = getJourneyDeparture(
        journeys[0],
        data.inputs.matchType,
      );
      const lastDeparture = getJourneyDeparture(
        journeys[journeys.length - 1],
        data.inputs.matchType,
      );
      // noc_line_and_servicecode
      const service = `${firstDeparture.operator_noc}-${firstDeparture.line_name}-${firstDeparture.service_code}`;
      const journeyTime = journeyStats.get(service) || {
        totalJourneyTime: 0,
        recordedTransits: 0,
        scheduledTransits: 0,
        lineName: firstDeparture.line_name,
        operatorNoc: firstDeparture.operator_noc,
        serviceCode: firstDeparture.service_code,
      };
      journeyTime.scheduledTransits += 1;
      if (firstStopDeparture && lastDeparture) {
        journeyTime.totalJourneyTime +=
          (lastDeparture.getTime() - firstStopDeparture.getTime()) / 1000;
        journeyTime.recordedTransits += 1;
      }
      journeyStats.set(service, journeyTime);
    });

    if (journeyStats.size > 0) {
      const services = await context.db.service_details.findMany({
        where: {
          noc_and_line_and_servicecode: {
            in: [...journeyStats.keys()],
          },
        },
        include: {
          operator: true,
        },
      });

      journeyStats.forEach((journey, key) => {
        const serviceDetails = services.find(
          (service) => service.noc_and_line_and_servicecode === key,
        );
        stats.push({
          lineName: serviceDetails?.line_name ?? "",
          operatorName: serviceDetails?.operator?.name ?? "NA",
          noc: serviceDetails?.operator_noc,
          servicePatternName: serviceDetails?.service_name ?? "",
          recordedTransits: journey.recordedTransits,
          totalJourneyTime: journey.totalJourneyTime,
          scheduledTransits: journey.scheduledTransits,
        });
      });
    }

    return stats;
  };

export const getJourneyStatsHistogram: CorridorStatsTypeResolvers["journeyTimeHistogram"] =
  (parent): CorridorStatsHistogramType[] => {
    // Data was cached in the output of getStats, and will be removed later
    const data = parent as StatsCache;
    const journeyStats = new Map<string, number>();

    [...data.journeys.values()].map((journeys) => {
      journeys.sort((a, b) => a.stop_index - b.stop_index);

      const firstStopDeparture = getJourneyDeparture(
        journeys[0],
        data.inputs.matchType,
      );
      const lastDeparture = getJourneyDeparture(
        journeys[journeys.length - 1],
        data.inputs.matchType,
      );
      if (firstStopDeparture && lastDeparture) {
        const totalJourneyTime = Math.floor(
          (lastDeparture.getTime() - firstStopDeparture.getTime()) /
            (1000 * 60),
        );

        journeyStats.set(
          totalJourneyTime.toString(),
          (journeyStats.get(totalJourneyTime.toString()) || 0) + 1,
        );
      }
    });

    return [
      {
        ts: null,
        hist: Array.from(journeyStats, ([key, value]) => ({
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

    const serviceLinks: ServiceLinkType[] = await listServiceLinks(
      results,
      context.kysely,
    );

    return serviceLinks.reverse();
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
    journeyTimeStats: getJourneyTimeStats,
    journeyTimeTimeOfDayStats: getJourneyTimeOfDayStats,
    journeyTimeDayOfWeekStats: getJourneyDayOfWeekStats,
    journeyTimeHistogram: getJourneyStatsHistogram,
    journeyTimePerServiceStats: getJourneyStatsPerService,
    serviceLinks: getServiceLinks,
  },
  Mutation: {
    createCorridor: createCorridor,
    updateCorridor: updateCorridor,
    deleteCorridor: deleteCorridor,
  },
};

export default corridorResovlers;
