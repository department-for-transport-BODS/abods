import { getFormattedDate, userSelectedDateAsUtc } from "../lib/dayjs.js";
import {
  Journey,
  JourneyResult,
  OtpEnum,
  QueryResolvers,
  Resolvers,
} from "../types/generated.js";
import { requireUserSession } from "./helpers.js";
import dayjs from "dayjs";
import { GraphQLError } from "graphql";
import { PrismaClient } from "@prisma/client";

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
        is_cancelled: true,
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
        isCancelled: journey.is_cancelled ?? false,
        operatorNoc:
          journey.expected_services?.expected_operator.operator_noc ??
          "unknown",
        operatorName:
          journey.expected_services?.expected_operator.operator_name ??
          "unknown",
      })),
    );
};

const getAvlData = (
  db: PrismaClient,
  dateString: string,
  newGroupId: string,
  minRange: dayjs.Dayjs,
  maxRange: dayjs.Dayjs,
) =>
  db.siriVMPositions
    .findMany({
      where: {
        date_of_journey: new Date(dateString),
        group_id: newGroupId,
        recorded_at_time: {
          gte: minRange.toDate(),
          lte: maxRange.toDate(),
        },
      },
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

export const getJourney: QueryResolvers["journey"] = async (
  _,
  args,
  context,
): Promise<JourneyResult> => {
  await requireUserSession(context);

  if (!args.groupId.includes("|")) {
    throw new GraphQLError("Wrong group id format", {
      extensions: { code: "BAD_USER_INPUT", http: { status: 400 } },
    });
  }
  const dateOfJourneyString = args.groupId.slice(
    args.groupId.lastIndexOf("|") + 1,
  );
  const groupIdPrefix = args.groupId.slice(0, args.groupId.lastIndexOf("|"));

  const stops = await context.db.timetable
    .findMany({
      where: {
        date_of_journey: new Date(dateOfJourneyString),
        group_id: args.groupId,
      },
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
        set_down: true,
      },
    })
    .then((r) =>
      r
        .map((s) => ({
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
          incompleteReason: s.incomplete_reason ?? 0,
          setDown: s.set_down ?? false,
        }))
        .sort((a, b) =>
          a.scheduledDepartureUtc.localeCompare(b.scheduledDepartureUtc),
        ),
    );

  if (stops.length < 1) {
    throw new GraphQLError("Journey not found", {
      extensions: { code: "NOT_FOUND", http: { status: 404 } },
    });
  }

  // Even though we can only match avl data within 2 hours of the timetable start/end,
  // occasionally there is some data outside that range, so it's useful to display that as well,
  // but avoid fetching data for the same journey a day before/after
  const avlRangeBufferInHours = 4;
  const minRange = dayjs(stops[0].scheduledDepartureUtc).subtract(
    avlRangeBufferInHours,
    "hours",
  );
  const maxRange = dayjs(stops.at(-1)!.scheduledDepartureUtc).add(
    avlRangeBufferInHours,
    "hours",
  );

  const avlPromises = [];
  let currentDay = minRange.startOf("day");
  while (currentDay.isSameOrBefore(maxRange.startOf("day"))) {
    const dateString = currentDay.toISOString().substring(0, 10);
    // Some of the avl data has the wrong group id when running overnight, so we construct a new one
    const newGroupId = groupIdPrefix + "|" + dateString;
    avlPromises.push(
      getAvlData(context.db, dateString, newGroupId, minRange, maxRange),
    );
    currentDay = currentDay.add(1, "day");
  }
  const avlLists = await Promise.all(avlPromises);
  return { stops, avls: avlLists.flat() };
};

const vehicleJourneyResolvers: Resolvers = {
  Query: {
    journey: getJourney,
    findJourneys: findJourneys,
  },
};

export default vehicleJourneyResolvers;
