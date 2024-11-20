import { getDate, getFormattedDate } from "../lib/dayjs.js";
import {
  AvlPoint,
  OtpEnum,
  QueryResolvers,
  Resolvers,
  Stop,
  UniqueJourneyType,
  VehicleReplayNamespaceResolvers,
} from "../types/generated.js";
import { emptyResolver, requireUserSession } from "./helpers.js";

export const findJourneys: VehicleReplayNamespaceResolvers["findJourneys"] =
  async (_, args, context): Promise<UniqueJourneyType[]> => {
    await requireUserSession(context);
    const lineIds = args.inputs.filters?.lineIds;
    const firstLineId = lineIds?.[0];

    if (firstLineId) {
      const currentTime = getDate();
      const toTimestamp = getDate(args.inputs.toTimestamp).subtract(4, "hour");
      let journeys = await context.db.expected_journeys.findMany({
        where: {
          noc_and_line_and_servicecode: firstLineId,
          date_of_journey: toTimestamp.toDate(),
        },
        include: {
          expected_services: {
            select: {
              line_name: true,
            },
          },
        },
      });

      if (toTimestamp.isSame(currentTime, "day")) {
        journeys = journeys.filter((journey) => {
          const parsedTime = getDate(journey.expected_journey_start);
          return parsedTime.isBefore(currentTime, "second");
        });
      }

      return journeys.map((journey) => {
        const formattedDate = getFormattedDate(journey.expected_journey_start);

        return {
          groupId: journey.group_id,
          startTime: formattedDate.toString(),
          serviceInfo: {
            serviceName: journey.journey_pattern_description,
            serviceNumber: journey.expected_services?.line_name ?? "unknown",
            serviceId: journey.group_id,
          },
        };
      });
    }
    return [];
  };

export const getAvls: QueryResolvers["avls"] = async (
  _,
  args,
  context,
): Promise<AvlPoint[]> => {
  await requireUserSession(context);

  const getAvlsForGroupId = async (groupId: string) => {
    const journey = await context.db.siriVMPositions.findMany({
      where: { group_id: groupId },
    });
    return journey.map((s) => ({
      latitude: s.latitude ?? 0,
      longitude: s.longitude ?? 0,
      recordedAtTimeUtc: s.recorded_at_time.toISOString(),
      vehicleRef: s.vehicle_ref,
    }));
  };

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

  const route = await context.db.timetable.findMany({
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
      expected_journeys: {
        select: {
          expected_journey_start: true,
          expected_services: {
            select: {
              service_name: true,
              noc_and_line_and_servicecode: true,
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
  return route.map((s) => ({
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
    lineName: s.expected_journeys?.expected_services?.line_name ?? "Unknown",
    operatorNoc:
      s.expected_journeys?.expected_services?.expected_operator.operator_noc ??
      "Unknown",
    operatorName:
      s.expected_journeys?.expected_services?.expected_operator.operator_name ??
      "Unknown",
    serviceName:
      s.expected_journeys?.expected_services?.service_name ?? "Unknown",
    serviceId:
      s.expected_journeys?.expected_services?.noc_and_line_and_servicecode ??
      "Unknown",
    startTime:
      s.expected_journeys?.expected_journey_start.toISOString() ??
      new Date(2000, 0, 1, 0, 0, 0, 0).toISOString(),
    otp: s.otp_state ? OtpEnum[s.otp_state as OtpEnum] : null,
  }));
};

const vehicleJourneyResolvers: Resolvers = {
  Query: {
    vehicleReplay: emptyResolver,
    avls: getAvls,
    route: getRoute,
  },
  VehicleReplayNamespace: {
    findJourneys: findJourneys,
  },
};

export default vehicleJourneyResolvers;
