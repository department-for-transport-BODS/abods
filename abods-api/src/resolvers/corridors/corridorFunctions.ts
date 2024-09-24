import { Timetable } from '@prisma/client';
import { Context } from '../../context';
import {
  CorridorJourneyServiceStatsType,
  CorridorJourneyStatsOption,
  CorridorResultsType,
  deleteCorridorDb,
  deleteCorridorPatterns,
  deleteCorridorStops,
  filteredJourneys,
  getCorridor,
  getCorridorList,
  returnCorridor,
  returnCorridorType,
  updateCorridorDb,
} from '../../lib/corridor.js';
import {
  AddFirstStopInputType,
  CorridorHistogramType,
  CorridorInputType,
  CorridorJourneyTimeStatsType,
  CorridorStatsDayOfWeekType,
  CorridorStatsHistogramType,
  CorridorStatsInputType,
  CorridorStatsPerServiceType,
  CorridorStatsTimeOfDayType,
  CorridorSummaryStatsType,
  CorridorType,
  CorridorUpdateInputType,
  Maybe,
  MutationResponseType,
  ServiceLinkType,
  SessionUser,
  StopType,
} from '../../types';
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

  const results = await db.prisma.naptan_stoppoint_latlong.findMany({
    where: {
      latitude: {
        gte: Number(inputs?.boundingBox?.minLatitude),
        lte: Number(inputs?.boundingBox?.maxLatitude),
      },
      longitude: {
        gte: inputs?.boundingBox?.minLongitude,
        lte: inputs?.boundingBox?.maxLongitude,
      },
    },
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
  }));
};

export const getSubsequentStops = async (
  stopList: Array<Maybe<string>>,
  sessionUser: SessionUser,
  db: Context,
): Promise<StopType[]> => {
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }

  const results = await db.prisma.transmodel_vehiclejourney.findMany({
    where: {
      stops: {
        some: {
          naptan_stop_id: {
            in: stopList.map(Number),
          },
        },
      },
    },
    include: {
      stops: {
        orderBy: {
          sequence_number: 'asc',
        },
        include: {
          naptan_stop: {
            include: {
              locality: true,
            },
          },
        },
      },
    },
  });

  const returnStops: StopType[] = [];
  const stopsSet = new Set();
  const patternId = new Set();

  const numberStopsList = stopList.map(Number);
  results.map((journey) => {
    const stops = journey.stops.map((stop) => stop.naptan_stop_id);
    if (
      !patternId.has(journey.service_pattern_id) &&
      (stopList.length === 1 ||
        numberStopsList.every((stop) => stop && stops.includes(Number(stop))))
    ) {
      patternId.add(journey.service_pattern_id);
      const lastStopInList = numberStopsList[numberStopsList.length - 1];
      const stopIndex = stops.indexOf(lastStopInList);
      if (stopIndex < stops.length - 1) {
        const nextStop = journey.stops.find(
          (stop) => stop.naptan_stop.id === stops[stopIndex + 1],
        );
        if (!stopsSet.has(nextStop?.atco_code)) {
          stopsSet.add(nextStop?.atco_code);
          returnStops.push({
            adminAreaId:
              nextStop?.naptan_stop.locality.admin_area_id.toString(),
            adminAreaName: '',
            stopId: nextStop?.naptan_stop.id.toString() ?? '',
            stopName: nextStop?.txc_common_name ?? '',
            lon: Number(nextStop?.naptan_stop.longitude),
            lat: Number(nextStop?.naptan_stop.latitude),
            localityName: nextStop?.naptan_stop.locality.name ?? '',
            localityId: '',
            sourceId: '',
          });
        }
      }
    }
  });

  return returnStops;
};

export const createCorridor = async (
  payload: CorridorInputType,
  sessionUser: SessionUser,
  db: Context,
): Promise<MutationResponseType> => {
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }

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

  await Promise.all([
    insertCorridorServicePatterns(
      corridor.corridor_id,
      payload.stopIds.map(String),
      db,
    ),
    insertCorridorStops(corridor.corridor_id, payload.stopIds.map(String), db),
  ]);

  return {
    success: true,
  };
};

