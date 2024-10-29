import { IResolvers } from "@graphql-tools/utils";
import { RequestContext } from "../../types/extra.js";
import {
  getVehicles,
  getEventStats,
  getHistoricalStats,
  getVehicleStatsPerOperator,
  getLast24Hours,
  getVehicleStatsByMin,
} from "./feedMonitoringFunctions.js";

import { AlertType, VechileCountType } from "../../lib/feedMonitoring.js";
import { getDate } from "../../lib/dayjs.js";
import { Resolvers } from "../../types/generated.js";

const feedMonitoringResovlers: Resolvers = {
  Query: {
    events: async () => {
      return {items: [
        {
          type: AlertType.VehicleCountDisparityEvent,
          data: {
            message: "Test1",
          },
          timestamp: getDate().subtract(2, "hour").toISOString(),
        },
        {
          type: AlertType.VehicleCountDisparityEvent,
          data: {
            message: "Test2",
          },
          timestamp: getDate().subtract(3, "hour").toISOString(),
        },
        {
          type: AlertType.VehicleCountDisparityEvent,
          data: {
            message: "Test3",
          },
          timestamp: getDate().subtract(4, "hour").toISOString(),
        },
      ]};
    },
    eventStats: async () => {
      return getEventStats();
    },
  },
  FeedMonitoringType: {
    historicalStats: async ({ operatorId },{ date }, { db }: RequestContext) =>
      getHistoricalStats(operatorId, date, db),
    vehicleStats: async ({ operatorId }, { start, end }, { db }: RequestContext) =>
      getVehicleStatsByMin(operatorId, start, end, db),
    liveStats: async (parent) => {
      return parent.liveStats ;
    },
  },
  LiveStatsType: {
    currentVehicles: async ({ operatorId }, _ ,{ db }) =>
      getVehicles(operatorId, db, VechileCountType.Actual),
    expectedVehicles: async ({ operatorId },_, { db }) =>
      getVehicles(operatorId, db, VechileCountType.Expected),
    last20Minutes: async ({ operatorId }, _, { db }) =>
      getVehicleStatsPerOperator(db, operatorId, getDate()),
    last24Hours: async ({ operatorId }, _, { db }) => getLast24Hours(operatorId, db),
  },
};

export default feedMonitoringResovlers;
