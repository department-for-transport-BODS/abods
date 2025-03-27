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
import { getDayOfWeekNumbers } from "../lib/utils.js";
import { emptyResolver, requireUserSession } from "./helpers.js";
import {
  getUserOperatorIds,
  getUserOperatorIdsQuery,
} from "../lib/operators.js";
import { Kysely, SelectQueryBuilder, sql } from "kysely";
import { DB } from "../kysely.js";
import { listServiceLinks } from "../lib/common.js";
import dayjs, { Dayjs } from "dayjs";
import { SessionUser } from "../types/extra";

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

  let query = context.db
    .selectFrom("service_details as s")
    .where("s.operator_noc", "in", getUserOperatorIdsQuery(context.db, user))
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
    const userOperatorIds = await getUserOperatorIds(user, context.db);

    const service = await context.db
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

  let query = context.db
    .selectFrom("expected_services")
    .where("operator_noc", "in", getUserOperatorIdsQuery(context.db, user))
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
    .execute()
    .then((r) =>
      r.map((x) => ({
        ...x,
        adminAreaIds: x.adminAreaIds.filter((i) => i).map((i) => i!),
      })),
    );
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

  const routesQueryResults = await context.db
    .selectFrom("distinct_routes as d")
    .innerJoin("servicepattern_route as s", "d.id", "s.distinct_route_id")
    .select(["d.id", "d.route"])
    .execute();
  const routes = routesQueryResults.map((n) => ({
    ...n,
    stopIds: n.route.split(","),
  }));
  const allStopIds = [...new Set(routes.flatMap((n) => n.stopIds))];
  const stopQueryResults = await context.db
    .selectFrom("naptan_stoppoint_latlong")
    .where("atco_code", "in", allStopIds)
    .where("atco_code", "is not", null)
    .where("longitude", "is not", null)
    .where("latitude", "is not", null)
    .select(["common_name", "atco_code", "longitude", "latitude"])
    .execute();
  const stopDetails = stopQueryResults.map((n) => ({
    stopName: n.common_name ?? "unknown",
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
      context.db,
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

      if (onTimeMinMinutes || onTimeMaxMinutes) {
        return compareThresholds(args.inputs, context.db, user);
      }
      const inputs = {
        ...args.inputs,
        filters: {
          ...args.inputs.filters,
          matchType: MatchType.Estimated,
        },
      };
      const results = await otpFilters(
        context.db
          .selectFrom(
            lineIds
              ? "timetable_summary_service_tz"
              : "timetable_summary_operator_t",
          )
          .where(
            "operator_noc",
            "in",
            getUserOperatorIdsQuery(context.db, user),
          ),
        inputs,
      )
        .groupBy(["incomplete_reason", "estimated"])
        .select(["incomplete_reason", "estimated"])
        .select((eb) => [
          eb.fn.sum<number>("early_count").as("early_count"),
          eb.fn.sum<number>("late_count").as("late_count"),
          eb.fn.sum<number>("on_time_count").as("on_time_count"),
          eb.fn.sum<number>("scheduled").as("scheduled"),
          eb.fn.sum<number>("completed").as("completed"),
        ])
        .execute();

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
        const scheduled = result.scheduled ?? 0;
        const reasonId = result.incomplete_reason ?? 0;

        // if the current row is estimated, and the request is to filter estimated,
        // then we should act as if they were all incomplete
        const ignoreEstimated =
          result.estimated &&
          args.inputs.filters.matchType === MatchType.Evidenced;

        const completed = ignoreEstimated ? 0 : result.completed ?? 0;
        const early = ignoreEstimated ? 0 : result.early_count ?? 0;
        const late = ignoreEstimated ? 0 : result.late_count ?? 0;
        const onTime = ignoreEstimated ? 0 : result.on_time_count ?? 0;

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

      // get an array of user's org's operator nocs.
      let operatorQuery = context.db
        .selectFrom("all_operators")
        .where("operatorref", "in", getUserOperatorIdsQuery(context.db, user));
      if (
        args.inputs.filters.adminAreaIds &&
        args.inputs.filters.adminAreaIds.length > 0
      ) {
        operatorQuery = operatorQuery.where(
          "operatorref",
          "in",
          context.db
            .selectFrom("noc_adminarea")
            .where(
              "adminarea_id",
              "in",
              args.inputs.filters.adminAreaIds.map(Number),
            )
            .select("national_operator_code"),
        );
      }

      const results = await otpFilters(
        context.db
          .selectFrom("timetable_summary_operator_t")
          .where(
            "operator_noc",
            "in",
            getUserOperatorIdsQuery(context.db, user),
          ),
        args.inputs,
      )
        .groupBy("operator_noc")
        .select("operator_noc")
        .select((eb) => [
          eb.fn.sum<number>("early_count").as("early_count"),
          eb.fn.sum<number>("late_count").as("late_count"),
          eb.fn.sum<number>("on_time_count").as("on_time_count"),
          eb.fn.sum<number>("scheduled").as("scheduled"),
          eb.fn.sum<number>("completed").as("completed"),
        ])
        .execute();
      const operators = await operatorQuery
        .select(["operatorref", "name"])
        .execute();

      const opPerformances: OperatorPerformanceType[] = [];
      for (const item of operators.sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", undefined, {
          numeric: true,
        }),
      )) {
        const operatorOtpStats = results.find(
          (o) => o.operator_noc == item.operatorref,
        );
        if (!operatorOtpStats) {
          continue;
        }
        const opPerformance: OperatorPerformanceType = {
          nocCode: item.operatorref,
          operatorId: item.operatorref,
          name: item.name,
          early: operatorOtpStats.early_count ?? 0,
          late: operatorOtpStats.late_count ?? 0,
          onTime: operatorOtpStats.on_time_count ?? 0,
        };
        opPerformances.push(opPerformance);
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
      if (operatorIds.length != 1) {
        return [];
      }
      logger.debug({ operatorIds }, "getPunctualityDayOfWeek");
      const results = await otpFilters(
        context.db
          .selectFrom(
            lineIds
              ? "timetable_summary_service_tz"
              : "timetable_summary_operator_t",
          )
          .where(
            "operator_noc",
            "in",
            getUserOperatorIdsQuery(context.db, user),
          ),
        args.inputs,
      )
        .groupBy("day_of_week")
        .select("day_of_week")
        .select((eb) => [
          eb.fn.sum<number>("early_count").as("early_count"),
          eb.fn.sum<number>("late_count").as("late_count"),
          eb.fn.sum<number>("on_time_count").as("on_time_count"),
        ])
        .execute();

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
          if (dayRecord) {
            day.early += dayRecord.early_count ?? 0;
            day.onTime += dayRecord.on_time_count ?? 0;
            day.late += dayRecord.late_count ?? 0;
          }
        }
      }

      return dayOfWeek.filter((week) => {
        if (week.early === 0 && week.late === 0 && week.onTime === 0)
          return false;

        return true;
      });
    } catch (error) {
      logger.error(error, "An error occurred when getting day of week stats");
      return null;
    }
  };

