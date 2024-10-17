import { all_operators, feed_monitoring_hour_summary, Prisma, SiriVMPositions } from '@prisma/client';
import { Context } from '../context';
import {
  FeedMonitoringType,
  HistoricalStatsType,
  PerformanceInputType,
  PunctualityTotalsType,
  SessionUser,
  VehicleStatsType,
} from '../types';
import { getOperators } from '../resolvers/otp/otpFunctions.js';
import { getDayOfWeekNumbers, isDefined } from './utils.js';
import { Dayjs } from 'dayjs';
import { getDate, getFormattedDate, getHourFormattedDate, isSameOrAfter, isSameOrBefore } from './dayjs.js';

export type AllOperatorWithFeedSummary = all_operators & {
  feed_summary: feed_monitoring_hour_summary[];
};

export type ExpectedJourneyType = {
  group_id: string
  expected_journey_start: Date
  expected_journey_end: Date | null
}

const getThresholds = async (
  db: Context,
  where: Prisma.timetable_threshold_summaryWhereInput,
) => {
  const whereCopy = { ...where };

  const result = db.prisma.timetable_threshold_summary.aggregate({
    _sum: {
      otp_count: true,
    },
    where: whereCopy,
  });

  return result;
};

const aggThresholds = async (
  db: Context,
  whereEarly: Prisma.timetable_threshold_summaryWhereInput,
  whereLate: Prisma.timetable_threshold_summaryWhereInput,
  whereOnTime: Prisma.timetable_threshold_summaryWhereInput,
) => {
  const earlyCall = getThresholds(db, whereEarly);
  const lateCall = getThresholds(db, whereLate);
  const onTimeCall = getThresholds(db, whereOnTime);

  const [early, late, onTime] = await Promise.all([
    earlyCall,
    lateCall,
    onTimeCall,
  ]);

  return {
    early: early._sum.otp_count ?? 0,
    late: late._sum.otp_count ?? 0,
    onTime: onTime._sum.otp_count ?? 0,
  };
};

export const compareThresholds = async (
  inputs: PerformanceInputType,
  sessionUser: SessionUser,
  db: Context,
): Promise<PunctualityTotalsType | null> => {
  const { fromTimestamp, toTimestamp, filters } = inputs;

  const {
    timingPointsOnly,
    onTimeMaxMinutes,
    onTimeMinMinutes,
    adminAreaIds,
    operatorIds,
    dayOfWeekFlags,
    startTime,
    endTime,
    maxDelay,
    minDelay,
    lineIds,
  } = filters ?? {};

  const operators = await getOperators(sessionUser, db);

  if (!operators) {
    throw 'No user operators';
  }

  const userOperatorIds = operators.map((o) => o.nocCode);

  let opIds: string[] | undefined = operatorIds
    ? operatorIds?.filter(isDefined)
    : undefined;

  let adminIds: string[] | undefined = adminAreaIds
    ? adminAreaIds?.filter(isDefined)
    : undefined;

  const where: Prisma.timetable_threshold_summaryWhereInput = {
    operator_noc: {
      in: opIds ? opIds : userOperatorIds,
    },
    date_of_journey: {
      gt: new Date(fromTimestamp),
      lte: new Date(toTimestamp),
    },
  };

  if (timingPointsOnly) {
    where.is_timing_point = timingPointsOnly;
  }

  if (lineIds && lineIds.length > 0) {
    where.noc_and_line_and_servicecode = {
      in: lineIds?.filter(isDefined),
    };
  }

  if (adminIds && adminIds.length > 0) {
    where.admin_areas = {
      hasEvery: adminIds.map(Number),
    };
  }

  // parse startime and endtime minutes/hours
  let start = new Date();
  let end = new Date();

  const departure_hour: {
    gte?: Date;
    lte?: Date;
  } = {};

  if (startTime) {
    const [hours, minutes, seconds] = startTime.split(':').map(Number);
    start.setHours(hours);
    start.setMinutes(minutes);
    departure_hour.gte = start;
  }

  if (endTime) {
    const [hours, minutes, seconds] = endTime.split(':').map(Number);
    end.setHours(hours);
    end.setMinutes(minutes);
    departure_hour.lte = end;
  }

  if (departure_hour.gte || departure_hour.lte) {
    where.departure_hour = departure_hour;
  }

  const timeDifference: {
    time_diff_minutes: {
      lt?: number;
      gt?: number;
      lte?: number;
      gte?: number;
    };
  }[] = [];

  if (minDelay) {
    timeDifference.push({
      time_diff_minutes: {
        gte: minDelay,
      },
    });
  }

  if (maxDelay) {
    timeDifference.push({
      time_diff_minutes: {
        lte: maxDelay,
      },
    });
  }

  let dayOfWeekNumbers: number[] = [];
  if (dayOfWeekFlags) {
    dayOfWeekNumbers = getDayOfWeekNumbers(dayOfWeekFlags);
    where.day_of_week = { in: dayOfWeekNumbers } 
  }

  if (onTimeMinMinutes && onTimeMaxMinutes) {
    const earlyTimeDifference = [
      ...timeDifference,
      {
        time_diff_minutes: {
          lt: onTimeMinMinutes,
        },
      },
    ];
    const whereEarly: Prisma.timetable_threshold_summaryWhereInput = {
      ...where,
      AND: earlyTimeDifference,
    };

    const lateTimeDifference = [
      ...timeDifference,
      {
        time_diff_minutes: {
          gte: onTimeMaxMinutes,
        },
      },
    ];
    const whereLate: Prisma.timetable_threshold_summaryWhereInput = {
      ...where,
      AND: lateTimeDifference,
    };

    const ontimeDifference = [
      ...timeDifference,
      {
        time_diff_minutes: {
          gte: onTimeMinMinutes,
          lt: onTimeMaxMinutes,
        },
      },
    ];
    const whereOntime: Prisma.timetable_threshold_summaryWhereInput = {
      ...where,
      AND: ontimeDifference,
    };

    const results = await aggThresholds(db, whereEarly, whereLate, whereOntime);

    return {
      ...results,
      scheduled: 0,
      completed: 0,
      averageDeviation: 0,
    };
  }

  return null;
};

