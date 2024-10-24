import {
  CorridorNamespaceAddFirstStopArgs,
  CorridorNamespaceAddSubsequentStopsArgs,
  CorridorStatsType,
  MutationCreateCorridorArgs,
  Resolvers
} from '../../types/generated.js';
import {
  createCorridor,
  deleteCorridor,
  getCorridors,
  getJourneyStats,
  getJourneyStatsByDay,
  getJourneyStatsByHour,
  getJourneyStatsHistogram,
  getJourneyStatsPerService,
  getServiceLinks,
  getStats,
  getStops,
  getSubsequentStops,
  getSummaryStats,
  listCorridors,
  StatsCache,
  updateCorridor
} from './corridorFunctions.js';
import { CorridorJourneyStatsOption } from "../../lib/corridor.js";

const corridorResovlers: Resolvers = {
  Query: {
    corridor: () => {
      return {};
    },
  },
  CorridorNamespace: {
    getCorridor: (
      _,
      { corridorId },
      { sessionUser, db },
    ) => getCorridors(corridorId, sessionUser, db),
    corridorList: (_, __, { sessionUser, db }) =>
      listCorridors(sessionUser, db),
    stats: (_, { inputs }, { sessionUser, db }) =>
      // Not actually returning this type, but intended to stash this data we get for the next resolvers in the chain
      getStats(inputs, sessionUser, db) as Promise<CorridorStatsType>,
    addFirstStop: (
      _,
      { inputs }: CorridorNamespaceAddFirstStopArgs,
      { sessionUser, db },
    ) => getStops(inputs, sessionUser, db),
    addSubsequentStops: (
      _,
      { stopList }: CorridorNamespaceAddSubsequentStopsArgs,
      { sessionUser, db },
    ) => getSubsequentStops(stopList, sessionUser, db),
  },
  CorridorStatsType: {
    summaryStats: (
      parent,
      _
    ) => {
      const data = parent as StatsCache;
      return getSummaryStats(data.journeys);
    },
    journeyTimeStats: (
      parent,
    ) => {
      const data = parent as StatsCache;
      return data.inputs.granularity === 'day'
        ? getJourneyStatsByDay(data.journeys)
        : getJourneyStatsByHour(data.journeys);
    },
    journeyTimeTimeOfDayStats: (
      parent
    ) => {
      const data = parent as StatsCache;
      return getJourneyStats(data.journeys, CorridorJourneyStatsOption.hourAsNumber);
    },
    journeyTimeDayOfWeekStats: (
      parent
    ) => {
      const data = parent as StatsCache;
      return getJourneyStats(data.journeys, CorridorJourneyStatsOption.dayOfWeek);
    },
    journeyTimeHistogram: (
      parent
    ) => {
      const data = parent as StatsCache;
      return getJourneyStatsHistogram(data.journeys);
    },
    journeyTimePerServiceStats: (parent, _, { db }) => {
      const data = parent as StatsCache;
      return getJourneyStatsPerService(data.journeys, db);
    },
    serviceLinks: (parent, _, { db }) => {
      const data = parent as StatsCache;
      return getServiceLinks(data.inputs, db);
    },
  },
  Mutation: {
    createCorridor: (
      _,
      { payload }: MutationCreateCorridorArgs,
      { sessionUser, db },
    ) => createCorridor(payload, sessionUser, db),
    updateCorridor: (
      _,
      { inputs },
      { sessionUser, db },
    ) => updateCorridor(inputs, sessionUser, db),
    deleteCorridor: (
      _,
      { corridorId },
      { sessionUser, db },
    ) => deleteCorridor(corridorId, sessionUser, db),
  },
};

export default corridorResovlers;