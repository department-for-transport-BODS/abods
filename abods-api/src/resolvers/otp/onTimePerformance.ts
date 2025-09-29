import {
  DelayFrequencyType,
  Direction,
  Granularity,
  MatchType,
  Maybe,
  OnTimePerformanceTypeResolvers,
  OperatorPerformancePage,
  OperatorPerformanceType,
  PunctualityDayOfWeekType,
  PunctualityTimeOfDayType,
  PunctualityTimeSeriesType,
  PunctualityTotalsType,
  RankingOrder,
  Resolvers,
  ServicePerformanceType,
  ServicePunctualityType,
  StopPerformanceType,
} from "../../types/generated.js";
import logger from "../../logger.js";
import { getFormattedDate, userSelectedDateAsUtc } from "../../lib/dayjs.js";
import {
  compareThresholds,
  getKyselyFiltersForOTPQuery,
  getOperatorsForUser,
  kyselyFilterForAdminIds,
} from "../../lib/otp.js";
import { requireUserSession } from "../helpers.js";
import { getUserOperatorIds } from "../../lib/operators.js";
import { sql } from "kysely";
import dayjs from "dayjs";
import { executeQuery } from "../../lib/dbKysely.js";
import { OTPSummaryTables } from "../../types/extra.js";

interface DayCount {
  dayOfWeek: number;
  early: number;
  onTime: number;
  late: number;
}