export const getOperatorsFromOrgId = async (
  orgId: number[],
  db: Context,
  userOperatorIds?: string[]
) => {
  const where: Prisma.bods_organisationoperatorWhereInput = {
    organisation_id: {
      in: orgId,
    },
  };

  if (userOperatorIds && userOperatorIds.length > 0) {
    where.operatorref = {
      in: userOperatorIds,
    };
  } else {
    where.operatorref = {
      not: undefined,
    };
  }

  return db.prisma.bods_organisationoperator.findMany({
    where: where,
    select: {
      operatorref: true,
    },
    distinct: ["operatorref"],
  });
};

export const getOperatorsFroServiceDetails = async (
  orgOperators: { operatorref: string }[],
  db: Context,
) => {
  return db.prisma.service_details.findMany({
    where: {
      operator_noc: {
        in: orgOperators.map((operator) => operator.operatorref),
      },
    },
    select: {
      operator_noc: true,
      operator: {
        select: {
          name: true,
        },
      },
    },
    distinct: ['operator_noc'],
  });
};

export const getNocAdminAreas = async (db: Context) => {
  return db.prisma.noc_adminarea.findMany({
    include: {
      admin_area: true
    }
  })
}

export const getOperatorWithFeed = (db: Context, operatorRefs: string) => {
  return db.prisma.all_operators.findUnique({
    where: {
      feed_summary: {
        some: {},
      },
      operatorref: operatorRefs,
    },
    include: {
      feed_summary: true,
    },
  });
};

