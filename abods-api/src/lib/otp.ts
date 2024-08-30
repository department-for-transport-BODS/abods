import { Prisma } from '@prisma/client';
import { Context } from '../context';
import {
  PerformanceInputType,
  PunctualityTotalsType,
  SessionUser,
} from '../types';
import { getOperators } from '../resolvers/otp/otpFunctions.js';
import { getDayOfWeekNumbers, isDefined } from './utils.js';

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
          gt: onTimeMaxMinutes,
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

export const getOperatorsFromOrgId = async (orgId: number[], db: Context) => {

  return db.prisma.bods_organisationoperator.findMany({
    where: {
      AND: [
        {
          organisation_id: {
            in: orgId,
          },
        },
        {
          operatorref: {
            not: undefined,
          },
        }
      ],
    },
    select: {
      operatorref: true,
    },
    distinct: ['operatorref'],
  });
}

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