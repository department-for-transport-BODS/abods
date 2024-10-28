import { Resolvers } from '../../types/generated.js';
import { findJourneys, getAvls, getRoute } from './vehicleJourneyFunctions.js';

const vehicleJourneyResovlers: Resolvers = {
  Query: {
    vehicleReplay: () => ({}),
    avls: getAvls,
    route: getRoute
  },
  VehicleReplayNamespace: {
    findJourneys: (_, { inputs }, { sessionUser, db }) =>
      findJourneys(inputs, sessionUser, db),
  }
};

export default vehicleJourneyResovlers;
