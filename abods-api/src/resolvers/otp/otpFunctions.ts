import { Context } from "../../context";
import {
  LineType,
  OperatorPerformanceType,
  OperatorType,
  PaginatedLineType,
  PunctualityTimeOfDayType,
  PunctualityTimeSeriesType,
  RankingOrder,
  ServicePerformanceInputType,
  ServicePunctualityType,
  SessionUser,
  StopPerformanceType,
} from "../../types.js";
import logger from "../../logger.js";
import { GraphQLResolveInfo } from "graphql";
import { getDate, getDateUTC, getBSTDate, getStrUTCHour } from "../../lib/dayjs.js";
import { Prisma } from "@prisma/client";

function divideAndRound(number: number): number {
  const result = number / 60;
  return Math.round(result);
}

function roundToNearestHour(time: Date): number {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  return minutes >= 30 ? (hours + 1) % 24 : hours;
}

interface DayCount {
  dayOfWeek: number;
  early: number;
  onTime: number;
  late: number;
}

interface TimeCount {
  timeOfDay: string;
  early: number;
  onTime: number;
  late: number;
}

interface distribution {
  noOfStops: number;
  performanceInMins: number;
}

const dayOfWeek: DayCount[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i + 1,
  early: 0,
  late: 0,
  onTime: 0,
}));

export const getOperatorList = async (
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not Authorized";
    }

    logger.debug(new Date().toLocaleString() + " getOperatorList");

    const userOperators = await getOperators(sessionUser, db);

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

