import { IResolvers } from '@graphql-tools/utils'
import { RequestContext } from '../../types';
import { findJourneys } from './vehicleJourneyFunctions';

const vehicleJourneyResovlers: IResolvers = {
    Query: {
        vehicleReplay:  async () => { return {}; }
    },
    VehicleReplayNamespace: {
        findJourneys: async(_, { inputs } , {sessionUser, db }: RequestContext ) => findJourneys(inputs, sessionUser, db)
    }
}

export default vehicleJourneyResovlers;