import { all_operators, feed_monitor_summary, Prisma, SiriVMPositions } from '@prisma/client';
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
  feed_summary: feed_monitor_summary[];
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

  return operator?.feed_summary.map((feed) => ({
    feedStatus: !!feed.last_outage,
    availability: Number(feed.availability),
    lastOutage: feed.last_outage,
    unavailableSince: feed.unavailable_since,
    liveStats: {
      updateFrequency: feed.update_frequency,
    },
  }));
};

const getFeedStatus = (
  unavailable: Date | null,
  lastOutage: Date | null
): boolean => {
  let feedStatus = false;
  if (unavailable) {
    if (!lastOutage || getDate(lastOutage)?.isBefore(getDate(unavailable))) {
      feedStatus = true;
    }
  }

  return feedStatus;
};

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
  const currentDate = new Date()
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
    select: {
      recorded_at_time: true,
      group_id: true,
      vehicle_ref: true
    }
  });
};

export const getAvlPerMinute = async (avl: { group_id: string; recorded_at_time: Date; vehicle_ref: string;}[]) => {
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