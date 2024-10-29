import { Context } from "../../context";
import {
  FrequentServiceInfoInputType,
  HeadwayInputType,
  HeadwayTimeSeriesType,
  LineFilterType,
  InputMaybe,
  LineType,
  OperatorFilterInput,
  OperatorPerformanceType,
  OperatorsPage,
  OperatorType,
  PaginatedLineType,
  PerformanceInputType,
  PunctualityTimeOfDayType,
  PunctualityTimeSeriesType,
  RankingOrder,
  ServicePerformanceInputType,
  ServicePerformanceType,
  ServicePunctualityType,
  StopPerformanceType,
} from "../../types/generated.js";
import { SessionUser } from "../../types/extra.js";
import logger from "../../logger.js";
import { GraphQLResolveInfo } from "graphql";
import { dbUtcToBstDate, dbUtcToBstHour, getBSTDate, getDate, getFormattedDate } from "../../lib/dayjs.js";
import { compareThresholds, getNocAdminAreas, getOperatorsFromOrgId, getOperatorsFroServiceDetails } from "../../lib/otp.js"
import { Prisma } from "@prisma/client";
import { checkSubArray, getDayOfWeekNumbers, isDefined } from "../../lib/utils.js";

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



export const getOperatorList = async (
  filterBy: InputMaybe<OperatorFilterInput> | undefined,
  sessionUser: SessionUser,
  db: Context,
): Promise<OperatorsPage> => {
  try {
    if (!sessionUser.user) {
      throw "Not Authorized";
    }

    logger.debug(new Date().toLocaleString() + " getOperatorList");

    const userOperators = filterBy?.operatorIds
      ? await getOperatorsDropDown(sessionUser, db, filterBy.operatorIds)
      : await getOperatorsDropDown(sessionUser, db);

    if (!userOperators) {
      throw "No operators for user";
    }

    return {
      items: userOperators
    }
  } catch (error) {
    logger.error(error);
    return {};
  }
};

