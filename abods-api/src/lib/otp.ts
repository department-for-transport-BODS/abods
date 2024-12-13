import { Prisma, PrismaClient } from "@prisma/client";
import {
  EstimatedToggle,
  PerformanceInputType,
  PunctualityTotalsType,
} from "../types/generated.js";
import { getDayOfWeekNumbers } from "./utils.js";
import { utcToBstDBInput } from "./dayjs.js";
import { getPrismaFiltersForOTPQuery } from "../resolvers/otpFunctions.js";

const getThresholds = async (
  db: PrismaClient,
  where: Prisma.timetable_threshold_summaryWhereInput,
) => {
  const whereCopy = { ...where };

  const result = db.timetable_threshold_summary.aggregate({
    _sum: {
      otp_count: true,
    },
    where: whereCopy,
  });

  return result;
};

const aggThresholds = async (
  db: PrismaClient,
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
  userOperatorIds: string[],
  db: PrismaClient,
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
    estimated,
  } = filters ?? {};

  const opIds = operatorIds ?? undefined;
  const adminIds = adminAreaIds ?? undefined;

  const where: Prisma.timetable_threshold_summaryWhereInput = {
    operator_noc: {
      in: opIds ? opIds : userOperatorIds,
    },
    date_of_journey: {
      gte: utcToBstDBInput(fromTimestamp),
      lt: utcToBstDBInput(toTimestamp),
    },
  };

  if (estimated === EstimatedToggle.Evidenced) {
    where.estimated = false;
  }

  if (timingPointsOnly) {
    where.is_timing_point = timingPointsOnly;
  }

  if (lineIds && lineIds.length > 0) {
    where.noc_and_line_and_servicecode = {
      in: lineIds,
    };
  }

  if (adminIds && adminIds.length > 0) {
    where.admin_areas = {
      hasEvery: adminIds.map(Number),
    };
  }

  // parse startime and endtime minutes/hours
  const start = new Date();
  const end = new Date();

  const departure_hour: {
    gte?: Date;
    lte?: Date;
  } = {};

  if (startTime) {
    const [hours, minutes, _] = startTime.split(":").map(Number);
    start.setHours(hours, minutes, 0, 0);
    departure_hour.gte = start;
  }

  if (endTime) {
    const [hours, minutes, _] = endTime.split(":").map(Number);
    end.setHours(hours, minutes, 0, 0);
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
    where.day_of_week = { in: dayOfWeekNumbers };
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
  orgId: number,
  db: PrismaClient,
  userOperatorIds?: string[],
) => {
  const where: Prisma.bods_organisationoperatorWhereInput = {
    organisation_id: orgId,
  };

  if (userOperatorIds && userOperatorIds.length > 0) {
    where.operatorref = {
      in: userOperatorIds,
    };
  }

  return db.bods_organisationoperator.findMany({
    where: where,
    select: {
      operatorref: true,
    },
    distinct: ["operatorref"],
  });
};

export const getOperatorsFroServiceDetails = async (
  orgOperators: { operatorref: string }[],
  db: PrismaClient,
) => {
  return db.service_details.findMany({
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
    distinct: ["operator_noc"],
  });
};

export const getNocAdminAreas = async (db: PrismaClient) => {
  return db.noc_adminarea.findMany({
    include: {
      admin_area: true,
    },
  });
};
