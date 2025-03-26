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
import { Kysely } from "kysely";
import { DB } from "../kysely.js";

export const findJourneys: QueryResolvers["findJourneys"] = async (
  _,
  args,
  context,
): Promise<Journey[]> => {
  await requireUserSession(context);

  return await context.kysely
    .selectFrom("expected_journeys as j")
    .innerJoin("expected_services as s", (join) =>
      join
        .onRef("s.date_of_journey", "=", "j.date_of_journey")
        .onRef(
          "s.noc_and_line_and_servicecode",
          "=",
          "j.noc_and_line_and_servicecode",
        ),
    )
    .innerJoin("expected_operators as o", (join) =>
      join
        .onRef("o.date_of_journey", "=", "s.date_of_journey")
        .onRef("o.operator_noc", "=", "s.operator_noc"),
    )
    .where("j.noc_and_line_and_servicecode", "=", args.lineId)
    .where(
      "j.date_of_journey",
      "=",
      userSelectedDateAsUtc(args.dateOfJourney).toDate(),
    )
    .select([
      "j.expected_journey_start",
      "j.group_id",
      "j.journey_pattern_description",
      "j.direction",
      "s.line_name",
      "s.operator_noc",
      "o.operator_name",
    ])
    .execute()
    .then((j) =>
      j.map((journey) => ({
        groupId: journey.group_id,
        directionRef: journey.direction,
        startTime: getFormattedDate(journey.expected_journey_start),
        serviceName: journey.journey_pattern_description,
        serviceNumber: journey.line_name,
        operatorNoc: journey.operator_noc,
        operatorName: journey.operator_name ?? "unknown",
      })),
    );
};

const getAvlData = (
  db: Kysely<DB>,
  dateString: string,
  newGroupId: string,
  minRange: dayjs.Dayjs,
  maxRange: dayjs.Dayjs,
) =>
  db
    .selectFrom("SiriVMPositions")
    .where("date_of_journey", "=", new Date(dateString))
    .where("group_id", "=", newGroupId)
    .where("recorded_at_time", ">=", minRange.toDate())
    .where("recorded_at_time", "<=", maxRange.toDate())
    .select([
      "latitude",
      "longitude",
      "recorded_at_time",
      "vehicle_ref",
      "direction_ref",
    ])
    .execute()
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

  const stops = await context.kysely
    .selectFrom("Timetable")
    .where("date_of_journey", "=", new Date(dateOfJourneyString))
    .where("group_id", "=", args.groupId)
    .select([
      "stop_latitude",
      "stop_longitude",
      "actual_departure_time",
      "expected_departure_time",
      "is_timing_point",
      "stop_id",
      "stop_index",
      "common_name",
      "otp_state",
      "timestamp_after_estimate",
      "direction",
      "incomplete_reason",
    ])
    .execute()
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

  const avlPromises = [];
  let currentDay = minRange.startOf("day");
  while (currentDay.isSameOrBefore(maxRange.startOf("day"))) {
    const dateString = currentDay.toISOString().substring(0, 10);
    // Some of the avl data has the wrong group id when running overnight, so we construct a new one
    const newGroupId = groupIdPrefix + "|" + dateString;
    avlPromises.push(
      getAvlData(context.kysely, dateString, newGroupId, minRange, maxRange),
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
