import { IResolvers } from "@graphql-tools/utils";
import { RequestContext } from "../../types";
import {
  findJourneys,
  getJourney,
  servicePatternsInfo,
  timingPatternDetail,
  vehicleJourney,
} from "./vehicleJourneyFunctions.js";

const vehicleJourneyResovlers: IResolvers = {
  Query: {
    vehicleReplay: async () => {
      return {};
    },
    servicePatternsInfo: async (
      _,
      { servicePatternIds },
      { sessionUser, db }: RequestContext
    ) => servicePatternsInfo(servicePatternIds, sessionUser, db),
    vehicleJourney: async (
      _,
      { vehicleJourneyId },
      { sessionUser, db }: RequestContext
    ) => vehicleJourney(vehicleJourneyId, sessionUser, db),
    timingPatternDetail: async (
      _,
      { timingPatternId },
      { sessionUser, db }: RequestContext
    ) => timingPatternDetail(timingPatternId, sessionUser, db),
  },
  VehicleReplayNamespace: {
    findJourneys: async (_, { inputs }, { sessionUser, db }: RequestContext) =>
      findJourneys(inputs, sessionUser, db),
    getJourney: async (
      _,
      { journeyId, startTime },
      { sessionUser, db }: RequestContext
    ) => getJourney(journeyId, startTime, sessionUser, db),
  },
};

export default vehicleJourneyResovlers;
