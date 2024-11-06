import { getDate, getFormattedDate } from "../lib/dayjs.js";
import {
  ExpectedJourneyType,
  getAvlPoints,
  getExpectedJourneys,
} from "../lib/otp.js";
import {
  EventStatsType, FeedMonitoringTypeResolvers,
  LiveStatsTypeResolvers,
  QueryResolvers,
  Resolvers,
  VehicleStatsType
} from '../types/generated.js';
import { AlertType, getVehicleStats, VechileCountType } from '../lib/feedMonitoring.js';
import { GraphQLResolveInfo } from "graphql";
import { PrismaClient } from '@prisma/client';

export const getEventStats: QueryResolvers['eventStats'] = () => {
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

export const getVehicleStatsPerOperator: LiveStatsTypeResolvers['last20Minutes'] = async (parent, _, context) => {
  const statsDate = getDate()
  let expectedJourneys: ExpectedJourneyType[] = []
  
  if(parent.operatorId){
    expectedJourneys = await getExpectedJourneys(
      context.db,
      parent.operatorId,
      statsDate,
      21
    );

    const avl: Awaited<ReturnType<typeof getAvlPoints>> = await getAvlPoints(
      context.db,
      parent.operatorId,
      statsDate,
      true,
      expectedJourneys.map((journey) => journey.group_id)
    );
    const results = await getVehicleStats(avl, expectedJourneys);

    return results.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  return []
};

export const getLiveStats = async (
  parent,
  db: PrismaClient,
  info: GraphQLResolveInfo
) => {
  const queryName = info.operation.name?.value;
  let last20Mins: Awaited<ReturnType<typeof getAvlPoints>> = [];
  let expected: ExpectedJourneyType[] = [];
  const currentDate = getDate();
  if (queryName === "operatorLiveStatus") {
    [expected, last20Mins] = await Promise.all([
      getExpectedJourneys(db, parent.operatorId, currentDate, 90),
      getAvlPoints(db, parent.operatorId, currentDate, true),
    ]);
  }

  const vechileRefs = new Set<string>();
  const groupIds = new Set(expected.map((journey) => journey.group_id));
  last20Mins = last20Mins.filter((avl) => {
    if (avl.group_id && groupIds.has(avl.group_id)) {
      if (!vechileRefs.has(avl.vehicle_ref)) {
        vechileRefs.add(avl.vehicle_ref);
      }
      return true;
    }

    return false;
  });

  return {
    operatorId: parent.operatorId,
    ...parent.liveStats,
    expectedVehicles: expected.length,
    currentVehicles: vechileRefs.size,
    avl: last20Mins,
    expected: expected,
  };
};

export const getHistoricalStats: FeedMonitoringTypeResolvers['historicalStats'] = async (parent, args, context) => {
  const result = await context.db.feed_monitor_daily_summary.findFirst({
    where: {
      operator_noc: parent.operatorId,
      date_of_journey: args.date,
    },
  });

  return {
    update_frequency: result?.update_frequency,
    availability: Number(result?.availability ?? 0),
  };
};

export const getExpectedVehicles : LiveStatsTypeResolvers['expectedVehicles'] = (parent, _, context) =>{
  return parent.operatorId ? getVehicles(parent.operatorId, context.db, VechileCountType.Expected) : 0
}

export const getActualVehicles : LiveStatsTypeResolvers['currentVehicles'] = (parent, _, context) =>{
  return parent.operatorId ? getVehicles(parent.operatorId, context.db, VechileCountType.Actual) : 0
}

export const getVehicles = async (
  operatorId: string,
  db: PrismaClient,
  type: VechileCountType
) => {
  const result = await db.feed_monitor_minute_summary.findFirst({
    where: {
      operator_noc: operatorId,
    },
    orderBy: {
      received_interval: "desc",
    },
    select: {
      actual: type === VechileCountType.Actual,
      expected: type === VechileCountType.Expected,
    },
  });

  return result?.actual ?? 0;
};

export const getLast24Hours: LiveStatsTypeResolvers['last24Hours'] = async (parent, args, context, info) => {
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

  return result
    .map((summary) => ({
      timestamp: getFormattedDate(summary.received_interval),
      actual: summary.actual,
      expected: summary.expected,
    }));
};

export const getVehicleStatsByMin: FeedMonitoringTypeResolvers['vehicleStats'] = async (parent, args, context, info): Promise<VehicleStatsType[]> => {
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

const getEvents: QueryResolvers['events'] = async () => {
  const currentDate = getDate();
  return {
    items: [
      {
        type: AlertType.VehicleCountDisparityEvent,
        data: {
          message: "Test1",
        },
        timestamp: currentDate.subtract(2, "hour").toISOString(),
      },
      {
        type: AlertType.VehicleCountDisparityEvent,
        data: {
          message: "Test2",
        },
        timestamp: currentDate.subtract(3, "hour").toISOString(),
      },
      {
        type: AlertType.VehicleCountDisparityEvent,
        data: {
          message: "Test3",
        },
        timestamp: currentDate.subtract(4, "hour").toISOString(),
      },
    ]
  };
};

const feedMonitoringResolvers: Resolvers = {
  Query: {
    events: getEvents,
    eventStats: getEventStats,
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
    last24Hours: getLast24Hours
  },
};

export default feedMonitoringResolvers;