import { DateTime, Duration, Interval } from "luxon";
import { MatchType, OtpEnum } from "@/src/generated/graphql";
import {
  VehicleJourneyAvl,
  VehicleJourneyStop,
  VehicleJourneySummary,
} from "@/types/vehicle-journeys";

const incompleteReasonText = {
  1: "missing NOC from real-time data",
  2: "missing service from real-time data",
  3: "missing journey code from real-time data",
  4: "missing real-time data within the zone of a stop",
  5: "GPS location in the zone of a stop that is deemed invalid",
  0: "an unspecified matching issue",
} as const;

export const incompleteIdToString = (incompleteId: number) =>
  incompleteReasonText[incompleteId as keyof typeof incompleteReasonText] ??
  incompleteReasonText[0];

export const formatJourneyStartTime = (journey: VehicleJourneySummary) =>
  DateTime.fromISO(journey.startTime)
    .setZone("Europe/London")
    .toFormat("HH:mm");

export const formatDate = (date: string) =>
  DateTime.fromISO(date).setZone("Europe/London").toFormat("dd/MM/yyyy");

export const formatLongDateTime = (dateTime: string) =>
  DateTime.fromISO(dateTime)
    .setZone("Europe/London")
    .toFormat("d MMM yyyy, HH:mm");

export const formatStopTime = (
  dateTime?: string | null,
  includeSeconds = false,
) => {
  if (!dateTime) return "-";
  return DateTime.fromISO(dateTime)
    .setZone("Europe/London")
    .toFormat(includeSeconds ? "HH:mm:ss" : "HH:mm");
};

export const formatDelay = (
  scheduled?: string | null,
  actual?: string | null,
) => {
  if (!scheduled || !actual) return "Unavailable";

  const diffSeconds = Math.round(
    DateTime.fromISO(actual).diff(DateTime.fromISO(scheduled), "seconds")
      .seconds,
  );
  const sign = diffSeconds >= 0 ? "+" : "-";
  const absoluteSeconds = Math.abs(diffSeconds);
  const minutes = Math.floor(absoluteSeconds / 60);
  const seconds = String(absoluteSeconds % 60).padStart(2, "0");

  return `${sign}${minutes}:${seconds}`;
};

export const getActualDeparture = (
  stop: VehicleJourneyStop,
  matchType: MatchType,
) => {
  if (stop.actualDepartureUtc) return stop.actualDepartureUtc;
  if (matchType === MatchType.Estimated && stop.estimatedDepartureUtc) {
    return stop.estimatedDepartureUtc;
  }
  return null;
};

export const getStopOtp = (stop: VehicleJourneyStop, matchType: MatchType) => {
  if (matchType === MatchType.Evidenced && stop.estimatedDepartureUtc)
    return null;
  return stop.otp;
};

export const getDistinct = <T, U>(items: T[], accessor: (item: T) => U): U[] =>
  items
    .map(accessor)
    .filter((value, index, array) => array.indexOf(value) === index);

export const normaliseJourneyDirection = (
  direction: string | null | undefined,
): string | null => {
  const value = (direction ?? "").trim().toLowerCase();
  if (!value) return null;
  if (value === "clockwise") return "outbound";
  if (value === "anticlockwise") return "inbound";
  return value;
};

export const getInitialVehicleRef = (
  stops: VehicleJourneyStop[],
  avls: VehicleJourneyAvl[],
) => {
  const firstEvidencedMatch = stops.find((stop) => stop.actualDepartureUtc);
  const matchedAvl = avls.find(
    (avl) => avl.recordedAtTimeUtc === firstEvidencedMatch?.actualDepartureUtc,
  );

  return matchedAvl?.vehicleRef ?? avls[0]?.vehicleRef ?? null;
};

export const calculateOtpStats = (
  stops: VehicleJourneyStop[],
  matchType: MatchType,
  timingPointsOnly: boolean,
) => {
  const stopDetails = stops
    .filter((stop) => stop.isTimingPoint || !timingPointsOnly)
    .map((stop) => ({
      ...stop,
      otp: getStopOtp(stop, matchType),
      incompleteReason: stop.incompleteReason ?? 0,
    }))
    .filter((stop) => stop.otp !== null || !stop.setDown);

  const total = stopDetails.length;
  const early = stopDetails.filter((stop) => stop.otp === OtpEnum.Early).length;
  const onTime = stopDetails.filter(
    (stop) => stop.otp === OtpEnum.OnTime,
  ).length;
  const late = stopDetails.filter((stop) => stop.otp === OtpEnum.Late).length;
  const noMatchStops = stopDetails.filter((stop) => stop.otp === null);
  const completed = total - noMatchStops.length;
  const reasonCounts = noMatchStops.reduce<Record<number, number>>(
    (counts, stop) => ({
      ...counts,
      [stop.incompleteReason]: (counts[stop.incompleteReason] ?? 0) + 1,
    }),
    {},
  );

  const incomplete = Object.entries(incompleteReasonText)
    .map(([reasonId]) => {
      const count = reasonCounts[Number(reasonId)] ?? 0;
      return { reason: incompleteIdToString(Number(reasonId)), count };
    })
    .filter((item) => item.count > 0);

  return {
    total,
    early,
    onTime,
    late,
    noData: noMatchStops.length,
    completed,
    incomplete,
  };
};

export const formatPercent = (numerator: number, denominator: number) => {
  if (denominator <= 0) return "Unavailable";
  return new Intl.NumberFormat("en-GB", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numerator / denominator);
};

export const getDefaultJourneyDate = (offsetISO?: string) =>
  DateTime.local()
    .startOf("day")
    .minus(Duration.fromISO(offsetISO || "PT0H"))
    .toISODate() ?? DateTime.local().toISODate();

export const getJourneyDateFromStartTime = (
  startTime: string | null | undefined,
) => {
  if (!startTime) return null;

  const dateTime = DateTime.fromISO(startTime, { setZone: true }).setZone(
    "Europe/London",
  );
  return dateTime.isValid ? dateTime.toISODate() : null;
};

export const getValidDateRange = (offsetISO?: string, durationISO?: string) =>
  Interval.before(
    DateTime.local()
      .endOf("day")
      .minus(Duration.fromISO(offsetISO || "PT0H")),
    Duration.fromISO(durationISO || "P6M"),
  );

export const isDateInRange = (
  date: string,
  offsetISO?: string,
  durationISO?: string,
) => {
  const parsedDate = DateTime.fromISO(date).startOf("day");
  return (
    parsedDate.isValid &&
    getValidDateRange(offsetISO, durationISO).contains(parsedDate)
  );
};
