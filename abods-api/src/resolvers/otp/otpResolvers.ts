import { IResolvers } from '@graphql-tools/utils'
import { getAdminAreas, getDelayFrequency, getFrequentServiceInfo, getFrequentServices, getHeadwayDayOfWeek, getHeadwayOverview, getHeadwayTimeOfDay, getHeadwayTimeSeries, getJourneyScheduledStartTimes, getOperator, getOperatorPerformance, getOperators, getPunctualityDayOfWeek, getPunctualityOverview, getPunctualityTimeOfDay, getPunctualityTimeSeries, getServiceInfo, getServicePerformance, getServicePunctuality, getStopPerformance } from './otpFunctions.js';
import { RequestContext } from '../../types.js';

const otpResolvers: IResolvers = {
    Query: {
        operators: (_: any, __: any, {sessionUser, db }: RequestContext) => getOperators(sessionUser, db),
        operator: (_, { operatorId }, {sessionUser, db }: RequestContext) => getOperator(operatorId, sessionUser, db),
        onTimePerformance: () => { return {}; }, // stub -> sub-resolvers do the work
        headwayMetrics: () => { return {}; }, // stub -> sub-resolvers do the work 
        serviceInfo: (_, { serviceId }, {sessionUser, db }: RequestContext) => getServiceInfo(serviceId, sessionUser, db),
        adminAreas: async (_: any, {adminAreaIds}: {adminAreaIds: string[]}, {sessionUser, db }: RequestContext) => getAdminAreas(adminAreaIds, sessionUser, db)
    },
    OnTimePerformanceType: {
        delayFrequency: ({ inputs }, {sessionUser, db }: RequestContext) => getDelayFrequency(inputs, sessionUser, db),
        journeyScheduledStartTimes: ({sessionUser, db }: RequestContext) => getJourneyScheduledStartTimes(sessionUser, db),
        operatorPerformance: async (_, { inputs }, {sessionUser, db }: RequestContext) => getOperatorPerformance(inputs, sessionUser, db),
        punctualityDayOfWeek: ({ inputs }, {sessionUser, db }: RequestContext) => getPunctualityDayOfWeek(inputs, sessionUser, db),
        punctualityOverview: (_, { inputs }, {sessionUser, db }: RequestContext) => getPunctualityOverview(inputs, sessionUser, db),
        punctualityTimeOfDay: ({ inputs }, {sessionUser, db }: RequestContext) => getPunctualityTimeOfDay(inputs, sessionUser, db),
        punctualityTimeSeries: (_, { inputs }, {sessionUser, db }: RequestContext) => getPunctualityTimeSeries(inputs, sessionUser, db),
        servicePunctuality: ({sessionUser, db }: RequestContext) => getServicePunctuality(sessionUser, db),
        stopPerformance: (_, { inputs }, {sessionUser, db }: RequestContext) => getStopPerformance(inputs, sessionUser, db),
        servicePerformance: (_, { inputs }, {sessionUser, db }: RequestContext) => getServicePerformance(inputs, sessionUser, db)
      },
    HeadwayMetricsType: {
        frequentServices: (_, { operatorId, fromTimestamp, toTimestamp }, {sessionUser, db }: RequestContext) => getFrequentServices( operatorId, fromTimestamp, toTimestamp, sessionUser, db),
        frequentServiceInfo: (_, { inputs }, {sessionUser, db }: RequestContext) => getFrequentServiceInfo(inputs, sessionUser, db),
        headwayDayOfWeek: (_, { lineId }, {sessionUser, db }: RequestContext) => getHeadwayDayOfWeek(lineId, sessionUser, db),
        headwayOverview: (_, { inputs }, {sessionUser, db }: RequestContext) => getHeadwayOverview(inputs, sessionUser, db),      
        headwayTimeOfDay: (_, { lineId }, {sessionUser, db }: RequestContext) => getHeadwayTimeOfDay(lineId, sessionUser, db),
        headwayTimeSeries: (_, { lineId }, {sessionUser, db }: RequestContext) => getHeadwayTimeSeries(lineId, sessionUser, db)
    }
}

export default otpResolvers;
