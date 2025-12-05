import { getFormattedDate } from "../lib/dayjs.js";
import {
  EventResponse,
  EventStatsType,
  FeedMonitoringType,
  FeedMonitoringTypeResolvers,
  LiveStatsType,
  HistoricalStatsType,
  LiveStatsTypeResolvers,
  QueryResolvers,
  Resolvers,
  VehicleStatsType,
  DashboardVehicles,
  Maybe,
  OperatorFeedMonitoring,
  OperatorFeedMonitoringResolvers,
} from "../types/generated.js";
import {
  getOperatorWithFeed,
  getVehicleCounts,
} from "../lib/feedMonitoring.js";
import { feed_monitor_summary } from "@prisma/client";
import { requireUserSession } from "./helpers.js";
import { getUserOperatorIdsQuery } from "../lib/operators.js";
import dayjs from "dayjs";
import logger from "../logger.js";
import { executeQuery } from "../lib/dbKysely.js";

export const getEventStats: QueryResolvers["eventStats"] =
  (): EventStatsType[] => {
    const eventStats: EventStatsType[] = [];
    // Get data for the previous 90 days before today
    const currentTime = dayjs();
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

export const getLast24Hours: LiveStatsTypeResolvers["last24Hours"] = async (
  parent,
  _,
  context,
): Promise<VehicleStatsType[]> => {
  if (!parent.operatorId) throw Error("Invalid data");
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
    if (!parent.operatorId) throw Error("Invalid data");
    const result = await context.db.feed_monitor_minute_summary.findMany({
      where: {
        operator_noc: parent.operatorId,
        received_interval: {
          gte: args.start,
          lte: args.end,
        },
      },
      orderBy: {
        received_interval: "asc",
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

export const getFeedMonitoringList: OperatorFeedMonitoringResolvers["feedMonitoring"] =
  async (parent, _, context): Promise<FeedMonitoringType> => {
    if (!parent.operatorId) throw Error("Parent data not set");
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
    const finalEndTime = dayjs().startOf("minute");
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

export const getOperator: QueryResolvers["operatorFeedMonitoring"] = async (
  _,
  args,
  context,
): Promise<Maybe<OperatorFeedMonitoring>> => {
  await requireUserSession(context);
  try {
    // TODO: is operator id in users' operator id array
    logger.debug({ operatorId: args.operatorId }, "getOperator");

    const operator = await context.db.all_operators.findUnique({
      where: {
        operatorref: args.operatorId,
      },
    });

    if (!operator) {
      throw Error("No operator found");
    }

    return {
      operatorId: operator.operatorref,
      nocCode: operator.operatorref,
      name: operator.name ?? "Unknown",
    };
  } catch (error) {
    logger.error(error, "An error occurred when getting operator info");
    return null;
  }
};

export const getOperatorList: QueryResolvers["operatorsFeedMonitoring"] =
  async (_, args, context): Promise<OperatorFeedMonitoring[]> => {
    const user = await requireUserSession(context);

    let query = context.kysely
      .selectFrom("service_details as s")
      .where(
        "s.operator_noc",
        "in",
        getUserOperatorIdsQuery(context.kysely, user),
      )
      .innerJoin("all_operators as a", "a.operatorref", "s.operator_noc");
    if (
      args.filterBy?.operatorIds &&
      (args.filterBy.operatorIds.length ?? 0) > 0
    ) {
      query = query.where("s.operator_noc", "in", args.filterBy.operatorIds);
    }
    const mainQuery = query
      .groupBy(["a.name", "s.operator_noc"])
      .select("name")
      .select("operator_noc")
      .orderBy("name");

    return executeQuery(mainQuery).then((x) =>
      x.map((o) => ({
        name: o.name ?? "",
        operatorId: o.operator_noc ?? "",
        nocCode: o.operator_noc ?? "",
      })),
    );
  };

const feedMonitoringResolvers: Resolvers = {
  Query: {
    events: getEvents,
    eventStats: getEventStats,
    dashboardVehicles: getDashboardVehicles,
    operatorFeedMonitoring: getOperator,
    operatorsFeedMonitoring: getOperatorList,
  },
  OperatorFeedMonitoring: {
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