export const getPunctualityOverview: OnTimePerformanceTypeResolvers["punctualityOverview"] =
  async (_, args, context): Promise<Maybe<PunctualityTotalsType>> => {
    const user = await requireUserSession(context);
    try {
      const { filters } = args.inputs;
      const {
        onTimeMaxMinutes,
        onTimeMinMinutes,
        adminAreaIds,
        startTime,
        endTime,
        operatorIds,
        direction,
      } = filters || {};

      const userOperatorIds = await getUserOperatorIds(user, context.kysely);
      if (onTimeMinMinutes || onTimeMaxMinutes) {
        return compareThresholds(args.inputs, userOperatorIds, context.kysely);
      }

      const summaryTable: OTPSummaryTables =
        operatorIds && operatorIds.length > 0
          ? "timetable_summary_service_tz"
          : "timetable_summary_operator_t";

      let summarySubQuery = getKyselyFiltersForOTPQuery(
        context.kysely,
        summaryTable,
        args.inputs,
        userOperatorIds,
      );

      const filterDirections = direction?.filter((value) => value != undefined);
      if (
        Array.isArray(filterDirections) &&
        !filterDirections.includes(Direction.All)
      ) {
        if (filterDirections?.includes(Direction.Inbound)) {
          filterDirections.push(Direction.Anticlockwise);
        }

        if (filterDirections?.includes(Direction.Outbound)) {
          filterDirections.push(Direction.Clockwise);
        }
        summarySubQuery = summarySubQuery.where((eb) =>
          eb(
            eb.fn("lower", [eb.ref("direction")]),
            "in",
            filterDirections.map((v) => v.toLocaleLowerCase()),
          ),
        );
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

      const results = await executeQuery(mainQuery);
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
      const opPerformances: OperatorPerformanceType[] = [];

      const { filters } = args.inputs;
      const { adminAreaIds, startTime, endTime } = filters || {};

      // get an array of user's org's operator nocs.
      const operators = await getOperatorsForUser(
        context.db,
        user,
        adminAreaIds,
      );

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

      const results = await executeQuery(mainQuery);

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

          const results = await executeQuery(mainQuery);

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

          const results = await executeQuery(mainQuery);

          return results
            .sort((a, b) => {
              if (
                a.time_diff_minutes != undefined &&
                b.time_diff_minutes != undefined
              )
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

          const results = await executeQuery(mainQuery);

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

          const results = await executeQuery(mainQuery);

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
      const { filters, fromTimestamp, toTimestamp, order } = args.inputs;

      const from = userSelectedDateAsUtc(fromTimestamp);
      const to = userSelectedDateAsUtc(toTimestamp);

      const diff = to.diff(from, "days");

      const fromMonth = from.month();
      const currentMonth = dayjs().month();

      const getPeriodType = (days: number) => {
        if (days === 7) return "last_7_days";
        if (days === 28) return "last_28_days";
        return fromMonth === currentMonth ? "month_to_date" : "last_month";
      };

      const timingPointsOnly = filters.timingPointsOnly;

      const userOperatorIds = await getUserOperatorIds(user, context.kysely);
      const operatorNocs = userOperatorIds.filter(
        (n) => !filters.operatorIds || filters.operatorIds.includes(n),
      );

      if (operatorNocs.length === 0) return [];

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
        .where("period_type", "=", getPeriodType(diff))
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

      const performanceMetrics = await executeQuery(performanceMetricsQuery);

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

          // Needs to be aliased separately. Need to find out why
          const aliasedSubQuery = summarySubQuery.as("summary");
          let mainQuery = context.kysely
            .selectFrom(aliasedSubQuery)
            .select([
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
            ])
            .select((eb) => [
              eb
                .case()
                .when(sql`LOWER(${eb.ref("direction")})`, "=", "anticlockwise")
                .then("inbound")
                .when(sql`LOWER(${eb.ref("direction")})`, "=", "clockwise")
                .then("outbound")
                .else(eb.ref("direction"))
                .end()
                .as("direction"),
            ])
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
            .select((eb) => [
              eb
                .case()
                .when(sql`LOWER(${eb.ref("direction")})`, "=", "anticlockwise")
                .then("inbound")
                .when(sql`LOWER(${eb.ref("direction")})`, "=", "clockwise")
                .then("outbound")
                .else(eb.ref("direction"))
                .end()
                .as("direction"),
            ])
            .groupBy([
              "stop_id",
              "common_name",
              "is_timing_point",
              "direction",
              "stop_index",
            ])
            .orderBy("stop_index", "asc");

          if (startTime || endTime) {
            const start = Number((startTime ?? "00:00").split(":")[0]);
            const end = Number((endTime ?? "23:59").split(":")[0]);
            mainQuery = mainQuery
              .where("hour", ">=", start)
              .where("hour", "<=", end);
          }

          const results = await executeQuery(mainQuery);

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
              averageDelay:
                Number(res.count_delayed) > 0
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
            .select([
              "noc_and_line_and_servicecode",
              "line_name",
              "direction",
              context.kysely.fn.sum("early_count").as("early_count"),
              context.kysely.fn.sum("late_count").as("late_count"),
              context.kysely.fn.sum("on_time_count").as("on_time_count"),
              context.kysely.fn.sum("completed").as("completed"),
              context.kysely.fn.sum("count_delayed").as("count_delayed"),
            ])
            .select((eb) => [
              eb
                .case()
                .when(sql`LOWER(${eb.ref("direction")})`, "=", "anticlockwise")
                .then("inbound")
                .when(sql`LOWER(${eb.ref("direction")})`, "=", "clockwise")
                .then("outbound")
                .else(eb.ref("direction"))
                .end()
                .as("direction"),
            ])
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
            .select((eb) => [
              eb
                .case()
                .when(sql`LOWER(${eb.ref("direction")})`, "=", "anticlockwise")
                .then("inbound")
                .when(sql`LOWER(${eb.ref("direction")})`, "=", "clockwise")
                .then("outbound")
                .else(eb.ref("direction"))
                .end()
                .as("direction"),
            ])
            .groupBy([
              "noc_and_line_and_servicecode",
              "line_name",
              "direction",
            ]);

          if (startTime || endTime) {
            const start = Number((startTime ?? "00:00").split(":")[0]);
            const end = Number((endTime ?? "23:59").split(":")[0]);
            mainQuery = mainQuery
              .where("hour", ">=", start)
              .where("hour", "<=", end);
          }

          const results = await executeQuery(mainQuery);

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
              averageDelay:
                Number(res.count_delayed) > 0
                  ? Number(res.average_delay) / Number(res.count_delayed)
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

const onTimePerformanceResolvers: Resolvers = {
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
};

export default onTimePerformanceResolvers;
