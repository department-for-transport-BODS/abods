import { getDate, getFormattedDate } from "../lib/dayjs.js";
import {
  EventResponse,
  EventStatsType,
  FeedMonitoringType,
  FeedMonitoringTypeResolvers,
  LiveStatsType,
  HistoricalStatsType,
  LiveStatsTypeResolvers,
  OperatorTypeResolvers,
  QueryResolvers,
  Resolvers,
  VehicleStatsType,
} from "../types/generated.js";
import {
  getAvlDetails,
  getActualGroupIds,
  getExpectedJourneys,
  getExpectedGroupIds,
  getOperatorWithFeed,
  getVehicleStats,
  VehicleCountType,
} from "../lib/feedMonitoring.js";
import { feed_monitor_summary, PrismaClient } from "@prisma/client";
import { Dayjs } from "dayjs";

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

const getStartAndEndTimes = (durationInMinutes: number): [Dayjs, Dayjs] => {
  const endTime = getDate().startOf("minute");
  const startTime = endTime.subtract(durationInMinutes, "minute");
  return [startTime, endTime];
};

export const getFeedMonitoringVehicleStats = async (
  db: PrismaClient,
  operatorId: string,
): Promise<VehicleStatsType[]> => {
  // 20 minutes of data expected in frontend
  const [startTime, endTime] = getStartAndEndTimes(20);

  const [expectedJourneys, avl] = await Promise.all([
    getExpectedJourneys(db, operatorId, startTime.toDate(), endTime.toDate()),
    getAvlDetails(db, operatorId, startTime.toDate(), endTime.toDate()),
  ]);
  return getVehicleStats(avl, expectedJourneys, startTime, endTime).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
};

export const getPreviousMinuteFeedMonitoringVehicleStats = async (
  db: PrismaClient,
  operatorId: string,
): Promise<VehicleStatsType[]> => {
  const [startTime, endTime] = getStartAndEndTimes(1);

  const [expectedJourneys, avl] = await Promise.all([
    getExpectedGroupIds(db, operatorId, startTime.toDate(), endTime.toDate()),
    getActualGroupIds(db, operatorId, startTime.toDate(), endTime.toDate()),
  ]);

  const setExp = new Set(expectedJourneys.map((j) => j.group_id));
  return [
    {
      timestamp: startTime.toISOString(),
      actual: avl.filter((j) => setExp.has(j.group_id ?? "")).length,
      expected: expectedJourneys.length,
    },
  ];
};

export const getHistoricalStats: FeedMonitoringTypeResolvers["historicalStats"] =
  async (parent, args, context): Promise<HistoricalStatsType> => {
    if (!parent.operatorId) throw "Invalid data";
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

  if (type === VehicleCountType.Actual) {
    return result?.actual ?? 0;
  }
  return result?.expected ?? 0;
};

export const getLast24Hours: LiveStatsTypeResolvers["last24Hours"] = async (
  parent,
  args,
  context,
  info,
): Promise<VehicleStatsType[]> => {
  if (!parent.operatorId) throw "Invalid data";
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
    if (!parent.operatorId) throw "Invalid data";
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

export const getLiveStats: FeedMonitoringTypeResolvers["liveStats"] = async (
  parent,
  _,
  context,
  info,
): Promise<LiveStatsType> => {
  if (!parent.operatorId) throw "Invalid data";
  const queryName = info.operation.name?.value;

  let result: VehicleStatsType[] = [];
  if (queryName === "dashboardOperatorVehicleCountsList") {
    result = await getFeedMonitoringVehicleStats(context.db, parent.operatorId);
  }
  if (queryName === "operatorLiveStatus") {
    result = await getPreviousMinuteFeedMonitoringVehicleStats(
      context.db,
      parent.operatorId,
    );
  }

  return {
    ...parent.liveStats,
    operatorId: parent.operatorId,
    currentVehicles:
      result.length > 0 ? result[result.length - 1].actual ?? 0 : 0,
    expectedVehicles:
      result.length > 0 ? result[result.length - 1].expected ?? 0 : 0,
    last20Minutes: result,
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
    last24Hours: getLast24Hours,
  },
};

export default feedMonitoringResolvers;
