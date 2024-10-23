import { Resolvers } from '../../types/generated.js';
import {
  findJourneys,
  getAvls,
  getJourney,
  getRoute,
  servicePatternsInfo,
  timingPatternDetail,
  vehicleJourney
} from './vehicleJourneyFunctions.js';

const vehicleJourneyResovlers: Resolvers = {
  Query: {
    vehicleReplay: () => ({}),
    servicePatternsInfo: (
      _,
      { servicePatternIds },
      { sessionUser, db }
    ) => servicePatternsInfo(servicePatternIds ?? [], sessionUser, db),
    vehicleJourney: (
      _,
      { vehicleJourneyId },
      { sessionUser, db }
    ) => vehicleJourney(vehicleJourneyId, sessionUser, db),
    timingPatternDetail: (
      _,
      { timingPatternId },
      { sessionUser, db }
    ) => timingPatternDetail(timingPatternId, sessionUser, db),
    avls: getAvls,
    route: getRoute
  },
  VehicleReplayNamespace: {
    findJourneys: (_, { inputs }, { sessionUser, db }) =>
      findJourneys(inputs, sessionUser, db),
    getJourney: (
      _,
      { journeyId, startTime },
      { sessionUser, db }
    ) => getJourney(journeyId, startTime, sessionUser, db)
  }
};

export default vehicleJourneyResovlers;
