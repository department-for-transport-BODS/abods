import { IResolvers } from "@graphql-tools/utils";
import {
  getAdminAreas,
  getDelayFrequency,
  getFrequentServiceInfo,
  getFrequentServices,
  getHeadwayDayOfWeek,
  getHeadwayOverview,
  getHeadwayTimeOfDay,
  getHeadwayTimeSeries,
  getJourneyScheduledStartTimes,
  getLines,
  getOperator,
  getOperatorList,
  getOperatorPerformance,
  getPunctualityDayOfWeek,
  getPunctualityOverview,
  getPunctualityTimeOfDay,
  getPunctualityTimeSeries,
  getServiceInfo,
  getServicePerformance,
  getServicePunctuality,
  getStopPerformance,
} from "./otpFunctions.js";
import { FeedMonitoringType, RequestContext } from "../../types.js";
import { GraphQLResolveInfo } from "graphql";
import { getFeedMonitoringList } from "../../lib/otp.js";

const otpResolvers: IResolvers = {
  Query: {
    operators: async (
      _: any,
      { filterBy },
      { sessionUser, db }: RequestContext,
      info: GraphQLResolveInfo
    ) => getOperatorList(filterBy, sessionUser, db),
    operator: async (
      _: any,
      { operatorId },
      { sessionUser, db }: RequestContext,
      info: GraphQLResolveInfo
    ) => getOperator(operatorId, sessionUser, db, info),
    onTimePerformance: async () => {
      return {};
    }, // stub -> sub-resolvers do the work
    headwayMetrics: async () => {
      return {};
    }, // stub -> sub-resolvers do the work
    serviceInfo: async (
      _,
      { serviceId },
      { sessionUser, db }: RequestContext
    ) => getServiceInfo(serviceId, sessionUser, db),
    adminAreas: async (
      _: any,
      { adminAreaIds }: { adminAreaIds: string[] },
      { sessionUser, db }: RequestContext
    ) => getAdminAreas(adminAreaIds, sessionUser, db),
  },
  OnTimePerformanceType: {
    delayFrequency: async (
      _,
      { inputs },
      { sessionUser, db }: RequestContext
    ) => getDelayFrequency(inputs, sessionUser, db),
    journeyScheduledStartTimes: async (
      _,
      { sessionUser, db }: RequestContext
    ) => getJourneyScheduledStartTimes(sessionUser, db),
    operatorPerformance: async (
      _,
      { inputs },
      { sessionUser, db }: RequestContext
    ) => getOperatorPerformance(inputs, sessionUser, db),
    punctualityDayOfWeek: async (
      _,
      { inputs },
      { sessionUser, db }: RequestContext
    ) => getPunctualityDayOfWeek(inputs, sessionUser, db),
    punctualityOverview: async (
      _,
      { inputs },
      { sessionUser, db }: RequestContext
    ) => getPunctualityOverview(inputs, sessionUser, db),
    punctualityTimeOfDay: async (
      _,
      { inputs },
      { sessionUser, db }: RequestContext
    ) => getPunctualityTimeOfDay(inputs, sessionUser, db),
    punctualityTimeSeries: async (
      _,
      { inputs },
      { sessionUser, db }: RequestContext
    ) => getPunctualityTimeSeries(inputs, sessionUser, db),
    servicePunctuality: async (
      _,
      { inputs },
      { sessionUser, db }: RequestContext
    ) => getServicePunctuality(inputs, sessionUser, db),
    stopPerformance: async (
      _,
      { inputs },
      { sessionUser, db }: RequestContext
    ) => getStopPerformance(inputs, sessionUser, db),
    servicePerformance: async (
      _,
      { inputs },
      { sessionUser, db }: RequestContext
    ) => getServicePerformance(inputs, sessionUser, db),
  },
  HeadwayMetricsType: {
    frequentServices: async (
      _,
      { operatorId, fromTimestamp, toTimestamp },
      { sessionUser, db }: RequestContext
    ) =>
      getFrequentServices(
        operatorId,
        fromTimestamp,
        toTimestamp,
        sessionUser,
        db
      ),
    frequentServiceInfo: async (
      _,
      { inputs },
      { sessionUser, db }: RequestContext
    ) => getFrequentServiceInfo(inputs, sessionUser, db),
    headwayDayOfWeek: async (
      _,
      { lineId },
      { sessionUser, db }: RequestContext
    ) => getHeadwayDayOfWeek(lineId, sessionUser, db),
    headwayOverview: async (
      _,
      { inputs },
      { sessionUser, db }: RequestContext
    ) => getHeadwayOverview(inputs, sessionUser, db),
    headwayTimeOfDay: async (
      _,
      { lineId },
      { sessionUser, db }: RequestContext
    ) => getHeadwayTimeOfDay(lineId, sessionUser, db),
    headwayTimeSeries: async (
      _,
      { inputs },
      { sessionUser, db }: RequestContext
    ) => getHeadwayTimeSeries(inputs, sessionUser, db),
  },
  OperatorsPage: {
    items: async (parent, _, __, info) => {
      return parent;
    },
  },
  OperatorType: {
    transitModel: async () => {
      return {};
    },
    feedMonitoring: async (
      parent,
      _,
      { sessionUser, db }: RequestContext,
      info
    ) => {
      const queryName = info.operation.name?.value;
      let feed: FeedMonitoringType | undefined = undefined;
      if (
        queryName === "feedMonitoringList" ||
        queryName === "operatorSparklineStats" ||
        queryName === "operatorLiveStatus"
      ) {
        feed = await getFeedMonitoringList(db, sessionUser, parent.operatorId);
      }

      return {
        operatorId: parent.operatorId,
        ...feed,
      };
    },
  },
  TransitModelType: {
    lines: async (
      _: any,
      { lineId },
      { sessionUser, db }: RequestContext,
      info: GraphQLResolveInfo
    ) => getLines(lineId, sessionUser, db, info),
  },
};

export default otpResolvers;