export const getGQLFormatterOperatorData = async  (
  operator: AllOperatorWithFeedSummary | null
): Promise<FeedMonitoringType> => {
  let total_actual_journeys_per_minute = 0;
  let total_expected_journey_per_minute = 0;
  let total_actual_journeys_per_minute_total = 0;
  let total_actual_live_location_positions_per_minute = 0;
  let lastOutage: Dayjs = getDate("1970-01-01");
  let unavailable: Dayjs = getDate("1970-01-01");
  let updateFreq = 0;

  const historicStats: HistoricalStatsType = {
    vehicleStats: [],
  };
  const last24hrs: VehicleStatsType[] = [];
  
  if (operator) {
    operator.feed_summary.map((feed) => {
      total_actual_journeys_per_minute += feed.actual_journeys_per_minute
      total_expected_journey_per_minute += feed.expected_journey_per_minute

      const tmpOutage = feed.last_outage
        ? getDate(feed.last_outage)
        : undefined;
      if (tmpOutage && lastOutage.isBefore(tmpOutage)) {
        lastOutage = tmpOutage;
      }

      const tmpUnavailable = feed.unavailable_since
        ? getDate(feed.unavailable_since)
        : undefined;

      if (tmpUnavailable && unavailable.isBefore(tmpUnavailable)) {
        unavailable = tmpUnavailable;
      }

      total_actual_journeys_per_minute_total += feed.actual_journeys_per_minute_total 
      total_actual_live_location_positions_per_minute += feed.actual_live_location_positions_per_minute

      if (
        feed.actual_journeys_per_minute > 0 ||
        feed.expected_journey_per_minute > 0
      ) {
        last24hrs.push({
          timestamp: getHourFormattedDate(feed.received_hour),
          actual: feed.actual_journeys_per_minute,
          expected: feed.expected_journey_per_minute,
        });
      }
    });
  } 

  if (total_actual_live_location_positions_per_minute > 0) {
    updateFreq =
      (
        total_actual_journeys_per_minute_total /
        total_actual_live_location_positions_per_minute
      ) * 60;
  }
  
  return {
    availability:
      total_expected_journey_per_minute > 0
        ? total_actual_journeys_per_minute / total_expected_journey_per_minute
        : 0,
    feedStatus: getFeedStatus(unavailable, lastOutage),
    historicalStats: historicStats,
    lastOutage: lastOutage.isSame("1970-01-01")
      ? undefined
      : getFormattedDate(lastOutage.toDate()),
    unavailableSince: unavailable.isSame("1970-01-01")
      ? undefined
      : getFormattedDate(unavailable.toDate()),
    vehicleStats: [],
    liveStats: {
      updateFrequency: Math.round(updateFreq),
      last24Hours: last24hrs,
      last20Minutes: [],
    },
  };
};

export const getFeedMonitoringList = async (
  db: Context,
  sessionUser: SessionUser,
  userOperatorId: string
) => {
  if (!sessionUser.userOrganisationIDs) {
    throw "No organisation mapped to user";
  }

  const operator: AllOperatorWithFeedSummary | null = await getOperatorWithFeed(
    db,
    userOperatorId
  );

  return getGQLFormatterOperatorData(operator);
};

const getFeedStatus = (unavailable: Dayjs | undefined, lastOutage: Dayjs | undefined): boolean => {
  let feedStatus = false
  if(unavailable){
    if(!lastOutage || lastOutage?.isBefore(unavailable)) {
      feedStatus = true
    }
  }

  return feedStatus
}

export const getExpectedJourneys = async (
  db: Context,
  operatorId: string,
  inputDate: Dayjs,
  duration?: number
) => {
  const where: Prisma.expected_journeysWhereInput = {
    operator_noc: operatorId,
    date_of_journey: inputDate.toDate(),
  };

  if (duration) {
    where.expected_journey_start = {
      lt: inputDate.toDate(),
    };

    where.expected_journey_end = {
      gte: inputDate.subtract(duration, "minute").toDate(),
    };
  }

  return db.prisma.expected_journeys.findMany({
    where: where,
    select: {
      group_id: true,
      expected_journey_start: true,
      expected_journey_end: true,
    },
    distinct: ["group_id"],
  });
};

export const getAvlPoints = async (
  db: Context,
  operatorId: string,
  inputDate: Dayjs,
  last20Mins?: boolean,
  groupIds?: string[]
) => {
  const where: Prisma.SiriVMPositionsWhereInput = {
    date_of_journey: inputDate.toDate(),
    operator_ref: operatorId,
  };

  if (last20Mins) {
    where.recorded_at_time = {
      gt: inputDate.subtract(21, "minute").toDate(), // 21 mins to ensure no partial loss of data
    };
  }

  if (groupIds && groupIds.length > 0) {
    where.group_id = {
      in: groupIds,
    };
  }

  return db.prisma.siriVMPositions.findMany({
    where: where,
  });
};

export const getAvlPerMinute = async (avl: SiriVMPositions[]) => {
  const journeys = new Map<string, Set<string>>()
  avl.map((avl) => {
    const recordedAt = 
      getDate(avl.recorded_at_time)
        .set("second", 0)
        .set("millisecond", 0)
        .toISOString()
    const journey = journeys.get(recordedAt) || new Set()
    if ( 
      !journey.has(avl.group_id)
    ) {
      journey.add(avl.group_id)
      journeys.set(recordedAt, journey)
    }
  });

  return journeys;
};

export const getExpectedJourneysCount = async (
  expected: ExpectedJourneyType[],
  date: Dayjs
) => {
  let expectedCount = 0;
  expected.map((journey) => {
    const journeyStart = getDate(journey.expected_journey_start);
    const journeyEnd = getDate(journey.expected_journey_end);

    if (isSameOrAfter(journeyEnd, date) && isSameOrBefore(journeyStart, date)) {
      expectedCount++;
    }
  });

  return expectedCount;
};