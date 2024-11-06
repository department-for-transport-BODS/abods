import { Prisma, PrismaClient, Timetable } from '@prisma/client';
import {
  CorridorJourneyServiceStatsType,
  CorridorJourneyStatsOption,
  CorridorResultsType,
  deleteCorridorDb,
  deleteCorridorStops,
  distinctRoutes,
  filteredJourneys,
  getCorridor,
  getCorridorList,
  getOrgAdminAreas,
  isCorridorMappedToUserOrg,
  returnCorridor,
  returnCorridorType,
  updateCorridorDb,
} from '../lib/corridor.js';
import {
  CorridorJourneyTimeStatsType,
  CorridorStatsDayOfWeekType,
  CorridorStatsInputType,
  CorridorStatsPerServiceType,
  CorridorStatsTimeOfDayType,
  InputMaybe,
  ServiceLinkType,
  Resolvers,
  CorridorStatsType,
  MutationResolvers,
  CorridorNamespaceResolvers,
  CorridorStatsTypeResolvers
} from '../types/generated.js';
import {
  getDate,
  getDayFormattedDate,
  getHourFormattedDate,
  utcToBstDBInput,
} from '../lib/dayjs.js';
import { getPercentile } from '../lib/utils.js';
import haversineDistance from 'haversine-distance';
import { emptyResolver, requireUserSession } from './helpers.js';
import { SessionUser } from '../types/extra.js';

export const listCorridors: CorridorNamespaceResolvers['corridorList'] = async (_, __, context) => {
  const user = await requireUserSession(context)

  const results: CorridorResultsType[] = await getCorridorList(context.db, user);

  return returnCorridorType(results);
};

export const getCorridors: CorridorNamespaceResolvers['getCorridor'] = async (_, args, context) => {
  const user = await requireUserSession(context)
  const corridor: CorridorResultsType | null = await getCorridor(
    args.corridorId,
    context.db,
    user
  );
  return corridor ? returnCorridor(corridor) : null;
};

export const getStops: CorridorNamespaceResolvers['addFirstStop'] = async (_, args, context) => {
  const user = await requireUserSession(context)

  if(!args.inputs) {
    throw 'Invalid inputs'
  }
  const { boundingBox, searchString } = args.inputs;

  const where: Prisma.naptan_stoppoint_latlongWhereInput = {}

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
          mode: 'insensitive'
        },
      },
    ];
  } else {
    where.latitude = {
      gte: Number(boundingBox?.minLatitude),
      lte: Number(boundingBox?.maxLatitude),
    };

    where.longitude = {
      gte: Number(boundingBox?.minLongitude),
      lte: Number(boundingBox?.maxLongitude),
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
    sourceId: stop.atco_code
  }));
};

export const getSubsequentStops: CorridorNamespaceResolvers['addSubsequentStops'] = async (_, args, context) => {
  const user = await requireUserSession(context)

  let stopList = args.stopList || []

  stopList.push('') // Push blank to add comma at the end
  let stopsPattern = stopList.join(',')
  const [routes, adminAreas] = await Promise.all([
    distinctRoutes(context.db, stopsPattern),
    getOrgAdminAreas(context.db, user),
  ]);

  stopList = []
  routes.map((data) => {
    const stopIndex = data.route.indexOf(stopsPattern)
    let matchStopPattern = stopsPattern 
    if(stopIndex > 0){
      matchStopPattern = `,${matchStopPattern}`
    }
    const matches = data.route.match(matchStopPattern.concat('(.*)'));
    if (matches && matches[1]) {
      const commaIndex = matches[1].indexOf(',');
      const nextStop =
        commaIndex !== -1 ? matches[1].substring(0, commaIndex) : matches[1];
      
      if (!stopList.includes(nextStop)) {
        stopList.push(nextStop);
      }
    }
  });

  if (stopList.length > 0) {
    const stops = await context.db.naptan_stoppoint_latlong.findMany({
      where: {
        id: {
          in: stopList.map(Number)
        },
        admin_area_id: {
          in: adminAreas.map(admin => admin.adminarea_id)
        }
      },
      include: {
        locality: true
      }
    })
  
    return stops.map((stop) => ({
      adminAreaId: stop.admin_area_id.toString(),
      adminAreaName: '',
      stopId: stop.id.toString(),
      stopName: stop.common_name,
      lon: Number(stop.longitude),
      lat: Number(stop.latitude),
      localityName: stop.locality.name,
      localityId: stop.locality_id,
      sourceId: stop.atco_code,
    }))
  }
  
  return []
}

