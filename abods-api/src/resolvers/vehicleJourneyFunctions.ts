import { getFormattedDate, userSelectedDateAsUtc } from "../lib/dayjs.js";
import {
  AvlPoint,
  Journey,
  OtpEnum,
  QueryResolvers,
  Resolvers,
  JourneyResult,
} from "../types/generated.js";
import { requireUserSession } from "./helpers.js";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import { GraphQLError } from "graphql";

export const getJourneys = (
  db: PrismaClient,
  lineId: string,
  dateOfJourney: string,
): Promise<Journey[]> =>
  db.expected_journeys
    .findMany({
      where: {
        noc_and_line_and_servicecode: lineId,
        date_of_journey: userSelectedDateAsUtc(dateOfJourney).toDate(),
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
      j
        .map((journey) => ({
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
        }))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    );

export const findJourneys: QueryResolvers["findJourneys"] = async (
  _,
  args,
  context,
): Promise<Journey[]> => {
  await requireUserSession(context);
  return await getJourneys(context.db, args.lineId, args.dateOfJourney);
};

const getAvls = (
  db: PrismaClient,
  groupId: string,
  dateOfJourney: string,
  minRange: Date,
  maxRange: Date,
) =>
  db.siriVMPositions
    .findMany({
      where: {
        date_of_journey: new Date(dateOfJourney),
        group_id: groupId,
        recorded_at_time: {
          gte: minRange,
          lte: maxRange,
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

const getJourneyDetails = async (db: PrismaClient, groupId: string) => {
  const dateOfJourney = getDateOfJourneyFromGroupId(groupId);
  const stops = await db.timetable
    .findMany({
      where: { date_of_journey: new Date(dateOfJourney), group_id: groupId },
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
        }))
        .sort((a, b) => {
          return a.scheduledDepartureUtc < b.scheduledDepartureUtc
            ? -1
            : a.scheduledDepartureUtc > b.scheduledDepartureUtc
              ? 1
              : 0;
        }),
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

  // Assuming that the range never spans more than two dates, this should never happen
  if (minRange.diff(maxRange, "hour") > 23) {
    throw new GraphQLError("AVL range spans more than a full day", {
      extensions: { code: "INTERNAL_SERVER_ERROR", http: { status: 500 } },
    });
  }

  const startDay = minRange.startOf("day").toISOString().substring(0, 10);
  const endDay = maxRange.startOf("day").toISOString().substring(0, 10);

  const groupIdPrefix = groupId.slice(0, groupId.lastIndexOf("|"));
  const avls: AvlPoint[] = [];

  // Some of the avl data has the wrong group id when running overnight, so we construct a new one
  await getAvls(
    db,
    groupIdPrefix + "|" + startDay,
    startDay,
    minRange.toDate(),
    maxRange.toDate(),
  ).then((r) => r.forEach((x) => avls.push(x)));
  if (startDay != endDay) {
    await getAvls(
      db,
      groupIdPrefix + "|" + endDay,
      endDay,
      minRange.toDate(),
      maxRange.toDate(),
    ).then((r) => r.forEach((x) => avls.push(x)));
  }
  return { stops, avls };
};

const getDateOfJourneyFromGroupId = (groupId: string) =>
  groupId.slice(groupId.lastIndexOf("|") + 1);

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

  const dateOfJourney = getDateOfJourneyFromGroupId(args.groupId);
  const [serviceJourneys, journey] = await Promise.all([
    getJourneys(context.db, args.lineId, dateOfJourney),
    getJourneyDetails(context.db, args.groupId),
  ]);
  return { ...journey, serviceJourneys };
};

const vehicleJourneyResolvers: Resolvers = {
  Query: {
    journey: getJourney,
    findJourneys: findJourneys,
  },
};

export default vehicleJourneyResolvers;
