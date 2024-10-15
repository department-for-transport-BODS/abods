import { IResolvers } from "@graphql-tools/utils";
import {
  QueryEventStatsArgs,
  RequestContext,
} from "../../types";
import { getEventStats, getVehicleStatsPerOperator } from "./feedMonitoringFunctions.js";
import { SiriVMPositions } from "@prisma/client";
import {
  ExpectedJourneyType,
  getExpectedJourneys,
  getAvlPoints,
} from "../../lib/otp.js";
import { getVehicleStats } from "../../lib/feedMonitoring.js";
import { getDate } from "../../lib/dayjs.js";

const feedMonitoringResovlers: IResolvers = {
  Query: {
    events: async () => {
      return {};
    },
    eventStats: async (
      inputs: QueryEventStatsArgs,
      _,
      { sessionUser, db }: RequestContext
    ) => {
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

    liveStats: async (parent, _, { sessionUser, db }: RequestContext, info) => {
      const queryName = info.operation.name?.value;
      let last20Mins: SiriVMPositions[] = [];
      let expected: ExpectedJourneyType[] = [];
      const currentDate = getDate()
      if (queryName === "operatorLiveStatus") {
        [expected, last20Mins] = await Promise.all([
          getExpectedJourneys(db, parent.operatorId, currentDate, 90),
          getAvlPoints(db, parent.operatorId, currentDate, true),
        ]);
      }

      const vechileRefs = new Set<string>();
      const groupIds = new Set(expected.map((journey) => journey.group_id));
      last20Mins = last20Mins.filter((avl) => {
        if (groupIds.has(avl.group_id)) {
          if (!vechileRefs.has(avl.vehicle_ref)) {
            vechileRefs.add(avl.vehicle_ref);
          }
          return true;
        }

        return false;
      });

      return {
        operatorId: parent.operatorId,
        ...parent.liveStats,
        expectedVehicles: expected.length,
        currentVehicles: vechileRefs.size,
        avl: last20Mins,
        expected: expected,
      };
    },
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
