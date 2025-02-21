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

const getAvls = (
  db: PrismaClient,
  groupIdPrefix: string,
  dateOfJourney: Date,
  minRange: Date,
  maxRange: Date,
) =>
  db.siriVMPositions
    .findMany({
      where: {
        date_of_journey: dateOfJourney,
        group_id:
          groupIdPrefix + "|" + dateOfJourney.toISOString().substring(0, 10),
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

export const getJourney: QueryResolvers["journey"] = async (
  _,
  args,
  context,
): Promise<JourneyResult> => {
  await requireUserSession(context);

  const groupIdPrefix = args.groupId.slice(0, args.groupId.lastIndexOf("|"));
  const dateOfJourney = new Date(
    args.groupId.slice(args.groupId.lastIndexOf("|") + 1),
  );

  const stops = await context.db.timetable
    .findMany({
      where: { date_of_journey: dateOfJourney, group_id: args.groupId },
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
  if (stops.length < 1) throw new Error("Journey not found");

  const minRange = dayjs(stops[0].scheduledDepartureUtc).subtract(2, "hours");
  const maxRange = dayjs(stops.at(-1)!.scheduledDepartureUtc).add(2, "hours");
  const startDay = minRange.startOf("day").toDate();
  const endDay = maxRange.startOf("day").toDate();

  const avls: AvlPoint[] = [];
  await getAvls(
    context.db,
    groupIdPrefix,
    startDay,
    minRange.toDate(),
    maxRange.toDate(),
  ).then((r) => r.forEach((x) => avls.push(x)));
  if (startDay.getDay() != endDay.getDay()) {
    await getAvls(
      context.db,
      groupIdPrefix,
      endDay,
      minRange.toDate(),
      maxRange.toDate(),
    ).then((r) => r.forEach((x) => avls.push(x)));
  }

  return { stops, avls };
};

const vehicleJourneyResolvers: Resolvers = {
  Query: {
    journey: getJourney,
    findJourneys: findJourneys,
  },
};

export default vehicleJourneyResolvers;
