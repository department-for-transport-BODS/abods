import {
  AdminAreasType,
  DelayFrequencyType,
  MatchType,
  FrequentServiceInfoInputType,
  FrequentServiceInfoType,
  FrequentServiceType,
  Granularity,
  HeadwayInputType,
  HeadwayMetricsTypeResolvers,
  HeadwayOverviewType,
  HeadwayTimeSeriesType,
  LineType,
  Maybe,
  OnTimePerformanceTypeResolvers,
  OperatorPerformancePage,
  OperatorPerformanceType,
  OperatorsPage,
  OperatorType,
  PerformanceInputType,
  PunctualityDayOfWeekType,
  PunctualityTimeOfDayType,
  PunctualityTimeSeriesType,
  PunctualityTotalsType,
  QueryResolvers,
  RankingOrder,
  Resolvers,
  ServiceInfoType,
  ServiceLinkType,
  ServicePatternType,
  ServicePerformanceType,
  ServicePunctualityType,
  StopPerformanceType,
} from "../types/generated.js";
import { SessionUser } from "../types/extra.js";
import logger from "../logger.js";
import {
  getDate,
  getFormattedDate,
  userSelectedDateAsUtc,
  addUkTime,
} from "../lib/dayjs.js";
import {
  compareThresholds,
  getFrequentServiceActualHours,
  getNocAdminAreas,
  getOperatorsFromOrgId,
  getOperatorsFroServiceDetails,
  getSummaryStopsTotalHours,
} from "../lib/otp.js";
import { Prisma, PrismaClient } from "@prisma/client";
import { getDayOfWeekNumbers } from "../lib/utils.js";
import { emptyResolver, requireUserSession } from "./helpers.js";
import haversineDistance from "haversine-distance";
import { getUserOperatorIds } from "../lib/operators.js";

interface DayCount {
  dayOfWeek: number;
  early: number;
  onTime: number;
  late: number;
}

export const getOperatorList: QueryResolvers["operators"] = async (
  _,
  args,
  context,
): Promise<OperatorsPage> => {
  const user = await requireUserSession(context);
  try {
    const userOperators = args.filterBy?.operatorIds
      ? await getOperatorsDropDown(user, context.db, args.filterBy.operatorIds)
      : await getOperatorsDropDown(user, context.db);

    if (!userOperators) {
      throw Error("No operators for user");
    }

    return {
      items: userOperators,
    };
  } catch (error) {
    logger.error(error, "An error occurred when getting operators");
    return {};
  }
};

const getOperatorsDropDown = async (
  user: SessionUser,
  db: PrismaClient,
  userOperatorIds?: string[],
): Promise<OperatorType[]> => {
  const orgOperators = await getOperatorsFromOrgId(
    user.orgId,
    db,
    userOperatorIds,
  );

  const [userOperators, adminAreas] = await Promise.all([
    getOperatorsFroServiceDetails(orgOperators, db),
    getNocAdminAreas(db),
  ]);

  return userOperators
    .map((op) => ({
      name: op.operator?.name ?? "unknown",
      nocCode: op.operator_noc,
      operatorId: op.operator_noc ?? "unknown",
      adminAreas: adminAreas
        .filter((area) => area.national_operator_code === op.operator_noc)
        .map((area) => ({
          adminAreaId: area.adminarea_id.toString(),
          adminAreaName: area.admin_area.name,
        })),
    }))
    .sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", undefined, { numeric: true }),
    );
};

export const getServiceInfo: QueryResolvers["serviceInfo"] = async (
  _,
  args,
  context,
): Promise<Maybe<ServiceInfoType>> => {
  const user = await requireUserSession(context);
  try {
    const userOperatorIds = await getUserOperatorIds(user, context.kysely);
    const service = await context.db.expected_services.findFirst({
      where: {
        noc_and_line_and_servicecode: args.serviceId,
      },
    });

    if (!service) {
      throw Error("No service found");
    }

    if (userOperatorIds.includes(service.operator_noc)) {
      return {
        serviceId: args.serviceId,
        serviceNumber: service.line_name,
        serviceName: service.service_name,
      };
    } else throw Error("User does not have access to service");
  } catch (error) {
    logger.error(error, "An error occurred when getting service info");
    return null;
  }
};

export const getLines: QueryResolvers["lines"] = async (
  _,
  args,
  context,
): Promise<LineType[]> => {
  const user = await requireUserSession(context);
  const userOperatorIds = await getUserOperatorIds(user, context.kysely);
  if (!userOperatorIds.includes(args.operatorId)) return [];

  const inputDate = args.inputDate
    ? userSelectedDateAsUtc(args.inputDate).toDate()
    : undefined;

  const services = await context.db.expected_services.findMany({
    where: {
      operator_noc: args.operatorId,
      date_of_journey: inputDate,
    },
    select: {
      noc_and_line_and_servicecode: true,
      service_name: true,
      line_name: true,
    },
    distinct: "noc_and_line_and_servicecode",
  });

  return services.map((service) => ({
    id: service.noc_and_line_and_servicecode,
    name: service.service_name,
    number: service.line_name,
  }));
};

