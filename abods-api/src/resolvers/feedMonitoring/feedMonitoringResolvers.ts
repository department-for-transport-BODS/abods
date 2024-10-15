import { IResolvers } from "@graphql-tools/utils";
import {
  RequestContext,
} from "../../types";
import { getEventStats, getLiveStats, getVehicleStatsPerOperator } from "./feedMonitoringFunctions.js";

import { getVehicleStats } from "../../lib/feedMonitoring.js";
import { getDate } from "../../lib/dayjs.js";

const feedMonitoringResovlers: IResolvers = {
  Query: {
    events: async () => {
      return {};
    },
    eventStats: async () => {
      return getEventStats();
    },
  },
  FeedMonitoringType: {
    historicalStats: async() => {
        return {
            updateFrequency: null,
            availability: null,
        }
    },
    vehicleStats: async (parent, { end }, { db }: RequestContext) =>
      getVehicleStatsPerOperator(db, parent.operatorId, end),

    liveStats: async (parent, _, { db }: RequestContext, info) => getLiveStats(parent, db, info),
  },
  LiveStatsType: {
    last20Minutes: async (
      parent
    ) => getVehicleStats(parent.avl, parent.expected),
  },
  EventsPage: {
    items: async () => {
      return [];
    },
  },
};

export default feedMonitoringResovlers;