export const timeDiffFilters = (
  queryInput: SelectQueryBuilder<DB, "timetable_threshold_summary", object>,
  inputs: PerformanceInputType,
): SelectQueryBuilder<DB, "timetable_threshold_summary", object> => {
  let query = otpFilters(queryInput, {
    ...inputs,
    filters: { ...inputs.filters, maxDelay: null, minDelay: null },
  }).where("time_diff_minutes", "is not", null);
  if (inputs.filters.maxDelay) {
    query = query.where("time_diff_minutes", "<=", inputs.filters.maxDelay);
  }
  if (inputs.filters.minDelay) {
    query = query.where("time_diff_minutes", "<=", inputs.filters.minDelay);
  }
  return query;
};

const getStopsDistribution = async (
  inputs: PerformanceInputType,
  db: Kysely<DB>,
  user: SessionUser,
) => {
  const results = await timeDiffFilters(
    db
      .selectFrom("timetable_threshold_summary")
      .where("operator_noc", "in", getUserOperatorIdsQuery(db, user)),
    inputs,
  )
    .groupBy("time_diff_minutes")
    .select("time_diff_minutes")
    .select((eb) => eb.fn.sum<number>("otp_count").as("otp_count"))
    .execute();

  return results
    .sort((a, b) => {
      if (a.time_diff_minutes && b.time_diff_minutes)
        return a.time_diff_minutes - b.time_diff_minutes;

      return 0;
    })
    .map((result) => ({
      bucket: Number(result.time_diff_minutes),
      frequency: result.otp_count,
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
      if (operatorIds.length != 1) {
        return null;
      }
      logger.debug({ operatorIds }, "getDelayFrequency");
      return getStopsDistribution(args.inputs, context.db, user);
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

      logger.debug("getPunctualityTimeOfDay");

      // bucket is the number difference in the OTP table
      // freq is the count of that difference

      const operatorIds = args.inputs.filters?.operatorIds ?? [];
      const lineIds = args.inputs.filters?.lineIds;

      // fetch all otp records group by time difference
      if (operatorIds.length != 1) {
        return [];
      }
      logger.debug({ operatorIds }, "getPunctualityTimeOfDay");
      const results = await otpFilters(
        context.db
          .selectFrom(
            lineIds
              ? "timetable_summary_service_tz"
              : "timetable_summary_operator_t",
          )
          .where(
            "operator_noc",
            "in",
            getUserOperatorIdsQuery(context.db, user),
          ),
        args.inputs,
      )
        .groupBy("departure_hour_only")
        .select("departure_hour_only")
        .select((eb) => [
          eb.fn.sum<number>("early_count").as("early_count"),
          eb.fn.sum<number>("late_count").as("late_count"),
          eb.fn.sum<number>("on_time_count").as("on_time_count"),
        ])
        .execute();

      const hoursOfDay: PunctualityTimeOfDayType[] = [];
      results.forEach((res) => {
        if (res.departure_hour_only) {
          hoursOfDay.push({
            timeOfDay: res.departure_hour_only,
            early: res.early_count ?? 0,
            onTime: res.on_time_count ?? 0,
            late: res.late_count ?? 0,
          });
        }
      });
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

      if (operatorIds.length != 1) {
        return null;
      }
      // get an array of user's org's operator nocs.
      const userOperatorIds = await getUserOperatorIds(user, context.db);
      const operator_noc_to_filter = operatorIds[0];

      if (!userOperatorIds.includes(operator_noc_to_filter)) {
        return null;
      }
      const query = otpFilters(
        context.db
          .selectFrom(
            lineIds
              ? "timetable_summary_service_tz"
              : "timetable_summary_operator_t",
          )
          .where(
            "operator_noc",
            "in",
            getUserOperatorIdsQuery(context.db, user),
          ),
        args.inputs,
      );
      const grouped =
        granularity === Granularity.Day
          ? query
              .groupBy(["date_of_journey"])
              .select(["date_of_journey as date"])
          : lineIds
            ? query
                .groupBy(["departure_hour"])
                .select(["departure_hour as date"])
            : query
                .groupBy(["date_of_journey", "departure_hour"])
                .select(["departure_hour as date"]);
      const results = await grouped
        .select((eb) => [
          eb.fn.sum<number>("early_count").as("early_count"),
          eb.fn.sum<number>("late_count").as("late_count"),
          eb.fn.sum<number>("on_time_count").as("on_time_count"),
        ])
        .execute();

      let summary = results.map((result) => ({
        ts: getFormattedDate(result.date),
        early: result.early_count ?? 0,
        late: result.late_count ?? 0,
        onTime: result.on_time_count ?? 0,
      }));

      summary = summary.sort((a, b) => {
        const firstTS = dayjs(a.ts);
        const secondTS = dayjs(b.ts);
        return firstTS.isAfter(secondTS) ? 1 : -1;
      });

      return summary;
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

      const userOperatorIds = await getUserOperatorIds(user, context.db);
      const operatorNocs = userOperatorIds.filter(
        (n) => n && (!filters.operatorIds || filters.operatorIds.includes(n)),
      );

      const orderFilter = order === RankingOrder.Ascending ? "asc" : "desc";

      let performanceMetricsQuery = context.db
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
      const services = await context.db
        .selectFrom("expected_services")
        .where("noc_and_line_and_servicecode", "in", codes)
        .select(["noc_and_line_and_servicecode", "service_name"])
        .execute();

      return performanceMetrics.map((stats) => ({
        nocCode: stats.operator_noc,
        lineId: stats.noc_and_line_and_servicecode,
        lineInfo: {
          serviceId: stats.noc_and_line_and_servicecode ?? "unknown",
          serviceName:
            services.find(
              (service) =>
                service.noc_and_line_and_servicecode ===
                stats.noc_and_line_and_servicecode,
            )?.service_name ?? "",
          serviceNumber: stats.line_name ?? "unknown",
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

      // fetch all otp records group by time difference
      if (operatorIds.length != 1) {
        return [];
      }
      logger.debug({ operatorIds }, "getStopPerformance");
      // get a sum per day
      const results = await otpFilters(
        context.db
          .selectFrom("timetable_summary_stops_tz")
          .where(
            "operator_noc",
            "in",
            getUserOperatorIdsQuery(context.db, user),
          ),
        args.inputs,
      )
        .groupBy(["stop_id", "common_name", "is_timing_point"])
        .select(["stop_id", "common_name", "is_timing_point"])
        .select((eb) => [
          eb.fn.sum<number>("early_count").as("early_count"),
          eb.fn.sum<number>("late_count").as("late_count"),
          eb.fn.sum<number>("on_time_count").as("on_time_count"),
          eb.fn.sum<number>("scheduled").as("scheduled"),
          eb.fn.sum<number>("completed").as("completed"),
          eb.fn.avg<number>("avg_time_difference").as("avg_time_difference"),
        ])
        .execute();

      const stopIds = results.map((res) => res.stop_id);

      const stops = await context.db
        .selectFrom("naptan_stoppoint_latlong as s")
        .innerJoin("naptan_locality as l", "l.gazetteer_id", "s.locality_id")
        .innerJoin("naptan_adminarea as a", "a.id", "l.admin_area_id")
        .where("s.id", "in", stopIds)
        .select([
          "s.id",
          "s.longitude",
          "s.latitude",
          "s.atco_code",
          "l.gazetteer_id",
          "l.name as localityName",
          "a.name as adminAreaName",
        ])
        .execute();

      return results.map((res) => {
        // avg delay
        const timeInSeconds = res.avg_time_difference
          ? Number(res.avg_time_difference) * 60
          : 0;

        const stop = stops.find((dbStop) => dbStop.id === res.stop_id);
        return {
          lineId: lineIds[0],
          stopId: stop?.atco_code ?? "",
          stopInfo: {
            stopId: stop?.atco_code ?? "",
            stopName: res.common_name ? res.common_name : "",
            stopLocality: {
              localityId: "",
              localityName: stop?.localityName ?? "",
              localityAreaId: "",
              localityAreaName: stop?.adminAreaName ?? "",
            },
            sourceId: stop?.atco_code ?? "",
            stopLocation: {
              longitude: stop?.longitude ?? 0,
              latitude: stop?.latitude ?? 0,
            },
          },
          early: res.early_count ?? 0,
          late: res.late_count ?? 0,
          onTime: res.on_time_count ?? 0,
          actualDepartures: res.completed ?? 0,
          scheduledDepartures: res.scheduled ?? 0,
          averageDelay: timeInSeconds,
          timingPoint: res.is_timing_point ? res.is_timing_point : false,
        };
      });
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
      const { filters } = args.inputs;
      let { operatorIds } = filters || {};
      operatorIds = operatorIds ?? [];

      if (operatorIds.length != 1) {
        return [];
      }
      // get an array of user's org's operator nocs.
      const userOperatorIds = await getUserOperatorIds(user, context.db);
      const operator_noc_to_filter = operatorIds[0];

      if (!userOperatorIds.includes(operator_noc_to_filter)) {
        return [];
      }
      // get a sum per day
      const results = await otpFilters(
        context.db
          .selectFrom("timetable_summary_service_tz")
          .where(
            "operator_noc",
            "in",
            getUserOperatorIdsQuery(context.db, user),
          ),
        args.inputs,
      )
        .groupBy(["noc_and_line_and_servicecode", "line_name"])
        .select(["noc_and_line_and_servicecode", "line_name"])
        .select((eb) => [
          eb.fn.sum<number>("early_count").as("early_count"),
          eb.fn.sum<number>("late_count").as("late_count"),
          eb.fn.sum<number>("on_time_count").as("on_time_count"),
          eb.fn.sum<number>("scheduled").as("scheduled"),
          eb.fn.sum<number>("completed").as("completed"),
          eb.fn.avg<number>("avg_time_difference").as("avg_time_difference"),
        ])
        .execute();

      const noc_and_lines = results.map(
        (result) => result.noc_and_line_and_servicecode,
      );

      const services = await context.db
        .selectFrom("expected_services")
        .where("noc_and_line_and_servicecode", "in", noc_and_lines)
        .select(["noc_and_line_and_servicecode", "service_name"])
        .execute();

      return results.map((res) => {
        const service = services.find(
          (serv) =>
            serv.noc_and_line_and_servicecode ===
            res.noc_and_line_and_servicecode,
        );

        return {
          lineId: res.noc_and_line_and_servicecode,
          early: res.early_count ? res.early_count : 0,
          late: res.late_count ? res.late_count : 0,
          onTime: res.on_time_count ? res.on_time_count : 0,
          scheduledDepartures: res.scheduled ? res.scheduled : 0,
          actualDepartures: res.completed ? res.completed : 0,
          averageDelay: res.avg_time_difference
            ? Number(res.avg_time_difference) * 60
            : 0,
          lineInfo: {
            serviceId: res.noc_and_line_and_servicecode,
            serviceNumber: res.line_name,
            serviceName: service?.service_name ?? "",
          },
        };
      });
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
      const userOperatorIds = await getUserOperatorIds(user, context.db);
      if (!userOperatorIds.includes(args.operatorId)) {
        return [];
      }
      const end = userSelectedDateAsUtc(args.toTimestamp).toDate();
      const start = userSelectedDateAsUtc(args.fromTimestamp).toDate();
      const results = await context.db
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
      const [totalHours, actualHours] = await Promise.all([
        getSummaryStopsTotalHours(context.db, args.inputs, user),
        getFrequentServiceActualHours(context.db, args.inputs, user),
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
      const results = await otpFilters(
        context.db
          .selectFrom("timetable_frequent_summary_services")
          .where(
            "operator_noc",
            "in",
            getUserOperatorIdsQuery(context.db, user),
          ),
        args.inputs,
      )
        .where("headway_stops_count", ">", "0")
        .select(["headway_stops_count", "excess_wait_time"])
        .execute();

      let headway = {
        excessWaitTime: 0,
        headwayCount: 0,
      };

      headway = results.reduce((acc, currentHeadway) => {
        acc.excessWaitTime +=
          Number(currentHeadway.excess_wait_time) *
          Number(currentHeadway.headway_stops_count);
        acc.headwayCount += Number(currentHeadway.headway_stops_count);

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
    const baseQuery = context.db
      .selectFrom("timetable_frequent_summary_services")
      .where("operator_noc", "in", getUserOperatorIdsQuery(context.db, user));
    try {
      const results = await otpFilters(baseQuery, args.inputs)
        .where("headway_stops_count", ">", "0")
        .select([
          "date_of_journey",
          "departure_hour",
          "headway_stops_count",
          "actual_headway",
          "expected_headway",
          "excess_wait_time",
        ])
        .execute();

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
            Number(result.actual_headway) * Number(result.headway_stops_count);
          headwayData.expected_headway +=
            Number(result.expected_headway) *
            Number(result.headway_stops_count);
          headwayData.excess_wait_time +=
            Number(result.excess_wait_time) *
            Number(result.headway_stops_count);
          headwayData.headway_stops_count += Number(result.headway_stops_count);
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
    const adminAreaRecords = await context.db
      .selectFrom("noc_adminarea")
      .where(
        "national_operator_code",
        "in",
        getUserOperatorIdsQuery(context.db, user),
      )
      .select("adminarea_id")
      .execute();

    if (adminAreaRecords) {
      const adminareaIds = adminAreaRecords.map((a) =>
        a.adminarea_id.toString(),
      );
      const adminAreas = await context.db
        .selectFrom("naptan_adminarea_with_shape")
        .where("id", "in", adminareaIds)
        .select(["id", "name", "st_asgeojson"])
        .execute();

      if (!adminAreas) {
        throw Error("No admin areas found");
      }

      return adminAreas.map((adminArea) => ({
        id: adminArea.id?.toString() ?? "unknown",
        name: adminArea.name ?? "unknown",
        shape: adminArea.st_asgeojson ?? "[]",
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

type tables =
  | "timetable_summary_service_tz"
  | "timetable_summary_operator_t"
  | "timetable_summary_stops_tz"
  | "timetable_threshold_summary"
  | "timetable_frequent_summary_services";
export function otpFilters<T extends tables>(
  queryInput: SelectQueryBuilder<DB, T, object>,
  inputs: PerformanceInputType &
    HeadwayInputType &
    FrequentServiceInfoInputType,
): SelectQueryBuilder<DB, T, object> {
  // We need to convert to non-generic type to get type checking here, even though this seems equivalent
  let query = queryInput as unknown as SelectQueryBuilder<DB, tables, object>;

  const startDateUtc = userSelectedDateAsUtc(inputs.fromTimestamp);
  const endDateUtc = userSelectedDateAsUtc(inputs.toTimestamp);
  query = query
    .where("date_of_journey", ">=", startDateUtc.toDate())
    .where("date_of_journey", "<", endDateUtc.toDate());

  const operatorIds = inputs.filters.operatorId
    ? [inputs.filters.operatorId]
    : inputs.filters.operatorIds ?? [];

  const operatorFilter = operatorIds.length > 0;
  if (operatorFilter) {
    query = query.where("operator_noc", "in", operatorIds);
  }

  // If start or end time aren't set, use the start and end of the day as default values,
  // so that we can still use the result in the filters
  const startDateTimeUtc = addUkTime(
    startDateUtc,
    inputs.filters.startTime ?? "00:00",
  );
  const endDateTimeUtc = addUkTime(
    // end date is the start of the next day, so go back a day for the end time
    // not clear how to handle this when we have data with a departure day shift
    endDateUtc.subtract(1, "day"),
    inputs.filters.endTime ?? "23:59",
  );
  if (inputs.filters.startTime || inputs.filters.endTime) {
    query = query.where(
      "departure_hour_only",
      ">=",
      startDateTimeUtc.format("HH:mm:ss Z"),
    );
    query = query.where(
      "departure_hour_only",
      "<=",
      endDateTimeUtc.format("HH:mm:ss Z"),
    );
  }

  const lines = inputs.filters.lineId
    ? [inputs.filters.lineId]
    : inputs.filters.lineIds;

  if (lines) {
    query = query.where("noc_and_line_and_servicecode", "in", lines);
  }

  if (inputs.filters.matchType === MatchType.Evidenced) {
    query = query.where("estimated", "is", false);
  }
  if (inputs.filters.timingPointsOnly) {
    query = query.where("is_timing_point", "is", true);
  }
  if (inputs.filters.dayOfWeekFlags) {
    query = query.where(
      "day_of_week",
      "in",
      getDayOfWeekNumbers(inputs.filters.dayOfWeekFlags),
    );
  }

  // assign maxlate and maxearly filters (maxearly switched to positive for db condition)
  const maxEarlyNumber = inputs.filters.minDelay
    ? Math.abs(inputs.filters.minDelay)
    : 0;
  const isServiceGranularity =
    inputs.filters.lineIds && inputs.filters.lineIds.length > 0;
  if (maxEarlyNumber > 0 && !isServiceGranularity) {
    query = query.where("max_early", "<=", maxEarlyNumber);
  }
  const maxLateNumber = inputs.filters.maxDelay ?? 0;
  if (maxLateNumber > 0 && !isServiceGranularity) {
    query = query.where("max_late", "<=", maxLateNumber);
  }

  if (inputs.filters.adminAreaIds && inputs.filters.adminAreaIds.length > 0) {
    const adminAreas = inputs.filters.adminAreaIds.map(Number);
    if (operatorFilter) {
      query = query.where("admin_areas", "@>", adminAreas);
    } else {
      query = query.where("admin_areas", "&&", adminAreas);
    }
  }

  // The caller needs the result back as the generic type
  return query as unknown as SelectQueryBuilder<DB, T, object>;
}

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
