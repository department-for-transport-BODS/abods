import { getDate, getFormattedDate } from "../lib/dayjs.js";
import {
  AlertTypeEnum,
  EventStatsType,
  FeedMonitoringTypeResolvers,
  LiveStatsType,
  LiveStatsTypeResolvers,
  Maybe,
  OperatorTypeResolvers,
  QueryResolvers,
  Resolvers,
  VehicleStatsType,
} from "../types/generated.js";
import {
  ExpectedJourneyType,
  getAvlPoints,
  getExpectedJourneys,
  getMinuteExpectedJourney,
  getOperatorWithFeed,
  getVehicleStats,
  VehicleCountType,
} from "../lib/feedMonitoring.js";
import { feed_monitor_summary, PrismaClient } from "@prisma/client";

export const getEventStats: QueryResolvers["eventStats"] = () => {
  const eventStats: EventStatsType[] = [];
  let startdate = getDate().subtract(90, "day");

  while (!startdate.isAfter(getDate())) {
    eventStats.push({
      count: 0,
      day: startdate.format("YYYY-MM-DD"),
    });

    startdate = startdate.add(1, "day");
  }
  return eventStats;
};

export const getFeedMonitoringVehicleStats = async (
  db: PrismaClient,
  operatorId: string,
  duration: number
) => {
  const statsDate = getDate();
  let expectedJourneys: ExpectedJourneyType[] = [];
  expectedJourneys = await getExpectedJourneys(
    db,
    operatorId,
    statsDate,
    duration
  );

  const avl: Awaited<ReturnType<typeof getAvlPoints>> = await getAvlPoints(
    db,
    operatorId,
    statsDate,
    duration,
    expectedJourneys.map((journey) => journey.group_id)
  );
  const results = await getVehicleStats(avl, expectedJourneys);

  return results.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};


export const getVehicleStatsPerOperator: LiveStatsTypeResolvers["last20Minutes"] =
  async (parent, _, context, __, duration?: number) => {
    if (parent.operatorId) {
      return getFeedMonitoringVehicleStats(context.db, parent.operatorId, 21);
    }

    return [];
  };

export const getHistoricalStats: FeedMonitoringTypeResolvers["historicalStats"] =
  async (parent, args, context) => {
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

  if(type === VehicleCountType.Actual){
    return result?.actual ?? 0;
  }
  return result?.expected ?? 0;
};

export const getLast24Hours: LiveStatsTypeResolvers["last24Hours"] = async (
  parent,
  args,
  context,
  info,
) => {
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

const getEvents: QueryResolvers["events"] = async () => {
  return {
    items: [],
  };
};

export const getFeedMonitoringList: OperatorTypeResolvers["feedMonitoring"] =
  async (parent, _, context) => {
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

export const getLiveStats: OperatorTypeResolvers["liveStats"] = async (
  parent,
  _,
  context
): Promise<LiveStatsType> => {
  const result = await getFeedMonitoringVehicleStats(
    context.db,
    parent.operatorId,
    1
  );
  return {
    currentVehicles: result[0].actual ?? 0,
    expectedVehicles: result[0].expected ?? 0,
    ...parent.liveStats,
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
    liveStats: getLiveStats,
  },
  LiveStatsType: {
    last20Minutes: getVehicleStatsPerOperator,
    last24Hours: getLast24Hours,
  },
};

export default feedMonitoringResolvers;
