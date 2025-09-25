import dayjs from "dayjs";
import { sql } from "kysely";
import { userSelectedDateAsUtc, toUkTime } from "../../lib/dayjs.js";
import { executeQuery } from "../../lib/dbKysely.js";
import { getUserOperatorIds } from "../../lib/operators.js";
import {
  getSummaryStopsTotalHours,
  getFrequentServiceActualHours,
  getKyselyFiltersForOTPQuery,
} from "../../lib/otp.js";
import logger from "../../logger.js";
import {
  FrequentServiceInfoType,
  FrequentServiceType,
  Granularity,
  HeadwayMetricsTypeResolvers,
  HeadwayOverviewType,
  HeadwayTimeSeriesType,
  Maybe,
  Resolvers,
} from "../../types/generated.js";
import { requireUserSession } from "../helpers.js";

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

      const results = await executeQuery(mainQuery);

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

      const results = await executeQuery(mainQuery);

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

const headwayMetricsResolvers: Resolvers = {
  HeadwayMetricsType: {
    frequentServices: getFrequentServices,
    frequentServiceInfo: getFrequentServiceInfo,
    headwayOverview: getHeadwayOverview,
    headwayTimeSeries: getHeadwayTimeSeries,
  },
};

export default headwayMetricsResolvers;
