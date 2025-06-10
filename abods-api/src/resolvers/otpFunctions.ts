import {
  AdminAreasType,
  DelayFrequencyType,
  Direction,
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
import { Prisma } from "@prisma/client";
import { getDayOfWeekNumbers } from "../lib/utils.js";
import { emptyResolver, requireUserSession } from "./helpers.js";
import {
  getUserOperatorIds,
  getUserOperatorIdsQuery,
} from "../lib/operators.js";
import { Kysely, sql } from "kysely";
import { DB } from "../kysely.js";
import { listServiceLinks } from "../lib/common.js";
import dayjs from "dayjs";

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
    const service = await context.db.expected_services.findFirst({
      where: {
        noc_and_line_and_servicecode: args.serviceId,
      },
      select: {
        operator_noc: true,
        line_name: true,
        service_name: true,
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

export const kyselyFilterForAdminIds = (
  query: ReturnType<typeof getKyselyFiltersForOTPQuery>,
  adminAreaIds: string[],
) => {
  if (adminAreaIds && adminAreaIds.length > 0) {
    query = query.where(
      sql<boolean>`admin_areas && ARRAY[${sql.join(adminAreaIds)}]::int4[]`,
    );
  }
  return query;
};

export const getPunctualityOverview: OnTimePerformanceTypeResolvers["punctualityOverview"] =
  async (_, args, context): Promise<Maybe<PunctualityTotalsType>> => {
    const user = await requireUserSession(context);
    try {
      const { filters } = args.inputs;
      const {
        lineIds,
        onTimeMaxMinutes,
        onTimeMinMinutes,
        adminAreaIds,
        startTime,
        endTime,
        operatorIds,
        direction,
      } = filters || {};

      const isDirectionsDisabled =
        process.env.ABODS_FLAG_DirectionsDisabled &&
        process.env.ABODS_FLAG_DirectionsDisabled === "true";

      const userOperatorIds = await getUserOperatorIds(user, context.kysely);
      if (onTimeMinMinutes || onTimeMaxMinutes) {
        return compareThresholds(args.inputs, userOperatorIds, context.kysely);
      }

      let summaryTable: OTPSummaryTables =
        operatorIds && operatorIds.length > 0
          ? "timetable_summary_service_tz"
          : "timetable_summary_operator_t";

      if (isDirectionsDisabled) {
        summaryTable = lineIds
          ? "timetable_summary_service_tz"
          : "timetable_summary_operator_t";
      }

      let summarySubQuery = getKyselyFiltersForOTPQuery(
        context.kysely,
        summaryTable,
        args.inputs,
        userOperatorIds,
      );

      if (Array.isArray(direction) && !direction.includes(Direction.All)) {
        summarySubQuery = summarySubQuery.where("direction", "in", direction);
      }

      summarySubQuery = kyselyFilterForAdminIds(
        summarySubQuery,
        adminAreaIds ?? [],
      );

      // Needs to be aliased separately. Need to find out why
      const aliasedSubQuery = summarySubQuery.as("summary");
      let mainQuery = context.kysely
        .selectFrom(aliasedSubQuery)
        .select([
          "incomplete_reason",
          "estimated",
          context.kysely.fn.sum("early_count").as("early_count"),
          context.kysely.fn.sum("late_count").as("late_count"),
          context.kysely.fn.sum("on_time_count").as("on_time_count"),
          context.kysely.fn.sum("completed").as("completed"),
          context.kysely.fn.sum("count_delayed").as("count_delayed"),
        ])
        .select((eb) => [
          sql<number>`SUM(${eb.ref("count_delayed")} * ${eb.ref("average_delay")})`.as(
            "average_delay",
          ),
          sql<number>`SUM(${eb.ref("scheduled")}) FILTER (WHERE ${eb.ref("estimated")} = false)`.as(
            "scheduled",
          ),
        ])
        .groupBy(["incomplete_reason", "estimated"]);

      if (startTime || endTime) {
        const start = Number((startTime ?? "00:00").split(":")[0]);
        const end = Number((endTime ?? "23:59").split(":")[0]);
        mainQuery = mainQuery
          .where("hour", ">=", start)
          .where("hour", "<=", end);
      }

      const results = await mainQuery.execute();

      const returnVal: PunctualityTotalsType = {
        scheduled: 0,
        early: 0,
        late: 0,
        onTime: 0,
        completed: 0,
        averageDeviation: 0,
        averageDelay: 0,
        incomplete: "{}", // To be replaced
      };
      const incompleteReasons: Record<number, number> = {};
      let averageDelayed: number | undefined = undefined;
      for (const result of results) {
        // https://github.com/kysely-org/kysely/issues/749
        const scheduled = Number(result.scheduled ?? 0);
        const reasonId = result.incomplete_reason ?? 0;

        // if the current row is estimated, and the request is to filter estimated,
        // then we should act as if they were all incomplete
        const ignoreEstimated =
          result.estimated &&
          args.inputs.filters.matchType === MatchType.Evidenced;

        // https://github.com/kysely-org/kysely/issues/749
        const completed = ignoreEstimated ? 0 : Number(result.completed ?? 0);
        const early = ignoreEstimated ? 0 : Number(result.early_count ?? 0);
        const late = ignoreEstimated ? 0 : Number(result.late_count ?? 0);
        const onTime = ignoreEstimated ? 0 : Number(result.on_time_count ?? 0);

        returnVal.scheduled += scheduled;
        returnVal.early += early;
        returnVal.late += late;
        returnVal.onTime += onTime;
        returnVal.completed += completed;
        if (
          result.count_delayed != undefined &&
          result.average_delay != undefined &&
          Number(result.count_delayed) > 0
        ) {
          averageDelayed =
            averageDelayed ??
            0 + Number(result.average_delay) / Number(result.count_delayed);
        }
        incompleteReasons[reasonId] ??= 0;
        incompleteReasons[reasonId] += scheduled - completed;
      }
      returnVal.incomplete = JSON.stringify(incompleteReasons);
      returnVal.averageDelay = averageDelayed;

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
      const { adminAreaIds, startTime, endTime } = filters || {};

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

      let summarySubQuery = getKyselyFiltersForOTPQuery(
        context.kysely,
        "timetable_summary_operator_t",
        args.inputs,
        operators.map((o) => o.operatorref),
      );

      summarySubQuery = kyselyFilterForAdminIds(
        summarySubQuery,
        adminAreaIds ?? [],
      );

      // Needs to be aliased separately. Need to find out why
      const aliasedSubQuery = summarySubQuery.as("summary");
      let mainQuery = context.kysely
        .selectFrom(aliasedSubQuery)
        .select([
          "operator_noc",
          context.kysely.fn.sum("early_count").as("early_count"),
          context.kysely.fn.sum("late_count").as("late_count"),
          context.kysely.fn.sum("on_time_count").as("on_time_count"),
          context.kysely.fn.sum("completed").as("completed"),
          context.kysely.fn.sum("scheduled").as("scheduled"),
          context.kysely.fn.sum("count_delayed").as("count_delayed"),
        ])
        .select((eb) => [
          sql<number>`SUM(${eb.ref("count_delayed")} * ${eb.ref("average_delay")})`.as(
            "average_delay",
          ),
        ])
        .groupBy(["operator_noc"]);

      if (startTime || endTime) {
        const start = Number((startTime ?? "00:00").split(":")[0]);
        const end = Number((endTime ?? "23:59").split(":")[0]);
        mainQuery = mainQuery
          .where("hour", ">=", start)
          .where("hour", "<=", end);
      }

      const results = await mainQuery.execute();

      for (const item of operators.sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", undefined, {
          numeric: true,
        }),
      )) {
        const operatorOtpStats = results.find(
          (o) => o.operator_noc == item.operatorref,
        );
        if (operatorOtpStats) {
          const totalOntime = operatorOtpStats.on_time_count
              ? operatorOtpStats.on_time_count
              : 0,
            totalEarly = operatorOtpStats.early_count
              ? operatorOtpStats.early_count
              : 0,
            totalLate = operatorOtpStats.late_count
              ? operatorOtpStats.late_count
              : 0,
            averageDelay =
              operatorOtpStats.average_delay == undefined
                ? undefined
                : Number(operatorOtpStats.count_delayed) > 0
                  ? Number(operatorOtpStats.average_delay) /
                    Number(operatorOtpStats.count_delayed)
                  : 0;

          const opPerformance: OperatorPerformanceType = {
            nocCode: item.operatorref,
            operatorId: item.operatorref,
            name: item.name,
            early: Number(totalEarly),
            late: Number(totalLate),
            onTime: Number(totalOntime),
            averageDelay: averageDelay,
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
      const startTime = args.inputs.filters.startTime;
      const endTime = args.inputs.filters.endTime;
      const adminAreaIds = args.inputs.filters.adminAreaIds;
      const operatorIds = args.inputs.filters.operatorIds ?? [];

      // fetch all otp records group by time difference
      if (operatorIds.length == 1) {
        logger.debug({ operatorIds }, "getPunctualityDayOfWeek");
        const userOperatorIds = await getUserOperatorIds(user, context.kysely);
        const operator_noc_to_filter = operatorIds[0];

        if (userOperatorIds.includes(operator_noc_to_filter)) {
          const summaryTable = lineIds
            ? "timetable_summary_service_tz"
            : "timetable_summary_operator_t";

          let summarySubQuery = getKyselyFiltersForOTPQuery(
            context.kysely,
            summaryTable,
            args.inputs,
            userOperatorIds,
          );

          summarySubQuery = kyselyFilterForAdminIds(
            summarySubQuery,
            adminAreaIds ?? [],
          );

          // Needs to be aliased separately. Need to find out why
          const aliasedSubQuery = summarySubQuery.as("summary");

          let mainQuery = context.kysely
            .selectFrom(aliasedSubQuery)
            .select([
              "day_of_week",
              context.kysely.fn.sum("early_count").as("early_count"),
              context.kysely.fn.sum("late_count").as("late_count"),
              context.kysely.fn.sum("on_time_count").as("on_time_count"),
            ])
            .groupBy(["day_of_week"]);

          if (startTime || endTime) {
            const start = Number((startTime ?? "00:00").split(":")[0]);
            const end = Number((endTime ?? "23:59").split(":")[0]);
            mainQuery = mainQuery
              .where("hour", ">=", start)
              .where("hour", "<=", end);
          }

          const results = await mainQuery.execute();

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
                day.early += dayRecord.early_count
                  ? Number(dayRecord.early_count)
                  : 0;
                day.onTime += dayRecord.on_time_count
                  ? Number(dayRecord.on_time_count)
                  : 0;
                day.late += dayRecord.late_count
                  ? Number(dayRecord.late_count)
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

export const getDelayFrequency: OnTimePerformanceTypeResolvers["delayFrequency"] =
  async (_, args, context): Promise<Maybe<DelayFrequencyType[]>> => {
    const user = await requireUserSession(context);
    try {
      // bucket is the number difference in the OTP table
      // freq is the count of that difference

      const { filters } = args.inputs;
      const { adminAreaIds, startTime, endTime, maxDelay, minDelay } =
        filters || {};
      const operatorIds = filters.operatorIds ?? [];

      args.inputs.filters.maxDelay = 0;
      args.inputs.filters.minDelay = 0;
      // fetch all otp records group by time difference
      if (operatorIds.length == 1) {
        logger.debug({ operatorIds }, "getDelayFrequency");
        const userOperatorIds = await getUserOperatorIds(user, context.kysely);

        const operator_noc_to_filter = operatorIds[0];

        if (userOperatorIds.includes(operator_noc_to_filter)) {
          let summarySubQuery = getKyselyFiltersForOTPQuery(
            context.kysely,
            "timetable_threshold_summary",
            args.inputs,
            userOperatorIds,
          );

          summarySubQuery = kyselyFilterForAdminIds(
            summarySubQuery,
            adminAreaIds ?? [],
          );

          summarySubQuery = summarySubQuery.where(
            "time_diff_minutes",
            "is not",
            null,
          );

          if (maxDelay) {
            summarySubQuery = summarySubQuery.where(
              "time_diff_minutes",
              "<=",
              maxDelay,
            );
          }

          if (minDelay) {
            summarySubQuery = summarySubQuery.where(
              "time_diff_minutes",
              ">=",
              minDelay,
            );
          }

          // Needs to be aliased separately. Need to find out why
          const aliasedSubQuery = summarySubQuery.as("summary");

          let mainQuery = context.kysely
            .selectFrom(aliasedSubQuery)
            .select([
              "time_diff_minutes",
              context.kysely.fn.sum("otp_count").as("otp_count"),
            ])
            .groupBy(["time_diff_minutes"]);

          if (startTime || endTime) {
            const start = Number((startTime ?? "00:00").split(":")[0]);
            const end = Number((endTime ?? "23:59").split(":")[0]);
            mainQuery = mainQuery
              .where("hour", ">=", start)
              .where("hour", "<=", end);
          }

          const results = await mainQuery.execute();

          return results
            .sort((a, b) => {
              if (a.time_diff_minutes && b.time_diff_minutes)
                return a.time_diff_minutes - b.time_diff_minutes;

              return 0;
            })
            .map((result) => ({
              bucket: Number(result.time_diff_minutes),
              frequency: Number(result.otp_count),
            }));
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
      const startTime = args.inputs.filters.startTime;
      const endTime = args.inputs.filters.endTime;
      const adminAreaIds = args.inputs.filters.adminAreaIds;

      // fetch all otp records group by time difference
      if (operatorIds.length == 1) {
        logger.debug({ operatorIds }, "getPunctualityTimeOfDay");
        const userOperatorIds = await getUserOperatorIds(user, context.kysely);
        const operator_noc_to_filter = operatorIds[0];

        if (userOperatorIds.includes(operator_noc_to_filter)) {
          const summaryTable = lineIds
            ? "timetable_summary_service_tz"
            : "timetable_summary_operator_t";

          let summarySubQuery = getKyselyFiltersForOTPQuery(
            context.kysely,
            summaryTable,
            args.inputs,
            userOperatorIds,
          );

          summarySubQuery = kyselyFilterForAdminIds(
            summarySubQuery,
            adminAreaIds ?? [],
          );

          // Needs to be aliased separately. Need to find out why
          const aliasedSubQuery = summarySubQuery.as("summary");

          let mainQuery = context.kysely
            .selectFrom(aliasedSubQuery)
            .select([
              "hour",
              context.kysely.fn.sum("early_count").as("early_count"),
              context.kysely.fn.sum("late_count").as("late_count"),
              context.kysely.fn.sum("on_time_count").as("on_time_count"),
            ])
            .groupBy(["hour"]);

          if (startTime || endTime) {
            const start = Number((startTime ?? "00:00").split(":")[0]);
            const end = Number((endTime ?? "23:59").split(":")[0]);
            mainQuery = mainQuery
              .where("hour", ">=", start)
              .where("hour", "<=", end);
          }

          const results = await mainQuery.execute();

          results.forEach((res) => {
            if (res.hour) {
              const hour = dayjs()
                .tz("Europe/London")
                .set("hour", res.hour)
                .startOf("hour");
              hoursOfDay.push({
                timeOfDay: hour.format("HH:mm:ssZ"),
                early: Number(res.early_count ?? 0),
                onTime: Number(res.on_time_count ?? 0),
                late: Number(res.late_count ?? 0),
              });
            }
          });
        }
      }

      return hoursOfDay.sort((a, b) =>
        a.timeOfDay.toString().localeCompare(b.timeOfDay.toString()),
      );
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
      const { granularity, lineIds, adminAreaIds, startTime, endTime } =
        filters || {};
      const operatorIds = filters?.operatorIds ?? [];

      if (operatorIds.length == 1) {
        const isDayGranularity = granularity === Granularity.Day;
        //if (granularity == "day" && operatorIds.length == 1) {
        // get an array of user's org's operator nocs.
        const userOperatorIds = await getUserOperatorIds(user, context.kysely);
        const operator_noc_to_filter = operatorIds[0];

        if (userOperatorIds.includes(operator_noc_to_filter)) {
          let summary: PunctualityTimeSeriesType[] = [];

          const summaryTable = lineIds
            ? "timetable_summary_service_tz"
            : "timetable_summary_operator_t";

          let summarySubQuery = getKyselyFiltersForOTPQuery(
            context.kysely,
            summaryTable,
            args.inputs,
            userOperatorIds,
          );

          summarySubQuery = kyselyFilterForAdminIds(
            summarySubQuery,
            adminAreaIds ?? [],
          );

          // Needs to be aliased separately. Need to find out why
          const aliasedSubQuery = summarySubQuery.as("summary");

          let mainQuery = context.kysely
            .selectFrom(aliasedSubQuery)
            .select([
              isDayGranularity ? "date_of_journey" : "departure_hour",
              context.kysely.fn.sum("early_count").as("early_count"),
              context.kysely.fn.sum("late_count").as("late_count"),
              context.kysely.fn.sum("on_time_count").as("on_time_count"),
            ])
            .groupBy(
              isDayGranularity ? ["date_of_journey"] : ["departure_hour"],
            );

          if (startTime || endTime) {
            const start = Number((startTime ?? "00:00").split(":")[0]);
            const end = Number((endTime ?? "23:59").split(":")[0]);
            mainQuery = mainQuery
              .where("hour", ">=", start)
              .where("hour", "<=", end);
          }

          const results = await mainQuery.execute();

          results.forEach((result) => {
            if (result) {
              summary.push({
                ts: isDayGranularity
                  ? getFormattedDate(result.date_of_journey)
                  : getFormattedDate(result.departure_hour),
                early: Number(result.early_count ?? 0),
                late: Number(result.late_count ?? 0),
                onTime: Number(result.on_time_count ?? 0),
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

      const services = await context.db.expected_services.findMany({
        where: {
          noc_and_line_and_servicecode: {
            in: performanceMetrics.map(
              (stat) => stat.noc_and_line_and_servicecode,
            ),
          },
        },
        select: {
          noc_and_line_and_servicecode: true,
          service_name: true,
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

      const operatorIds = args.inputs.filters.operatorIds ?? [];
      const lineIds = args.inputs.filters.lineIds ?? [];
      const startTime = args.inputs.filters.startTime;
      const endTime = args.inputs.filters.endTime;
      const adminAreaIds = args.inputs.filters.adminAreaIds;
      const isTimingPoint = args.inputs.filters.timingPointsOnly;

      const stopPerformances: StopPerformanceType[] = [];

      // fetch all otp records group by time difference
      if (operatorIds.length == 1) {
        logger.debug({ operatorIds }, "getStopPerformance");
        const userOperatorIds = await getUserOperatorIds(user, context.kysely);
        const operator_noc_to_filter = operatorIds[0];

        if (userOperatorIds.includes(operator_noc_to_filter)) {
          // get a sum per day
          let summarySubQuery = getKyselyFiltersForOTPQuery(
            context.kysely,
            "timetable_summary_stops_tz",
            args.inputs,
            userOperatorIds,
          );

          summarySubQuery = kyselyFilterForAdminIds(
            summarySubQuery,
            adminAreaIds ?? [],
          );

          const isDirectionsDisabled =
            process.env.ABODS_FLAG_DirectionsDisabled === "true";

          // Needs to be aliased separately. Need to find out why
          const aliasedSubQuery = summarySubQuery.as("summary");
          let mainQuery = context.kysely
            .selectFrom(aliasedSubQuery)
            .select(
              isDirectionsDisabled
                ? [
                    "stop_id",
                    "common_name",
                    "is_timing_point",
                    context.kysely.fn.sum("early_count").as("early_count"),
                    context.kysely.fn.sum("late_count").as("late_count"),
                    context.kysely.fn.sum("on_time_count").as("on_time_count"),
                    context.kysely.fn.sum("completed").as("completed"),
                    context.kysely.fn.sum("count_delayed").as("count_delayed"),
                    context.kysely.fn
                      .avg("diff_sched_time_to_stop")
                      .as("diff_sched_time_to_stop"),
                    context.kysely.fn
                      .avg("diff_sched_time_to_stop_timing_point")
                      .as("diff_sched_time_to_stop_timing_point"),
                    context.kysely.fn
                      .avg("diff_actual_time_to_stop")
                      .as("diff_actual_time_to_stop"),
                    context.kysely.fn
                      .avg("diff_actual_time_to_stop_timing_point")
                      .as("diff_actual_time_to_stop_timing_point"),
                    context.kysely.fn
                      .avg("avg_time_difference")
                      .as("avg_time_difference"),
                  ]
                : [
                    "stop_id",
                    "common_name",
                    "is_timing_point",
                    context.kysely.fn.sum("early_count").as("early_count"),
                    context.kysely.fn.sum("late_count").as("late_count"),
                    context.kysely.fn.sum("on_time_count").as("on_time_count"),
                    context.kysely.fn.sum("completed").as("completed"),
                    context.kysely.fn.sum("count_delayed").as("count_delayed"),
                    context.kysely.fn
                      .avg("avg_time_difference")
                      .as("avg_time_difference"), // To be deleted when ABODS_FLAG_Directions is removed
                    context.kysely.fn
                      .avg("diff_sched_time_to_stop")
                      .as("diff_sched_time_to_stop"),
                    context.kysely.fn
                      .avg("diff_sched_time_to_stop_timing_point")
                      .as("diff_sched_time_to_stop_timing_point"),
                    context.kysely.fn
                      .avg("diff_actual_time_to_stop")
                      .as("diff_actual_time_to_stop"),
                    context.kysely.fn
                      .avg("diff_actual_time_to_stop_timing_point")
                      .as("diff_actual_time_to_stop_timing_point"),
                  ],
            )
            .select((eb) =>
              isDirectionsDisabled
                ? []
                : [
                    eb
                      .case()
                      .when(
                        sql`LOWER(${eb.ref("direction")})`,
                        "=",
                        "anticlockwise",
                      )
                      .then("inbound")
                      .when(
                        sql`LOWER(${eb.ref("direction")})`,
                        "=",
                        "clockwise",
                      )
                      .then("outbound")
                      .else(eb.ref("direction"))
                      .end()
                      .as("direction"),
                  ],
            )
            .select((eb) => [
              sql<number>`SUM(${eb.ref("count_delayed")} * ${eb.ref("average_delay")})`.as(
                "average_delay",
              ),
              sql<number>`SUM(${eb.ref("avg_time_difference")} * ${eb.ref("on_time_count")}) FILTER (WHERE ${eb.ref("on_time_count")} > 0) * 60`.as(
                "on_time_in_seconds",
              ),
              sql<number>`SUM(${eb.ref("avg_time_difference")} * ${eb.ref("late_count")}) FILTER (WHERE ${eb.ref("late_count")} > 0) * 60`.as(
                "late_in_seconds",
              ),
              sql<number>`SUM(${eb.ref("avg_time_difference")}  * ${eb.ref("early_count")}) FILTER (WHERE ${eb.ref("early_count")} > 0) * 60`.as(
                "early_in_seconds",
              ),
              sql<number>`SUM(${eb.ref("scheduled")}) FILTER (WHERE ${eb.ref("estimated")} = false)`.as(
                "scheduled",
              ),
            ])
            .select((eb) =>
              isDirectionsDisabled
                ? []
                : [
                    eb
                      .case()
                      .when(
                        sql`LOWER(${eb.ref("direction")})`,
                        "=",
                        "anticlockwise",
                      )
                      .then("inbound")
                      .when(
                        sql`LOWER(${eb.ref("direction")})`,
                        "=",
                        "clockwise",
                      )
                      .then("outbound")
                      .else(eb.ref("direction"))
                      .end()
                      .as("direction"),
                  ],
            )
            .groupBy(
              isDirectionsDisabled
                ? ["stop_id", "common_name", "is_timing_point", "stop_index"]
                : [
                    "stop_id",
                    "common_name",
                    "is_timing_point",
                    "direction",
                    "stop_index",
                  ],
            )
            .orderBy("stop_index", "asc");

          if (startTime || endTime) {
            const start = Number((startTime ?? "00:00").split(":")[0]);
            const end = Number((endTime ?? "23:59").split(":")[0]);
            mainQuery = mainQuery
              .where("hour", ">=", start)
              .where("hour", "<=", end);
          }

          const results = await mainQuery.execute();

          const stopIds = results.map((res) => Number(res.stop_id));

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
            const timeInSeconds = res.avg_time_difference
              ? Number(res.avg_time_difference) * 60
              : 0;
            const stop = stops.find(
              (dbStop) => dbStop.id === Number(res.stop_id),
            );
            const averageScheduled = isTimingPoint
              ? Number(res.diff_sched_time_to_stop_timing_point)
                ? Number(res.diff_sched_time_to_stop_timing_point)
                : undefined
              : res.diff_sched_time_to_stop
                ? Number(res.diff_sched_time_to_stop)
                : undefined;
            const averageActual = isTimingPoint
              ? res.diff_actual_time_to_stop_timing_point
                ? Number(res.diff_actual_time_to_stop_timing_point)
                : undefined
              : res.diff_actual_time_to_stop
                ? Number(res.diff_actual_time_to_stop)
                : undefined;

            stopPerformances.push({
              lineId: lineIds[0],
              stopId: stop?.atco_code ?? "",
              stopInfo: {
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
              early: res.early_count ? Number(res.early_count) : 0,
              late: res.late_count ? Number(res.late_count) : 0,
              onTime: res.on_time_count ? Number(res.on_time_count) : 0,
              actualDepartures: res.completed ? Number(res.completed) : 0,
              scheduledDepartures: res.scheduled ? Number(res.scheduled) : 0,
              averageDelay: isDirectionsDisabled
                ? timeInSeconds
                : Number(res.count_delayed) > 0
                  ? Number(res.average_delay) / Number(res.count_delayed)
                  : undefined,
              countDelayed: Number(res.count_delayed),
              timingPoint: res.is_timing_point ?? false,
              direction: res.direction
                ? (res.direction as Direction)
                : undefined,
              averageScheduled: averageScheduled,
              averageActual: averageActual,
              onTimeInSeconds:
                res.on_time_count == undefined
                  ? undefined
                  : Number(res.on_time_count) > 0
                    ? Number(res.on_time_in_seconds) / Number(res.on_time_count)
                    : 0,
              earlyInSeconds:
                res.early_count == undefined
                  ? undefined
                  : Number(res.early_count) > 0
                    ? Number(res.early_in_seconds) / Number(res.early_count)
                    : 0,
              lateInSeconds:
                res.late_count == undefined
                  ? undefined
                  : Number(res.late_count) > 0
                    ? Number(res.late_in_seconds) / Number(res.late_count)
                    : 0,
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
      const { startTime, endTime, adminAreaIds } = filters || {};
      const operatorIds = filters.operatorIds ?? [];

      if (operatorIds.length == 1) {
        // get an array of user's org's operator nocs.
        const userOperatorIds = await getUserOperatorIds(user, context.kysely);
        const operator_noc_to_filter = operatorIds[0];

        const isDirectionsDisabled =
          process.env.ABODS_FLAG_DirectionsDisabled === "true";

        if (userOperatorIds.includes(operator_noc_to_filter)) {
          let summarySubQuery = getKyselyFiltersForOTPQuery(
            context.kysely,
            "timetable_summary_service_tz",
            args.inputs,
            userOperatorIds,
          );

          summarySubQuery = kyselyFilterForAdminIds(
            summarySubQuery,
            adminAreaIds ?? [],
          );

          // Needs to be aliased separately. Need to find out why
          const aliasedSubQuery = summarySubQuery.as("summary");
          let mainQuery = context.kysely
            .selectFrom(aliasedSubQuery)
            .select(
              // remove selecting directions when all directions is passed
              isDirectionsDisabled
                ? [
                    "noc_and_line_and_servicecode",
                    "line_name",
                    context.kysely.fn.sum("early_count").as("early_count"),
                    context.kysely.fn.sum("late_count").as("late_count"),
                    context.kysely.fn.sum("on_time_count").as("on_time_count"),
                    context.kysely.fn.sum("completed").as("completed"),
                    context.kysely.fn
                      .avg("avg_time_difference")
                      .as("avg_time_difference"),
                    context.kysely.fn.sum("count_delayed").as("count_delayed"),
                  ]
                : [
                    "noc_and_line_and_servicecode",
                    "line_name",
                    "direction",
                    context.kysely.fn.sum("early_count").as("early_count"),
                    context.kysely.fn.sum("late_count").as("late_count"),
                    context.kysely.fn.sum("on_time_count").as("on_time_count"),
                    context.kysely.fn.sum("completed").as("completed"),
                    context.kysely.fn
                      .avg("avg_time_difference")
                      .as("avg_time_difference"),
                    context.kysely.fn.sum("count_delayed").as("count_delayed"),
                  ],
            )
            .select((eb) =>
              isDirectionsDisabled
                ? []
                : [
                    eb
                      .case()
                      .when(
                        sql`LOWER(${eb.ref("direction")})`,
                        "=",
                        "anticlockwise",
                      )
                      .then("inbound")
                      .when(
                        sql`LOWER(${eb.ref("direction")})`,
                        "=",
                        "clockwise",
                      )
                      .then("outbound")
                      .else(eb.ref("direction"))
                      .end()
                      .as("direction"),
                  ],
            )
            .select((eb) => [
              sql`SUM(${eb.ref("count_delayed")} * ${eb.ref("average_delay")})`.as(
                "average_delay",
              ),
              sql<number>`SUM(${eb.ref("avg_time_difference")} * ${eb.ref("on_time_count")}) FILTER (WHERE ${eb.ref("on_time_count")} > 0) * 60`.as(
                "on_time_in_seconds",
              ),
              sql<number>`SUM(${eb.ref("avg_time_difference")} * ${eb.ref("late_count")}) FILTER (WHERE ${eb.ref("late_count")} > 0) * 60`.as(
                "late_in_seconds",
              ),
              sql<number>`SUM(${eb.ref("avg_time_difference")}  * ${eb.ref("early_count")}) FILTER (WHERE ${eb.ref("early_count")} > 0) * 60`.as(
                "early_in_seconds",
              ),
              sql<number>`SUM(${eb.ref("scheduled")}) FILTER (WHERE ${eb.ref("estimated")} = false)`.as(
                "scheduled",
              ),
            ])
            .select((eb) =>
              isDirectionsDisabled
                ? []
                : [
                    eb
                      .case()
                      .when(
                        sql`LOWER(${eb.ref("direction")})`,
                        "=",
                        "anticlockwise",
                      )
                      .then("inbound")
                      .when(
                        sql`LOWER(${eb.ref("direction")})`,
                        "=",
                        "clockwise",
                      )
                      .then("outbound")
                      .else(eb.ref("direction"))
                      .end()
                      .as("direction"),
                  ],
            )
            .groupBy(
              isDirectionsDisabled
                ? ["noc_and_line_and_servicecode", "line_name"]
                : ["noc_and_line_and_servicecode", "line_name", "direction"],
            );

          if (startTime || endTime) {
            const start = Number((startTime ?? "00:00").split(":")[0]);
            const end = Number((endTime ?? "23:59").split(":")[0]);
            mainQuery = mainQuery
              .where("hour", ">=", start)
              .where("hour", "<=", end);
          }

          const results = await mainQuery.execute();

          const noc_and_lines = results
            .map((result) => result.noc_and_line_and_servicecode)
            .filter((code) => code !== null);

          const services = await context.db.expected_services.findMany({
            where: {
              noc_and_line_and_servicecode: {
                in: noc_and_lines,
              },
            },
            select: {
              service_name: true,
              noc_and_line_and_servicecode: true,
            },
          });

          results.forEach((res) => {
            const avgDelay = res.avg_time_difference
              ? Number(res.avg_time_difference) * 60
              : 0;
            const service = services.find(
              (serv) =>
                serv.noc_and_line_and_servicecode ===
                res.noc_and_line_and_servicecode,
            );

            servicePunctualities.push({
              lineId: res.noc_and_line_and_servicecode,
              early: res.early_count ? Number(res.early_count) : 0,
              late: res.late_count ? Number(res.late_count) : 0,
              onTime: res.on_time_count ? Number(res.on_time_count) : 0,
              scheduledDepartures: res.scheduled ? Number(res.scheduled) : 0,
              actualDepartures: res.completed ? Number(res.completed) : 0,
              countDelayed: Number(res.count_delayed),
              averageDelay: isDirectionsDisabled
                ? avgDelay
                : Number(res.count_delayed) > 0
                  ? Number(res.average_delay) / Number(res.count_delayed)
                  : undefined,
              direction: res.direction
                ? (res.direction.toLowerCase() as Direction)
                : undefined,
              direction: res.direction
                ? (res.direction.toLowerCase() as Direction)
                : undefined,
              onTimeInSeconds:
                res.on_time_count == undefined
                  ? undefined
                  : Number(res.on_time_count) > 0
                    ? Number(res.on_time_in_seconds) / Number(res.on_time_count)
                    : 0,
              earlyInSeconds:
                res.early_count == undefined
                  ? undefined
                  : Number(res.early_count) > 0
                    ? Number(res.early_in_seconds) / Number(res.early_count)
                    : 0,
              lateInSeconds:
                res.late_count == undefined
                  ? undefined
                  : Number(res.late_count) > 0
                    ? Number(res.late_in_seconds) / Number(res.late_count)
                    : 0,
              lineInfo: {
                serviceId: res.noc_and_line_and_servicecode!,
                serviceNumber: res.line_name!,
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
        getSummaryStopsTotalHours(context.kysely, args.inputs, userOperatorIds),
        getFrequentServiceActualHours(
          context.kysely,
          args.inputs,
          userOperatorIds,
        ),
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
      const { filters } = args.inputs;
      const { startTime, endTime } = filters || {};

      const userOperatorIds = await getUserOperatorIds(user, context.kysely);
      const summarySubQuery = getKyselyFiltersForOTPQuery(
        context.kysely,
        "timetable_frequent_summary_services",
        args.inputs,
        userOperatorIds,
      );

      // Needs to be aliased separately. Need to find out why
      const aliasedSubQuery = summarySubQuery
        .where("headway_stops_count", ">", sql.lit("0"))
        .where("excess_wait_time", "is not", null)
        .as("summary");

      let mainQuery = context.kysely
        .selectFrom(aliasedSubQuery)
        .select(["headway_stops_count", "excess_wait_time"]);

      if (startTime || endTime) {
        const start = Number((startTime ?? "00:00").split(":")[0]);
        const end = Number((endTime ?? "23:59").split(":")[0]);
        mainQuery = mainQuery
          .where("hour", ">=", start)
          .where("hour", "<=", end);
      }

      const results = await mainQuery.execute();

      if (results.length < 1) {
        return {
          excess: undefined,
        };
      }

      if (results.length < 1) {
        return {
          excess: undefined,
        };
      }

      let headway = {
        excessWaitTime: 0,
        headwayCount: 0,
      };

      headway = results.reduce((acc, currentHeadway) => {
        acc.excessWaitTime +=
          // We've filtered out null values in where clause so its fine to assert not null
          Number(currentHeadway.excess_wait_time) *
          Number(currentHeadway.headway_stops_count);
        acc.headwayCount += Number(currentHeadway.headway_stops_count);

        return acc;
      }, headway);

      return {
        excess: headway.excessWaitTime / headway.headwayCount,
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
      const { startTime, endTime } = filters || {};

      const userOperatorIds = await getUserOperatorIds(user, context.kysely);
      const summarySubQuery = getKyselyFiltersForOTPQuery(
        context.kysely,
        "timetable_frequent_summary_services",
        args.inputs,
        userOperatorIds,
      );

      // Needs to be aliased separately. Need to find out why
      const aliasedSubQuery = summarySubQuery
        .where("headway_stops_count", ">", sql.lit("0"))
        .where("actual_headway", "is not", null)
        .where("expected_headway", "is not", null)
        .where("excess_wait_time", "is not", null)
        .as("summary");

      let mainQuery = context.kysely
        .selectFrom(aliasedSubQuery)
        .select([
          "date_of_journey",
          "departure_hour",
          "headway_stops_count",
          "actual_headway",
          "expected_headway",
          "excess_wait_time",
        ]);

      if (startTime || endTime) {
        const start = Number((startTime ?? "00:00").split(":")[0]);
        const end = Number((endTime ?? "23:59").split(":")[0]);
        mainQuery = mainQuery
          .where("hour", ">=", start)
          .where("hour", "<=", end);
      }

      const results = await mainQuery.execute();

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
            // We've filtered out null values in where clause so its fine to assert not null
            Number(result.actual_headway) * Number(result.headway_stops_count);
          headwayData.expected_headway +=
            // We've filtered out null values in where clause so its fine to assert not null
            Number(result.expected_headway) *
            Number(result.headway_stops_count);
          headwayData.excess_wait_time +=
            // We've filtered out null values in where clause so its fine to assert not null
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
          actual: headway.actual_headway / headway.headway_stops_count,
          scheduled: headway.expected_headway / headway.headway_stops_count,
          excess: headway.excess_wait_time / headway.headway_stops_count,
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

type OTPSummaryTables = keyof Pick<
  DB,
  | "timetable_summary_service_tz"
  | "timetable_summary_operator_t"
  | "timetable_summary_stops_tz"
  | "timetable_frequent_summary_services"
  | "timetable_threshold_summary"
>;

export const getKyselyFiltersForOTPQuery = (
  db: Kysely<DB>,
  tableName: OTPSummaryTables,
  inputs: PerformanceInputType &
    HeadwayInputType &
    FrequentServiceInfoInputType,
  userOperatorNocList: string[],
) => {
  const { fromTimestamp, toTimestamp, filters } = inputs || {};
  const {
    timingPointsOnly,
    operatorId,
    maxDelay,
    minDelay,
    lineIds,
    lineId,
    dayOfWeekFlags,
    matchType,
  } = filters || {};
  const operatorIds = filters?.operatorIds ?? [];

  const nocListToFilter: string[] = userOperatorNocList
    .filter((o) => operatorIds.includes(o))
    .filter((o) => !operatorId || o === operatorId);

  const startDateUtc = userSelectedDateAsUtc(fromTimestamp);
  const endDateUtc = userSelectedDateAsUtc(toTimestamp);

  // assign maxlate and maxearly filters (maxearly switched to positive for db condition)
  const maxLateNumber = maxDelay ?? 0;
  const maxEarlyNumber = minDelay ? Math.abs(minDelay) : 0;

  const isServiceGranularity = lineIds && lineIds.length > 0;

  const lines = lineId ? [lineId] : lineIds;

  let query = db
    .selectFrom(tableName)
    .selectAll()
    .select((eb) =>
      sql<number>`EXTRACT(HOUR FROM ${eb.ref("departure_hour")} AT TIME ZONE 'Europe/London')`.as(
        "hour",
      ),
    )
    .where("date_of_journey", ">=", startDateUtc.toDate())
    .where("date_of_journey", "<", endDateUtc.toDate());

  if (nocListToFilter.length > 0) {
    query = query.where("operator_noc", "in", nocListToFilter);
  }
  if (matchType && matchType === MatchType.Evidenced) {
    query = query.where("estimated", "=", false);
  }

  if (timingPointsOnly) {
    query = query.where("is_timing_point", "=", timingPointsOnly);
  }

  if (dayOfWeekFlags) {
    const dayOfWeekNumbers = getDayOfWeekNumbers(dayOfWeekFlags);
    query = query.where("day_of_week", "in", dayOfWeekNumbers);
  }

  if (maxEarlyNumber > 0 && !isServiceGranularity) {
    query = query.where("max_early", "<=", maxEarlyNumber);
  }

  if (maxLateNumber > 0 && !isServiceGranularity) {
    query = query.where("max_late", "<=", maxLateNumber);
  }

  if (lines) {
    query = query.where("noc_and_line_and_servicecode", "in", lines);
  }

  return query;
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
