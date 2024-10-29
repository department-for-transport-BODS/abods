import { Dayjs } from 'dayjs';
import { Context } from '../../context';
import { getDate, getFormattedDate } from '../../lib/dayjs.js';
import {
  OtpEnum,
  UniqueJourneyType,
  VehicleReplayInputType,
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

export const getAvls: QueryResolvers["avls"] = async (_, args, context) => {
  if (!context.sessionUser.user) {
    throw 'Not Authorized';
  }

  const getAvlsForGroupId = async (groupId: string) => {
    const journey = await context.db.prisma.siriVMPositions.findMany({
      where: { group_id: groupId },
      include: {}
    });
    return journey.map(s => ({
      latitude: s.latitude?.toNumber() ?? 0,
      longitude: s.longitude?.toNumber() ?? 0,
      recordedAtTimeUtc: s.recorded_at_time.toISOString(),
      vehicleRef: s.vehicle_ref
    }));
  };

  const avls = await getAvlsForGroupId(args.groupId);
  if (avls.length > 0) return avls
  return await getAvlsForGroupId(args.groupId.toUpperCase());
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
  return route.map(s =>
    ({
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
      otp: s.otp_state ? OtpEnum[s.otp_state] : null
    }));
};
