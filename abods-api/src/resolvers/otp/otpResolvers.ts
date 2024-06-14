import { IResolvers } from '@graphql-tools/utils'
import { getAdminAreas, getDelayFrequency, getFrequentServiceInfo, getFrequentServices, getHeadwayDayOfWeek, getHeadwayOverview, getHeadwayTimeOfDay, getHeadwayTimeSeries, getJourneyScheduledStartTimes, getOperator, getOperatorList, getOperatorPerformance, getPunctualityDayOfWeek, getPunctualityOverview, getPunctualityTimeOfDay, getPunctualityTimeSeries, getServiceInfo, getServicePerformance, getServicePunctuality, getStopPerformance } from './otpFunctions.js';
import { RequestContext } from '../../types.js';
import { GraphQLResolveInfo } from 'graphql';

const otpResolvers: IResolvers = {
    Query: {
        operators: async (_: any, __: any, {sessionUser, db }: RequestContext) => getOperatorList(sessionUser, db),
        operator: async (_: any, {operatorId, lineId} , {sessionUser, db }: RequestContext, info: GraphQLResolveInfo) => getOperator(operatorId, lineId, sessionUser, db, info),
        onTimePerformance: async () => { return {}; }, // stub -> sub-resolvers do the work
        headwayMetrics: async () => { return {}; }, // stub -> sub-resolvers do the work 
        serviceInfo: async (_, { serviceId }, {sessionUser, db }: RequestContext) => getServiceInfo(serviceId, sessionUser, db),
        adminAreas: async (_: any, {adminAreaIds}: {adminAreaIds: string[]}, {sessionUser, db }: RequestContext) => getAdminAreas(adminAreaIds, sessionUser, db),
    },
    OnTimePerformanceType: {
        delayFrequency: async (_, { inputs }, {sessionUser, db }: RequestContext) => getDelayFrequency(inputs, sessionUser, db),
        journeyScheduledStartTimes: async (_, {sessionUser, db }: RequestContext) => getJourneyScheduledStartTimes(sessionUser, db),
        operatorPerformance: async (_, { inputs }, {sessionUser, db }: RequestContext) => getOperatorPerformance(inputs, sessionUser, db),
        punctualityDayOfWeek: async (_, { inputs }, {sessionUser, db }: RequestContext) => getPunctualityDayOfWeek(inputs, sessionUser, db),
        punctualityOverview: async (_, { inputs }, {sessionUser, db }: RequestContext) => getPunctualityOverview(inputs, sessionUser, db),
        punctualityTimeOfDay: async (_, { inputs }, {sessionUser, db }: RequestContext) => getPunctualityTimeOfDay(inputs, sessionUser, db),
        punctualityTimeSeries: async (_, { inputs }, {sessionUser, db }: RequestContext) => getPunctualityTimeSeries(inputs, sessionUser, db),
        servicePunctuality: async (_, { inputs }, {sessionUser, db }: RequestContext) => getServicePunctuality(sessionUser, db),
        stopPerformance: async (_, { inputs }, {sessionUser, db }: RequestContext) => getStopPerformance(inputs, sessionUser, db),
        servicePerformance: async (_, { inputs }, {sessionUser, db }: RequestContext) => getServicePerformance(inputs, sessionUser, db)
    },
    HeadwayMetricsType: {
        frequentServices: async (_, { operatorId, fromTimestamp, toTimestamp }, {sessionUser, db }: RequestContext) => getFrequentServices( operatorId, fromTimestamp, toTimestamp, sessionUser, db),
        frequentServiceInfo: async (_, { inputs }, {sessionUser, db }: RequestContext) => getFrequentServiceInfo(inputs, sessionUser, db),
        headwayDayOfWeek: async (_, { lineId }, {sessionUser, db }: RequestContext) => getHeadwayDayOfWeek(lineId, sessionUser, db),
        headwayOverview: async (_, { inputs }, {sessionUser, db }: RequestContext) => getHeadwayOverview(inputs, sessionUser, db),      
        headwayTimeOfDay: async (_, { lineId }, {sessionUser, db }: RequestContext) => getHeadwayTimeOfDay(lineId, sessionUser, db),
        headwayTimeSeries: async (_, { inputs }, {sessionUser, db }: RequestContext) => getHeadwayTimeSeries(inputs, sessionUser, db)
    }
}

export default otpResolvers;
