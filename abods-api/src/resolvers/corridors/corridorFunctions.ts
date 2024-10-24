import { Prisma, Timetable } from '@prisma/client';
import { Context } from '../../context';
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
} from '../../lib/corridor.js';
import {
  AddFirstStopInputType,
  CorridorJourneyTimeStatsType,
  CorridorStatsDayOfWeekType,
  CorridorStatsHistogramType,
  CorridorStatsInputType,
  CorridorStatsPerServiceType,
  CorridorStatsTimeOfDayType,
  CorridorSummaryStatsType,
  CorridorType,
  CorridorUpdateInputType,
  CorridorInputType,
  InputMaybe,
  Maybe,
  MutationResponseType,
  ServiceLinkType,
  StopType
} from '../../types/generated.js';
import { SessionUser } from "../../types/extra.js";
import {
  getDate,
  getDayFormattedDate,
  getHourFormattedDate,
} from '../../lib/dayjs.js';
import { getPercentile } from '../../lib/utils.js';
import haversineDistance from 'haversine-distance';

export const listCorridors = async (
  sessionUser: SessionUser,
  db: Context,
): Promise<CorridorType[]> => {
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }

  const results: CorridorResultsType[] = await getCorridorList(db, sessionUser);

  return returnCorridorType(results);
};

export const getCorridors = async (
  corridorId: Number,
  sessionUser: SessionUser,
  db: Context,
): Promise<CorridorType | undefined> => {
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }
  const corridor: CorridorResultsType | null = await getCorridor(
    corridorId,
    db,
    sessionUser
  );
  return corridor ? returnCorridor(corridor) : undefined;
};

