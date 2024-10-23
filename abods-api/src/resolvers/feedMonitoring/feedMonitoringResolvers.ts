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

const feedMonitoringResovlers: IResolvers = {
  Query: {
    events: async () => {
      return [
        {
          type: AlertType.VehicleCountDisparityEvent,
          data: {
            message: "Test1",
          },
          timestamp: getDate().subtract(2, "hour"),
        },
        {
          type: AlertType.VehicleCountDisparityEvent,
          data: {
            message: "Test2",
          },
          timestamp: getDate().subtract(3, "hour"),
        },
        {
          type: AlertType.VehicleCountDisparityEvent,
          data: {
            message: "Test3",
          },
          timestamp: getDate().subtract(4, "hour"),
        },
      ];
    },
    eventStats: async () => {
      return getEventStats();
    },
  },
  FeedMonitoringType: {
    historicalStats: async ({ operatorId, date }, { db }: RequestContext) =>
      getHistoricalStats(operatorId, date, db),
    vehicleStats: async ({ operatorId, start, end }, { db }: RequestContext) =>
      getVehicleStatsByMin(operatorId, start, end, db),
    liveStats: async () => {},
  },
  LiveStatsType: {
    currentVehicles: async ({ operatorId }, { db }: RequestContext) =>
      getVehicles(operatorId, db, VechileCountType.Actual),
    expectedVehicles: async ({ operatorId }, { db }: RequestContext) =>
      getVehicles(operatorId, db, VechileCountType.Expected),
    last20Minutes: async ({ operatorId }, { db }: RequestContext) =>
      getVehicleStatsPerOperator(db, operatorId, getDate()),
    last24Hours: async ({ operatorId }, db) => getLast24Hours(operatorId, db),
  },
  EventsPage: {
    items: async () => {
      return [];
    },
  },
};

export default feedMonitoringResovlers;
