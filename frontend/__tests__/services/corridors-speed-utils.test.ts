import { describe, expect, it } from "vitest";
import {
  serviceLinksForStops,
  toSpeedStats,
} from "@/services/corridors/corridors-speed-utils";
import { CorridorStats } from "@/types/corridors";
import { RouteType } from "../../src/generated/graphql";

const link = (fromStop: string, toStop: string, distance: number) => ({
  fromStop,
  toStop,
  distance,
  routeValidity: RouteType.Valid,
  linkRoute: null,
});

const timeRow = {
  minTransitTime: 300,
  maxTransitTime: 600,
  avgTransitTime: 420,
  percentile25: 350,
  percentile75: 500,
};

const stats: CorridorStats = {
  summaryStats: {
    averageTransitTime: 420,
    numberOfServices: 1,
    scheduledTransits: 1,
    totalTransits: 1,
  },
  transitTimeStats: [{ ts: "2026-05-01T00:00:00+00:00", ...timeRow }],
  transitTimeTimeOfDayStats: [{ hour: 10, category: "10:00", ...timeRow }],
  transitTimeDayOfWeekStats: [{ dow: 1, category: "Mon", ...timeRow }],
  transitTimeHistogram: [
    { bin: 0, freq: 0, xAxisCategory: "0:00", xAxisLabel: "" },
    { bin: 6, freq: 4, xAxisCategory: "6:00", xAxisLabel: "" },
    { bin: 7, freq: 1, xAxisCategory: "7:00", xAxisLabel: "" },
    { bin: 9, freq: 2, xAxisCategory: "9:00", xAxisLabel: "" },
  ],
  transitTimePerServiceStats: [],
  serviceLinks: [],
};

describe("toSpeedStats", () => {
  it("converts journey time box plots to mph, so the slowest journey is the lowest speed", () => {
    const speed = toSpeedStats(stats, 1000);

    for (const series of [
      speed.transitTimeStats,
      speed.transitTimeTimeOfDayStats,
      speed.transitTimeDayOfWeekStats,
    ]) {
      expect(series[0]).toMatchObject({
        avgTransitTime: 5,
        minTransitTime: 4,
        maxTransitTime: 7,
        percentile25: 4,
        percentile75: 6,
      });
    }
    expect(speed.transitTimeTimeOfDayStats[0].category).toBe("10:00");
  });

  it("rebins the journey time histogram by mph, merging bins that land on the same speed", () => {
    const speed = toSpeedStats(stats, 1000);

    expect(
      speed.transitTimeHistogram.map(({ xAxisCategory, xAxisLabel, freq }) => [
        xAxisCategory,
        xAxisLabel,
        freq ?? 0,
      ]),
    ).toEqual([
      ["4", "4 mph", 2],
      ["5", "5 mph", 1],
      ["6", "6 mph", 4],
      ["7", "7 mph", 0],
    ]);
  });

  it("leaves journey time stats untouched", () => {
    toSpeedStats(stats, 1000);

    expect(stats.transitTimeStats[0].avgTransitTime).toBe(420);
    expect(stats.transitTimeHistogram[1].bin).toBe(6);
  });
});

describe("serviceLinksForStops", () => {
  it("keeps only links between the selected stops", () => {
    const links = [link("A", "B", 100), link("B", "C", 500)];

    expect(
      serviceLinksForStops(links, [{ naptan: "A" }, { naptan: "B" }]),
    ).toEqual([links[0]]);
  });

  it("returns no links when none match the selected stops", () => {
    const links = [link("A", "B", 100)];

    expect(serviceLinksForStops(links, [{ naptan: "X" }])).toEqual([]);
  });
});
