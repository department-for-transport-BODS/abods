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
  DashboardVehicles,
} from "../types/generated.js";
import {
  getOperatorWithFeed,
  getVehicleCounts,
  VehicleCountType,
} from "../lib/feedMonitoring.js";
import { feed_monitor_summary, PrismaClient } from "@prisma/client";
import { requireUserSession } from "./helpers.js";
import { getUserOperatorIdsQuery } from "../lib/operators.js";

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
  _,
  context,
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
  async (parent, args, context): Promise<VehicleStatsType[]> => {
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

const getEvents: QueryResolvers["events"] = (): EventResponse => ({
  items: [],
});

export const getFeedMonitoringList: OperatorTypeResolvers["feedMonitoring"] =
  async (parent, _, context): Promise<FeedMonitoringType> => {
    if (!parent.operatorId) throw "Parent data not set";
    const feed_summary: feed_monitor_summary | null = await getOperatorWithFeed(
      context.db,
      parent.operatorId,
    );

    return {
      operatorId: parent.operatorId,
      feedStatus: !feed_summary?.unavailable_since,
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
  if (queryName === "operatorLiveStatus") {
    const finalEndTime = getDate().startOf("minute");
    const promises: Promise<VehicleStatsType>[] = [];
    for (let offset = 0; offset < 20; offset++) {
      const endTime = finalEndTime.subtract(offset, "minute");
      const startTime = endTime.subtract(1, "minute").toDate();
      promises.push(
        getVehicleCounts(
          context.kysely,
          parent.operatorId,
          startTime,
          endTime.toDate(),
        ).then((n) => {
          return {
            actual: n.length > 0 ? n[0].actual : 0,
            expected: n.length > 0 ? n[0].expected : 0,
            timestamp: startTime.toISOString(),
          };
        }),
      );
    }
    result = await Promise.all(promises).then((n) =>
      n.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      ),
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

const getDashboardVehicles: QueryResolvers["dashboardVehicles"] = async (
  _,
  args,
  context,
): Promise<DashboardVehicles[]> => {
  const user = await requireUserSession(context);

  const summary = context.kysely
    .selectFrom("feed_monitor_minute_summary")
    .where("date_of_journey", "=", new Date());

  const operatorId = args.operatorId ?? null;

  return summary
    .groupBy("operator_noc")
    .$if(!!operatorId, (qb) => qb.where("operator_noc", "=", operatorId))
    .where("operator_noc", "in", getUserOperatorIdsQuery(context.kysely, user))
    .where(
      "received_interval",
      "=",
      summary.select(({ fn }) =>
        fn.max("received_interval").as("latest_timestamp"),
      ),
    )
    .select(({ fn, eb }) => [
      "operator_noc as operatorId",
      eb.cast<number>(fn.sum("expected"), "integer").as("expected"),
      eb.cast<number>(fn.sum("actual"), "integer").as("actual"),
    ])
    .execute();
};

const feedMonitoringResolvers: Resolvers = {
  Query: {
    events: getEvents,
    eventStats: getEventStats,
    dashboardVehicles: getDashboardVehicles,
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