const getOperators = async (
  sessionUser: SessionUser,
  db: Context,
  adminAreaIds?: string[]
) => {
  try {
    if (!sessionUser.user) {
      throw "Not Authorized";
    }

    if (!sessionUser.userOrganisationIDs) {
      throw "User not in any organisations";
    }

    let adminAreaNumberIds: number[] = [];

    if (adminAreaIds && adminAreaIds.length > 0) {
      adminAreaNumberIds = adminAreaIds.map((str) => parseInt(str, 10));
    }

    const operators = await db.prisma.all_operators.findMany({
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
              in: sessionUser.userOrganisationIDs,
            },
          },
        },
      },
      include: {
        noc_adminareas: true,
      },
    });

    if (!operators) {
      throw "No operators found";
    }

    const userOperators = operators.map((operator): OperatorType => {
      return mapOperatorToOperatorType(
        operator,
        operator.noc_adminareas
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

export const getServiceInfo = async (
  serviceId,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    // get user's operator ids
    const operators = await getOperators(sessionUser, db);

    if (!operators) {
      throw "No user operators";
    }

    const userOperatorIds = operators.map((o) => o.nocCode);

    const service = await db.prisma.expected_services.findFirst({
      where: {
        noc_and_line: serviceId,
      },
    });

    if (!service) {
      throw "No service found";
    }

    if (userOperatorIds.includes(service.operator_noc)) {
      return {
        serviceId: serviceId,
        serviceNumber: service.line_name,
        serviceName: service.service_name,
      };
    } else throw "User does not have access to service";
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getOperatorLines = async (operatorRef: string, db: Context) => {
  const operator = await db.prisma.expected_operators.findMany({
    where: {
      operator_noc: operatorRef,
    },
    include: {
      expected_services: {
        select: {
          noc_and_line: true,
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
      if (!distinctServices.has(service.noc_and_line)) {
        distinctServices.add(service.noc_and_line);
        services.push({
          lineId: service.noc_and_line,
          lineName: service.service_name,
          lineNumber: service.line_name,
          onTimePerformance: [],
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

export const getLines = async (
  lineIds: string[],
  sessionUser: SessionUser,
  db: Context,
  info: GraphQLResolveInfo
) => {
  const { operatorId } = info.variableValues as { operatorId: string };
  const operationName: string = info.operation.name?.value ?? "";

  if (operationName === "operatorLines") {
    return getOperatorLines(operatorId, db);
  }
  const operators = await getOperators(sessionUser, db);

  if (!operators) {
    throw "No user operators";
  }

  const userOperatorIds = operators.map((o) => o.nocCode);


  if (userOperatorIds.includes(operatorId)) {
    // to be added for service maps next
  }
  console.log("operator ref", operatorId)
}


export const getOperator = async (
  operatorRef: string,
  sessionUser: SessionUser,
  db: Context,
  info: GraphQLResolveInfo
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    // TODO: is operator id in users' operator id array
    logger.debug("getOperator op: {0} ", operatorRef);

    const operator = await db.prisma.all_operators.findUnique({
      where: {
        operatorref: operatorRef,
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

export const getPunctualityOverview = async (
  inputs,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    // start - performance timer
    var startTimer = performance.now();

    const { fromTimestamp, toTimestamp, filters, paging, sortBy } = inputs;
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
    } = filters;

    logger.debug(new Date().toLocaleString() + " getPunctualityOverview");

    // get an array of user's org's operator nocs.
    const operators = await getOperators(sessionUser, db, adminAreaIds);

    if (!operators) {
      throw "No user operators";
    }

    const userOperatorIds = operators.map((o) => o.nocCode);

    let results;
    let prismaFilters = getPrismaFiltersForOTPQuery(inputs, userOperatorIds);

    if (lineIds) {
      results = await db.prisma.timetable_summary_service.aggregate({
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
      results = await db.prisma.timetable_summary_operator.aggregate({
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

    if (results) {
      //end - performance timer
      var endTimer = performance.now();

      logger.debug(
        `Call to getPunctualityOverview took ${
          endTimer - startTimer
        } milliseconds`
      );

      return {
        __typename: "PunctualityTotalsType",
        early: results._sum.early_count,
        late: results._sum.late_count,
        onTime: results._sum.on_time_count,
        scheduled: results._sum.scheduled,
        completed: results._sum.completed,
        averageDeviation: 0,
      };
    }

    return null;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getOperatorPerformance = async (
  inputs,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    // start - performance timer
    var startTimer = performance.now();

    let opPerformances: OperatorPerformanceType[] = [];

    const { fromTimestamp, toTimestamp, filters, paging, sortBy } = inputs;
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
    } = filters;

    logger.debug(new Date().toLocaleString() + " getOperatorPerformance");

    // get an array of user's org's operator nocs.
    const operators = await getOperators(sessionUser, db, adminAreaIds);

    if (!operators) {
      throw "No user operators";
    }

    const userOperatorIds = operators.map((o) => o.nocCode);

    const results = await db.prisma.timetable_summary_operator.groupBy({
      by: ["operator_noc"],
      where: getPrismaFiltersForOTPQuery(inputs, userOperatorIds),
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
      `Call to getOperatorPerformance took ${
        endTimer - startTimer
      } milliseconds`
    );

    return ret;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getPunctualityDayOfWeek = async (
  inputs,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    const { fromTimestamp, toTimestamp, filters, paging, sortBy } = inputs;
    const {
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
    } = filters;

    // fetch all otp records group by time difference
    if (operatorIds.length == 1) {
      logger.debug(
        "getPunctualityDayOfWeek id: " + JSON.stringify(operatorIds)
      );
      const operators = await getOperators(sessionUser, db);

      if (!operators) {
        throw "No user operators";
      }

      const userOperatorIds = operators.map((o) => o.nocCode);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        let results;

        if (lineIds) {
          results = await db.prisma.timetable_summary_service.groupBy({
            by: ["day_of_week"],
            where: getPrismaFiltersForOTPQuery(inputs, userOperatorIds),
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          });
        } else {
          results = await db.prisma.timetable_summary_operator.groupBy({
            by: ["day_of_week"],
            where: getPrismaFiltersForOTPQuery(inputs, userOperatorIds),
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          });
        }

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
      }
    }

    return dayOfWeek;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getJourneyScheduledStartTimes = async (
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    return [
      {
        days: ["Mon", "Wed", "Fri"],
        fromDate: "2024-01-01",
        startTimes: ["08:00", "10:00", "12:00"],
        toDate: "2024-01-31",
      },
    ];
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getDelayFrequency = async (
  inputs,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    logger.debug("getDelayFrequency");

    // bucket is the number difference in the OTP table
    // freq is the count of that difference

    const { fromTimestamp, toTimestamp, filters, paging, sortBy } = inputs;
    const {
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
    } = filters;

    let performanceStopDistribution: distribution[] = [];

    // fetch all otp records group by time difference
    if (operatorIds.length == 1) {
      logger.debug("getDelayFrequency id: " + JSON.stringify(operatorIds));
      const operators = await getOperators(sessionUser, db);

      if (!operators) {
        throw "No user operators";
      }

      const userOperatorIds = operators.map((o) => o.nocCode);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        let results;

        if (lineIds) {
          results = await db.prisma.timetable_summary_service.findMany({
            where: getPrismaFiltersForOTPQuery(inputs, userOperatorIds),
            select: {
              avg_time_difference: true,
              completed: true,
            },
          });
        } else {
          results = await db.prisma.timetable_summary_operator.findMany({
            where: getPrismaFiltersForOTPQuery(inputs, userOperatorIds),
            select: {
              avg_time_difference: true,
              completed: true,
            },
          });
        }

        if (results) {
          results.forEach((res) => {
            if (res.avg_time_difference) {
              // get a rounded average time difference for the record
              const avgDiff = Math.round(res.avg_time_difference);

              if (res.completed > 0) {
                // is thie performance in minutes (time difference) value already in the array?
                const index = performanceStopDistribution.findIndex(
                  (d) => d.performanceInMins == avgDiff
                );
                if (index !== -1) {
                  // it is in the array, add the completed stops to this noOfStops
                  const element = performanceStopDistribution.find(
                    (d) => d.performanceInMins == avgDiff
                  );
                  performanceStopDistribution.splice(index, 1);
                  performanceStopDistribution.push({
                    performanceInMins: avgDiff,
                    noOfStops: element?.noOfStops
                      ? element?.noOfStops + res.completed
                      : res.completed,
                  });
                } else {
                  // add a new entry for this new time difference
                  performanceStopDistribution.push({
                    performanceInMins: avgDiff,
                    noOfStops: res.completed,
                  });
                }
              }
            }
          });
        }
      }
    }

    const unsortedArray = performanceStopDistribution.map((ele) => ({
      bucket: ele.performanceInMins,
      frequency: ele.noOfStops,
    }));

    const sortedArray = unsortedArray.sort((a, b) => a.bucket - b.bucket);

    return sortedArray;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getPunctualityTimeOfDay = async (
  inputs,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }
    // of the 10:30 slot, how many were ontime/early/late example

    const hoursOfDay: PunctualityTimeOfDayType[] = []

    logger.debug("getPunctualityTimeOfDay");

    // bucket is the number difference in the OTP table
    // freq is the count of that difference

    const { fromTimestamp, toTimestamp, filters, paging, sortBy } = inputs;
    const {
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
    } = filters;

    // fetch all otp records group by time difference
    if (operatorIds.length == 1) {
      logger.debug(
        "getPunctualityTimeOfDay id: " + JSON.stringify(operatorIds)
      );
      const operators = await getOperators(sessionUser, db);

      if (!operators) {
        throw "No user operators";
      }

      const userOperatorIds = operators.map((o) => o.nocCode);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        let results;

        if (lineIds) {
          results = await db.prisma.timetable_summary_service.groupBy({
            by: ["departure_hour"],
            where: getPrismaFiltersForOTPQuery(inputs, userOperatorIds),
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          }) ?? [];
        } else {
          results = await db.prisma.timetable_summary_operator.groupBy({
            by: ["departure_hour"],
            where: getPrismaFiltersForOTPQuery(inputs, userOperatorIds),
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          }) ?? [];
        }

        results.forEach((res) => {
          hoursOfDay.push({
            timeOfDay: getStrUTCHour(res.departure_hour),
            early: res._sum.early_count,
            onTime: res._sum.on_time_count,
            late: res._sum.late_count
          })
        });
     
      }
    }

    return hoursOfDay;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getPunctualityTimeSeries = async (
  inputs,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    logger.debug(new Date().toLocaleString() + " getPunctualityTimeSeries");

    const { fromTimestamp, toTimestamp, filters, paging, sortBy } = inputs;
    const {
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
    } = filters;

    if (operatorIds.length == 1) {
      //if (granularity == "day" && operatorIds.length == 1) {
      // get an array of user's org's operator nocs.
      const operators = await getOperators(sessionUser, db);
      const isDayGranularity = granularity === 'day'
      if (!operators) {
        throw "No user operators";
      }

      const userOperatorIds = operators.map((o) => o.nocCode);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        const start = new Date(fromTimestamp);
        const end = new Date(toTimestamp);
        const days = getDaysInRange(start, end);

        
        let summary: PunctualityTimeSeriesType[] = []

        let results;
        const queryFields = {
          _sum: {
            early_count: true,
            late_count: true,
            on_time_count: true,
          }
        }
        
        if (lineIds) {
          results = await db.prisma.timetable_summary_service.groupBy({
            by: isDayGranularity ? ["date_of_journey"]: ["date_of_journey", "departure_hour"],
            where: getPrismaFiltersForOTPQuery(inputs, userOperatorIds),
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          }) ?? [];
        } else {
          results = await db.prisma.timetable_summary_operator.groupBy({
            by: isDayGranularity ? ["date_of_journey"]: ["date_of_journey", "departure_hour"],
            where: getPrismaFiltersForOTPQuery(inputs, userOperatorIds),
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          }) ?? [];
        }

        results.forEach((result) => {
          if (result._sum) {
            const journeyDate = getDate(result.date_of_journey)
            const departureHour = isDayGranularity ? undefined: getDate(result.departure_hour)

            summary.push({
              ts: isDayGranularity ? result.date_of_journey : getDateUTC(journeyDate, departureHour).toISOString(),
              early: result._sum.early_count,
              late: result._sum.late_count,
              onTime: result._sum.on_time_count
            })
          }
        });

        summary = summary.sort((a,b) => {
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

export const getServicePunctuality = async (
  inputs: ServicePerformanceInputType,
  sessionUser: SessionUser,
  db: Context
): Promise<ServicePunctualityType[]> => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    const {
      filters,
      fromTimestamp,
      order,
      toTimestamp
    } = inputs

    const timingPointsOnly = filters?.timingPointsOnly


    const operators = await getOperators(sessionUser, db);

    const operatorNocs = operators?.map((op) => op.nocCode) ?? []

    const where: Prisma.performance_statisticsWhereInput = {
      operator_noc: {
        in: operatorNocs
      },
      date_period_start: new Date(getBSTDate(fromTimestamp, "YYYY-MM-DD"))
    }

    if(timingPointsOnly) {
      where.is_timing_point = timingPointsOnly
    }

    const orderFilter = order === RankingOrder.Ascending ? "asc" : "desc"
    const performanceMetrics = await db.prisma.performance_statistics.findMany({
      where,
      take: 3,
      distinct: ["date_period_start", "date_period_end", "date_period_end", "on_time_percentage", "early_count", "late_count", "on_time_count"],
      orderBy: [{
        on_time_percentage: orderFilter
      },{
        trend_percentage: orderFilter
      }]
    })


    return performanceMetrics.map((stats) =>({
      nocCode: stats.operator_noc,
      lineId: stats.noc_and_line,
      lineInfo: {
        serviceId: stats.noc_and_line,
        serviceName: stats.service_name,
        serviceNumber: stats.line_name
      },
      onTime: stats.on_time_count,
      early: stats.early_count,
      late: stats.late_count,
      trend: {
        onTime: stats.trend_on_time_count ?? 0,
        late: stats.trend_late_count ?? 0,
        early: stats.trend_early_count ?? 0
      }
    }))

  } catch (error) {
    logger.error(error);
    return [];
  }
};

export const getStopPerformance = async (
  inputs,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }
    // for this operator & for this service, get all stops and their OTP stats

    const { fromTimestamp, toTimestamp, filters, paging, sortBy } = inputs;
    const {
      timingPointsOnly,
      adminAreaIds,
      startTime,
      endTime,
      maxDelay,
      minDelay,
      dayOfWeekFlags,
      operatorIds,
      lineIds,
      granularity,
    } = filters;

    let stopPerformances: StopPerformanceType[] = [];

    // fetch all otp records group by time difference
    if (operatorIds.length == 1) {
      logger.debug("getStopPerformance id: " + JSON.stringify(operatorIds));
      const operators = await getOperators(sessionUser, db);

      if (!operators) {
        throw "No user operators";
      }

      const userOperatorIds = operators.map((o) => o.nocCode);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        // get a sum per day
        const results = await db.prisma.timetable_summary_stops.groupBy({
          by: ["stop_id", "common_name", "is_timing_point"],
          where: getPrismaFiltersForOTPQuery(inputs, userOperatorIds),
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

        const stopIds: number[] = results.map((res) => res.stop_id)

        const stops = await db.prisma.naptan_stoppoint_latlong.findMany({
          where: {
            id: {
              in: stopIds
            }
          },
          select: {
            id: true,
            longitude: true,
            latitude: true,
            locality:{
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
          const timeInSeconds = res._avg.avg_time_difference
            ? res._avg.avg_time_difference * 60
            : 0;

          const stop = stops.find((dbStop) => dbStop.id === res.stop_id)
          stopPerformances.push({
            lineId: lineIds[0],
            stopId: res.stop_id ? res.stop_id : 0,
            stopInfo: {
              //stopId: res.stop_id? res.stop_id : 0,
              stopId: res.stop_id.toString(),
              stopName: res.common_name ? res.common_name : "",
              stopLocality: {
                localityId: "",
                localityName: stop?.locality?.name ?? "",
                localityAreaId: "",
                localityAreaName: stop?.locality?.admin_area.name ?? "",
              },
              sourceId: "",
              stopLocation: {
                longitude: Number(stop?.longitude) ?? 0,
                latitude: Number(stop?.latitude) ?? 0,
              },
            },
            early: res._sum.early_count ? res._sum.early_count : 0,
            late: res._sum.late_count ? res._sum.late_count : 0,
            onTime: res._sum.on_time_count ? res._sum.on_time_count : 0,
            actualDepartures: res._sum.completed ? res._sum.completed : 0,
            scheduledDepartures: res._sum.scheduled ? res._sum.scheduled : 0,
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

export const getServicePerformance = async (
  inputs,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    let servicePunctualities: ServicePunctualityType[] = [];

    // get all services for this operator
    // get all journies for this service
    // get all OTP stops for this journey

    const { fromTimestamp, toTimestamp, filters, paging, sortBy } = inputs;
    const {
      timingPointsOnly,
      adminAreaIds,
      startTime,
      endTime,
      maxDelay,
      minDelay,
      dayOfWeekFlags,
      operatorIds,
      granularity,
    } = filters;

    if (operatorIds.length == 1) {
      // get an array of user's org's operator nocs.
      const operators = await getOperators(sessionUser, db);

      if (!operators) {
        throw "No user operators";
      }

      const userOperatorIds = operators.map((o) => o.nocCode);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        // get a sum per day
        const results = await db.prisma.timetable_summary_service.groupBy({
          by: ["noc_and_line", "line_name", "service_name"],
          where: getPrismaFiltersForOTPQuery(inputs, userOperatorIds),
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

        results.forEach((res) => {
          const avgDelay = res._avg.avg_time_difference
            ? res._avg.avg_time_difference * 60
            : 0;
          servicePunctualities.push({
            lineId: res.noc_and_line,
            early: res._sum.early_count ? res._sum.early_count : 0,
            late: res._sum.late_count ? res._sum.late_count : 0,
            onTime: res._sum.on_time_count ? res._sum.on_time_count : 0,
            scheduledDepartures: res._sum.scheduled ? res._sum.scheduled : 0,
            actualDepartures: res._sum.completed ? res._sum.completed : 0,
            averageDelay: avgDelay,
            lineInfo: {
              serviceId: res.noc_and_line,
              serviceNumber: res.line_name,
              serviceName: res.service_name,
            },
            rank: 1,
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
export const getFrequentServices = async (
  operatorId,
  fromTimestamp,
  toTimestamp,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }
    return [
      {
        serviceId: "Service123",
        serviceInfo: {
          serviceId: "Service123",
          serviceName: "Downtown Express",
          serviceNumber: "EXP123",
        },
      },
      {
        serviceId: "Service456",
        serviceInfo: {
          serviceId: "Service456",
          serviceName: "Uptown Loop",
          serviceNumber: "LOOP456",
        },
      },
    ];
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getFrequentServiceInfo = async (
  inputs,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }
    return {
      numHours: 150,
      totalHours: 200,
    };
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getHeadwayDayOfWeek = async (
  lineId,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }
    return [
      {
        dayOfWeek: 1,
        actualWaitTime: 5.0,
        excessWaitTime: 0.5,
        scheduledWaitTime: 4.5,
      },
      {
        dayOfWeek: 2,
        actualWaitTime: 6.0,
        excessWaitTime: 0.6,
        scheduledWaitTime: 5.4,
      },
    ];
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getHeadwayOverview = async (
  inputs,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }
    // filtered on service id and operator id

    // per service - headway

    return {
      actualWaitTime: 5.5,
      scheduledWaitTime: 3.2,
      excessWaitTime: 2.3,
    };
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getHeadwayTimeOfDay = async (
  lineId,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }
    return [
      {
        timeOfDay: "08:00",
        actualWaitTime: 4.0,
        excessWaitTime: 0.4,
        scheduledWaitTime: 3.6,
      },
      {
        timeOfDay: "09:00",
        actualWaitTime: 3.8,
        excessWaitTime: 0.2,
        scheduledWaitTime: 3.6,
      },
    ];
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getHeadwayTimeSeries = async (
  inputs,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    return [];

    // return [
    //   { ts: "2024-04-10T12:00:00Z", actualWaitTime: 5.2, excessWaitTime: 0.5, scheduledWaitTime: 4.7 },
    //   { ts: "2024-04-11T12:00:00Z", actualWaitTime: 5.1, excessWaitTime: 0.4, scheduledWaitTime: 4.7 }
    // ];
  } catch (error) {
    logger.error(error);
    return null;
  }
};

export const getAdminAreas = async (
  adminAreaIds: String[],
  sessionUser: any,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    const operators = await getOperators(sessionUser, db);

    if (!operators) {
      throw "No operators";
    }
    const userOperatorIds = operators.map((o) => o.nocCode);

    const adminAreaRecords = await db.prisma.noc_adminarea.findMany({
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
      const adminAreas = await db.prisma.naptan_adminarea_with_shape.findMany({
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

// helpers
function getDayOfWeekNumbers(dayOfWeekFlags: any) {
  let dayOfWeekNumbers: Number[] = [];
  if (dayOfWeekFlags.monday == true) dayOfWeekNumbers.push(1);
  if (dayOfWeekFlags.tuesday == true) dayOfWeekNumbers.push(2);
  if (dayOfWeekFlags.wednesday == true) dayOfWeekNumbers.push(3);
  if (dayOfWeekFlags.thursday == true) dayOfWeekNumbers.push(4);
  if (dayOfWeekFlags.friday == true) dayOfWeekNumbers.push(5);
  if (dayOfWeekFlags.saturday == true) dayOfWeekNumbers.push(6);
  if (dayOfWeekFlags.sunday == true) dayOfWeekNumbers.push(0);
  return dayOfWeekNumbers;
}

const getPrismaFiltersForOTPQuery = (inputs, userOperatorNocList: string[]) => {
  const { fromTimestamp, toTimestamp, filters, paging, sortBy } = inputs;
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
  } = filters;

  // filter list of users' nocs to either operator nocs from filter OR full list
  let nocListToFilter: string[] = [];
  if (operatorIds && operatorIds.length > 0) {
    nocListToFilter = userOperatorNocList.filter((o) =>
      operatorIds.includes(o)
    );
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

  if (startTime) {
    const [hours, minutes, seconds] = startTime.split(":").map(Number);
    start.setHours(hours);
    start.setMinutes(minutes);
  }

  if (endTime) {
    const [hours, minutes, seconds] = endTime.split(":").map(Number);
    end.setHours(hours);
    end.setMinutes(minutes);
  }

  // date_of_journey - add an hour to from timestamp to prevent single day condition issues
  let fromMlSeconds = new Date(fromTimestamp).getTime();
  var addMlSeconds = 60 * 60 * 1000;
  var dateOfJourneyFromDateTime = new Date(fromMlSeconds + addMlSeconds);
  var dateOfJourneyToDateTime = new Date(toTimestamp);

  // assign maxlate and maxearly filters (maxearly switched to positive for db condition)
  const maxLateNumber = maxDelay ? maxDelay : 0;
  const maxEarlyNumber = minDelay ? Math.abs(minDelay) : 0;

  return {
    operator_noc: { in: nocListToFilter },
    date_of_journey: {
      gte: dateOfJourneyFromDateTime,
      lte: dateOfJourneyToDateTime,
    },
    ...(timingPointsOnly ? { is_timing_point: timingPointsOnly } : {}),
    ...(dayOfWeekFlags
      ? { day_of_week: { in: dayOfWeekNumbers as number[] } }
      : {}),
    ...(startTime && endTime
      ? { expected_departure_hour: { gte: start, lte: end } }
      : {
          ...(startTime
            ? { expected_departure_hour: { gte: start } }
            : {
                ...(endTime ? { expected_departure_hour: { lte: end } } : {}),
              }),
        }),
    ...(maxEarlyNumber > 0
      ? {
          max_early: { lte: maxEarlyNumber },
        }
      : {}),
    ...(maxLateNumber > 0
      ? {
          max_late: { lte: maxLateNumber },
        }
      : {}),
    ...(lineIds
      ? {
          noc_and_line: {
            in: lineIds,
          },
        }
      : {}),
  };
};
