import { Context } from "../../context.js";
import { getDate, getFormattedDate, isSameOrBefore } from "../../lib/dayjs.js";
import {
  ExpectedJourneyType,
  getAvlPoints,
  getExpectedJourneys,
} from "../../lib/otp.js";
import { EventStatsType } from "../../types/generated.js";
import { getVehicleStats, VechileCountType } from "../../lib/feedMonitoring.js";
import { GraphQLResolveInfo } from "graphql";
import { Dayjs } from "dayjs";

export const getEventStats = (): EventStatsType[] => {
  const eventStats: EventStatsType[] = [];
  let startdate = getDate().subtract(90, "day");

  while (isSameOrBefore(startdate, getDate())) {
    eventStats.push({
      count: 0,
      day: startdate.toDate(),
    });

    startdate = startdate.add(1, "day");
  }
  return eventStats;
};

export const getVehicleStatsPerOperator = async (
  db: Context,
  operatorId: string,
  statsDate: Dayjs
) => {
  const expectedJourneys: ExpectedJourneyType[] = await getExpectedJourneys(
    db,
    operatorId,
    statsDate,
    21
  );

  const avl: {
    group_id: string;
    recorded_at_time: Date;
    vehicle_ref: string;
  }[] = await getAvlPoints(
    db,
    operatorId,
    statsDate,
    false,
    expectedJourneys.map((journey) => journey.group_id)
  );
  const results = await getVehicleStats(avl, expectedJourneys);
  return results.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

export const getLiveStats = async (
  parent,
  db: Context,
  info: GraphQLResolveInfo
) => {
  const queryName = info.operation.name?.value;
  let last20Mins: {
    group_id: string;
    recorded_at_time: Date;
    vehicle_ref: string;
  }[] = [];
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
    if (groupIds.has(avl.group_id)) {
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

export const getHistoricalStats = async (
  operatorId: string,
  date: Date,
  db: Context
) => {
  const result = await db.prisma.feed_monitor_daily_summary.findFirst({
    where: {
      operator_noc: operatorId,
      date_of_journey: date,
    },
  });

  return {
    update_frequency: result?.update_frequency,
    availability: result?.availability,
  };
};

export const getVehicles = async (
  operatorId: string,
  db: Context,
  type: VechileCountType
) => {
  const result = await db.prisma.feed_monitor_minute_summary.findFirst({
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

  return result?.actual;
};

export const getLast24Hours = async (operatorId: string, db: Context) => {
  const result = await db.prisma.feed_monitor_hourly_summary.findMany({
    where: {
      operator_noc: operatorId,
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

export const getVehicleStatsByMin = async (
  operatorId: string,
  start: Date,
  end: Date,
  db: Context
) => {
  const result = await db.prisma.feed_monitor_minute_summary.findMany({
    where: {
      operator_noc: operatorId,
      received_interval: {
        gte: start,
        lte: end,
      },
    },
  });

  result.map((summary) => ({
    timestamp: getFormattedDate(summary.received_interval),
    expected: summary.expected,
    actual: summary.actual,
  }));
};
