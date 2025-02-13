import { getFormattedDate, userSelectedDateAsUtc } from "../lib/dayjs.js";
import {
  AvlPoint,
  Journey,
  OtpEnum,
  QueryResolvers,
  Resolvers,
  Stop,
} from "../types/generated.js";
import { requireUserSession } from "./helpers.js";

export const findJourneys: QueryResolvers["findJourneys"] = async (
  _,
  args,
  context,
): Promise<Journey[]> => {
  await requireUserSession(context);

  return context.db.expected_journeys
    .findMany({
      where: {
        noc_and_line_and_servicecode: args.lineId,
        date_of_journey: userSelectedDateAsUtc(args.dateOfJourney).toDate(),
      },
      select: {
        expected_journey_start: true,
        group_id: true,
        journey_pattern_description: true,
        direction: true,
        expected_services: {
          select: {
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
    })
    .then((j) =>
      j.map((journey) => ({
        groupId: journey.group_id,
        directionRef: journey.direction,
        startTime: getFormattedDate(journey.expected_journey_start),
        serviceName: journey.journey_pattern_description,
        serviceNumber: journey.expected_services?.line_name ?? "unknown",
        operatorNoc:
          journey.expected_services?.expected_operator.operator_noc ??
          "unknown",
        operatorName:
          journey.expected_services?.expected_operator.operator_name ??
          "unknown",
      })),
    );
};

export const getAvls: QueryResolvers["avls"] = async (
  _,
  args,
  context,
): Promise<AvlPoint[]> => {
  await requireUserSession(context);

  const getAvlsForGroupId = (groupId: string) =>
    context.db.siriVMPositions
      .findMany({
        where: { group_id: groupId },
        select: {
          latitude: true,
          longitude: true,
          recorded_at_time: true,
          vehicle_ref: true,
          direction_ref: true,
        },
      })
      .then((j) =>
        j.map((s) => ({
          latitude: s.latitude ?? 0,
          longitude: s.longitude ?? 0,
          recordedAtTimeUtc: s.recorded_at_time.toISOString(),
          vehicleRef: s.vehicle_ref,
          directionRef: s.direction_ref ?? "unknown",
        })),
      );

  // If we have re-run timetable generation after changing the group id format, we will get no results just querying with the group id from the timetable, so check for old formats too
  const groupIds = [
    ...new Set([
      args.groupId,
      args.groupId.toUpperCase(),
      args.groupId.toUpperCase().replace("|", ""),
    ]),
  ];

  for (const groupId of groupIds) {
    const avls = await getAvlsForGroupId(groupId);
    if (avls.length > 0) return avls;
  }
  return [];
};

export const getRoute: QueryResolvers["route"] = async (
  _,
  args,
  context,
): Promise<Stop[]> => {
  await requireUserSession(context);

  return context.db.timetable
    .findMany({
      where: { group_id: args.groupId },
      select: {
        stop_latitude: true,
        stop_longitude: true,
        actual_departure_time: true,
        expected_departure_time: true,
        is_timing_point: true,
        stop_id: true,
        stop_index: true,
        common_name: true,
        otp_state: true,
        timestamp_after_estimate: true,
        direction: true,
        incomplete_reason: true,
      },
    })
    .then((r) =>
      r.map((s) => ({
        latitude: s.stop_latitude ?? 0,
        longitude: s.stop_longitude ?? 0,
        actualDepartureUtc: s.actual_departure_time?.toISOString(),
        estimatedDepartureUtc: s.timestamp_after_estimate?.toISOString(),
        scheduledDepartureUtc: (
          s.expected_departure_time ?? new Date(2000, 0, 1, 0, 0, 0, 0)
        ).toISOString(),
        stopIndex: s.stop_index,
        stopId: s.stop_id,
        stopName: s.common_name ?? "Unknown",
        isTimingPoint: s.is_timing_point ?? false,
        otp: s.otp_state ? OtpEnum[s.otp_state as OtpEnum] : null,
        directionRef: s.direction ?? "unknown",
        incompleteReason: s.incomplete_reason,
      })),
    );
};

const vehicleJourneyResolvers: Resolvers = {
  Query: {
    avls: getAvls,
    route: getRoute,
    findJourneys: findJourneys,
  },
};

export default vehicleJourneyResolvers;