export const getStops = async (
  inputs: Maybe<AddFirstStopInputType> | undefined,
  sessionUser: SessionUser,
  db: Context,
): Promise<StopType[]> => {
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }

  if(!inputs) {
    throw 'Invalid inputs'
  }
  const { boundingBox, searchString } = inputs;

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

  const adminAreas = await getOrgAdminAreas(db, sessionUser);

  where.admin_area_id = {
    in: adminAreas.map((admin) => admin.adminarea_id),
  };

  const results = await db.prisma.naptan_stoppoint_latlong.findMany({
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

export const getSubsequentStops = async (
  stopList: InputMaybe<Array<InputMaybe<string>>>|undefined,
  sessionUser: SessionUser,
  db: Context,
): Promise<StopType[]> => {
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }

  if (!stopList) throw "Bad Request"

  stopList.push('') // Push blank to add comma at the end
  let stopsPattern = stopList.join(',')
  const [routes, adminAreas] = await Promise.all([
    distinctRoutes(db, stopsPattern),
    getOrgAdminAreas(db, sessionUser),
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
    const stops = await db.prisma.naptan_stoppoint_latlong.findMany({
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

export const createCorridor = async (
  payload: InputMaybe<CorridorInputType> | undefined,
  sessionUser: SessionUser,
  db: Context,
): Promise<MutationResponseType> => {
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }
  if (!payload || !payload.name|| !payload.stopIds) throw "Bad Request"

  const corridor = await db.prisma.corridor.create({
    data: {
      corridor_name: payload.name,
      organisation_id: sessionUser.userOrganisationIDs?.[0] ?? 0,
      user_id: sessionUser.user?.id ?? 0,
    },
    select: {
      corridor_id: true,
    },
  });

  await insertCorridorStops(
    corridor.corridor_id,
    payload.stopIds.map(String),
    db,
    sessionUser
  );

  return {
    success: true,
  };
};

export const insertCorridorStops = async (
  corridor_id: Number,
  stopIds: string[],
  db: Context,
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
  const stops = await db.prisma.naptan_stoppoint_latlong.findMany({
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

  await db.prisma.corridor_stops.createMany({
    data: records,
  });
};

export const deleteCorridor = async (
  corridorId: Number,
  sessionUser: SessionUser,
  db: Context,
): Promise<MutationResponseType> => {
  if (
    !sessionUser.user ||
    !isCorridorMappedToUserOrg(Number(corridorId), sessionUser, db)
  ) {
    throw 'Not Authorized';
  }

  await Promise.all([
    deleteCorridorDb(corridorId, db),
    deleteCorridorStops(corridorId, db),
  ]);

  return {
    success: true,
  };
};

export const updateCorridor = async (
  inputs: CorridorUpdateInputType,
  sessionUser: SessionUser,
  db: Context,
): Promise<MutationResponseType> => {
  if (
    !sessionUser.user ||
    !isCorridorMappedToUserOrg(Number(inputs.id), sessionUser, db)
  ) {
    throw 'Not Authorized';
  }

  if (!inputs || !inputs.id || !inputs.name || !inputs.stopList) throw "Bad Request"

  await Promise.all([
    updateCorridorDb(inputs.id, inputs.name, db),
    deleteCorridorStops(inputs.id, db),
  ]);

  await insertCorridorStops(
    inputs.id,
    inputs.stopList.map(String),
    db,
    sessionUser
  );

  return {
    success: true,
  };
};

export const getStats = async (
  inputs: CorridorStatsInputType,
  sessionUser: SessionUser,
  db: Context,
) => {

  const { corridorId, fromTimestamp, granularity, stopList, toTimestamp } =
    inputs;

  if (
    !sessionUser.user ||
    !isCorridorMappedToUserOrg(Number(corridorId), sessionUser, db)
  ) {
    throw 'Not Authorized';
  }

  let results: Timetable[] = await db.prisma.timetable.findMany({
    where: {
      stop_id: {
        in: stopList?.map(Number),
      },
      date_of_journey: {
        gt: fromTimestamp,
        lte: toTimestamp,
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

  return {
    inputs,
    journeys,
  };
};

export const getSummaryStats = (
  inputs: CorridorStatsInputType,
  journeys: Map<string, Timetable[]>,
  sessionUser: SessionUser,
  db: Context,
): CorridorSummaryStatsType => {
  const scheduledTransits = journeys.size;
  let totalTransits = 0;
  let totalJourneyTime = 0;
  const services = new Set();
  const _ = [...journeys.values()].map((journeys) => {
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

export const getJourneyStatsByDay = (
  journeys: Map<string, Timetable[]>,
): (
  | CorridorJourneyTimeStatsType
  | CorridorStatsTimeOfDayType
  | CorridorStatsDayOfWeekType
)[] => {
  return getJourneyStats(journeys, CorridorJourneyStatsOption.day);
};

export const getJourneyStatsByHour = (
  journeys: Map<string, Timetable[]>,
): (
  | CorridorJourneyTimeStatsType
  | CorridorStatsTimeOfDayType
  | CorridorStatsDayOfWeekType
)[] => {
  return getJourneyStats(journeys, CorridorJourneyStatsOption.hour);
};

export const getJourneyStats = (
  journeys: Map<string, Timetable[]>,
  inputType: CorridorJourneyStatsOption,
): (
  | CorridorJourneyTimeStatsType
  | CorridorStatsTimeOfDayType
  | CorridorStatsDayOfWeekType
)[] => {
  const journeyStats = new Map<string, number[]>();
  const _ = [...journeys.values()].map((journeys) => {
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
    | CorridorJourneyTimeStatsType
    | CorridorStatsTimeOfDayType
    | CorridorStatsDayOfWeekType
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

export const getJourneyStatsPerService = async (
  journeys: Map<string, Timetable[]>,
  db: Context
): Promise<CorridorStatsPerServiceType[]> => {
  const journeyStats = new Map<string, CorridorJourneyServiceStatsType>();
  const stats: CorridorStatsPerServiceType[] = [];
  const _ = [...journeys.values()].map((journeys) => {
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
    const services = await db.prisma.service_details.findMany({
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

export const getJourneyStatsHistogram = (
  journeys: Map<string, Timetable[]>,
): CorridorStatsHistogramType[] => {
  const journeyStats = new Map<string, number>();

  const _ = [...journeys.values()].map((journeys) => {
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

export const getServiceLinks = async (
  inputs: CorridorStatsInputType,
  db: Context,
): Promise<ServiceLinkType[]> => {
  const { corridorId } = inputs;

  const results = await db.prisma.corridor_stops.findMany({
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
