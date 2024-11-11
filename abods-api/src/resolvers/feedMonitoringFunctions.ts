import { getDate, getFormattedDate } from "../lib/dayjs.js";
import {
  EventResponse,
  EventStatsType,
  FeedMonitoringType,
  FeedMonitoringTypeResolvers,
  HistoricalStatsType,
  LiveStatsTypeResolvers,
  OperatorTypeResolvers,
  QueryResolvers,
  Resolvers,
  VehicleStatsType,
} from "../types/generated.js";
import {
  ExpectedJourneyType,
  getAvlPoints,
  getExpectedJourneys,
  getOperatorWithFeed,
  getVehicleStats,
  VehicleCountType,
} from "../lib/feedMonitoring.js";
import { feed_monitor_summary, PrismaClient } from "@prisma/client";

export const getEventStats: QueryResolvers["eventStats"] =
  (): EventStatsType[] => {
    const eventStats: EventStatsType[] = [];
    // Get data for the previous 90 days before today
    const currentTime = getDate();
    let startdate = currentTime.subtract(90, "day");

    while (startdate.isBefore(currentTime)) {
      eventStats.push({
        count: 0,
        day: startdate.format("YYYY-MM-DD"),
      });

      startdate = startdate.add(1, "day");
    }
    return eventStats;
  };

export const getVehicleStatsPerOperator: LiveStatsTypeResolvers["last20Minutes"] =
  async (parent, _, context): Promise<VehicleStatsType[]> => {
    const currentTime = getDate();
    let expectedJourneys: ExpectedJourneyType[] = [];

    if (parent.operatorId) {
      expectedJourneys = await getExpectedJourneys(
        context.db,
        parent.operatorId,
        currentTime,
        21,
      );

      const avl: Awaited<ReturnType<typeof getAvlPoints>> = await getAvlPoints(
        context.db,
        parent.operatorId,
        currentTime,
        true,
        expectedJourneys.map((journey) => journey.group_id),
      );
      const results = await getVehicleStats(avl, expectedJourneys);

      return results.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
    }

    return [];
  };

export const getHistoricalStats: FeedMonitoringTypeResolvers["historicalStats"] =
  async (parent, args, context): Promise<HistoricalStatsType> => {
    const result = await context.db.feed_monitor_daily_summary.findFirst({
      where: {
        operator_noc: parent.operatorId,
        date_of_journey: args.date,
      },
    });

    return {
      updateFrequency: result?.update_frequency,
      availability: Number(result?.availability ?? 0),
    };
  };

export const getExpectedVehicles: LiveStatsTypeResolvers["expectedVehicles"] = (
  parent,
  _,
  context,
): Promise<number> => {
  return parent.operatorId
    ? getVehicles(parent.operatorId, context.db, VehicleCountType.Expected)
    : Promise.resolve(0);
};

export const getActualVehicles: LiveStatsTypeResolvers["currentVehicles"] = (
  parent,
  _,
  context,
): Promise<number> => {
  return parent.operatorId
    ? getVehicles(parent.operatorId, context.db, VehicleCountType.Actual)
    : Promise.resolve(0);
};

export const getVehicles = async (
  operatorId: string,
  db: PrismaClient,
  type: VehicleCountType,
) => {
  const result = await db.feed_monitor_minute_summary.findFirst({
    where: {
      operator_noc: operatorId,
    },
    orderBy: {
      received_interval: "desc",
    },
    select: {
      actual: type === VehicleCountType.Actual,
      expected: type === VehicleCountType.Expected,
    },
  });

  return result?.actual ?? 0;
};

export const getLast24Hours: LiveStatsTypeResolvers["last24Hours"] = async (
  parent,
  args,
  context,
  info,
): Promise<VehicleStatsType[]> => {
  const result = await context.db.feed_monitor_hourly_summary.findMany({
    where: {
      operator_noc: parent.operatorId,
    },
    select: {
      actual: true,
      expected: true,
      received_interval: true,
    },
    orderBy: {
      received_interval: "asc",
    },
  });

  return result.map((summary) => ({
    timestamp: getFormattedDate(summary.received_interval),
    actual: summary.actual,
    expected: summary.expected,
  }));
};

export const getVehicleStatsByMin: FeedMonitoringTypeResolvers["vehicleStats"] =
  async (parent, args, context, info): Promise<VehicleStatsType[]> => {
    const result = await context.db.feed_monitor_minute_summary.findMany({
      where: {
        operator_noc: parent.operatorId,
        received_interval: {
          gte: args.start,
          lte: args.end,
        },
      },
    });

    return result.map((summary) => ({
      timestamp: getFormattedDate(summary.received_interval),
      expected: summary.expected,
      actual: summary.actual,
    }));
  };

const getEvents: QueryResolvers["events"] =
  async (): Promise<EventResponse> => {
    return {
      items: [],
    };
  };

export const getFeedMonitoringList: OperatorTypeResolvers["feedMonitoring"] =
  async (parent, _, context): Promise<FeedMonitoringType> => {
    if (!parent.operatorId) throw "Parent data not set";
    const feed_summary: feed_monitor_summary | null = await getOperatorWithFeed(
      context.db,
      parent.operatorId,
    );

    return {
      operatorId: parent.operatorId,
      feedStatus: !!feed_summary?.last_outage,
      availability: Number(feed_summary?.availability ?? 0),
      lastOutage: feed_summary?.last_outage,
      unavailableSince: feed_summary?.unavailable_since,
      liveStats: {
        operatorId: parent.operatorId,
        updateFrequency: feed_summary?.update_frequency,
      },
    };
  };

const feedMonitoringResolvers: Resolvers = {
  Query: {
    events: getEvents,
    eventStats: getEventStats,
  },
  OperatorType: {
    feedMonitoring: getFeedMonitoringList,
  },
  FeedMonitoringType: {
    historicalStats: getHistoricalStats,
    vehicleStats: getVehicleStatsByMin,
    liveStats: async (parent) => parent.liveStats ?? {},
  },
  LiveStatsType: {
    currentVehicles: getActualVehicles,
    expectedVehicles: getExpectedVehicles,
    last20Minutes: getVehicleStatsPerOperator,
    last24Hours: getLast24Hours,
  },
};

export default feedMonitoringResolvers;