export const getOperatorsDropDown = async (
  sessionUser: SessionUser,
  db: Context,
  userOperatorIds?: string[]
): Promise<OperatorType[]> => {
  if (!sessionUser.user) {
    throw "Not Authorized";
  }

  if (!sessionUser.userOrganisationIDs) {
    throw "User not in any organisations";
  }

  let orgOperators: { operatorref: string }[] = [];

  orgOperators = await getOperatorsFromOrgId(
    sessionUser.userOrganisationIDs,
    db,
    userOperatorIds
  );

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
  serviceId: string,
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
        noc_and_line_and_servicecode: serviceId,
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

const getOperatorLines = async (operatorRef: string, db: Context, filterDate?: Date) => {
  const where: Prisma.expected_operatorsWhereInput = {
    operator_noc: operatorRef,
  }
  if(filterDate) {
    where.date_of_journey = filterDate
  }

  const operator = await db.prisma.expected_operators.findMany({
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

export const getLines = async (
  inputs: InputMaybe<LineFilterType> | undefined,
  sessionUser: SessionUser,
  db: Context,
  info: GraphQLResolveInfo
): Promise<PaginatedLineType> => {
  inputs = inputs || {}
  const { operatorId } = info.variableValues as { operatorId: string };
  const operationName: string = info.operation.name?.value ?? "";

  const operators = await getOperators(sessionUser, db);

  if (!operators) {
    throw "No user operators";
  }

  const userOperatorIds = operators.map((o) => o.nocCode);

  if (userOperatorIds.includes(operatorId)) {
    const inputDate = inputs.inputDate
      ? new Date(dbUtcToBstDate(inputs.inputDate))
      : undefined;
    if (operationName === "operatorLines") {
      return getOperatorLines(operatorId, db, inputDate);
    }
  }
  return {
    items: []
  }
}


export const getOperator = async (
  operatorRef: string,
  sessionUser: SessionUser,
  db: Context,
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
  inputs: PerformanceInputType,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    // start - performance timer
    var startTimer = performance.now();

    const { filters } = inputs;
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
      return compareThresholds(inputs, sessionUser, db)
    }

    // get an array of user's org's operator nocs.
    const operators = await getOperators(sessionUser, db, adminAreaIds || []);

    if (!operators) {
      throw "No user operators";
    }

    const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

    let results;
    let prismaFilters = getPrismaFiltersForOTPQuery(inputs, userOperatorIds);

    if (lineIds) {
      results = await db.prisma.timetable_summary_service_tz.aggregate({
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
      results = await db.prisma.timetable_summary_operator_t.aggregate({
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

export const getOperatorPerformance = async (
  inputs: PerformanceInputType,
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

    const { fromTimestamp, toTimestamp, filters, paging } = inputs;
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
    const operators = await getOperators(sessionUser, db, adminAreaIds || []);

    if (!operators) {
      throw "No user operators";
    }

    const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

    const where = getPrismaFiltersForOTPQuery(inputs, userOperatorIds)

    const results = await db.prisma.timetable_summary_operator_t.groupBy({
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

export const getPunctualityDayOfWeek = async (
  inputs: PerformanceInputType,
  sessionUser: SessionUser,
  db: Context,
) => {
  try {
    if (!sessionUser.user) {
      throw 'Not authorized';
    }

    const { fromTimestamp, toTimestamp, filters, paging } = inputs;
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
      const operators = await getOperators(sessionUser, db);

      if (!operators) {
        throw 'No user operators';
      }

      const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        let results;

        const where = getPrismaFiltersForOTPQuery(inputs, userOperatorIds);
        if (lineIds) {
          results = await db.prisma.timetable_summary_service_tz.groupBy({
            by: ["day_of_week"],
            where: where,
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          });
        } else {
          results = await db.prisma.timetable_summary_operator_t.groupBy({
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

export const getStopsDistribution = async (
  inputs: PerformanceInputType,
  userOperatorIds: string[],
  db: Context,
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

  const results = await db.prisma.timetable_threshold_summary.groupBy({
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

export const getDelayFrequency = async (
  inputs: PerformanceInputType,
  sessionUser: SessionUser,
  db: Context,
) => {
  try {
    if (!sessionUser.user) {
      throw 'Not authorized';
    }

    logger.debug('getDelayFrequency');

    // bucket is the number difference in the OTP table
    // freq is the count of that difference

    const { filters } = inputs;
    let { operatorIds } = filters || {};
    operatorIds = operatorIds || []

    // fetch all otp records group by time difference
    if (operatorIds.length == 1) {
      logger.debug('getDelayFrequency id: ' + JSON.stringify(operatorIds));
      const operators = await getOperators(sessionUser, db);

      if (!operators) {
        throw 'No user operators';
      }

      const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        return getStopsDistribution(inputs, userOperatorIds, db);
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

export const getPunctualityTimeOfDay = async (
  inputs: PerformanceInputType,
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

    const { fromTimestamp, toTimestamp, filters, paging } = inputs;
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
      const operators = await getOperators(sessionUser, db);

      if (!operators) {
        throw "No user operators";
      }

      const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        let results;

        const where = getPrismaFiltersForOTPQuery(inputs, userOperatorIds)

        if (lineIds) {
          results = await db.prisma.timetable_summary_service_tz.groupBy({
            by: ["departure_hour_only"],
            where: where,
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          }) ?? [];
        } else {
          results = await db.prisma.timetable_summary_operator_t.groupBy({
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

export const getPunctualityTimeSeries = async (
  inputs: PerformanceInputType,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    logger.debug(new Date().toLocaleString() + " getPunctualityTimeSeries");

    const { fromTimestamp, toTimestamp, filters, paging } = inputs;
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
      const operators = await getOperators(sessionUser, db);
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
        const queryFields = {
          _sum: {
            early_count: true,
            late_count: true,
            on_time_count: true,
          }
        }

        const where = getPrismaFiltersForOTPQuery(inputs, userOperatorIds)
        if (lineIds) {
          results = await db.prisma.timetable_summary_service_tz.groupBy({
            by: isDayGranularity ? ["date_of_journey"] : ["departure_hour"],
            where: where,
            _sum: {
              early_count: true,
              late_count: true,
              on_time_count: true,
            },
          }) ?? [];
        } else {
          results = await db.prisma.timetable_summary_operator_t.groupBy({
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
    const operatorIds = filters?.operatorIds?.filter(isDefined)

    const operators = await getOperators(sessionUser, db);

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
        date_period_start: new Date(getBSTDate(fromTimestamp, "YYYY-MM-DD")),
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
        await db.prisma.performance_statistics.findMany({
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

      const services = await db.prisma.expected_services.findMany({
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

export const getStopPerformance = async (
  inputs: PerformanceInputType,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }
    // for this operator & for this service, get all stops and their OTP stats

    const { filters } = inputs;
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
      const operators = await getOperators(sessionUser, db);

      if (!operators) {
        throw "No user operators";
      }

      const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

      const operator_noc_to_filter = operatorIds[0];

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        // get a sum per day
        const where = getPrismaFiltersForOTPQuery(inputs, userOperatorIds)
        const results = await db.prisma.timetable_summary_stops_tz.groupBy({
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
            ? res._avg.avg_time_difference * 60
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

export const getServicePerformance = async (
  inputs: PerformanceInputType,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    let servicePunctualities: ServicePerformanceType[] = [];

    const { filters } = inputs;
    let {
      operatorIds,
    } = filters || {};
    operatorIds = operatorIds || []

    if (operatorIds.length == 1) {
      // get an array of user's org's operator nocs.
      const operators = await getOperators(sessionUser, db);

      if (!operators) {
        throw "No user operators";
      }

      const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

      const operator_noc_to_filter = operatorIds[0];
      const where = getPrismaFiltersForOTPQuery(inputs, userOperatorIds)

      if (userOperatorIds.includes(operator_noc_to_filter)) {
        // get a sum per day
        const results = await db.prisma.timetable_summary_service_tz.groupBy({
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

        const services = await db.prisma.expected_services.findMany({
          where: {
            noc_and_line_and_servicecode: {
              in: noc_and_lines
            }
          }
        })

        results.forEach((res) => {
          const avgDelay = res._avg.avg_time_difference
            ? res._avg.avg_time_difference * 60
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
export const getFrequentServices = async (
  operatorId: string,
  fromTimestamp: any,
  toTimestamp: any,
  sessionUser: SessionUser,
  db: Context
) => {
  try {
    if (!sessionUser.user) {
      throw "Not authorized";
    }

    const operators = await getOperators(sessionUser, db);

    if (!operators) {
      throw "No user operators";
    }

    const userOperatorIds = operators.map((o) => o.nocCode);

    if (userOperatorIds.includes(operatorId)) {
      const results = await db.prisma.timetable_summary_service_tz.findMany({
        where: {
          operator_noc: operatorId,
          date_of_journey: {
            gt: new Date(fromTimestamp),
            lte: new Date(toTimestamp)
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

export const getFrequentServiceInfo = async (
  inputs: InputMaybe<FrequentServiceInfoInputType> | undefined,
  sessionUser: SessionUser,
  db: Context,
) => {
  try {
    if (!sessionUser.user) {
      throw 'Not authorized';
    }

    const operators = await getOperators(sessionUser, db);

    if (!operators) {
      throw 'No user operators';
    }

    const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

    const where: Prisma.timetable_summary_stops_tzWhereInput =
      getPrismaFiltersForOTPQuery(inputs, userOperatorIds);

    const results = await db.prisma.timetable_summary_stops_tz.groupBy(
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

      if (result._sum.actual_headway && result._sum.actual_headway > 0)
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

export const getHeadwayOverview = async (
  inputs: HeadwayInputType,
  sessionUser: SessionUser,
  db: Context,
) => {
  try {
    if (!sessionUser.user) {
      throw 'Not authorized';
    }

    const operators = await getOperators(sessionUser, db);

    if (!operators) {
      throw 'No user operators';
    }

    const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

    const where: Prisma.timetable_summary_stops_tzWhereInput =
      getPrismaFiltersForOTPQuery(inputs, userOperatorIds);

    where.headway_stops_count = {
      gt: 0
    }

    const results = await db.prisma.timetable_summary_stops_tz.findMany(
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
        currentHeadway.actual_headway * currentHeadway.headway_stops_count;
      acc.scheduledWaitTime +=
        currentHeadway.expected_headway * currentHeadway.headway_stops_count;
      acc.excessWaitTime +=
        currentHeadway.excess_wait_time * currentHeadway.headway_stops_count;
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

export const getHeadwayTimeSeries = async (
  inputs: HeadwayInputType,
  sessionUser: SessionUser,
  db: Context,
) => {
  try {
    if (!sessionUser.user) {
      throw 'Not authorized';
    }

    const { filters } = inputs;
    const { granularity } = filters || {};

    const isDayGranularity = granularity === 'day'

    const operators = await getOperators(sessionUser, db);

    if (!operators) {
      throw 'No user operators';
    }

    const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

    const where: Prisma.timetable_summary_stops_tzWhereInput =
      getPrismaFiltersForOTPQuery(inputs, userOperatorIds);

    where.headway_stops_count = {
      gt: 0
    }

    const results = await db.prisma.timetable_summary_stops_tz.findMany({
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
          headwayData.actual_headway = headwayData.actual_headway + result.actual_headway * result.headway_stops_count
          headwayData.expected_headway = headwayData.expected_headway + result.expected_headway * result.headway_stops_count
          headwayData.excess_wait_time = headwayData.excess_wait_time + result.excess_wait_time * result.headway_stops_count
          headwayData.headway_stops_count += result.headway_stops_count
        } else {
          headwayMap[formatterdeparture] = {
            actual_headway: result.actual_headway * result.headway_stops_count,
            expected_headway: result.expected_headway * result.headway_stops_count,
            excess_wait_time: result.excess_wait_time * result.headway_stops_count,
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

export const getAdminAreas = async (
  sessionUser: SessionUser,
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
    const userOperatorIds = operators.map((o) => o.nocCode ?? "").filter((o)=> !!o);

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

const getPrismaFiltersForOTPQuery = (
  inputs: InputMaybe<PerformanceInputType & HeadwayInputType & FrequentServiceInfoInputType> | undefined,
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
