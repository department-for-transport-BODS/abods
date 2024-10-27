import { Dayjs } from 'dayjs';
import { Context } from '../../context';
import { getDate, getFormattedDate } from '../../lib/dayjs.js';
import logger from '../../logger.js';
import {
  OtpEnum,
  UniqueJourneyType,
  VehicleReplayInputType,
  Maybe,
  GpsFeedType,
  ServicePatternType,
  StopType,
  VehicleJourneyType,
  TimingPatternDetailType,
  GpsFeedJourneyStatus,
  QueryResolvers
} from '../../types/generated.js';
import { SessionUser } from '../../types/extra';

export const findJourneys = async (
  inputs: VehicleReplayInputType,
  sessionUser: SessionUser,
  db: Context,
): Promise<UniqueJourneyType[]> => {
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }
  const lineIds = inputs.filters?.lineIds;

  let journeysData: UniqueJourneyType[] = [];
  if (lineIds && lineIds.length > 0 && lineIds[0]) {
    const currentTime = getDate();
    const toTimestamp = getDate(inputs.toTimestamp).subtract(4, 'hour');
    let journeys = await db.prisma.expected_journeys.findMany({
      where: {
        noc_and_line_and_servicecode: lineIds[0],
        date_of_journey: toTimestamp.toDate(),
      },
      include: {
        expected_service: {
          select: {
            line_name: true,
          },
        },
      },
    });

    let inputDate: Dayjs;
    if (toTimestamp.isSame(currentTime, 'day')) {
      journeys = journeys.filter((journey) => {
        const parsedTime = getDate(journey.expected_journey_start);
        return parsedTime.isBefore(currentTime, 'second');
      });
    }

    journeysData = journeys.map((journey) => {
      const formattedDate = getFormattedDate(journey.expected_journey_start);

      const jsDate = getDate(journey.expected_journey_start);

      const journeyDescription: string = journey.journey_pattern_description;
      return {
        vehicleJourneyId: journey.group_id,
        startTime: formattedDate.toString(),
        serviceInfo: {
          serviceName: journeyDescription,
          serviceNumber: journey.expected_service.line_name,
          serviceId: journey.group_id,
        },
      };
    });
  }

  return journeysData;
};

export const getJourneyInputs = (journeyId: string, journeyDate: Date) => ({
  latitude: true,
  longitude: true,
  vehicle_ref: true,
  recorded_at_time: true,
  Timetable: {
    select: {
      date_of_journey: true,
      common_name: true,
      atco_code: true,
      stop_index: true,
      expected_departure_time: true,
      is_timing_point: true,
      vehiclejourney_id: true,
      time_difference: true,
      expected_journeys: {
        select: {
          expected_journey_start: true,
          expected_service: {
            select: {
              noc_and_line_and_servicecode: true,
              service_name: true,
              line_name: true,
              expected_operator: {
                select: {
                  operator_noc: true,
                  operator_name: true,
                },
              },
            },
          },
        },
      },
    },
    where: {
      group_id: journeyId,
      date_of_journey: journeyDate,
    },
  },
});