export const insertCorridorServicePatterns = async (
  corridor_id: Number,
  stopIds: string[],
  db: Context,
) => {
  const journeys = await db.prisma.transmodel_vehiclejourney.findMany({
    where: {
      stops: {
        some: {
          naptan_stop_id: {
            in: stopIds.map(Number), // Subset of stops to filter journeys
          },
        },
      },
    },
    include: {
      stops: true,
    },
  });

  const patternId = new Set();

  const numberStopsList = stopIds.map(Number);
  const records: {
    service_pattern_id: number;
    corridor_id: number;
  }[] = [];
  journeys.map((journey) => {
    const stops = journey.stops.map((stop) => stop.naptan_stop_id);
    if (
      !patternId.has(journey.service_pattern_id) &&
      numberStopsList.every((stop) => stop && stops.includes(Number(stop)))
    ) {
      patternId.add(journey.service_pattern_id);
      records.push({
        service_pattern_id: journey.service_pattern_id,
        corridor_id: Number(corridor_id),
      });
    }
  });

  await db.prisma.corridor_servicepatterns.createMany({
    data: records,
  });
};

export const insertCorridorStops = async (
  corridor_id: Number,
  stopIds: string[],
  db: Context,
) => {
  const numberStopsList = stopIds.map(Number);

  const records: {
    corridor_id: number;
    corridor_index: number;
    stop_id: number;
    route_to_next_stop: string;
    distance_to_next_stop: number;
  }[] = [];

  const stops = await db.prisma.naptan_stoppoint_latlong.findMany({
    where: {
      id: {
        in: numberStopsList,
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
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }

  await Promise.all([
    deleteCorridorDb(corridorId, db),
    deleteCorridorStops(corridorId, db),
    deleteCorridorPatterns(corridorId, db),
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
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }

  await Promise.all([
    updateCorridorDb(inputs.id, inputs.name, db),
    deleteCorridorStops(inputs.id, db),
    deleteCorridorPatterns(inputs.id, db),
  ]);

  await Promise.all([
    insertCorridorServicePatterns(inputs.id, inputs.stopList.map(String), db),
    insertCorridorStops(inputs.id, inputs.stopList.map(String), db),
  ]);

  return {
    success: true,
  };
};

export const getStats = async (
  inputs: CorridorStatsInputType,
  sessionUser: SessionUser,
  db: Context,
) => {
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }

  const { corridorId, fromTimestamp, granularity, stopList, toTimestamp } =
    inputs;

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
    averageJourneyTime: averageJourneyTime,
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
  db: Context,
): Promise<CorridorStatsPerServiceType[]> => {
  const journeyStats = new Map<string, CorridorJourneyServiceStatsType>();
  const _ = [...journeys.values()].map((journeys) => {
    journeys.sort((a, b) => a.stop_index - b.stop_index);

    const firstStopOfCorridor = journeys[0];
    const lastStopOfCorridor = journeys[journeys.length - 1];

    // noc_line_and_servicecode
    const service = `${firstStopOfCorridor.operator_noc}-${firstStopOfCorridor.line_name}-${firstStopOfCorridor.service_code}`;
    let journeyTime: CorridorJourneyServiceStatsType = journeyStats.get(
      service,
    ) || {
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

  const stats: CorridorStatsPerServiceType[] = [];
  journeyStats.forEach((journey, key) => {
    const serviceDetails = services.find(
      (service) => service.noc_and_line_and_servicecode === key,
    );
    stats.push({
      lineName: serviceDetails?.line_name ?? '',
      operatorName: serviceDetails?.operator.name,
      noc: serviceDetails?.operator_noc,
      servicePatternName: serviceDetails?.service_name ?? '',
      recordedTransits: journey.recordedTransits,
      totalJourneyTime: journey.totalJourneyTime,
      scheduledTransits: journey.scheduledTransits,
    });
  });

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
          1000,
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
