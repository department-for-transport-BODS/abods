import {
  FrequentServiceInfoInputType,
  HeadwayInputType,
  HeadwayTimeSeriesType,
  LineType,
  OperatorPerformanceType,
  OperatorType,
  PaginatedLineType,
  PerformanceInputType,
  PunctualityTimeOfDayType,
  PunctualityTimeSeriesType,
  RankingOrder,
  ServicePerformanceType,
  StopPerformanceType,
  HeadwayMetricsTypeResolvers,
  OnTimePerformanceTypeResolvers,
  QueryResolvers,
  Resolvers,
  TransitModelTypeResolvers
} from "../types/generated.js";
import { SessionUser } from "../types/extra.js";
import logger from "../logger.js";
import { dbUtcToBstDate, dbUtcToBstHour, getBSTDate, getDate, getFormattedDate, utcToBstDBInput } from '../lib/dayjs.js';
import { compareThresholds, getNocAdminAreas, getOperatorsFromOrgId, getOperatorsFroServiceDetails } from "../lib/otp.js"
import { Prisma, PrismaClient } from '@prisma/client';
import { checkSubArray, getDayOfWeekNumbers, isDefined } from "../lib/utils.js";
import { emptyResolver, requireUserSession } from './helpers.js';

interface DayCount {
  dayOfWeek: number;
  early: number;
  onTime: number;
  late: number;
}

export const getOperatorList: QueryResolvers['operators'] = async (_, __, context) => {
  try {
    const user = await requireUserSession(context)

    logger.debug(new Date().toLocaleString() + " getOperatorList");

    const userOperators = await getOperatorsDropDown(user, context.db)

    if (!userOperators) {
      throw "No operators for user";
    }

    return {
      items: userOperators,
    };
  } catch (error) {
    logger.error(error);
    return null;
  }
};

const getOperatorsDropDown = async (
  user: SessionUser,
  db: PrismaClient,
): Promise<OperatorType[]> => {
  const orgOperators = await getOperatorsFromOrgId(user.orgIds, db);

  const [userOperators, adminAreas] = await Promise.all([
    getOperatorsFroServiceDetails(orgOperators, db),
    getNocAdminAreas(db),
  ]);

  return userOperators
    .map((op) => ({
      name: op.operator?.name ?? 'NA',
      nocCode: op.operator_noc,
      operatorId: op.operator_noc,
      adminAreas: adminAreas
        .filter((area) => area.national_operator_code === op.operator_noc)
        .map((area) => ({
          adminAreaId: area.adminarea_id.toString(),
          adminAreaName: area.admin_area.name,
        })),
    }))
    .sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '', undefined, { numeric: true }),
    );

}

export const getOperators = async (
  user: SessionUser,
  db: PrismaClient,
  adminAreaIds?: string[]
) => {
  try {
    let adminAreaNumberIds: number[] = [];

    if (adminAreaIds && adminAreaIds.length > 0) {
      adminAreaNumberIds = adminAreaIds.map((str) => parseInt(str, 10));
    }

    const operators = await db.all_operators.findMany({
      where: {
        ...(adminAreaNumberIds.length > 0
          ? {
            noc_adminareas: {
              some: {
                adminarea_id: {
                  in: adminAreaNumberIds,
                },
              },
            },
          }
          : {}),
        operatorOrganisations: {
          some: {
            organisation_id: {
              in: user.orgIds,
            },
          },
        },
      },
      include: {
        noc_adminarea: true,
      },
    });

    if (!operators) {
      throw "No operators found";
    }

    const userOperators = operators.map((operator): OperatorType => {
      return mapOperatorToOperatorType(
        operator,
        operator.noc_adminarea
      ) as OperatorType;
    });
    return userOperators.sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", undefined, { numeric: true })
    );
  } catch (error) {
    logger.error(error);
    return null;
  }
};

const mapOperatorToOperatorType = (operator, adminAreas): OperatorType => {
  const adminAreaIds = adminAreas.map((adminArea) => {
    return {
      adminAreaId: adminArea.adminarea_id,
    };
  });

  return {
    operatorId: operator.operatorref,
    nocCode: operator.operatorref,
    name: operator.name,
    adminAreas: adminAreaIds,
  };
};

