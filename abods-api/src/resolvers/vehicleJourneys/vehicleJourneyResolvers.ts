import { Resolvers } from '../../types';
import {
  findJourneys,
  getJourney,
  servicePatternsInfo,
  timingPatternDetail,
  vehicleJourney
} from './vehicleJourneyFunctions.js';

const vehicleJourneyResovlers: Resolvers = {
  Query: {
    servicePatternsInfo: async (
      _,
      { servicePatternIds },
      { sessionUser, db }
    ) => servicePatternsInfo(servicePatternIds ?? [], sessionUser, db),
    vehicleJourney: async (
      _,
      { vehicleJourneyId },
      { sessionUser, db }
    ) => vehicleJourney(vehicleJourneyId, sessionUser, db),
    timingPatternDetail: async (
      _,
      { timingPatternId },
      { sessionUser, db }
    ) => timingPatternDetail(timingPatternId, sessionUser, db)
  },
  VehicleReplayNamespace: {
    findJourneys: async (_, { inputs }, { sessionUser, db }) =>
      findJourneys(inputs, sessionUser, db),
    getJourney: async (
      _,
      { journeyId, startTime },
      { sessionUser, db }
    ) => getJourney(journeyId, startTime, sessionUser, db)
  }
};

export default vehicleJourneyResovlers;
