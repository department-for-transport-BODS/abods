import { IResolvers } from "@graphql-tools/utils";
import { CorridorNamespaceAddFirstStopArgs, CorridorNamespaceAddSubsequentStopsArgs, MutationCreateCorridorArgs, RequestContext } from "../../types";
import { createCorridor, deleteCorridor, getCorridors, getJourneyStats, getJourneyStatsByDay, getJourneyStatsByHour, getJourneyStatsHistogram, getJourneyStatsPerService, getServiceLinks, getStats, getStops, getSubsequentStops, getSummaryStats, listCorridors, updateCorridor } from "./corridorFunctions.js";
import { CorridorJourneyStatsOption } from "../../lib/corridor.js";

const corridorResovlers: IResolvers = {
  Query: {
    corridor: async () => {
      return {};
    },
  },
  CorridorNamespace: {
    getCorridor: async (
      _,
      { corridorId },
      { sessionUser, db }: RequestContext,
    ) => getCorridors(corridorId, sessionUser, db),
    corridorList: async (_, __, { sessionUser, db }: RequestContext) =>
      listCorridors(sessionUser, db),
    stats: async (_, { inputs }, { sessionUser, db }: RequestContext) =>
      getStats(inputs, sessionUser, db),
    addFirstStop: async (
      _,
      { inputs }: CorridorNamespaceAddFirstStopArgs,
      { sessionUser, db }: RequestContext,
    ) => getStops(inputs, sessionUser, db),
    addSubsequentStops: async (
      _,
      { stopList }: CorridorNamespaceAddSubsequentStopsArgs,
      { sessionUser, db }: RequestContext,
    ) => getSubsequentStops(stopList, sessionUser, db),
  },
  CorridorStatsType: {
    summaryStats: async (
      { inputs, journeys },
      _,
      { sessionUser, db }: RequestContext,
    ) => getSummaryStats(inputs, journeys, sessionUser, db),
    journeyTimeStats: async (
      parents,
    ) => {
      return parents.inputs.granularity === 'day'
        ? getJourneyStatsByDay(parents.journeys)
        : getJourneyStatsByHour(parents.journeys);
    },
    journeyTimeTimeOfDayStats: async (
      parents
    ) => {
      return getJourneyStats(parents.journeys, CorridorJourneyStatsOption.hourAsNumber);
    },
    journeyTimeDayOfWeekStats: async (
      parents
    ) => {
      return getJourneyStats(parents.journeys, CorridorJourneyStatsOption.dayOfWeek);
    },
    journeyTimeHistogram: async (
      parents
    ) => {
      const histogram = getJourneyStatsHistogram(parents.journeys)
      return histogram;
    },
    journeyTimePerServiceStats: async (
      parents,
      _,
      { db }: RequestContext,
    ) => {
      return getJourneyStatsPerService(parents.journeys, db);
    },
    serviceLinks: async (parents, _, { db }: RequestContext) => {
      return getServiceLinks(parents.inputs, db);
    },
  },
  Mutation: {
    createCorridor: async (
      _: any,
      { payload }: MutationCreateCorridorArgs,
      { sessionUser, db }: RequestContext,
    ) => createCorridor(payload, sessionUser, db),
    updateCorridor: async (
      _: any,
      { inputs },
      { sessionUser, db }: RequestContext,
    ) => updateCorridor(inputs, sessionUser, db),
    deleteCorridor: async (
      _: any,
      { corridorId },
      { sessionUser, db }: RequestContext,
    ) => deleteCorridor(corridorId, sessionUser, db),
  },
};

export default corridorResovlers;