const point = (x: number, y: number): [number, number] => [x, y];

function temporaryInferredServiceLinks(
  stops: { stopId: string; lon: number; stopName: string; lat: number }[],
  stopIdList: string[],
) {
  stops = stops.sort(
    (a, b) => stopIdList.indexOf(a.stopId) - stopIdList.indexOf(b.stopId),
  );
  const serviceLinks: ServiceLinkType[] = [];
  for (let i = 1; i < stops.length; i++) {
    const current = stops[i];
    const previous = stops[i - 1];
    const currentPoint = point(current.lon, current.lat);
    const previousPoint = point(previous.lon, previous.lat);
    serviceLinks.push({
      fromStop: previous.stopId,
      toStop: current.stopId,
      distance: haversineDistance(previousPoint, currentPoint),
      routeValidity: "INVALID_NO_ROUTE_POINTS",
      linkRoute: JSON.stringify([previousPoint, currentPoint]),
    });
  }
  return serviceLinks;
}

export const getServicePatterns: QueryResolvers["servicePatterns"] = async (
  _,
  args,
  context,
): Promise<ServicePatternType[]> => {
  await requireUserSession(context);
  const routesQueryResults = await context.db.distinct_routes.findMany({
    where: {
      servicepattern_route: {
        noc_and_line_and_servicecode: args.lineId,
      },
    },
    select: {
      id: true,
      route: true,
    },
  });
  const routes = routesQueryResults.map((n) => ({
    ...n,
    stopIds: n.route.split(","),
  }));
  const allStopIds = [...new Set(routes.flatMap((n) => n.stopIds))];
  const stopQueryResults = await context.db.naptan_stoppoint_latlong.findMany({
    where: {
      atco_code: { in: allStopIds },
      NOT: {
        atco_code: null,
        longitude: null,
        latitude: null,
      },
    },
    select: {
      common_name: true,
      atco_code: true,
      longitude: true,
      latitude: true,
    },
  });
  const stopDetails = stopQueryResults.map((n) => ({
    stopName: n.common_name,
    // workaround for nullable db columns that can probably be not null, the where clause should exclude null for now
    stopId: n.atco_code!,
    lon: n.longitude!,
    lat: n.latitude!,
  }));

  const result: ServicePatternType[] = [];
  for (const route of routes) {
    const stops = stopDetails.filter((s) => route.stopIds.includes(s.stopId));
    result.push({
      stops,
      servicePatternId: route.id.toString(),
      // to be replaced with a simple mapping once we have the data available
      serviceLinks: temporaryInferredServiceLinks(stops, route.stopIds),
    });
  }
  return result;
};

export const getOperator: QueryResolvers["operator"] = async (
  _,
  args,
  context,
): Promise<Maybe<OperatorType>> => {
  await requireUserSession(context);
  try {
    // TODO: is operator id in users' operator id array
    logger.debug({ operatorId: args.operatorId }, "getOperator");

    const operator = await context.db.all_operators.findUnique({
      where: {
        operatorref: args.operatorId,
      },
    });

    if (!operator) {
      throw Error("No operator found");
    }

    const operatorPayload: OperatorType = {
      operatorId: operator.operatorref,
      name: operator.name,
      nocCode: operator.operatorref,
    };

    return operatorPayload;
  } catch (error) {
    logger.error(error, "An error occurred when getting operator info");
    return null;
  }
};

