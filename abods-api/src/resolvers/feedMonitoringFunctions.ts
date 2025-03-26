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
import { getVehicleCounts } from "../lib/feedMonitoring.js";
import { requireUserSession } from "./helpers.js";
import { getUserOperatorIdsQuery } from "../lib/operators.js";
import dayjs from "dayjs";
import logger from "../logger.js";

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
    const result = await context.db
      .selectFrom("feed_monitor_daily_summary")
      .where("operator_noc", "=", parent.operatorId)
      .select(["availability", "update_frequency"])
      .executeTakeFirst();

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
  if (!parent.operatorId) throw "Invalid data";
  const result = await context.db
    .selectFrom("feed_monitor_hourly_summary")
    .where("operator_noc", "=", parent.operatorId)
    .orderBy("received_interval")
    .select(["actual", "expected", "received_interval"])
    .execute();

  return result.map((summary) => ({
    timestamp: getFormattedDate(summary.received_interval),
    actual: summary.actual,
    expected: summary.expected,
  }));
};

export const getVehicleStatsByMin: FeedMonitoringTypeResolvers["vehicleStats"] =
  async (parent, args, context): Promise<VehicleStatsType[]> => {
    if (!parent.operatorId) throw "Invalid data";
    const result = await context.db
      .selectFrom("feed_monitor_minute_summary")
      .where("operator_noc", "=", parent.operatorId)
      .where("received_interval", ">=", new Date(args.start))
      .where("received_interval", "<=", new Date(args.end))
      .orderBy("received_interval")
      .select(["actual", "expected", "received_interval"])
      .execute();

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
    const operatorId = parent.operatorId;
    if (!operatorId) throw "Parent data not set";
    return await context.db
      .selectFrom("feed_monitor_summary")
      .where("operator_noc", "=", operatorId)
      .select([
        "availability",
        "last_outage",
        "unavailable_since",
        "update_frequency",
      ])
      .executeTakeFirst()
      .then((feed_summary) => ({
        operatorId: operatorId,
        feedStatus: !feed_summary?.unavailable_since,
        availability: Number(feed_summary?.availability ?? 0),
        lastOutage: feed_summary?.last_outage,
        unavailableSince: feed_summary?.unavailable_since,
        liveStats: {
          operatorId: operatorId,
          updateFrequency: feed_summary?.update_frequency,
        },
      }));
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
          context.db,
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

  const summary = context.db
    .selectFrom("feed_monitor_minute_summary")
    .where("date_of_journey", "=", new Date());

  const operatorId = args.operatorId ?? null;

  return summary
    .groupBy("operator_noc")
    .$if(!!operatorId, (qb) => qb.where("operator_noc", "=", operatorId))
    .where("operator_noc", "in", getUserOperatorIdsQuery(context.db, user))
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

    const operator = await context.db
      .selectFrom("all_operators")
      .where("operatorref", "=", args.operatorId)
      .select(["operatorref", "name"])
      .executeTakeFirst();

    if (!operator) {
      throw Error("No operator found");
    }

    return {
      operatorId: operator.operatorref ?? "Unknown",
      nocCode: operator.operatorref ?? "Unknown",
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

    let query = context.db
      .selectFrom("service_details as s")
      .where("s.operator_noc", "in", getUserOperatorIdsQuery(context.db, user))
      .innerJoin("all_operators as a", "a.operatorref", "s.operator_noc");
    if (args.filterBy && (args.filterBy.operatorIds.length ?? 0) > 0) {
      query = query.where("s.operator_noc", "in", args.filterBy.operatorIds);
    }
    return await query
      .groupBy(["a.name", "s.operator_noc"])
      .select("name")
      .select("operator_noc")
      .orderBy("name")
      .execute()
      .then((x) =>
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
