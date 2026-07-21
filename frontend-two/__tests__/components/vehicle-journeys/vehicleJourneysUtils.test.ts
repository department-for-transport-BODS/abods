import { DateTime } from "luxon";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateOtpStats,
  formatDelay,
  getDefaultJourneyDate,
  getInitialVehicleRef,
  getJourneyDateFromStartTime,
  isDateInRange,
  normaliseJourneyDirection,
} from "@/components/vehicle-journeys/vehicleJourneysUtils";
import { MatchType, OtpEnum } from "@/src/generated/graphql";
import {
  VehicleJourneyAvl,
  VehicleJourneyStop,
} from "@/types/vehicle-journeys";

const buildStop = (
  overrides: Partial<VehicleJourneyStop> = {},
): VehicleJourneyStop =>
  ({
    actualDepartureUtc: null,
    estimatedDepartureUtc: null,
    scheduledDepartureUtc: "2026-07-13T09:30:00Z",
    latitude: 51.5,
    longitude: -0.12,
    stopIndex: 1,
    stopName: "High Street",
    stopId: 1,
    isTimingPoint: true,
    otp: OtpEnum.OnTime,
    directionRef: "outbound",
    incompleteReason: 0,
    setDown: false,
    ...overrides,
  }) as VehicleJourneyStop;

const buildAvl = (
  overrides: Partial<VehicleJourneyAvl> = {},
): VehicleJourneyAvl =>
  ({
    recordedAtTimeUtc: "2026-07-13T09:31:00Z",
    latitude: 51.5,
    longitude: -0.12,
    vehicleRef: "BUS-1",
    directionRef: "outbound",
    ...overrides,
  }) as VehicleJourneyAvl;

describe("vehicleJourneysUtils", () => {
  describe("normaliseJourneyDirection", () => {
    it.each([
      [undefined, null],
      [null, null],
      ["", null],
      ["   ", null],
      ["clockwise", "outbound"],
      ["Clockwise", "outbound"],
      ["anticlockwise", "inbound"],
      [" InBound ", "inbound"],
      ["outbound", "outbound"],
    ])("normalises %p to %p", (input, expected) => {
      expect(normaliseJourneyDirection(input)).toBe(expected);
    });
  });

  describe("getJourneyDateFromStartTime", () => {
    it.each([
      [undefined, null],
      [null, null],
      ["not-a-date", null],
      ["2026-07-13T23:30:00Z", "2026-07-14"],
      ["2026-01-13T23:30:00Z", "2026-01-13"],
    ])("returns %p for %p", (input, expected) => {
      expect(getJourneyDateFromStartTime(input)).toBe(expected);
    });
  });

  describe("formatDelay", () => {
    it.each([
      [undefined, "2026-07-13T09:31:15Z", "Unavailable"],
      ["2026-07-13T09:30:00Z", undefined, "Unavailable"],
      ["2026-07-13T09:30:00Z", "2026-07-13T09:31:15Z", "+1:15"],
      ["2026-07-13T09:30:45Z", "2026-07-13T09:30:00Z", "-0:45"],
    ])("formats delay from %p and %p as %p", (scheduled, actual, expected) => {
      expect(formatDelay(scheduled, actual)).toBe(expected);
    });
  });

  describe("getInitialVehicleRef", () => {
    it("prefers the AVL that matches the first evidenced stop", () => {
      const stops = [
        buildStop({ actualDepartureUtc: "2026-07-13T09:31:00Z" }),
        buildStop({
          stopId: 2,
          stopIndex: 2,
          actualDepartureUtc: "2026-07-13T09:33:00Z",
        }),
      ];
      const avls = [
        buildAvl({
          vehicleRef: "BUS-2",
          recordedAtTimeUtc: "2026-07-13T09:33:00Z",
        }),
        buildAvl({
          vehicleRef: "BUS-1",
          recordedAtTimeUtc: "2026-07-13T09:31:00Z",
        }),
      ];

      expect(getInitialVehicleRef(stops, avls)).toBe("BUS-1");
    });

    it.each([
      {
        name: "falls back to the first AVL when there is no evidenced stop match",
        stops: [buildStop({ actualDepartureUtc: null })],
        avls: [
          buildAvl({ vehicleRef: "BUS-9" }),
          buildAvl({ vehicleRef: "BUS-8" }),
        ],
        expected: "BUS-9",
      },
      {
        name: "returns null when there is no AVL data",
        stops: [buildStop({ actualDepartureUtc: "2026-07-13T09:31:00Z" })],
        avls: [],
        expected: null,
      },
    ])("$name", ({ stops, avls, expected }) => {
      expect(getInitialVehicleRef(stops, avls)).toBe(expected);
    });
  });

  describe("calculateOtpStats", () => {
    const stops = [
      buildStop({ stopId: 1, stopIndex: 1, otp: OtpEnum.Early }),
      buildStop({ stopId: 2, stopIndex: 2, otp: OtpEnum.OnTime }),
      buildStop({ stopId: 3, stopIndex: 3, otp: OtpEnum.Late }),
      buildStop({
        stopId: 4,
        stopIndex: 4,
        otp: OtpEnum.Late,
        estimatedDepartureUtc: "2026-07-13T09:34:00Z",
        incompleteReason: 4,
      }),
      buildStop({
        stopId: 5,
        stopIndex: 5,
        otp: OtpEnum.OnTime,
        isTimingPoint: false,
      }),
      buildStop({
        stopId: 6,
        stopIndex: 6,
        otp: null,
        setDown: true,
        incompleteReason: 5,
      }),
    ];

    it("treats estimated-only timing points as incomplete for evidenced matching", () => {
      expect(calculateOtpStats(stops, MatchType.Evidenced, true)).toEqual({
        total: 4,
        early: 1,
        onTime: 1,
        late: 1,
        noData: 1,
        completed: 3,
        incomplete: [
          {
            reason: "missing real-time data within the zone of a stop",
            count: 1,
          },
        ],
      });
    });

    it("includes all stops when requested and keeps estimated matches in the totals", () => {
      expect(calculateOtpStats(stops, MatchType.Estimated, false)).toEqual({
        total: 5,
        early: 1,
        onTime: 2,
        late: 2,
        noData: 0,
        completed: 5,
        incomplete: [],
      });
    });
  });

  describe("date range helpers", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([
      [undefined, "2026-07-17"],
      ["P7D", "2026-07-10"],
    ])("defaults %p to %p", (offsetISO, expected) => {
      expect(getDefaultJourneyDate(offsetISO)).toBe(expected);
    });

    it.each([
      ["2026-07-16", true],
      ["2026-04-01", true],
      ["2025-12-31", false],
      ["not-a-date", false],
    ])("reports %p as in range: %p", (date, expected) => {
      expect(isDateInRange(date, "PT0H", "P6M")).toBe(expected);
    });

    it("builds a range that includes the expected latest date", () => {
      const latestExpectedDate = DateTime.fromISO("2026-07-16").startOf("day");

      expect(
        isDateInRange(latestExpectedDate.toISODate() ?? "", "P1D", "P6M"),
      ).toBe(true);
    });
  });
});
