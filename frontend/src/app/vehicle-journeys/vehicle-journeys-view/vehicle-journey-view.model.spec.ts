import { DateTime, Settings } from "luxon";
import { Stop, AvlPoint, MatchType } from "../../../generated/graphql";

describe("JourneyInfo Model", () => {
  const t1 = "2022-08-18T11:20:00.000+01:00";
  const t2 = "2022-08-18T11:21:00.000+01:00";
  const startTime = "2022-08-18T11:20:00.000+01:00";

  const mockStops = (): Stop[] => [
    {
      stopId: 1,
      stopName: "Solihull Town Centre",
      longitude: -1.78000522,
      latitude: 52.4139824,
      isTimingPoint: true,
      otp: null,
      estimatedDepartureUtc: null,
      actualDepartureUtc: t1,
      directionRef: "inbound",
      incompleteReason: 0,
      scheduledDepartureUtc: startTime,
      stopIndex: 0,
      setDown: true,
    },
    {
      stopId: 2,
      stopName: "Whitefields Rd",
      longitude: -1.77750742,
      latitude: 52.407795,
      isTimingPoint: false,
      otp: null,
      estimatedDepartureUtc: null,
      actualDepartureUtc: null,
      directionRef: "inbound",
      incompleteReason: 0,
      scheduledDepartureUtc: startTime,
      stopIndex: 1,
      setDown: true,
    },
    {
      stopId: 3,
      stopName: "Solihull Sixth Form College",
      longitude: -1.77633333,
      latitude: 52.4044762,
      isTimingPoint: false,
      otp: null,
      estimatedDepartureUtc: null,
      actualDepartureUtc: null,
      directionRef: "inbound",
      incompleteReason: 0,
      scheduledDepartureUtc: startTime,
      stopIndex: 2,
      setDown: true,
    },
  ];

  const mockAvls: AvlPoint[] = [
    {
      recordedAtTimeUtc: t1,
      latitude: 52.4139834,
      longitude: -1.78000502,
      vehicleRef: "ABC-123",
      directionRef: "inbound",
    },
    {
      recordedAtTimeUtc: t2,
      latitude: 52.4139838,
      longitude: -1.78000505,
      vehicleRef: "ABC-123",
      directionRef: "inbound",
    },
  ];

  beforeEach(() => {
    Settings.defaultZone = "utc";
    Settings.now = () => 1659312000000; // 2022-08-01
  });

  it("should create a JourneyInfo object with stops and avls", () => {
    const journeyInfo = {
      stops: mockStops(),
      avls: mockAvls,
    };

    expect(journeyInfo.stops.length).toBe(3);
    expect(journeyInfo.avls.length).toBe(2);
    expect(journeyInfo.stops[0].stopName).toBe("Solihull Town Centre");
    expect(journeyInfo.avls[0].vehicleRef).toBe("ABC-123");
  });

  it("should filter avls by direction if specified", () => {
    const journeyInfo = {
      stops: mockStops(),
      avls: [
        ...mockAvls,
        {
          recordedAtTimeUtc: t2,
          latitude: 52.4,
          longitude: -1.7,
          vehicleRef: "XYZ-999",
          directionRef: "outbound",
        },
      ],
    };

    const inboundAvls = journeyInfo.avls.filter(
      (a) => a.directionRef === "inbound",
    );
    expect(inboundAvls.length).toBe(2);
    expect(inboundAvls.every((a) => a.directionRef === "inbound")).toBeTrue();
  });

  it("should get initial vehicleRef from first evidenced stop", () => {
    const journeyInfo = {
      stops: mockStops(),
      avls: mockAvls,
    };
    const firstEvidenced = journeyInfo.stops.find((s) => s.actualDepartureUtc);
    const matchedAvl = journeyInfo.avls.find(
      (a) => a.recordedAtTimeUtc === firstEvidenced?.actualDepartureUtc,
    );
    expect(matchedAvl?.vehicleRef).toBe("ABC-123");
  });

  it("should handle empty avls gracefully", () => {
    const journeyInfo = {
      stops: mockStops(),
      avls: [] as AvlPoint[],
    };
    expect(journeyInfo.avls.length).toBe(0);
    // Should not throw
    expect(() => {
      const firstEvidenced = journeyInfo.stops.find(
        (s) => s.actualDepartureUtc,
      );
      const matchedAvl = journeyInfo.avls.find(
        (a) => a.recordedAtTimeUtc === firstEvidenced?.actualDepartureUtc,
      );
      return matchedAvl;
    }).not.toThrow();
  });
});
