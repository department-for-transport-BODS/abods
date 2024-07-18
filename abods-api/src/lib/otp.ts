import { Prisma } from '@prisma/client';
import { Context } from '../context';
import {
  PerformanceInputType,
  PunctualityTotalsType,
  SessionUser,
} from '../types';
import { getOperators } from '../resolvers/otp/otpFunctions.js';
import { isDefined } from './utils.js';

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

  if (lineIds) {
    where.noc_and_line_and_servicecode = {
      in: lineIds?.filter(isDefined),
    };
  }

  if (adminIds) {
    where.admin_area_id = {
      in: adminIds.map(Number),
    };
  }

  if (onTimeMinMinutes && onTimeMaxMinutes) {
    const whereEarly: Prisma.timetable_threshold_summaryWhereInput = {
      ...where,
      time_diff_minutes: {
        lt: onTimeMinMinutes,
      },
    };

    const whereLate: Prisma.timetable_threshold_summaryWhereInput = {
      ...where,
      time_diff_minutes: {
        gt: onTimeMaxMinutes,
      },
    };

    const whereOntime: Prisma.timetable_threshold_summaryWhereInput = {
      ...where,
      time_diff_minutes: {
        gte: onTimeMinMinutes,
        lte: onTimeMaxMinutes,
      },
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