export const getTimetableJourney = async (
  journeyId: string,
  journeyDate: Date,
  db: Context,
): Promise<Array<Maybe<GpsFeedType>>> => {
  const journeys = await db.prisma.timetable.findMany({
    where: {
      date_of_journey: journeyDate,
      group_id: journeyId,
    },
    select: {
      date_of_journey: true,
      common_name: true,
      atco_code: true,
      stop_index: true,
      expected_departure_time: true,
      is_timing_point: true,
      vehiclejourney_id: true,
      time_difference: true,
      stop_latitude: true,
      stop_longitude: true,
      expected_journeys: {
        select: {
          expected_journey_start: true,
          expected_service: {
            select: {
              noc_and_line_and_servicecode: true,
              service_name: true,
              line_name: true,
              expected_operator: {
                select: {
                  operator_noc: true,
                  operator_name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return journeys
    .sort((a, b) => a.stop_index - b.stop_index)
    .map((journey) => {
      const startTime = getFormattedDate(
        journey.expected_journeys?.expected_journey_start,
      );

      const stopScheduledTime = getFormattedDate(
        journey.expected_departure_time,
      );

      return {
        ts: '',
        vehicleId: 'N/A',
        vehicleJourneyId: journeyId,
        servicePatternId: journey.vehiclejourney_id.toString(),
        isTimingPoint: journey.is_timing_point,
        delay: 0,
        actualDelay: 0,
        startTime: startTime.toString(),
        scheduledDeparture: stopScheduledTime.toString(),
        lat: Number(journey.stop_latitude),
        lon: Number(journey.stop_longitude),
        journeyStatus: GpsFeedJourneyStatus.Unknown,
        operatorInfo: {
          operatorId:
            journey.expected_journeys?.expected_service.expected_operator
              .operator_noc ?? '',
          operatorName:
            journey.expected_journeys?.expected_service.expected_operator
              .operator_name ?? '',
          nocCode:
            journey.expected_journeys?.expected_service.expected_operator
              .operator_noc ?? '',
        },
        serviceInfo: {
          serviceId:
            journey.expected_journeys?.expected_service
              .noc_and_line_and_servicecode ?? '',
          serviceNumber:
            journey.expected_journeys?.expected_service.line_name ?? '',
          serviceName:
            journey.expected_journeys?.expected_service.service_name ?? '',
        },
        previousStopInfo: {
          stopId: '',
          stopName: '',
          sourceId: '',
          stopLocality: {
            localityAreaId: '',
            localityAreaName: '',
            localityId: '',
            localityName: '',
          },
          stopLocation: {
            latitude: Number(journey.stop_latitude),
            longitude: Number(journey.stop_longitude),
          },
        },
      };
    });
};

export const getJourney = async (
  journeyId: string,
  startTime: Date,
  sessionUser: SessionUser,
  db: Context,
): Promise<Array<Maybe<GpsFeedType>>> => {
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }
  let journeyData: Array<Maybe<GpsFeedType>> = [];

  const journeyDate = new Date(startTime.toISOString().substring(0, 10));

  const journeys = await db.prisma.siriVMPositions.findMany({
    where: {
      date_of_journey: journeyDate,
      group_id: journeyId,
    },
    select: {
      ...getJourneyInputs(journeyId, journeyDate),
    },
  });

  let matchedStop = journeys.find((journey) => journey.Timetable?.stop_index);

  if (!matchedStop ) {
    return getTimetableJourney(journeyId, journeyDate, db);
  }

  const lastStopIndex = journeys.reduce((maxIndex, journey) => {
    if (
      journey.Timetable?.stop_index &&
      journey.Timetable?.stop_index > maxIndex
    ) {
      maxIndex = journey.Timetable?.stop_index;
    }
    return maxIndex;
  }, 0);


  const journeyCount = journeys.length;

  journeyData = journeys.map((journey, index) => {
    if (journey.Timetable?.stop_index) {
      matchedStop = journey;
    }

    const startTime = getFormattedDate(
      matchedStop?.Timetable?.expected_journeys?.expected_journey_start,
    );

    const timestamp = getFormattedDate(journey.recorded_at_time);

    const stopScheduledTime = getFormattedDate(
      matchedStop?.Timetable?.expected_departure_time,
    );

    const previousIndex = index === 0 ? 0 : index - 1;
    const delay = matchedStop?.Timetable?.time_difference ?? 0;
    return {
      ts: timestamp.toString(),
      vehicleId: journey.vehicle_ref,
      vehicleJourneyId: journeyId,
      servicePatternId: matchedStop?.Timetable?.vehiclejourney_id.toString(),
      isTimingPoint: journey.Timetable?.is_timing_point,
      delay:
        lastStopIndex === matchedStop?.Timetable?.stop_index && delay < 0
          ? 0
          : delay,
      actualDelay: delay,
      startTime: startTime.toString(),
      scheduledDeparture: stopScheduledTime.toString(),
      lat: Number(journey.latitude),
      lon: Number(journey.longitude),
      journeyStatus: matchedStop?.Timetable?.expected_departure_time
        ? index + 1 === journeyCount
          ? GpsFeedJourneyStatus.Completed
          : GpsFeedJourneyStatus.Started
        : GpsFeedJourneyStatus.Unknown,
      operatorInfo: {
        operatorId:
          matchedStop?.Timetable?.expected_journeys?.expected_service
            .expected_operator.operator_noc ?? '',
        operatorName:
          matchedStop?.Timetable?.expected_journeys?.expected_service
            .expected_operator.operator_name ?? '',
        nocCode:
          matchedStop?.Timetable?.expected_journeys?.expected_service
            .expected_operator.operator_noc ?? '',
      },
      serviceInfo: {
        serviceId:
          matchedStop?.Timetable?.expected_journeys?.expected_service
            .noc_and_line_and_servicecode ?? '',
        serviceNumber:
          matchedStop?.Timetable?.expected_journeys?.expected_service
            .line_name ?? '',
        serviceName:
          matchedStop?.Timetable?.expected_journeys?.expected_service
            .service_name ?? '',
      },
      previousStopInfo: {
        stopId: matchedStop?.Timetable?.atco_code?.toString() ?? '',
        stopName: matchedStop?.Timetable?.common_name ?? '',
        sourceId: '',
        stopLocality: {
          localityAreaId: '',
          localityAreaName: '',
          localityId: '',
          localityName: '',
        },
        stopLocation: {
          latitude: Number(journeys[previousIndex].latitude),
          longitude: Number(journeys[previousIndex].longitude),
        },
      },
    };
  });

  return journeyData;
};

export const servicePatternsInfo = async (
  vehicleJourneyId: string[],
  sessionUser: SessionUser,
  db: Context,
): Promise<Array<Maybe<ServicePatternType>>> => {
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }
  let servicePatterns: Array<Maybe<ServicePatternType>> = [];
  if (vehicleJourneyId && vehicleJourneyId.length > 0) {
    const vehicleJourney = await db.prisma.transmodel_vehiclejourney.findUnique(
      {
        where: {
          id: Number(vehicleJourneyId[0]),
        },
        include: {
          stops: {
            select: {
              naptan_stop: {
                select: {
                  common_name: true,
                  latitude: true,
                  longitude: true,
                },
              },
              atco_code: true,
              txc_common_name: true,
            },
          },
        },
      },
    );

    const stops: Array<StopType> | undefined = vehicleJourney?.stops.map(
      (stop) => {
        return {
          stopId: stop.atco_code,
          stopName: stop.naptan_stop.common_name ?? stop.txc_common_name,
          lon: Number(stop.naptan_stop.longitude),
          lat: Number(stop.naptan_stop.latitude),
        };
      },
    );

    servicePatterns = [
      {
        stops: stops ?? [],
        servicePatternId: vehicleJourneyId[0],
        serviceLinks: [],
        name: '',
      },
    ];
  }

  return servicePatterns;
};

export const vehicleJourney = async (
  vehicleJourneyId: string,
  sessionUser: SessionUser,
  db: Context,
): Promise<Maybe<VehicleJourneyType>[]> => {
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }

  const journey = await db.prisma.expected_journeys.findUnique({
    where: {
      group_id: vehicleJourneyId,
    },
    include: {
      expected_service: {
        select: {
          expected_operator: true,
          operator_noc: true,
        },
      },
    },
  });

  return [
    {
      mode: '',
      operatorId:
        journey?.expected_service.expected_operator.operator_noc ?? '',
      servicePatternId: journey?.vehicle_journey_id.toString() ?? '',
      timingPatternId: journey?.vehicle_journey_id.toString() ?? '',
      vehicleJourneyId: vehicleJourneyId,
    },
  ];
};

export const timingPatternDetail = async (
  timingPatternId: string,
  sessionUser: SessionUser,
  db: Context,
): Promise<Maybe<TimingPatternDetailType>[]> => {
  if (!sessionUser.user) {
    throw 'Not Authorized';
  }

  const journey = await db.prisma.transmodel_vehiclejourney.findUnique({
    where: {
      id: Number(timingPatternId),
    },
    include: {
      stops: true,
    },
  });

  const journeyDepartureTime = getDate(journey?.start_time);

  return (
    journey?.stops.map((stop, index) => ({
      stopIndex: index,
      arrivalTimeOffset: 0,
      departureTimeOffset: journey?.start_time
        ? getDate(stop.departure_time).diff(journeyDepartureTime, 'minute')
        : 0,
      createdAt: getDate(),
      noPickup: false,
      noSetdown: false,
      requestStop: false,
      timingPatternId: timingPatternId,
      timingPoint: stop.is_timing_point,
      updatedAt: getDate(),
      version: '1',
    })) ?? []
  );
};

export const getAvls: QueryResolvers["avls"] = async (_, args, context) => {
  if (!context.sessionUser.user) {
    throw 'Not Authorized';
  }

  const journey = await context.db.prisma.siriVMPositions.findMany({ where: { group_id: args.groupId }, include: {} });
  return journey.map(s => ({
    latitude: s.latitude?.toNumber() ?? 0,
    longitude: s.longitude?.toNumber() ?? 0,
    recordedAtTimeUtc: s.recorded_at_time.toISOString(),
    vehicleRef: s.vehicle_ref
  }));
};

export const getRoute: QueryResolvers["route"] = async (_, args, context) => {
  if (!context.sessionUser.user) {
    throw 'Not Authorized';
  }

  const route = await context.db.prisma.timetable.findMany({
    where: { group_id: args.groupId }, select: {
      stop_latitude: true,
      stop_longitude: true,
      actual_departure_time: true,
      expected_departure_time: true,
      is_timing_point: true,
      stop_id: true,
      stop_index: true,
      common_name: true,
      otp_state: true,
      expected_journeys: {
        select: {
          expected_journey_start: true,
          expected_service: {
            select: {
              service_name: true,
              noc_and_line_and_servicecode: true,
              line_name: true,
              expected_operator: {
                select: {
                  operator_noc: true,
                  operator_name: true
                }
              }
            }
          }
        }
      }
    }
  });
  const finalStopIndex = Math.max(...route.map(n=>n.stop_index))
  return route.map(s => {
    const otp = s.otp_state ? OtpEnum[s.otp_state] : null
    return ({
      latitude: s.stop_latitude?.toNumber() ?? 0,
      longitude: s.stop_longitude?.toNumber() ?? 0,
      actualDepartureUtc: s.actual_departure_time?.toISOString(),
      scheduledDepartureUtc: (s.expected_departure_time ?? new Date(2000, 0, 1, 0, 0, 0, 0)).toISOString(),
      stopIndex: s.stop_index,
      stopId: s.stop_id,
      stopName: s.common_name ?? 'Unknown',
      isTimingPoint: s.is_timing_point ?? false,
      lineName: s.expected_journeys?.expected_service.line_name ?? 'Unknown',
      operatorNoc: s.expected_journeys?.expected_service.expected_operator.operator_noc ?? 'Unknown',
      operatorName: s.expected_journeys?.expected_service.expected_operator.operator_name ?? 'Unknown',
      serviceName: s.expected_journeys?.expected_service.service_name ?? 'Unknown',
      serviceId: s.expected_journeys?.expected_service.noc_and_line_and_servicecode ?? 'Unknown',
      startTime: s.expected_journeys?.expected_journey_start.toISOString() ?? new Date(2000, 0, 1, 0, 0, 0, 0).toISOString(),
      otp: s.stop_index === finalStopIndex && otp === OtpEnum.Early ? OtpEnum.OnTime : otp
    });
  });
};
