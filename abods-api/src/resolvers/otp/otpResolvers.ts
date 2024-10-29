import { getAdminAreas, getDelayFrequency, getFrequentServiceInfo, getFrequentServices, getHeadwayOverview, getHeadwayTimeSeries, getLines, getOperator, getOperatorList, getOperatorPerformance, getPunctualityDayOfWeek, getPunctualityOverview, getPunctualityTimeOfDay, getPunctualityTimeSeries, getServiceInfo, getServicePerformance, getServicePunctuality, getStopPerformance } from './otpFunctions.js';
import { RequestContext } from '../../types/extra.js';
import { GraphQLResolveInfo } from 'graphql';
import { FeedMonitoringListType } from '../../lib/feedMonitoring.js';
import { getFeedMonitoringList } from '../../lib/otp.js';
import { FeedMonitoringType, OperatorsPage, OperatorType, Resolvers } from '../../types/generated';

const otpResolvers: Resolvers = {
  Query: {
    operators: async (
      _: any,
      { filterBy },
      { sessionUser, db }: RequestContext,
    ): Promise<OperatorsPage> => getOperatorList(filterBy, sessionUser, db),
    operator: async (
      _: any,
      { operatorId },
      { sessionUser, db }: RequestContext,
      info: GraphQLResolveInfo
    ) => getOperator(operatorId, sessionUser, db),
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
      _,
      __,
      { sessionUser, db }: RequestContext
    ) => getAdminAreas(sessionUser, db),
  },
  OnTimePerformanceType: {
    delayFrequency: async (_, { inputs }, {sessionUser, db }: RequestContext) => getDelayFrequency(inputs, sessionUser, db),
    operatorPerformance: async (_, { inputs }, {sessionUser, db }: RequestContext) => getOperatorPerformance(inputs, sessionUser, db),
    punctualityDayOfWeek: async (_, { inputs }, {sessionUser, db }: RequestContext) => getPunctualityDayOfWeek(inputs, sessionUser, db),
    punctualityOverview: async (_, { inputs }, {sessionUser, db }: RequestContext) => getPunctualityOverview(inputs, sessionUser, db),
    punctualityTimeOfDay: async (_, { inputs }, {sessionUser, db }: RequestContext) => getPunctualityTimeOfDay(inputs, sessionUser, db),
    punctualityTimeSeries: async (_, { inputs }, {sessionUser, db }: RequestContext) => getPunctualityTimeSeries(inputs, sessionUser, db),
    servicePunctuality: async (_, { inputs }, {sessionUser, db }: RequestContext) => getServicePunctuality(inputs, sessionUser, db),
    stopPerformance: async (_, { inputs }, {sessionUser, db }: RequestContext) => getStopPerformance(inputs, sessionUser, db),
    servicePerformance: async (_, { inputs }, {sessionUser, db }: RequestContext) => getServicePerformance(inputs, sessionUser, db)
  },
  HeadwayMetricsType: {
    frequentServices: async (_, { operatorId, fromTimestamp, toTimestamp }, {sessionUser, db }: RequestContext) => getFrequentServices( operatorId, fromTimestamp, toTimestamp, sessionUser, db),
    frequentServiceInfo: async (_, { inputs }, {sessionUser, db }: RequestContext) => getFrequentServiceInfo(inputs, sessionUser, db),
    headwayOverview: async (_, { inputs }, {sessionUser, db }: RequestContext) => getHeadwayOverview(inputs, sessionUser, db),
    headwayTimeSeries: async (_, { inputs }, {sessionUser, db }: RequestContext) => getHeadwayTimeSeries(inputs, sessionUser, db)
  },
  OperatorsPage: {
    items: async (parent) => {
      return parent.items ?? [];
    },
  },
  OperatorType: {
    transitModel: async () => {
      return {};
    },
    feedMonitoring: async (
      { operatorId },
      _,
      { sessionUser, db }: RequestContext,
      info
    ): Promise<FeedMonitoringType> => {
      const queryName = info.operation.name?.value;
      let feed: FeedMonitoringListType | undefined = undefined;
      // if (
      //   queryName === "feedMonitoringList" ||
      //   queryName === "operatorSparklineStats" ||
      //   queryName === "operatorLiveStatus"
      // ) {
      //   feed = await getFeedMonitoringList(db, sessionUser, operatorId );
      // }

      feed = await getFeedMonitoringList(db, sessionUser, operatorId );
      return feed;
    }
  },
  TransitModelType: {
    lines: async (
      _,
      __,
      { sessionUser, db }: RequestContext,
      info: GraphQLResolveInfo
    ) => getLines(sessionUser, db, info),
  },
};

export default otpResolvers;