export const createCorridor: MutationResolvers['createCorridor'] = async (_, args, context) => {
  const user = await requireUserSession(context)
  if (!args.payload || !args.payload.name|| !args.payload.stopIds) throw "Bad Request"

  const corridor = await context.db.corridor.create({
    data: {
      corridor_name: args.payload.name,
      organisation_id: user.orgIds[0] ?? 0,
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
    user
  );

  return {
    success: true,
  };
};

const insertCorridorStops = async (
  corridor_id: Number,
  stopIds: string[],
  db: PrismaClient,
  sessionUser: SessionUser
) => {
  const numberStopsList = stopIds.map(Number);

  const records: {
    corridor_id: number;
    corridor_index: number;
    stop_id: number;
    route_to_next_stop: string;
    distance_to_next_stop: number;
  }[] = [];

  const adminAreas = await getOrgAdminAreas(db, sessionUser);
  const stops = await db.naptan_stoppoint_latlong.findMany({
    where: {
      id: {
        in: numberStopsList,
      },
      admin_area_id: {
        in: adminAreas.map((admin) => admin.adminarea_id)
      }
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
      route_to_next_stop:
        index < stops.length - 1
          ? JSON.stringify([
              [Number(stop.longitude), Number(stop.latitude)],
              [
                Number(stops[index + 1].longitude),
                Number(stops[index + 1].latitude),
              ],
            ])
          : '',
      distance_to_next_stop: index < stops.length - 1 ? haversineDistance(
        [Number(stop.longitude), Number(stop.latitude)],
        [Number(stops[index + 1].longitude), Number(stops[index + 1].latitude)],
      ): 0,
    });
  });

  await db.corridor_stops.createMany({
    data: records,
  });
};

export const deleteCorridor: MutationResolvers['deleteCorridor'] = async (_, args, context) => {
  const user = await requireUserSession(context)
  if (
    !await isCorridorMappedToUserOrg(Number(args.corridorId), user, context.db)
  ) {
    throw 'Not Authorized';
  }

  if (!args.corridorId) throw 'Bad Request'

  await Promise.all([
    deleteCorridorDb(args.corridorId, context.db),
    deleteCorridorStops(args.corridorId, context.db),
  ]);

  return {
    success: true,
  };
};

export const updateCorridor: MutationResolvers['updateCorridor'] = async (_, args, context) => {
  if (!args.inputs) throw 'Bad Request'
  const user = await requireUserSession(context)
  if (
    !await isCorridorMappedToUserOrg(Number(args.inputs.id), user, context.db)
  ) {
    throw 'Not Authorized';
  }

  if (!args.inputs.id || !args.inputs.name || !args.inputs.stopList) throw "Bad Request"

  await Promise.all([
    updateCorridorDb(args.inputs.id, args.inputs.name, context.db),
    deleteCorridorStops(args.inputs.id, context.db),
  ]);

  await insertCorridorStops(
    args.inputs.id,
    args.inputs.stopList.map(String),
    context.db,
    user
  );

  return {
    success: true,
  };
};

type StatsCache = {inputs: InputMaybe<CorridorStatsInputType> | undefined, journeys:Map<string, Timetable[]>}

export const getStats: CorridorNamespaceResolvers['stats'] = async (_, args, context) => {

  const { corridorId, fromTimestamp, granularity, stopList, toTimestamp } =
    args.inputs || {};
  const user = await requireUserSession(context)

  if (
    !await isCorridorMappedToUserOrg(Number(corridorId), user, context.db)
  ) {
    throw 'Not Authorized';
  }

  let results: Timetable[] = await context.db.timetable.findMany({
    where: {
      stop_id: {
        in: stopList?.map(Number),
      },
      date_of_journey: {
        gte: utcToBstDBInput(fromTimestamp),
        lt: utcToBstDBInput(toTimestamp),
      },
    },
    include: {
      expected_journeys: true,
    },
  });

  const journeyMap: Map<string, Timetable[]> = new Map();
  let mapKey = '';
  let existingJourneys: Timetable[] = [];
  results.map((journey) => {
    mapKey = `${journey.group_id}${journey.vehiclejourney_id}`;
    existingJourneys = journeyMap.get(mapKey) || [];
    existingJourneys.push(journey);
    journeyMap.set(mapKey, existingJourneys);
  });

  const journeys = filteredJourneys(stopList?.length ?? 0, journeyMap);

  // Not actually returning this type, but intended to stash this data we get for the next resolvers in the chain
  return { inputs: args.inputs, journeys } as CorridorStatsType;
};

export const getSummaryStats: CorridorStatsTypeResolvers['summaryStats'] = (parent) => {
  // Data was cached in the output of getStats, and will be removed later
  const data = parent as StatsCache;
  const scheduledTransits = data.journeys.size;
  let totalTransits = 0;
  let totalJourneyTime = 0;
  const services = new Set();
  [...data.journeys.values()].map((journeys) => {
    journeys.sort((a, b) => a.stop_index - b.stop_index);
    const firstStopOfCorridor = journeys[0].actual_departure_time;
    const lastStopOfCorridor =
      journeys[journeys.length - 1].actual_departure_time;
    if (firstStopOfCorridor && lastStopOfCorridor) {
      totalTransits += 1;
      totalJourneyTime +=
        (lastStopOfCorridor.getTime() - firstStopOfCorridor.getTime()) / 1000; //In seconds
    }

    const serviceCode = `${journeys[0].operator_noc}${journeys[0].service_code}${journeys[0].line_name}`;
    if (!services.has(serviceCode)) {
      services.add(serviceCode);
    }
  });

  const averageJourneyTime = Math.ceil(totalJourneyTime / totalTransits);

  return {
    totalTransits: totalTransits,
    numberOfServices: services.size,
    averageJourneyTime: isNaN(averageJourneyTime) ? 0 : averageJourneyTime,
    scheduledTransits: scheduledTransits,
  };
};

export const getJourneyTimeOfDayStats: CorridorStatsTypeResolvers['journeyTimeTimeOfDayStats'] = (parent)=>{
  // Data was cached in the output of getStats, and will be removed later
  const data = parent as StatsCache;
  return getJourneyStats(data.journeys, CorridorJourneyStatsOption.hourAsNumber)
}

export const getJourneyDayOfWeekStats: CorridorStatsTypeResolvers['journeyTimeDayOfWeekStats'] = (parent)=>{
  // Data was cached in the output of getStats, and will be removed later
  const data = parent as StatsCache;
  return getJourneyStats(data.journeys, CorridorJourneyStatsOption.dayOfWeek)
}

export const getJourneyTimeStats: CorridorStatsTypeResolvers['journeyTimeStats'] = (parent)=>{
  // Data was cached in the output of getStats, and will be removed later
  const data = parent as StatsCache;
  return (data.inputs || {}).granularity === 'day'
    ? getJourneyStats(data.journeys, CorridorJourneyStatsOption.day)
    : getJourneyStats(data.journeys, CorridorJourneyStatsOption.hour);
}

const getJourneyStats = (
  journeys: Map<string, Timetable[]>,
  inputType: CorridorJourneyStatsOption,
) => {
  const journeyStats = new Map<string, number[]>();
  [...journeys.values()].map((journeys) => {
    journeys.sort((a, b) => a.stop_index - b.stop_index);

    const firstStopOfCorridor = journeys[0];
    const lastStopOfCorridor = journeys[journeys.length - 1];

    if (
      firstStopOfCorridor.actual_departure_time &&
      lastStopOfCorridor.actual_departure_time
    ) {
      let dateKey: string = '';
      switch (inputType) {
        case CorridorJourneyStatsOption.day:
          dateKey = getDayFormattedDate(firstStopOfCorridor.date_of_journey);
          break;

        case CorridorJourneyStatsOption.dayOfWeek:
          dateKey = getDate(firstStopOfCorridor.date_of_journey)
            .day()
            .toString();
          break;

        case CorridorJourneyStatsOption.hour:
          dateKey = getHourFormattedDate(
            firstStopOfCorridor.expected_departure_time,
          );
          break;

        case CorridorJourneyStatsOption.hourAsNumber:
          dateKey = getDate(firstStopOfCorridor.expected_departure_time)
            .tz('Europe/London')
            .hour()
            .toString();
          break;

        default:
          throw new Error('Invalid journey indicator type provided');
      }

      const journeyTime = journeyStats.get(dateKey) || [];
      journeyTime.push(
        (lastStopOfCorridor.actual_departure_time.getTime() -
          firstStopOfCorridor.actual_departure_time.getTime()) /
          1000,
      );
      journeyStats.set(dateKey, journeyTime);
    }
  });

  const stats: (
    & CorridorJourneyTimeStatsType
    & CorridorStatsTimeOfDayType
    & CorridorStatsDayOfWeekType
  )[] = [];
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

export const getJourneyStatsPerService: CorridorStatsTypeResolvers['journeyTimePerServiceStats'] = async (parent, _, context): Promise<CorridorStatsPerServiceType[]> => {
  // Data was cached in the output of getStats, and will be removed later
  const data = parent as StatsCache;
  const journeyStats = new Map<string, CorridorJourneyServiceStatsType>();
  const stats: CorridorStatsPerServiceType[] = [];
  [...data.journeys.values()].map((journeys) => {
    journeys.sort((a, b) => a.stop_index - b.stop_index);
    const firstStopOfCorridor = journeys[0];
    const lastStopOfCorridor = journeys[journeys.length - 1];
    // noc_line_and_servicecode
    const service = `${firstStopOfCorridor.operator_noc}-${firstStopOfCorridor.line_name}-${firstStopOfCorridor.service_code}`;
    let journeyTime = journeyStats.get(service) || {
      totalJourneyTime: 0,
      recordedTransits: 0,
      scheduledTransits: 0,
      lineName: firstStopOfCorridor.line_name,
      operatorNoc: firstStopOfCorridor.operator_noc,
      serviceCode: firstStopOfCorridor.service_code,
    };
    journeyTime.scheduledTransits += 1;
    if (
      firstStopOfCorridor.actual_departure_time &&
      lastStopOfCorridor.actual_departure_time
    ) {
      journeyTime.totalJourneyTime +=
        (lastStopOfCorridor.actual_departure_time.getTime() -
          firstStopOfCorridor.actual_departure_time.getTime()) /
        1000;
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
        (service) => service.noc_and_line_and_servicecode === key
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

export const getJourneyStatsHistogram: CorridorStatsTypeResolvers['journeyTimeHistogram'] = (parent) => {
  // Data was cached in the output of getStats, and will be removed later
  const data = parent as StatsCache;
  const journeyStats = new Map<string, number>();

  [...data.journeys.values()].map((journeys) => {
    journeys.sort((a, b) => a.stop_index - b.stop_index);

    const firstStopOfCorridor = journeys[0];
    const lastStopOfCorridor = journeys[journeys.length - 1];
    if (
      firstStopOfCorridor.actual_departure_time &&
      lastStopOfCorridor.actual_departure_time
    ) {
      const totalJourneyTime = Math.floor(
        (lastStopOfCorridor.actual_departure_time.getTime() -
          firstStopOfCorridor.actual_departure_time.getTime()) /
          ( 1000 * 60 ),
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

export const getServiceLinks: CorridorStatsTypeResolvers['serviceLinks'] = async (parent, _, context) => {
  // Data was cached in the output of getStats, and will be removed later
  const data = parent as StatsCache;
  const { corridorId } = data.inputs || {};

  const results = await context.db.corridor_stops.findMany({
    where: {
      corridor_id: Number(corridorId),
    },
  });

  const serviceLinks: ServiceLinkType[] = [];

  results.forEach((stop, index) => {
    if (index < results.length - 1) {
      serviceLinks.push({
        fromStop: stop.stop_id.toString(),
        toStop: results[index + 1].stop_id.toString(),
        distance: stop.distance_to_next_stop,
        routeValidity: 'INVALID',
        linkRoute: stop.route_to_next_stop,
      });
    }
  });

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
