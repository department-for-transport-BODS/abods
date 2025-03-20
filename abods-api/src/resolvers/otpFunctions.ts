import {
  AdminAreasType,
  DelayFrequencyType,
  FrequentServiceInfoInputType,
  FrequentServiceInfoType,
  FrequentServiceType,
  Granularity,
  HeadwayInputType,
  HeadwayMetricsTypeResolvers,
  HeadwayOverviewType,
  HeadwayTimeSeriesType,
  LineType,
  MatchType,
  Maybe,
  OnTimePerformanceTypeResolvers,
  OperatorPerformancePage,
  OperatorPerformanceType,
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
  ServicePatternType,
  ServicePerformanceType,
  ServicePunctualityType,
  StopPerformanceType,
} from "../types/generated.js";
import logger from "../logger.js";
import {
  getFormattedDate,
  toUkTime,
  userSelectedDateAsUtc,
} from "../lib/dayjs.js";
import {
  compareThresholds,
  getFrequentServiceActualHours,
  getSummaryStopsTotalHours,
} from "../lib/otp.js";
import { Prisma, PrismaClient } from "@prisma/client";
import { getDayOfWeekNumbers } from "../lib/utils.js";
import { emptyResolver, requireUserSession } from "./helpers.js";
import {
  getUserOperatorIds,
  getUserOperatorIdsQuery,
} from "../lib/operators.js";
import { Kysely, sql } from "kysely";
import { DB } from "../kysely.js";
import { listServiceLinks } from "../lib/common.js";
import dayjs, { Dayjs } from "dayjs";

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
): Promise<OperatorType[]> => {
  const user = await requireUserSession(context);

  let query = context.kysely
    .selectFrom("service_details as s")
    .where(
      "s.operator_noc",
      "in",
      getUserOperatorIdsQuery(context.kysely, user),
    )
    .innerJoin("all_operators as a", "a.operatorref", "s.operator_noc")
    .innerJoin(
      "noc_adminarea as n",
      "n.national_operator_code",
      "s.operator_noc",
    );
  if (args.filterBy && args.filterBy.operatorIds.length > 0) {
    query = query.where("s.operator_noc", "in", args.filterBy.operatorIds);
  }
  return await query
    .groupBy(["a.name", "s.operator_noc"])
    .select((eb) => [
      eb.fn.coalesce("name", sql.lit("<unknown>")).as("name"),
      eb.fn.coalesce("operator_noc", sql.lit("<unknown>")).as("operatorId"),
      sql<string>`string_agg(distinct n.adminarea_id::text, ',')`.as(
        "adminAreaIds",
      ),
    ])
    .orderBy("name")
    .execute()
    .then((x) =>
      x.map((o) => ({
        name: o.name,
        operatorId: o.operatorId,
        nocCode: o.operatorId,
        adminAreaIds: o.adminAreaIds.split(","),
      })),
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

    const service = await context.kysely
      .selectFrom("expected_services")
      .where("noc_and_line_and_servicecode", "=", args.serviceId)
      .select(["operator_noc", "line_name", "service_name"])
      .executeTakeFirst();

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

  if (args.operatorIds.length === 0) return [];

  let query = context.kysely
    .selectFrom("expected_services")
    .where("operator_noc", "in", getUserOperatorIdsQuery(context.kysely, user))
    .where("operator_noc", "in", args.operatorIds);

  const inputDate = userSelectedDateAsUtc(args.inputDate).toDate();
  if (args.endDate) {
    const endDate = userSelectedDateAsUtc(args.endDate).toDate();
    query = query
      .where("date_of_journey", ">=", inputDate)
      .where("date_of_journey", "<", endDate);
  } else {
    query = query.where("date_of_journey", "=", inputDate);
  }

  return query
    .select("noc_and_line_and_servicecode as id")
    .select("service_name as name")
    .select("line_name as number")
    .select("admin_area_id as adminAreaIds")
    .distinctOn("noc_and_line_and_servicecode")
    .execute();
};

async function getOtpServiceLinks(
  stops: { stopId: string; lon: number; stopName: string; lat: number }[],
  stopIdList: string[],
  db: Kysely<DB>,
) {
  stops = stops.sort(
    (a, b) => stopIdList.indexOf(a.stopId) - stopIdList.indexOf(b.stopId),
  );
  return listServiceLinks(stops, db);
}

export const getServicePatterns: QueryResolvers["servicePatterns"] = async (
  _,
  args,
  context,
): Promise<ServicePatternType[]> => {
  await requireUserSession(context);

  const routesQueryResults = await context.kysely
    .selectFrom("distinct_routes as d")
    .innerJoin("servicepattern_route as s", "d.id", "s.distinct_route_id")
    .select(["d.id", "d.route"])
    .execute();
  const routes = routesQueryResults.map((n) => ({
    ...n,
    stopIds: n.route.split(","),
  }));
  const allStopIds = [...new Set(routes.flatMap((n) => n.stopIds))];
  const stopQueryResults = await context.kysely
    .selectFrom("naptan_stoppoint_latlong")
    .where("atco_code", "in", allStopIds)
    .where("atco_code", "is not", null)
    .where("longitude", "is not", null)
    .where("latitude", "is not", null)
    .select(["common_name", "atco_code", "longitude", "latitude"])
    .execute();
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
    const serviceLinks = await getOtpServiceLinks(
      stops,
      route.stopIds,
      context.kysely,
    );
    result.push({
      stops,
      servicePatternId: route.id.toString(),
      serviceLinks,
    });
  }
  return result;
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

      const where = {
        ...getPrismaFiltersForOTPQuery(args.inputs, userOperatorIds),
        estimated: Prisma.skip,
      };
      const _sum = {
        early_count: true,
        late_count: true,
        on_time_count: true,
        completed: true,
        scheduled: true,
      } as const;

      const results = lineIds
        ? await context.db.timetable_summary_service_tz.groupBy({
            by: ["incomplete_reason", "estimated"],
            where,
            _sum,
          })
        : await context.db.timetable_summary_operator_t.groupBy({
            by: ["incomplete_reason", "estimated"],
            where,
            _sum,
          });

      const returnVal: PunctualityTotalsType = {
        scheduled: 0,
        early: 0,
        late: 0,
        onTime: 0,
        completed: 0,
        averageDeviation: 0,
        incomplete: "{}", // To be replaced
      };
      const incompleteReasons: Record<number, number> = {};
      for (const result of results) {
        const scheduled = result._sum.scheduled ?? 0;
        const reasonId = result.incomplete_reason ?? 0;

        // if the current row is estimated, and the request is to filter estimated,
        // then we should act as if they were all incomplete
        const ignoreEstimated =
          result.estimated &&
          args.inputs.filters.matchType === MatchType.Evidenced;

        const completed = ignoreEstimated ? 0 : result._sum.completed ?? 0;
        const early = ignoreEstimated ? 0 : result._sum.early_count ?? 0;
        const late = ignoreEstimated ? 0 : result._sum.late_count ?? 0;
        const onTime = ignoreEstimated ? 0 : result._sum.on_time_count ?? 0;

        returnVal.scheduled += scheduled;
        returnVal.early += early;
        returnVal.late += late;
        returnVal.onTime += onTime;
        returnVal.completed += completed;

        incompleteReasons[reasonId] ??= 0;
        incompleteReasons[reasonId] += scheduled - completed;
      }
      returnVal.incomplete = JSON.stringify(incompleteReasons);
      //end - performance timer
      const endTimer = performance.now();

      logger.debug(
        { totalTimeMs: endTimer - startTimer },
        "Call to getPunctualityOverview Finished",
      );

      return returnVal;
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
          operatorOrganisations: {
            some: { organisation_id: { in: user.orgIds } },
          },
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
              : 0;

          const opPerformance: OperatorPerformanceType = {
            nocCode: item.operatorref,
            operatorId: item.operatorref,
            name: item.name,
            early: totalEarly,
            late: totalLate,
            onTime: totalOntime,
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

export const timeDiffFilters = (
  inputs: PerformanceInputType,
  userOperatorIds: string[],
) => ({
  ...getPrismaFiltersForOTPQuery(inputs, userOperatorIds),
  max_early: Prisma.skip,
  max_late: Prisma.skip,
  time_diff_minutes: {
    not: null,
    lte: inputs.filters.maxDelay ? inputs.filters.maxDelay : Prisma.skip,
    gte: inputs.filters.minDelay ? inputs.filters.minDelay : Prisma.skip,
  },
});

const getStopsDistribution = async (
  inputs: PerformanceInputType,
  userOperatorIds: string[],
  db: PrismaClient,
) => {
  const results = await db.timetable_threshold_summary.groupBy({
    by: ["time_diff_minutes"],
    where: timeDiffFilters(inputs, userOperatorIds),
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
            const firstTS = dayjs(a.ts);
            const secondTS = dayjs(b.ts);
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

      const orderFilter = order === RankingOrder.Ascending ? "asc" : "desc";

      let performanceMetricsQuery = context.kysely
        .selectFrom("performance_statistics")
        .selectAll()
        .where("operator_noc", "in", operatorNocs)
        .where(
          "date_period_start",
          "=",
          userSelectedDateAsUtc(fromTimestamp).toDate(),
        )
        .where("percentage_change", "is not", null)
        .orderBy("on_time_percentage", orderFilter)
        .orderBy("percentage_change", orderFilter)
        .limit(3);

      if (timingPointsOnly) {
        performanceMetricsQuery = performanceMetricsQuery.where(
          "is_timing_point",
          "=",
          timingPointsOnly,
        );
      }

      const performanceMetrics = await performanceMetricsQuery.execute();

      const codes = performanceMetrics.map(
        (stat) => stat.noc_and_line_and_servicecode,
      );
      const services = await context.kysely
        .selectFrom("expected_services")
        .where("noc_and_line_and_servicecode", "in", codes)
        .select(["noc_and_line_and_servicecode", "service_name"])
        .execute();

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

      const operatorIds = args.inputs.filters.operatorIds ?? [];
      const lineIds = args.inputs.filters.lineIds ?? [];

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

          const services = await context.kysely
            .selectFrom("expected_services")
            .where("noc_and_line_and_servicecode", "in", noc_and_lines)
            .select(["noc_and_line_and_servicecode", "service_name"])
            .execute();

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
      if (!userOperatorIds.includes(args.operatorId)) {
        return [];
      }
      const end = userSelectedDateAsUtc(args.toTimestamp).toDate();
      const start = userSelectedDateAsUtc(args.fromTimestamp).toDate();
      const results = await context.kysely
        .selectFrom("timetable_frequent_summary_services")
        .where("operator_noc", "=", args.operatorId)
        .where("date_of_journey", ">=", start)
        .where("date_of_journey", "<", end)
        .select("noc_and_line_and_servicecode")
        .distinct()
        .execute();

      return results.map((result) => ({
        serviceId: result.noc_and_line_and_servicecode,
      }));
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
          currentHeadway.headway_stops_count.toNumber();
        acc.headwayCount += currentHeadway.headway_stops_count.toNumber();

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
          const time = toUkTime(result.departure_hour);
          const timeIndex =
            args.inputs.filters.granularity === Granularity.Day
              ? time.startOf("day")
              : time;
          const index = timeIndex.toISOString();
          const headwayData = (headwayMap[index] ??= {
            actual_headway: 0,
            expected_headway: 0,
            excess_wait_time: 0,
            headway_stops_count: 0,
          });
          headwayData.actual_headway +=
            result.actual_headway.toNumber() *
            result.headway_stops_count.toNumber();
          headwayData.expected_headway +=
            result.expected_headway.toNumber() *
            result.headway_stops_count.toNumber();
          headwayData.excess_wait_time +=
            result.excess_wait_time.toNumber() *
            result.headway_stops_count.toNumber();
          headwayData.headway_stops_count +=
            result.headway_stops_count.toNumber();
        }
      });

      const returnHeadways: HeadwayTimeSeriesType[] = [];

      for (const [departure_hour, headway] of Object.entries(headwayMap)) {
        returnHeadways.push({
          ts: new Date(departure_hour),
          // Prevent confusion on the front end by rounding to the nearest second before converting to number of minutes
          actualWaitTime: headway.actual_headway / headway.headway_stops_count,
          scheduledWaitTime:
            headway.expected_headway / headway.headway_stops_count,
          excessWaitTime:
            headway.excess_wait_time / headway.headway_stops_count,
        });
      }

      return returnHeadways.sort((a, b) => {
        if (dayjs(a.ts).isBefore(dayjs(b.ts))) return -1;
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
    const adminAreaRecords = await context.kysely
      .selectFrom("noc_adminarea")
      .where(
        "national_operator_code",
        "in",
        getUserOperatorIdsQuery(context.kysely, user),
      )
      .select("adminarea_id")
      .execute();

    if (adminAreaRecords) {
      const adminareaIds = adminAreaRecords.map((a) => a.adminarea_id);
      const adminAreas = await context.kysely
        .selectFrom("naptan_adminarea_with_shape")
        .where("id", "in", adminareaIds)
        .select(["id", "name", "st_asgeojson"])
        .execute();

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

export const addUkTime = (date: Dayjs, time: string | null | undefined) => {
  const timestamp = date;
  if (!time) {
    return date.utc();
  }
  const [hours, minutes, _] = time.split(":").map(Number);
  return toUkTime(timestamp)
    .set("hour", hours)
    .set("minute", minutes)
    .startOf("minute")
    .utc();
};

export const getPrismaFiltersForOTPQuery = (
  inputs: PerformanceInputType &
    HeadwayInputType &
    FrequentServiceInfoInputType,
  userOperatorNocList: string[],
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
  const maxLateNumber = maxDelay ?? 0;
  const maxEarlyNumber = minDelay ? Math.abs(minDelay) : 0;

  const isServiceGranularity = lineIds && lineIds.length > 0;
  const allOperators = operatorIds?.length > 0 || !!operatorId;

  const lines = lineId ? [lineId] : lineIds;

  return {
    operator_noc: { in: nocListToFilter },
    date_of_journey: { gte: startDateUtc.toDate(), lt: endDateUtc.toDate() },
    estimated: matchType === MatchType.Evidenced ? false : Prisma.skip,
    is_timing_point: timingPointsOnly ? true : Prisma.skip,
    day_of_week: dayOfWeekFlags ? { in: dayOfWeekNumbers } : Prisma.skip,
    ...(!startTime && !endTime
      ? {}
      : startDateTimeUtc.hour() > endDateTimeUtc.hour()
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
          }),
    max_early:
      maxEarlyNumber > 0 && !isServiceGranularity
        ? { lte: maxEarlyNumber }
        : Prisma.skip,
    max_late:
      maxLateNumber > 0 && !isServiceGranularity
        ? { lte: maxLateNumber }
        : Prisma.skip,
    noc_and_line_and_servicecode: lines ? { in: lines } : Prisma.skip,
    admin_areas:
      adminAreaIds && adminAreaIds.length > 0
        ? !allOperators
          ? { hasSome: adminAreaIds.map(Number) }
          : { hasEvery: adminAreaIds.map(Number) }
        : Prisma.skip,
  };
};

const otpResolvers: Resolvers = {
  Query: {
    operators: getOperatorList,
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
