import { getAdminAreas, getDelayFrequency, getFrequentServiceInfo, getFrequentServices, getHeadwayOverview, getHeadwayTimeSeries, getLines, getOperator, getOperatorList, getOperatorPerformance, getPunctualityDayOfWeek, getPunctualityOverview, getPunctualityTimeOfDay, getPunctualityTimeSeries, getServiceInfo, getServicePerformance, getServicePunctuality, getStopPerformance } from './otpFunctions.js';
import { Resolvers } from '../../types/generated';

const otpResolvers: Resolvers = {
    Query: {
        operators: (_, __, {sessionUser, db }) => getOperatorList(sessionUser, db),
        operator: (_, {operatorId} , {sessionUser, db }) => getOperator(operatorId, sessionUser, db),
        onTimePerformance: () => { return {}; }, // stub -> sub-resolvers do the work
        headwayMetrics: () => { return {}; }, // stub -> sub-resolvers do the work 
        serviceInfo: (_, { serviceId }, {sessionUser, db }) => getServiceInfo(serviceId, sessionUser, db),
        adminAreas: (_, __, {sessionUser, db }) => getAdminAreas(sessionUser, db),
    },
    OnTimePerformanceType: {
        delayFrequency: (_, { inputs }, {sessionUser, db }) => getDelayFrequency(inputs, sessionUser, db),
        operatorPerformance: (_, { inputs }, {sessionUser, db }) => getOperatorPerformance(inputs, sessionUser, db),
        punctualityDayOfWeek: (_, { inputs }, {sessionUser, db }) => getPunctualityDayOfWeek(inputs, sessionUser, db),
        punctualityOverview: (_, { inputs }, {sessionUser, db }) => getPunctualityOverview(inputs, sessionUser, db),
        punctualityTimeOfDay: (_, { inputs }, {sessionUser, db }) => getPunctualityTimeOfDay(inputs, sessionUser, db),
        punctualityTimeSeries: (_, { inputs }, {sessionUser, db }) => getPunctualityTimeSeries(inputs, sessionUser, db),
        servicePunctuality: (_, { inputs }, {sessionUser, db }) => getServicePunctuality(inputs, sessionUser, db),
        stopPerformance: (_, { inputs }, {sessionUser, db }) => getStopPerformance(inputs, sessionUser, db),
        servicePerformance: (_, { inputs }, {sessionUser, db }) => getServicePerformance(inputs, sessionUser, db)
    },
    HeadwayMetricsType: {
        frequentServices: (_, { operatorId, fromTimestamp, toTimestamp }, {sessionUser, db }) => getFrequentServices( operatorId, fromTimestamp, toTimestamp, sessionUser, db),
        frequentServiceInfo: (_, { inputs }, {sessionUser, db }) => getFrequentServiceInfo(inputs, sessionUser, db),
        headwayOverview: (_, { inputs }, {sessionUser, db }) => getHeadwayOverview(inputs, sessionUser, db),
        headwayTimeSeries: (_, { inputs }, {sessionUser, db }) => getHeadwayTimeSeries(inputs, sessionUser, db)
    },
    OperatorType:{
        transitModel: () => { return {}; },
    },
    TransitModelType: {
        lines: (_, __ , {sessionUser, db }, info) => getLines(sessionUser, db, info),
    }
}

export default otpResolvers;