export const getPunctualityOverview: OnTimePerformanceTypeResolvers["punctualityOverview"] =
  async (_, args, context): Promise<Maybe<PunctualityTotalsType>> => {
    const user = await requireUserSession(context);
    try {
      // start - performance timer
      const startTimer = performance.now();

      const { filters } = args.inputs;
      const { lineIds, onTimeMaxMinutes, onTimeMinMinutes } = filters || {};

      const userOperatorIds = await getUserOperatorIds(user, context.kysely);
      if (onTimeMinMinutes || onTimeMaxMinutes) {
        return compareThresholds(args.inputs, userOperatorIds, context.db);
      }

      let results;
      let scheduled;
      const prismaFilters = getPrismaFiltersForOTPQuery(
        args.inputs,
        userOperatorIds,
      );

      const filterWithoutEstimate = {
        ...prismaFilters,
        estimated: Prisma.skip,
      };

      const aggregationFields:
        | Prisma.Timetable_summary_service_tzSumAggregateInputType
        | Prisma.Timetable_summary_operator_tSumAggregateInputType = {
        early_count: true,
        late_count: true,
        on_time_count: true,
        completed: true,
      };

      const getServiceSummaryOverview = (
        prismaFilters: ReturnType<typeof getPrismaFiltersForOTPQuery>,
        sum: Prisma.Timetable_summary_service_tzSumAggregateInputType,
      ) => {
        return context.db.timetable_summary_service_tz.aggregate({
          where: prismaFilters,
          _sum: sum,
        });
      };

      const getOperatorSummaryOverview = (
        prismaFilters: ReturnType<typeof getPrismaFiltersForOTPQuery>,
        sum: Prisma.Timetable_summary_operator_tSumAggregateInputType,
      ) => {
        return context.db.timetable_summary_operator_t.aggregate({
          where: prismaFilters,
          _sum: sum,
        });
      };

      if (lineIds) {
        [results, scheduled] = await Promise.all([
          getServiceSummaryOverview(prismaFilters, aggregationFields),
          getServiceSummaryOverview(filterWithoutEstimate, {
            scheduled: true,
          }),
        ]);
      } else {
        [results, scheduled] = await Promise.all([
          getOperatorSummaryOverview(prismaFilters, aggregationFields),
          getOperatorSummaryOverview(filterWithoutEstimate, {
            scheduled: true,
          }),
        ]);
      }

      if (results?._sum && scheduled?._sum) {
        //end - performance timer
        const endTimer = performance.now();

        logger.debug(
          { totalTimeMs: endTimer - startTimer },
          "Call to getPunctualityOverview Finished",
        );

        return {
          early: results._sum.early_count ?? 0,
          late: results._sum.late_count ?? 0,
          onTime: results._sum.on_time_count ?? 0,
          scheduled: scheduled._sum.scheduled ?? 0,
          completed: results._sum.completed ?? 0,
          averageDeviation: 0,
        };
      }

      return null;
    } catch (error) {
      logger.error(error, "An error occurred when getting punctuality stats");
      return null;
    }
  };