export const getServiceInfo: QueryResolvers['serviceInfo'] = async (_, args, context) => {
  try {
    const user = await requireUserSession(context)

    // get user's operator ids
    const operators = await getOperators(user, context.db);

    if (!operators) {
      throw "No user operators";
    }

    const userOperatorIds = operators.map((o) => o.nocCode);

    const service = await context.db.expected_services.findFirst({
      where: {
        noc_and_line_and_servicecode: args.serviceId,
      },
    });

    if (!service) {
      throw "No service found";
    }

    if (userOperatorIds.includes(service.operator_noc)) {
      return {
        serviceId: args.serviceId,
        serviceNumber: service.line_name,
        serviceName: service.service_name,
      };
    } else throw "User does not have access to service";
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getOperatorLines = async (operatorRef: string, db: PrismaClient, filterDate?: Date) => {
  const where: Prisma.expected_operatorsWhereInput = {
    operator_noc: operatorRef,
  }
  if(filterDate) {
    where.date_of_journey = filterDate
  }

  const operator = await db.expected_operators.findMany({
    where: where,
    include: {
      expected_services: {
        select: {
          noc_and_line_and_servicecode: true,
          service_name: true,
          line_name: true,
        },
      },
    },
  });

  const services: LineType[] = [];
  const distinctServices = new Set();
  operator.map((op) => {
    op.expected_services.map((service) => {
      if (!distinctServices.has(service.noc_and_line_and_servicecode)) {
        distinctServices.add(service.noc_and_line_and_servicecode);
        services.push({
          lineId: service.noc_and_line_and_servicecode,
          lineName: service.service_name,
          lineNumber: service.line_name,
          servicePatterns: [],
        });
      }
    });
  });

  const lines: PaginatedLineType = {
    items: services,
  };

  return lines;
};

export const getLines: TransitModelTypeResolvers['lines'] = async (_, args, context, info) => {
  const user = await requireUserSession(context)
  const { operatorId } = info.variableValues as { operatorId: string };
  const operationName: string = info.operation.name?.value ?? "";

  const operators = await getOperators(user, context.db);

  if (!operators) {
    throw "No user operators";
  }

  const userOperatorIds = operators.map((o) => o.nocCode);

  if (userOperatorIds.includes(operatorId)) {
    const inputDate = args.filterBy?.inputDate
      ? new Date(dbUtcToBstDate(args.filterBy?.inputDate))
      : undefined;
    if (operationName === "operatorLines") {
      return getOperatorLines(operatorId, context.db, inputDate);
    }
  }
  return {
    items: []
  }
}


export const getOperator: QueryResolvers['operator'] = async (_, args, context) => {
  try {
    await requireUserSession(context)

    // TODO: is operator id in users' operator id array
    logger.debug("getOperator op: {0} ", args.operatorId);

    const operator = await context.db.all_operators.findUnique({
      where: {
        operatorref: args.operatorId,
      },
    });

    if (!operator) {
      throw "No operator found";
    }

    let operatorPayload: OperatorType = {
      operatorId: operator.operatorref,
      name: operator.name,
      nocCode: operator.operatorref,
    };

    return operatorPayload;
  } catch (error) {
    console.error(error);
    return null;
  }
};


export const getPunctualityOverview: OnTimePerformanceTypeResolvers['punctualityOverview'] = async (_, args, context) => {
  try {
    const user = await requireUserSession(context)

    // start - performance timer
    var startTimer = performance.now();

    const { filters } = args.inputs;
    const {
      timingPointsOnly,
      adminAreaIds,
      operatorIds,
      startTime,
      endTime,
      maxDelay,
      minDelay,
      lineIds,
      dayOfWeekFlags,
      onTimeMaxMinutes,
      onTimeMinMinutes,
    } = filters || {};

    logger.debug(new Date().toLocaleString() + " getPunctualityOverview");

    if (onTimeMinMinutes || onTimeMaxMinutes) {
      return compareThresholds(args.inputs, user, context.db)
    }

    // get an array of user's org's operator nocs.
    const operators = await getOperators(user, context.db);

    if (!operators) {
      throw "No user operators";
    }

    const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

    let results;
    let prismaFilters = getPrismaFiltersForOTPQuery(args.inputs, userOperatorIds);

    if (lineIds) {
      results = await context.db.timetable_summary_service_tz.aggregate({
        where: prismaFilters,
        _sum: {
          early_count: true,
          late_count: true,
          on_time_count: true,
          completed: true,
          scheduled: true,
        },
      });
    } else {
      results = await context.db.timetable_summary_operator_t.aggregate({
        where: prismaFilters,
        _sum: {
          early_count: true,
          late_count: true,
          on_time_count: true,
          completed: true,
          scheduled: true,
        },
      });
    }

    if (results?._sum) {
      //end - performance timer
      var endTimer = performance.now();

      logger.debug(
        `Call to getPunctualityOverview took ${endTimer - startTimer
        } milliseconds`
      );

      return {
        early: results._sum.early_count ?? 0,
        late: results._sum.late_count ?? 0,
        onTime: results._sum.on_time_count ?? 0,
        scheduled: results._sum.scheduled ?? 0,
        completed: results._sum.completed ?? 0,
        averageDeviation: 0
      };
    }

    return null;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getOperatorPerformance: OnTimePerformanceTypeResolvers['operatorPerformance'] = async (_, args, context) => {
  try {
    const user = await requireUserSession(context)

    // start - performance timer
    var startTimer = performance.now();

    let opPerformances: OperatorPerformanceType[] = [];

    const { fromTimestamp, toTimestamp, filters, paging } = args.inputs;
    const {
      timingPointsOnly,
      adminAreaIds,
      operatorIds,
      startTime,
      endTime,
      maxDelay,
      minDelay,
      lineIds,
      dayOfWeekFlags,
    } = filters || {};

    logger.debug(new Date().toLocaleString() + " getOperatorPerformance");

    // get an array of user's org's operator nocs.
    const operators = await getOperators(user, context.db, adminAreaIds || []);

    if (!operators) {
      throw "No user operators";
    }

    const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

    const where = getPrismaFiltersForOTPQuery(args.inputs, userOperatorIds)

    const results = await context.db.timetable_summary_operator_t.groupBy({
      by: ["operator_noc"],
      where: where,
      _sum: {
        early_count: true,
        late_count: true,
        on_time_count: true,
        completed: true,
        scheduled: true,
      },
    });

    for (let i = 0; i < operators.length; i++) {
      const operatorOtpStats = results.find(
        (o) => o.operator_noc == operators[i].nocCode
      );
      if (operatorOtpStats && operatorOtpStats._sum) {
        let totalOntime = operatorOtpStats._sum.on_time_count
          ? operatorOtpStats._sum.on_time_count
          : 0,
          totalEarly = operatorOtpStats._sum.early_count
            ? operatorOtpStats._sum.early_count
            : 0,
          totalLate = operatorOtpStats._sum.late_count
            ? operatorOtpStats._sum.late_count
            : 0,
          totalscheduled = operatorOtpStats._sum.scheduled
            ? operatorOtpStats._sum.scheduled
            : 0,
          totalCompleted = operatorOtpStats._sum.completed
            ? operatorOtpStats._sum.completed
            : 0;

        let opPerformance: OperatorPerformanceType = {
          nocCode: operators[i].nocCode,
          operatorId: operators[i].nocCode,
          name: operators[i].name,
          early: totalEarly,
          late: totalLate,
          onTime: totalOntime,
          averageDelay: 0, // TODO
          scheduledDepartures: totalscheduled,
          actualDepartures: totalCompleted,
        };
        opPerformances.push(opPerformance);
      }
    }

    var ret = {
      items: opPerformances,
      pageInfo: {
        next: opPerformances.length,
        totalCount: opPerformances.length,
      },
    };

    //end - performance timer
    var endTimer = performance.now();
    logger.debug(
      `Call to getOperatorPerformance took ${endTimer - startTimer
      } milliseconds`
    );

    return ret;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getPunctualityDayOfWeek: OnTimePerformanceTypeResolvers['punctualityDayOfWeek'] = async (_, args, context) => {
  try {
    const user = await requireUserSession(context)

    const { fromTimestamp, toTimestamp, filters, paging } = args.inputs;
    let {
      timingPointsOnly,
      adminAreaIds,
      startTime,
      endTime,
      maxDelay,
      minDelay,
      dayOfWeekFlags,
      operatorIds,
      granularity,
      lineIds,
    } = filters || {};

    operatorIds = operatorIds || []

    // fetch all otp records group by time difference
    if (operatorIds.length == 1) {
      logger.debug(
        'getPunctualityDayOfWeek id: ' + JSON.stringify(operatorIds),
      );
      const operators = await getOperators(user, context.db);

      if (!operators) {
        throw 'No user operators';
      }

      const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        let results;

        const where = getPrismaFiltersForOTPQuery(args.inputs, userOperatorIds);
        if (lineIds) {
          results = await context.db.timetable_summary_service_tz.groupBy({
            by: ["day_of_week"],
            where: where,
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          });
        } else {
          results = await context.db.timetable_summary_operator_t.groupBy({
            by: ['day_of_week'],
            where: where,
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          });
        }

        const dayOfWeek: DayCount[] = Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i + 1,
          early: 0,
          late: 0,
          onTime: 0,
        }));


        if (results) {
          for (let i = 0; i < dayOfWeek.length; i++) {
            const day = dayOfWeek[i];
            const dayRecord = results.find((d) => d.day_of_week == i);
            if (dayRecord && dayRecord._sum) {
              day.early += dayRecord._sum.early_count
                ? dayRecord._sum.early_count
                : 0;
              day.onTime += dayRecord._sum.on_time_count
                ? dayRecord._sum.on_time_count
                : 0;
              day.late += dayRecord._sum.late_count
                ? dayRecord._sum.late_count
                : 0;
            }
          }
        }

        return dayOfWeek.filter((week) => {
          if (week.early === 0 && week.late === 0 && week.onTime === 0)
            return false;

          return true;
        });
      }
    }

    return []
  } catch (error) {
    logger.error(error);
    return null;
  }
};

const getStopsDistribution = async (
  inputs: PerformanceInputType,
  userOperatorIds: string[],
  db: PrismaClient,
) => {
  const { filters } = inputs;
  const { maxDelay, minDelay } = filters || {};

  const where: Prisma.timetable_threshold_summaryWhereInput =
    getPrismaFiltersForOTPQuery(inputs, userOperatorIds, true);

  if (maxDelay && minDelay) {
    where.time_diff_minutes = {
      lte: maxDelay,
      gte: minDelay,
    };
  } else if (maxDelay) {
    where.time_diff_minutes = {
      lte: maxDelay,
    };
  } else if (minDelay) {
    where.time_diff_minutes = {
      gte: minDelay,
    };
  }

  const results = await db.timetable_threshold_summary.groupBy({
    by: ['time_diff_minutes'],
    where: where,
    _sum: {
      otp_count: true,
    },
  });

  const filteredResults = results.filter(
    (result) => result.time_diff_minutes || result.time_diff_minutes === 0,
  );

  filteredResults.sort((a, b) => {
    if (a.time_diff_minutes && b.time_diff_minutes)
      return a.time_diff_minutes - b.time_diff_minutes;

    return 0;
  });

  return filteredResults.map((result) => ({
    bucket: Number(result.time_diff_minutes),
    frequency: result._sum.otp_count,
  }));
};

export const getDelayFrequency: OnTimePerformanceTypeResolvers['delayFrequency'] = async (_, args, context) => {
  try {
    const user = await requireUserSession(context)

    logger.debug('getDelayFrequency');

    // bucket is the number difference in the OTP table
    // freq is the count of that difference

    const { filters } = args.inputs;
    let { operatorIds } = filters || {};
    operatorIds = operatorIds || []

    // fetch all otp records group by time difference
    if (operatorIds.length == 1) {
      logger.debug('getDelayFrequency id: ' + JSON.stringify(operatorIds));
      const operators = await getOperators(user, context.db);

      if (!operators) {
        throw 'No user operators';
      }

      const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        return getStopsDistribution(args.inputs, userOperatorIds, context.db);
      } else {
        if (!operators) {
          throw 'No user operators';
        }
      }
    }
    return null;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getPunctualityTimeOfDay: OnTimePerformanceTypeResolvers['punctualityTimeOfDay'] = async (_, args, context) => {
  try {
    const user = await requireUserSession(context)
    // of the 10:30 slot, how many were ontime/early/late example

    const hoursOfDay: PunctualityTimeOfDayType[] = []

    logger.debug("getPunctualityTimeOfDay");

    // bucket is the number difference in the OTP table
    // freq is the count of that difference

    const { fromTimestamp, toTimestamp, filters, paging } = args.inputs;
    let {
      timingPointsOnly,
      adminAreaIds,
      startTime,
      endTime,
      maxDelay,
      minDelay,
      dayOfWeekFlags,
      operatorIds,
      granularity,
      lineIds,
    } = filters || {};
    operatorIds = operatorIds || []

    // fetch all otp records group by time difference
    if (operatorIds.length == 1) {
      logger.debug(
        "getPunctualityTimeOfDay id: " + JSON.stringify(operatorIds)
      );
      const operators = await getOperators(user, context.db);

      if (!operators) {
        throw "No user operators";
      }

      const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        let results;

        const where = getPrismaFiltersForOTPQuery(args.inputs, userOperatorIds)

        if (lineIds) {
          results = await context.db.timetable_summary_service_tz.groupBy({
            by: ["departure_hour_only"],
            where: where,
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          }) ?? [];
        } else {
          results = await context.db.timetable_summary_operator_t.groupBy({
            by: ["departure_hour_only"],
            where: where,
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          }) ?? [];
        }

        results.forEach((res) => {
          hoursOfDay.push({
            timeOfDay: dbUtcToBstHour(res.departure_hour_only),
            early: res._sum.early_count,
            onTime: res._sum.on_time_count,
            late: res._sum.late_count,
          });
        });

      }
    }

    return hoursOfDay;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getPunctualityTimeSeries: OnTimePerformanceTypeResolvers['punctualityTimeSeries'] = async (_, args, context) => {
  try {
    const user = await requireUserSession(context)

    logger.debug(new Date().toLocaleString() + " getPunctualityTimeSeries");

    const { fromTimestamp, toTimestamp, filters, paging } = args.inputs;
    let {
      timingPointsOnly,
      adminAreaIds,
      startTime,
      endTime,
      maxDelay,
      minDelay,
      dayOfWeekFlags,
      operatorIds,
      granularity,
      lineIds,
    } = filters || {};
    operatorIds = operatorIds || []

    if (operatorIds.length == 1) {
      //if (granularity == "day" && operatorIds.length == 1) {
      // get an array of user's org's operator nocs.
      const operators = await getOperators(user, context.db);
      const isDayGranularity = granularity === 'day'
      if (!operators) {
        throw "No user operators";
      }

      const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        const start = new Date(fromTimestamp);
        const end = new Date(toTimestamp);
        const days = getDaysInRange(start, end);


        let summary: PunctualityTimeSeriesType[] = []

        let results;
        const where = getPrismaFiltersForOTPQuery(args.inputs, userOperatorIds)
        if (lineIds) {
          results = await context.db.timetable_summary_service_tz.groupBy({
            by: isDayGranularity ? ["date_of_journey"] : ["departure_hour"],
            where: where,
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          }) ?? [];
        } else {
          results = await context.db.timetable_summary_operator_t.groupBy({
            by: isDayGranularity ? ["date_of_journey"] : ["date_of_journey", "departure_hour"],
            where: where,
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          }) ?? [];
        }

        results.forEach((result) => {
          if (result._sum) {
            summary.push({
              ts: isDayGranularity
                ? getFormattedDate(result.date_of_journey)
                : getFormattedDate(result.departure_hour),
              early: result._sum.early_count,
              late: result._sum.late_count,
              onTime: result._sum.on_time_count,
            });
          }
        });

        summary = summary.sort((a, b) => {
          const firstTS = getDate(a.ts)
          const secondTS = getDate(b.ts)
          return firstTS.isAfter(secondTS) ? 1 : -1
        });

        return summary
      }
    }

    return null;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

function getDaysInRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export const getServicePunctuality: OnTimePerformanceTypeResolvers['servicePunctuality'] = async (_, args, context) => {
  try {
    const user = await requireUserSession(context)

    const {
      filters,
      fromTimestamp,
      order,
      toTimestamp
    } = args.inputs

    const timingPointsOnly = filters?.timingPointsOnly
    const operatorIds = filters?.operatorIds?.filter(isDefined)

    const operators = await getOperators(user, context.db);

    const operatorNocs = operators?.map((o) => o.nocCode ?? "").filter((o)=> !!o) ?? [];

    let displayData = true
    if (operatorIds) {
      displayData = checkSubArray(operatorNocs, operatorIds)
    }

    if (displayData) {
      const where: Prisma.performance_statisticsWhereInput = {
        operator_noc: {
          in: operatorIds ? operatorIds : operatorNocs
        },
        date_period_start: new Date(getBSTDate(new Date(fromTimestamp), "YYYY-MM-DD")),
        AND: [
          {
            OR: [
              {
                on_time_count: {
                  gt: 0
                },
                late_count: {
                  gt: 0
                },
                early_count: {
                  gt: 0
                }
              }
            ]
          },
          {
            OR: [
              {
                trend_on_time_count: {
                  gt: 0
                },
                trend_late_count: {
                  gt: 0
                },
                trend_early_count: {
                  gt: 0
                }
              }
            ]
          }
        ]
      }

      if (timingPointsOnly) {
        where.is_timing_point = timingPointsOnly
      }

      const orderFilter = order === RankingOrder.Ascending ? "asc" : "desc"
      const performanceMetrics =
        await context.db.performance_statistics.findMany({
          where,
          take: 3,
          distinct: [
            'date_period_start',
            'date_period_end',
            'date_period_end',
            'on_time_percentage',
            'early_count',
            'late_count',
            'on_time_count',
          ],
          orderBy: [
            {
              on_time_percentage: orderFilter,
            },
            {
              trend_percentage: orderFilter,
            },
          ],
        });

      const services = await context.db.expected_services.findMany({
        where: {
          noc_and_line_and_servicecode: {
            in: performanceMetrics.map(stat => stat.noc_and_line_and_servicecode)
          }
        }
      })

      return performanceMetrics.map((stats) => ({
        nocCode: stats.operator_noc,
        lineId: stats.noc_and_line_and_servicecode,
        lineInfo: {
          serviceId: stats.noc_and_line_and_servicecode,
          serviceName:
            services.find(
              (service) =>
                service.noc_and_line_and_servicecode ===
                stats.noc_and_line_and_servicecode,
            )?.service_name ?? '',
          serviceNumber: stats.line_name,
        },
        onTime: stats.on_time_count,
        early: stats.early_count,
        late: stats.late_count,
        trend: {
          onTime: stats.trend_on_time_count ?? 0,
          late: stats.trend_late_count ?? 0,
          early: stats.trend_early_count ?? 0,
        },
      }));
    }

    return []
  } catch (error) {
    logger.error(error);
    return [];
  }
};

export const getStopPerformance: OnTimePerformanceTypeResolvers['stopPerformance'] = async (_, args, context) => {
  try {
    const user = await requireUserSession(context)
    // for this operator & for this service, get all stops and their OTP stats

    const { filters } = args.inputs;
    let {
      operatorIds,
      lineIds,
    } = filters || {};
    operatorIds = operatorIds || []
    lineIds = lineIds || []

    let stopPerformances: StopPerformanceType[] = [];

    // fetch all otp records group by time difference
    if (operatorIds.length == 1) {
      logger.debug("getStopPerformance id: " + JSON.stringify(operatorIds));
      const operators = await getOperators(user, context.db);

      if (!operators) {
        throw "No user operators";
      }

      const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        // get a sum per day
        const where = getPrismaFiltersForOTPQuery(args.inputs, userOperatorIds)
        const results = await context.db.timetable_summary_stops_tz.groupBy({
          by: ["stop_id", "common_name", "is_timing_point"],
          where: where,
          _sum: {
            early_count: true,
            late_count: true,
            on_time_count: true,
            scheduled: true,
            completed: true,
          },
          _avg: {
            avg_time_difference: true,
          },
        });

        const stopIds = results.map((res) => res.stop_id)

        const stops = await context.db.naptan_stoppoint_latlong.findMany({
          where: {
            id: {
              in: stopIds
            }
          },
          select: {
            id: true,
            longitude: true,
            latitude: true,
            atco_code: true,
            locality: {
              select: {
                gazetteer_id: true,
                name: true,
                admin_area: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          }
        })

        results.forEach((res) => {
          // avg delay
          const timeInSeconds = res._avg?.avg_time_difference
            ? res._avg.avg_time_difference.toNumber() * 60
            : 0;

          const stop = stops.find((dbStop) => dbStop.id === res.stop_id)
          stopPerformances.push({
            lineId: lineIds[0],
            stopId: `ST${stop?.atco_code}`,
            stopInfo: {
              //stopId: res.stop_id? res.stop_id : 0,
              stopId: `ST${stop?.atco_code}`,
              stopName: res.common_name ? res.common_name : "",
              stopLocality: {
                localityId: "",
                localityName: stop?.locality?.name ?? "",
                localityAreaId: "",
                localityAreaName: stop?.locality?.admin_area.name ?? "",
              },
              sourceId: stop?.atco_code ?? "",
              stopLocation: {
                longitude: Number(stop?.longitude) ?? 0,
                latitude: Number(stop?.latitude) ?? 0,
              },
            },
            early: res._sum?.early_count ? res._sum.early_count : 0,
            late: res._sum?.late_count ? res._sum.late_count : 0,
            onTime: res._sum?.on_time_count ? res._sum.on_time_count : 0,
            actualDepartures: res._sum?.completed ? res._sum.completed : 0,
            scheduledDepartures: res._sum?.scheduled ? res._sum.scheduled : 0,
            averageDelay: timeInSeconds,
            timingPoint: res.is_timing_point ? res.is_timing_point : false,
          });
        });
      }
    }

    return stopPerformances;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getServicePerformance: OnTimePerformanceTypeResolvers['servicePerformance'] = async (_, args, context) => {
  try {
    const user = await requireUserSession(context)

    let servicePunctualities: ServicePerformanceType[] = [];

    const { filters } = args.inputs;
    let {
      operatorIds,
    } = filters || {};
    operatorIds = operatorIds || []

    if (operatorIds.length == 1) {
      // get an array of user's org's operator nocs.
      const operators = await getOperators(user, context.db);

      if (!operators) {
        throw "No user operators";
      }

      const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

      const operator_noc_to_filter = operatorIds[0];
      const where = getPrismaFiltersForOTPQuery(args.inputs, userOperatorIds)

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        // get a sum per day
        const results = await context.db.timetable_summary_service_tz.groupBy({
          by: ["noc_and_line_and_servicecode", "line_name"],
          where: where,
          _sum: {
            early_count: true,
            late_count: true,
            on_time_count: true,
            scheduled: true,
            completed: true,
          },
          _avg: {
            avg_time_difference: true,
          },
        });

        const noc_and_lines = results.map(result => result.noc_and_line_and_servicecode)

        const services = await context.db.expected_services.findMany({
          where: {
            noc_and_line_and_servicecode: {
              in: noc_and_lines
            }
          }
        })

        results.forEach((res) => {
          const avgDelay = res._avg.avg_time_difference
            ? res._avg.avg_time_difference.toNumber() * 60
            : 0;

          const service = services.find(serv => serv.noc_and_line_and_servicecode === res.noc_and_line_and_servicecode)

          servicePunctualities.push({
            lineId: res.noc_and_line_and_servicecode,
            early: res._sum.early_count ? res._sum.early_count : 0,
            late: res._sum.late_count ? res._sum.late_count : 0,
            onTime: res._sum.on_time_count ? res._sum.on_time_count : 0,
            scheduledDepartures: res._sum.scheduled ? res._sum.scheduled : 0,
            actualDepartures: res._sum.completed ? res._sum.completed : 0,
            averageDelay: avgDelay,
            lineInfo: {
              serviceId: res.noc_and_line_and_servicecode,
              serviceNumber: res.line_name,
              serviceName: service?.service_name ?? "",
            },
          });
        });
      }
    }

    return servicePunctualities;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

// -> OPERATOR PAGE
export const getFrequentServices: HeadwayMetricsTypeResolvers['frequentServices'] = async (_, args, context) => {
  try {
    const user = await requireUserSession(context)
    const operators = await getOperators(user, context.db);

    if (!operators) {
      throw "No user operators";
    }

    const userOperatorIds = operators.map((o) => o.nocCode);

    if (userOperatorIds.includes(args.operatorId)) {
      const results = await context.db.timetable_summary_service_tz.findMany({
        where: {
          operator_noc: args.operatorId,
          date_of_journey: {
            gte: utcToBstDBInput(args.fromTimestamp),
            lt: utcToBstDBInput(args.toTimestamp)
          },
          headway_valid: true
        },
        select: {
          noc_and_line_and_servicecode: true
        },
        distinct: ['noc_and_line_and_servicecode']
      })

      return results.map(result => ({
        serviceId: result.noc_and_line_and_servicecode
      }));
    }

    return []

  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getFrequentServiceInfo: HeadwayMetricsTypeResolvers['frequentServiceInfo'] = async (_, args, context) => {
  try {
    const user = await requireUserSession(context)
    const operators = await getOperators(user, context.db);

    if (!operators) {
      throw 'No user operators';
    }

    const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

    const where: Prisma.timetable_summary_stops_tzWhereInput =
      getPrismaFiltersForOTPQuery(args.inputs, userOperatorIds);

    const results = await context.db.timetable_summary_stops_tz.groupBy(
      {
        by: ['departure_hour'],
        where: where,
        _sum: {
          scheduled: true,
          actual_headway: true,
        },
      },
    );

    let totalHours = 0;
    let actualHours = 0;

    results.map((result) => {
      if (result._sum.scheduled && result._sum.scheduled > 0) totalHours += 1;

      if (result._sum.actual_headway && result._sum.actual_headway.toNumber() > 0)
        actualHours += 1;
    });

    return {
      numHours: actualHours,
      totalHours: totalHours,
    };

  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getHeadwayOverview: HeadwayMetricsTypeResolvers['headwayOverview'] = async (_, args, context) => {
  try {
    const user = await requireUserSession(context)
    const operators = await getOperators(user, context.db);

    if (!operators) {
      throw 'No user operators';
    }

    const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

    const where: Prisma.timetable_summary_stops_tzWhereInput =
      getPrismaFiltersForOTPQuery(args.inputs, userOperatorIds);

    where.headway_stops_count = {
      gt: 0
    }

    const results = await context.db.timetable_summary_stops_tz.findMany(
      {
        where: where,
        select: {
          headway_stops_count: true,
          actual_headway: true,
          expected_headway: true,
          excess_wait_time: true,
        },
      },
    );

    let headway = {
      actualWaitTime: 0,
      scheduledWaitTime: 0,
      excessWaitTime: 0,
      headwayCount: 0
    }

    headway = results.reduce((acc, currentHeadway) => {
      acc.actualWaitTime +=
        currentHeadway.actual_headway.toNumber() * currentHeadway.headway_stops_count;
      acc.scheduledWaitTime +=
        currentHeadway.expected_headway.toNumber() * currentHeadway.headway_stops_count;
      acc.excessWaitTime +=
        currentHeadway.excess_wait_time.toNumber() * currentHeadway.headway_stops_count;
      acc.headwayCount += currentHeadway.headway_stops_count

      return acc
    }, headway);

    return {
      actualWaitTime: headway.actualWaitTime / (headway.headwayCount * 60),
      scheduledWaitTime: headway.scheduledWaitTime / (headway.headwayCount * 60),
      excessWaitTime: headway.excessWaitTime / (headway.headwayCount * 60),
    }

  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getHeadwayTimeSeries: HeadwayMetricsTypeResolvers['headwayTimeSeries'] = async (_, args, context) => {
  try {
    const user = await requireUserSession(context)

    const { filters } = args.inputs;
    const { granularity } = filters || {};

    const isDayGranularity = granularity === 'day'

    const operators = await getOperators(user, context.db);

    if (!operators) {
      throw 'No user operators';
    }

    const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

    const where: Prisma.timetable_summary_stops_tzWhereInput =
      getPrismaFiltersForOTPQuery(args.inputs, userOperatorIds);

    where.headway_stops_count = {
      gt: 0
    }

    const results = await context.db.timetable_summary_stops_tz.findMany({
      where: where,
      select: {
        date_of_journey: true,
        departure_hour: true,
        headway_stops_count: true,
        actual_headway: true,
        expected_headway: true,
        excess_wait_time: true,
      },
    })

    let headwayMap: {
      [key: string]: {
        actual_headway: number,
        expected_headway: number,
        excess_wait_time: number,
        headway_stops_count: number
      }
    } = {}
    results.map((result) => {
      if (result.departure_hour) {
        const formatterdeparture = isDayGranularity
          ? getFormattedDate(result.departure_hour, 'YYYY-MM-DD')
          : getFormattedDate(result.departure_hour);
        const headwayData = headwayMap[formatterdeparture]

        if (headwayData) {
          headwayData.actual_headway = headwayData.actual_headway + result.actual_headway.toNumber() * result.headway_stops_count
          headwayData.expected_headway = headwayData.expected_headway + result.expected_headway.toNumber() * result.headway_stops_count
          headwayData.excess_wait_time = headwayData.excess_wait_time + result.excess_wait_time.toNumber() * result.headway_stops_count
          headwayData.headway_stops_count += result.headway_stops_count
        } else {
          headwayMap[formatterdeparture] = {
            actual_headway: result.actual_headway.toNumber() * result.headway_stops_count,
            expected_headway: result.expected_headway.toNumber() * result.headway_stops_count,
            excess_wait_time: result.excess_wait_time.toNumber() * result.headway_stops_count,
            headway_stops_count: result.headway_stops_count
          }
        }
      }
    })

    const returnHeadways: HeadwayTimeSeriesType[] = []

    for (const [departure_hour, headway] of Object.entries(headwayMap)) {
      returnHeadways.push({
        ts: departure_hour,
        actualWaitTime: headway.actual_headway / (headway.headway_stops_count * 60),
        scheduledWaitTime: headway.expected_headway / (headway.headway_stops_count * 60),
        excessWaitTime: headway.excess_wait_time / (headway.headway_stops_count * 60)
      })
    }

    return returnHeadways.sort((a, b) => {
      if (getDate(a.ts).isBefore(getDate(b.ts)))
        return -1
      return 1
    })

  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getAdminAreas: QueryResolvers['adminAreas'] = async (_, __, context) => {
  try {
    const user = await requireUserSession(context)
    const operators = await getOperators(user, context.db);

    if (!operators) {
      throw "No operators";
    }
    const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

    const adminAreaRecords = await context.db.noc_adminarea.findMany({
      where: {
        national_operator_code: {
          in: userOperatorIds,
        },
      },
      select: {
        adminarea_id: true,
      },
    });

    if (adminAreaRecords) {
      const adminareaIds = adminAreaRecords.map((a) => a.adminarea_id);
      const adminAreas = await context.db.naptan_adminarea_with_shape.findMany({
        where: {
          id: {
            in: adminareaIds,
          },
        },
      });

      if (!adminAreas) {
        throw "No admin areas found";
      }

      const ret = adminAreas.map((adminArea) => {
        return {
          adminAreaId: String(adminArea.id),
          adminAreaName: adminArea.name,
          shape: adminArea.st_asgeojson,
        };
      });

      return ret;
    }

    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getPrismaFiltersForOTPQuery = (
  inputs: PerformanceInputType & HeadwayInputType & FrequentServiceInfoInputType,
  userOperatorNocList: string[],
  isThreshold?: boolean,
) => {
  const { fromTimestamp, toTimestamp, filters } = inputs || {};
  let {
    timingPointsOnly,
    adminAreaIds,
    operatorIds,
    operatorId,
    startTime,
    endTime,
    maxDelay,
    minDelay,
    lineIds,
    lineId,
    dayOfWeekFlags,
  } = filters || {};
  operatorIds = operatorIds || []

  // filter list of users' nocs to either operator nocs from filter OR full list
  let nocListToFilter: string[] = [];
  if (operatorIds && operatorIds.length > 0) {
    nocListToFilter = userOperatorNocList.filter((o) =>
      operatorIds.includes(o),
    );
  } else if (operatorId && userOperatorNocList.includes(operatorId)) {
    nocListToFilter = [operatorId]
  } else {
    nocListToFilter = userOperatorNocList;
  }

  let dayOfWeekNumbers: Number[] = [];
  if (dayOfWeekFlags) {
    dayOfWeekNumbers = getDayOfWeekNumbers(dayOfWeekFlags);
  }

  // parse startime and endtime minutes/hours
  let start = new Date();
  let end = new Date();

  // date_of_journey - add an hour to from timestamp to prevent single day condition issues
  let fromMlSeconds = new Date(fromTimestamp).getTime();
  var addMlSeconds = 60 * 60 * 1000;
  var dateOfJourneyFromDateTime = getDate(
    new Date(fromMlSeconds + addMlSeconds),
  ).tz('Europe/London');
  var dateOfJourneyToDateTime = getDate(new Date(toTimestamp)).tz(
    'Europe/London',
  );

  if (startTime && startTime !== '00:00') {
    const [hours, minutes, seconds] = startTime.split(':').map(Number);
    dateOfJourneyFromDateTime = dateOfJourneyFromDateTime.set('hour', hours);
    dateOfJourneyFromDateTime = dateOfJourneyFromDateTime.set(
      'minute',
      minutes,
    );
    dateOfJourneyFromDateTime = dateOfJourneyFromDateTime.set('second', 0);
    dateOfJourneyFromDateTime = dateOfJourneyFromDateTime.set('millisecond', 0);
  }

  if (endTime) {
    const [hours, minutes, seconds] = endTime.split(':').map(Number);
    dateOfJourneyToDateTime = dateOfJourneyToDateTime.set('hour', hours);
    dateOfJourneyToDateTime = dateOfJourneyToDateTime.set('minute', minutes);
    dateOfJourneyToDateTime = dateOfJourneyToDateTime.set('second', 0);
    dateOfJourneyToDateTime = dateOfJourneyToDateTime.set('millisecond', 0);
  }

  // assign maxlate and maxearly filters (maxearly switched to positive for db condition)
  const maxLateNumber = maxDelay ? maxDelay : 0;
  const maxEarlyNumber = minDelay ? Math.abs(minDelay) : 0;

  const isServiceGranularity = lineIds && lineIds.length > 0;
  const allOperators = (operatorIds?.length > 0) || !!operatorId

  return {
    operator_noc: { in: nocListToFilter },
    date_of_journey: {
      gte: dateOfJourneyFromDateTime.toDate(),
      lte: new Date(toTimestamp),
    },
    ...(timingPointsOnly ? { is_timing_point: timingPointsOnly } : {}),
    ...(dayOfWeekFlags
      ? { day_of_week: { in: dayOfWeekNumbers as number[] } }
      : {}),
    ...(startTime && endTime
      ? isThreshold
        ? {
          departure_hour: {
            gte: dateOfJourneyFromDateTime.toDate(),
            lte: dateOfJourneyToDateTime.toDate(),
          },
        }
        : {
          departure_hour_only: {
            gte: dateOfJourneyFromDateTime.toDate(),
            lte: dateOfJourneyToDateTime.toDate(),
          },
        }
      : {
        ...(startTime
          ? isThreshold
            ? { departure_hour: { gte: dateOfJourneyFromDateTime.toDate() } }
            : {
              departure_hour_only: {
                gte: dateOfJourneyFromDateTime.toDate(),
              },
            }
          : {
            ...(endTime
              ? isThreshold
                ? {
                  departure_hour: {
                    lte: dateOfJourneyToDateTime.toDate(),
                  },
                }
                : {
                  departure_hour_only: {
                    lte: dateOfJourneyToDateTime.toDate(),
                  },
                }
              : {}),
          }),
      }),
    ...(maxEarlyNumber > 0 && !isServiceGranularity && !isThreshold
      ? {
        max_early: { lte: maxEarlyNumber },
      }
      : {}),
    ...(maxLateNumber > 0 && !isServiceGranularity && !isThreshold
      ? {
        max_late: { lte: maxLateNumber },
      }
      : {}),
    ...(lineIds
      ? {
        noc_and_line_and_servicecode: {
          in: lineIds,
        },
      }
      : {}),
    ...(lineId
      ? {
        noc_and_line_and_servicecode: lineId,
      }
      : {}),
    ...(adminAreaIds && adminAreaIds.length > 0
      ? {
        admin_areas: !allOperators ? {
          hasSome: adminAreaIds.map(Number),
        } : {
          hasEvery: adminAreaIds.map(Number),
        },
      }
      : {}),
  };
};

const otpResolvers: Resolvers = {
    Query: {
        operators: getOperatorList,
        operator: getOperator,
        onTimePerformance: emptyResolver,
        headwayMetrics: emptyResolver,
        serviceInfo: getServiceInfo,
        adminAreas: getAdminAreas,
    },
    OnTimePerformanceType: {
        delayFrequency: getDelayFrequency,
        operatorPerformance: getOperatorPerformance,
        punctualityDayOfWeek: getPunctualityDayOfWeek,
        punctualityOverview: getPunctualityOverview,
        punctualityTimeOfDay: getPunctualityTimeOfDay,
        punctualityTimeSeries: getPunctualityTimeSeries,
        servicePunctuality: getServicePunctuality,
        stopPerformance: getStopPerformance,
        servicePerformance: getServicePerformance,
    },
    HeadwayMetricsType: {
        frequentServices: getFrequentServices,
        frequentServiceInfo: getFrequentServiceInfo,
        headwayOverview: getHeadwayOverview,
        headwayTimeSeries: getHeadwayTimeSeries,
    },
    OperatorType: {
        transitModel: emptyResolver,
    },
    TransitModelType: {
        lines: getLines,
    }
}

export default otpResolvers;
