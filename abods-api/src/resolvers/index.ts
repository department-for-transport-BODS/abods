import userResolvers from "./userFunctions.js";
import sharedResolvers from "./sharedFunctions.js";
import { mergeResolvers } from "@graphql-tools/merge";
import otpResolvers from "./otp/onTimePerformance.js";
import vehicleJourneyResolvers from "./vehicleJourneyFunctions.js";
import corridorResolvers from "./corridor/corridorResolver.js";
import feedMonitoringResolvers from "./feedMonitoringFunctions.js";
import avlResolvers from "./avlFunctions.js";
import { Resolvers } from "../types/generated.js";
import {
  DateResolver,
  DateTimeResolver,
  TimeResolver,
  JSONResolver,
} from "graphql-scalars";
import stopAnalysisResolvers from "./stopAnalysis.js";
import dataMonitoringResolvers from "./dataMonitoringFunctions.js";
import distancesResolver from "./distances.js";
import otpQuery from "./otp/query.js";
import headwayMetricsResolvers from "./otp/headway.js";
import onTimePerformanceResolvers from "./otp/onTimePerformance.js";
import corridorMutations from "./corridor/mutation.js";
import corridorStats from "./corridor/stats.js";

export const customScalarResolvers: Resolvers = {
  Date: DateResolver,
  DateTime: DateTimeResolver,
  Time: TimeResolver,
  JSON: JSONResolver,
};

const resolversArray = [
  customScalarResolvers,
  userResolvers,
  sharedResolvers,
  otpResolvers,
  vehicleJourneyResolvers,
  corridorResolvers,
  avlResolvers,
  feedMonitoringResolvers,
  stopAnalysisResolvers,
  dataMonitoringResolvers,
  distancesResolver,
  otpQuery,
  headwayMetricsResolvers,
  onTimePerformanceResolvers,
  corridorMutations,
  corridorStats,
];
const resolvers = mergeResolvers(resolversArray);

export default resolvers;