export const getOperatorPerformance: OnTimePerformanceTypeResolvers["operatorPerformance"] =
  async (_, args, context): Promise<Maybe<OperatorPerformancePage>> => {
    const user = await requireUserSession(context);
    try {
      // start - performance timer
      const startTimer = performance.now();

      const opPerformances: OperatorPerformanceType[] = [];

      const { filters } = args.inputs;
      const { adminAreaIds } = filters || {};

      // get an array of user's org's operator nocs.
      const operators = await context.db.all_operators.findMany({
        where: {
          noc_adminarea:
            adminAreaIds && adminAreaIds.length > 0
              ? { some: { adminarea_id: { in: adminAreaIds.map(Number) } } }
              : Prisma.skip,
          operatorOrganisations: { some: { organisation_id: user.orgId } },
        },
        select: {
          operatorref: true,
          name: true,
        },
      });

      const where = getPrismaFiltersForOTPQuery(
        args.inputs,
        operators.map((o) => o.operatorref),
      );

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

      for (const item of operators.sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", undefined, {
          numeric: true,
        }),
      )) {
        const operatorOtpStats = results.find(
          (o) => o.operator_noc == item.operatorref,
        );
        if (operatorOtpStats && operatorOtpStats._sum) {
          const totalOntime = operatorOtpStats._sum.on_time_count
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

          const opPerformance: OperatorPerformanceType = {
            nocCode: item.operatorref,
            operatorId: item.operatorref,
            name: item.name,
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

      const ret = {
        items: opPerformances,
        pageInfo: {
          next: opPerformances.length,
          totalCount: opPerformances.length,
        },
      };

      //end - performance timer
      const endTimer = performance.now();
      logger.debug(
        { totalTimeMs: endTimer - startTimer },
        "Call to getOperatorPerformance finished",
      );

      return ret;
    } catch (error) {
      logger.error(error, "An error occurred when getting performance stats");
      return null;
    }
  };

export const getPunctualityDayOfWeek: OnTimePerformanceTypeResolvers["punctualityDayOfWeek"] =
  async (_, args, context): Promise<Maybe<PunctualityDayOfWeekType[]>> => {
    const user = await requireUserSession(context);
    try {
      const lineIds = args.inputs.filters.lineIds;
      const operatorIds = args.inputs.filters.operatorIds ?? [];

      // fetch all otp records group by time difference
      if (operatorIds.length == 1) {
        logger.debug({ operatorIds }, "getPunctualityDayOfWeek");
        const userOperatorIds = await getUserOperatorIds(user, context.kysely);
        const operator_noc_to_filter = operatorIds[0];

        if (userOperatorIds.includes(operator_noc_to_filter)) {
          let results;

          const where = getPrismaFiltersForOTPQuery(
            args.inputs,
            userOperatorIds,
          );

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
              by: ["day_of_week"],
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

      return [];
    } catch (error) {
      logger.error(error, "An error occurred when getting day of week stats");
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

  where.time_diff_minutes = {
    not: null,
  };

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
    by: ["time_diff_minutes"],
    where: where,
    _sum: {
      otp_count: true,
    },
  });

  return results
    .sort((a, b) => {
      if (a.time_diff_minutes && b.time_diff_minutes)
        return a.time_diff_minutes - b.time_diff_minutes;

      return 0;
    })
    .map((result) => ({
      bucket: Number(result.time_diff_minutes),
      frequency: result._sum.otp_count,
    }));
};

export const getDelayFrequency: OnTimePerformanceTypeResolvers["delayFrequency"] =
  async (_, args, context): Promise<Maybe<DelayFrequencyType[]>> => {
    const user = await requireUserSession(context);
    try {
      // bucket is the number difference in the OTP table
      // freq is the count of that difference

      const { filters } = args.inputs;
      let { operatorIds } = filters || {};
      operatorIds = operatorIds ?? [];

      // fetch all otp records group by time difference
      if (operatorIds.length == 1) {
        logger.debug({ operatorIds }, "getDelayFrequency");
        const userOperatorIds = await getUserOperatorIds(user, context.kysely);

        const operator_noc_to_filter = operatorIds[0];

        if (userOperatorIds.includes(operator_noc_to_filter)) {
          return getStopsDistribution(args.inputs, userOperatorIds, context.db);
        }
      }
      return null;
    } catch (error) {
      logger.error(
        error,
        "An error occurred when getting delay frequency stats",
      );
      return null;
    }
  };

export const getPunctualityTimeOfDay: OnTimePerformanceTypeResolvers["punctualityTimeOfDay"] =
  async (_, args, context): Promise<Maybe<PunctualityTimeOfDayType[]>> => {
    const user = await requireUserSession(context);
    try {
      // of the 10:30 slot, how many were ontime/early/late example

      const hoursOfDay: PunctualityTimeOfDayType[] = [];

      logger.debug("getPunctualityTimeOfDay");

      // bucket is the number difference in the OTP table
      // freq is the count of that difference

      const operatorIds = args.inputs.filters?.operatorIds ?? [];
      const lineIds = args.inputs.filters?.lineIds;

      // fetch all otp records group by time difference
      if (operatorIds.length == 1) {
        logger.debug({ operatorIds }, "getPunctualityTimeOfDay");
        const userOperatorIds = await getUserOperatorIds(user, context.kysely);
        const operator_noc_to_filter = operatorIds[0];

        if (userOperatorIds.includes(operator_noc_to_filter)) {
          let results;

          const where = getPrismaFiltersForOTPQuery(
            args.inputs,
            userOperatorIds,
          );

          if (lineIds) {
            results =
              (await context.db.timetable_summary_service_tz.groupBy({
                by: ["departure_hour_only"],
                where: where,
                _sum: {
                  early_count: true,
                  late_count: true,
                  on_time_count: true,
                },
              })) ?? [];
          } else {
            results =
              (await context.db.timetable_summary_operator_t.groupBy({
                by: ["departure_hour_only"],
                where: where,
                _sum: {
                  early_count: true,
                  late_count: true,
                  on_time_count: true,
                },
              })) ?? [];
          }

          results.forEach((res) => {
            if (res.departure_hour_only) {
              hoursOfDay.push({
                timeOfDay: res.departure_hour_only,
                early: res._sum.early_count ?? 0,
                onTime: res._sum.on_time_count ?? 0,
                late: res._sum.late_count ?? 0,
              });
            }
          });
        }
      }

      return hoursOfDay;
    } catch (error) {
      logger.error(error, "An error occurred when getting time of day stats");
      return null;
    }
  };

export const getPunctualityTimeSeries: OnTimePerformanceTypeResolvers["punctualityTimeSeries"] =
  async (_, args, context): Promise<Maybe<PunctualityTimeSeriesType[]>> => {
    const user = await requireUserSession(context);
    try {
      const { filters } = args.inputs;
      const { granularity, lineIds } = filters || {};
      const operatorIds = filters?.operatorIds ?? [];

      if (operatorIds.length == 1) {
        const isDayGranularity = granularity === Granularity.Day;
        //if (granularity == "day" && operatorIds.length == 1) {
        // get an array of user's org's operator nocs.
        const userOperatorIds = await getUserOperatorIds(user, context.kysely);
        const operator_noc_to_filter = operatorIds[0];

        if (userOperatorIds.includes(operator_noc_to_filter)) {
          let summary: PunctualityTimeSeriesType[] = [];

          let results;
          const where = getPrismaFiltersForOTPQuery(
            args.inputs,
            userOperatorIds,
          );
          if (lineIds) {
            results =
              (await context.db.timetable_summary_service_tz.groupBy({
                by: isDayGranularity ? ["date_of_journey"] : ["departure_hour"],
                where: where,
                _sum: {
                  early_count: true,
                  late_count: true,
                  on_time_count: true,
                },
              })) ?? [];
          } else {
            results =
              (await context.db.timetable_summary_operator_t.groupBy({
                by: isDayGranularity
                  ? ["date_of_journey"]
                  : ["date_of_journey", "departure_hour"],
                where: where,
                _sum: {
                  early_count: true,
                  late_count: true,
                  on_time_count: true,
                },
              })) ?? [];
          }

          results.forEach((result) => {
            if (result._sum) {
              summary.push({
                ts: isDayGranularity
                  ? getFormattedDate(result.date_of_journey)
                  : getFormattedDate(result.departure_hour),
                early: result._sum.early_count ?? 0,
                late: result._sum.late_count ?? 0,
                onTime: result._sum.on_time_count ?? 0,
              });
            }
          });

          summary = summary.sort((a, b) => {
            const firstTS = getDate(a.ts);
            const secondTS = getDate(b.ts);
            return firstTS.isAfter(secondTS) ? 1 : -1;
          });

          return summary;
        }
      }

      return null;
    } catch (error) {
      logger.error(error, "An error occurred when getting time series stats");
      return null;
    }
  };

export const getServicePunctuality: OnTimePerformanceTypeResolvers["servicePunctuality"] =
  async (_, args, context): Promise<ServicePunctualityType[]> => {
    const user = await requireUserSession(context);
    try {
      const { filters, fromTimestamp, order } = args.inputs;

      const timingPointsOnly = filters.timingPointsOnly;

      const userOperatorIds = await getUserOperatorIds(user, context.kysely);
      const operatorNocs = userOperatorIds.filter(
        (n) => !filters.operatorIds || filters.operatorIds.includes(n),
      );

      const where: Prisma.performance_statisticsWhereInput = {
        operator_noc: {
          in: operatorNocs,
        },
        date_period_start: userSelectedDateAsUtc(fromTimestamp).toDate(),
        AND: [
          {
            OR: [
              {
                on_time_count: {
                  gt: 0,
                },
                late_count: {
                  gt: 0,
                },
                early_count: {
                  gt: 0,
                },
              },
            ],
          },
          {
            OR: [
              {
                trend_on_time_count: {
                  gt: 0,
                },
                trend_late_count: {
                  gt: 0,
                },
                trend_early_count: {
                  gt: 0,
                },
              },
            ],
          },
        ],
      };

      if (timingPointsOnly) {
        where.is_timing_point = timingPointsOnly;
      }

      const orderFilter = order === RankingOrder.Ascending ? "asc" : "desc";
      const performanceMetrics =
        await context.db.performance_statistics.findMany({
          where,
          take: 3,
          distinct: [
            "date_period_start",
            "date_period_end",
            "date_period_end",
            "on_time_percentage",
            "early_count",
            "late_count",
            "on_time_count",
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
            in: performanceMetrics.map(
              (stat) => stat.noc_and_line_and_servicecode,
            ),
          },
        },
      });

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
            )?.service_name ?? "",
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
    } catch (error) {
      logger.error(
        error,
        "An error occurred when getting service punctuality stats",
      );
      return [];
    }
  };

export const getStopPerformance: OnTimePerformanceTypeResolvers["stopPerformance"] =
  async (_, args, context): Promise<Maybe<StopPerformanceType[]>> => {
    const user = await requireUserSession(context);
    try {
      // for this operator & for this service, get all stops and their OTP stats

      const { filters } = args.inputs;
      let { operatorIds, lineIds } = filters || {};
      operatorIds = operatorIds ?? [];
      lineIds = lineIds ?? [];

      const stopPerformances: StopPerformanceType[] = [];

      // fetch all otp records group by time difference
      if (operatorIds.length == 1) {
        logger.debug({ operatorIds }, "getStopPerformance");
        const userOperatorIds = await getUserOperatorIds(user, context.kysely);
        const operator_noc_to_filter = operatorIds[0];

        if (userOperatorIds.includes(operator_noc_to_filter)) {
          // get a sum per day
          const where = getPrismaFiltersForOTPQuery(
            args.inputs,
            userOperatorIds,
          );

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

          const stopIds = results.map((res) => res.stop_id);

          const stops = await context.db.naptan_stoppoint_latlong.findMany({
            where: {
              id: {
                in: stopIds,
              },
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
                    },
                  },
                },
              },
            },
          });

          results.forEach((res) => {
            // avg delay
            const timeInSeconds = res._avg?.avg_time_difference
              ? res._avg.avg_time_difference.toNumber() * 60
              : 0;

            const stop = stops.find((dbStop) => dbStop.id === res.stop_id);
            stopPerformances.push({
              lineId: lineIds[0],
              stopId: stop?.atco_code ?? "",
              stopInfo: {
                //stopId: res.stop_id? res.stop_id : 0,
                stopId: stop?.atco_code ?? "",
                stopName: res.common_name ? res.common_name : "",
                stopLocality: {
                  localityId: "",
                  localityName: stop?.locality?.name ?? "",
                  localityAreaId: "",
                  localityAreaName: stop?.locality?.admin_area.name ?? "",
                },
                sourceId: stop?.atco_code ?? "",
                stopLocation: {
                  longitude: stop?.longitude ?? 0,
                  latitude: stop?.latitude ?? 0,
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
      logger.error(
        error,
        "An error occurred when getting stop performance stats",
      );
      return null;
    }
  };

export const getServicePerformance: OnTimePerformanceTypeResolvers["servicePerformance"] =
  async (_, args, context): Promise<Maybe<ServicePerformanceType[]>> => {
    const user = await requireUserSession(context);
    try {
      const servicePunctualities: ServicePerformanceType[] = [];

      const { filters } = args.inputs;
      let { operatorIds } = filters || {};
      operatorIds = operatorIds ?? [];

      if (operatorIds.length == 1) {
        // get an array of user's org's operator nocs.
        const userOperatorIds = await getUserOperatorIds(user, context.kysely);
        const operator_noc_to_filter = operatorIds[0];
        const where = getPrismaFiltersForOTPQuery(args.inputs, userOperatorIds);

        if (userOperatorIds.includes(operator_noc_to_filter)) {
          // get a sum per day
          const results = await context.db.timetable_summary_service_tz.groupBy(
            {
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
            },
          );

          const noc_and_lines = results.map(
            (result) => result.noc_and_line_and_servicecode,
          );

          const services = await context.db.expected_services.findMany({
            where: {
              noc_and_line_and_servicecode: {
                in: noc_and_lines,
              },
            },
          });

          results.forEach((res) => {
            const avgDelay = res._avg.avg_time_difference
              ? res._avg.avg_time_difference.toNumber() * 60
              : 0;

            const service = services.find(
              (serv) =>
                serv.noc_and_line_and_servicecode ===
                res.noc_and_line_and_servicecode,
            );

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
      logger.error(
        error,
        "An error occurred when getting service performance stats",
      );
      return null;
    }
  };

// -> OPERATOR PAGE
export const getFrequentServices: HeadwayMetricsTypeResolvers["frequentServices"] =
  async (_, args, context): Promise<Maybe<FrequentServiceType[]>> => {
    const user = await requireUserSession(context);
    try {
      const userOperatorIds = await getUserOperatorIds(user, context.kysely);
      if (userOperatorIds.includes(args.operatorId)) {
        const results =
          await context.db.timetable_frequent_summary_services.findMany({
            where: {
              operator_noc: args.operatorId,
              date_of_journey: {
                gte: userSelectedDateAsUtc(args.fromTimestamp).toDate(),
                lt: userSelectedDateAsUtc(args.toTimestamp).toDate(),
              },
            },
            select: {
              noc_and_line_and_servicecode: true,
            },
            distinct: ["noc_and_line_and_servicecode"],
          });

        return results.map((result) => ({
          serviceId: result.noc_and_line_and_servicecode,
        }));
      }

      return [];
    } catch (error) {
      logger.error(error, "An error occurred when getting frequent services");
      return null;
    }
  };

export const getFrequentServiceInfo: HeadwayMetricsTypeResolvers["frequentServiceInfo"] =
  async (_, args, context): Promise<Maybe<FrequentServiceInfoType>> => {
    const user = await requireUserSession(context);
    try {
      const userOperatorIds = await getUserOperatorIds(user, context.kysely);

      const [totalHours, actualHours] = await Promise.all([
        getSummaryStopsTotalHours(context.db, args.inputs, userOperatorIds),
        getFrequentServiceActualHours(context.db, args.inputs, userOperatorIds),
      ]);

      return {
        numHours: actualHours,
        totalHours: totalHours,
      };
    } catch (error) {
      logger.error(
        error,
        "An error occurred when getting frequent service info",
      );
      return null;
    }
  };

export const getHeadwayOverview: HeadwayMetricsTypeResolvers["headwayOverview"] =
  async (_, args, context): Promise<Maybe<HeadwayOverviewType>> => {
    const user = await requireUserSession(context);
    try {
      const userOperatorIds = await getUserOperatorIds(user, context.kysely);
      const where = getPrismaFiltersForOTPQuery(args.inputs, userOperatorIds);

      where.headway_stops_count = {
        gt: 0,
      };

      const results =
        await context.db.timetable_frequent_summary_services.findMany({
          where: where,
          select: {
            headway_stops_count: true,
            excess_wait_time: true,
          },
        });

      let headway = {
        excessWaitTime: 0,
        headwayCount: 0,
      };

      headway = results.reduce((acc, currentHeadway) => {
        acc.excessWaitTime +=
          currentHeadway.excess_wait_time.toNumber() *
          currentHeadway.headway_stops_count;
        acc.headwayCount += currentHeadway.headway_stops_count;

        return acc;
      }, headway);

      return {
        excessWaitTime: headway.excessWaitTime / headway.headwayCount,
      };
    } catch (error) {
      logger.error(error, "An error occurred when getting headway overview");
      return null;
    }
  };

export const getHeadwayTimeSeries: HeadwayMetricsTypeResolvers["headwayTimeSeries"] =
  async (_, args, context): Promise<Maybe<HeadwayTimeSeriesType[]>> => {
    const user = await requireUserSession(context);
    try {
      const { filters } = args.inputs;
      const { granularity } = filters || {};

      const isDayGranularity = granularity === Granularity.Day;

      const userOperatorIds = await getUserOperatorIds(user, context.kysely);
      const where = getPrismaFiltersForOTPQuery(args.inputs, userOperatorIds);

      where.headway_stops_count = {
        gt: 0,
      };

      const results =
        await context.db.timetable_frequent_summary_services.findMany({
          where: where,
          select: {
            date_of_journey: true,
            departure_hour: true,
            headway_stops_count: true,
            actual_headway: true,
            expected_headway: true,
            excess_wait_time: true,
          },
        });

      const headwayMap: Record<
        string,
        {
          actual_headway: number;
          expected_headway: number;
          excess_wait_time: number;
          headway_stops_count: number;
        }
      > = {};

      results.map((result) => {
        if (result.departure_hour) {
          const formatterdeparture = isDayGranularity
            ? getFormattedDate(result.departure_hour, "YYYY-MM-DD")
            : getFormattedDate(result.departure_hour);
          const headwayData = headwayMap[formatterdeparture];

          if (headwayData) {
            headwayData.actual_headway =
              headwayData.actual_headway +
              result.actual_headway.toNumber() * result.headway_stops_count;
            headwayData.expected_headway =
              headwayData.expected_headway +
              result.expected_headway.toNumber() * result.headway_stops_count;
            headwayData.excess_wait_time =
              headwayData.excess_wait_time +
              result.excess_wait_time.toNumber() * result.headway_stops_count;
            headwayData.headway_stops_count += result.headway_stops_count;
          } else {
            headwayMap[formatterdeparture] = {
              actual_headway:
                result.actual_headway.toNumber() * result.headway_stops_count,
              expected_headway:
                result.expected_headway.toNumber() * result.headway_stops_count,
              excess_wait_time:
                result.excess_wait_time.toNumber() * result.headway_stops_count,
              headway_stops_count: result.headway_stops_count,
            };
          }
        }
      });

      const returnHeadways: HeadwayTimeSeriesType[] = [];

      for (const [departure_hour, headway] of Object.entries(headwayMap)) {
        returnHeadways.push({
          ts: departure_hour,
          // Prevent confusion on the front end by rounding to the nearest second before converting to number of minutes
          actualWaitTime: headway.actual_headway / headway.headway_stops_count,
          scheduledWaitTime:
            headway.expected_headway / headway.headway_stops_count,
          excessWaitTime:
            headway.excess_wait_time / headway.headway_stops_count,
        });
      }

      return returnHeadways.sort((a, b) => {
        if (getDate(a.ts).isBefore(getDate(b.ts))) return -1;
        return 1;
      });
    } catch (error) {
      logger.error(error, "An error occurred when getting headway time series");
      return null;
    }
  };

export const getAdminAreas: QueryResolvers["adminAreas"] = async (
  _,
  __,
  context,
): Promise<Maybe<AdminAreasType[]>> => {
  const user = await requireUserSession(context);
  try {
    const userOperatorIds = await getUserOperatorIds(user, context.kysely);
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
        throw Error("No admin areas found");
      }

      return adminAreas.map((adminArea) => ({
        id: adminArea.id.toString(),
        name: adminArea.name,
        shape: adminArea.st_asgeojson,
      }));
    }

    return null;
  } catch (error) {
    logger.error(error, "An error occurred when getting admin areas");
    return null;
  }
};

export const getPrismaFiltersForOTPQuery = (
  inputs: PerformanceInputType &
    HeadwayInputType &
    FrequentServiceInfoInputType,
  userOperatorNocList: string[],
  isThreshold?: boolean,
): Prisma.timetable_summary_service_tzWhereInput &
  Prisma.timetable_summary_operator_tWhereInput &
  Prisma.timetable_summary_stops_tzWhereInput &
  Prisma.timetable_threshold_summaryWhereInput &
  Prisma.timetable_frequent_summary_servicesWhereInput => {
  const { fromTimestamp, toTimestamp, filters } = inputs || {};
  const {
    timingPointsOnly,
    adminAreaIds,
    operatorId,
    startTime,
    endTime,
    maxDelay,
    minDelay,
    lineIds,
    lineId,
    dayOfWeekFlags,
    matchType,
  } = filters || {};
  const operatorIds = filters?.operatorIds ?? [];

  // filter list of users' nocs to either operator nocs from filter OR full list
  let nocListToFilter: string[] = [];
  if (operatorIds && operatorIds.length > 0) {
    nocListToFilter = userOperatorNocList.filter((o) =>
      operatorIds.includes(o),
    );
  } else if (operatorId && userOperatorNocList.includes(operatorId)) {
    nocListToFilter = [operatorId];
  } else {
    nocListToFilter = userOperatorNocList;
  }

  let dayOfWeekNumbers: number[] = [];
  if (dayOfWeekFlags) {
    dayOfWeekNumbers = getDayOfWeekNumbers(dayOfWeekFlags);
  }

  const startDateUtc = userSelectedDateAsUtc(fromTimestamp);
  const endDateUtc = userSelectedDateAsUtc(toTimestamp);

  // If start or end time aren't set, use the start and end of the day as default values,
  // so that we can still use the result in the filters
  const startDateTimeUtc = addUkTime(startDateUtc, startTime ?? "00:00");
  const endDateTimeUtc = addUkTime(
    // end date is the start of the next day, so go back a day for the end time
    // not clear how to handle this when we have data with a departure day shift
    endDateUtc.subtract(1, "day"),
    endTime ?? "23:59",
  );

  // assign maxlate and maxearly filters (maxearly switched to positive for db condition)
  const maxLateNumber = maxDelay ? maxDelay : 0;
  const maxEarlyNumber = minDelay ? Math.abs(minDelay) : 0;

  const isServiceGranularity = lineIds && lineIds.length > 0;
  const allOperators = operatorIds?.length > 0 || !!operatorId;

  return {
    operator_noc: { in: nocListToFilter },
    date_of_journey: { gte: startDateUtc.toDate(), lt: endDateUtc.toDate() },
    estimated: matchType === MatchType.Evidenced ? false : Prisma.skip,
    ...(timingPointsOnly ? { is_timing_point: timingPointsOnly } : {}),
    ...(dayOfWeekFlags ? { day_of_week: { in: dayOfWeekNumbers } } : {}),
    departure_hour: isThreshold
      ? {
          gte: startTime ? startDateTimeUtc.toDate() : Prisma.skip,
          lte: endTime ? endDateTimeUtc.toDate() : Prisma.skip,
        }
      : Prisma.skip,
    ...(!isThreshold
      ? startDateTimeUtc.hour() > endDateTimeUtc.hour()
        ? {
            // Prisma prevents us from sending the UTC offset in our query, otherwise UK time values would just work as below
            // Somewhat related: https://github.com/prisma/prisma/issues/7915
            // (In general prisma will always convert a datetime value to UTC before sending to the database, even manually constructing an ISO-8601 string with offset doesn't work)
            // However, when converted to UTC, the start time can come after the end time
            // The result of such a query, comparing to a timetz field (e.g. x >= 23:00:00 && x <= 22:59:00) is an empty set
            // so in the event that the start time is after the end time, we should use two clauses
            OR: [
              {
                departure_hour_only: {
                  // get everything from the start time up to the end of the day
                  gte: startDateTimeUtc.toDate(),
                  lte: startDateTimeUtc.endOf("day").toDate(),
                },
              },
              {
                departure_hour_only: {
                  // get everything from the start of the day up to the end time
                  gte: endDateTimeUtc.startOf("day").toDate(),
                  lte: endDateTimeUtc.toDate(),
                },
              },
            ],
          }
        : {
            departure_hour_only: {
              gte: startDateTimeUtc.toDate(),
              lte: endDateTimeUtc.toDate(),
            },
          }
      : {}),
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
          admin_areas: !allOperators
            ? {
                hasSome: adminAreaIds.map(Number),
              }
            : {
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
    lines: getLines,
    servicePatterns: getServicePatterns,
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
};

export default otpResolvers;
