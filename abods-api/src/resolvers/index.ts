import userResolvers from "./userFunctions.js";
import sharedResolvers from "./sharedFunctions.js";
import { mergeResolvers } from "@graphql-tools/merge";
import otpResolvers from "./otpFunctions.js";
import vehicleJourneyResolvers from "./vehicleJourneyFunctions.js";
import corridorResolvers from "./corridorFunctions.js";
import feedMonitoringResolvers from "./feedMonitoringFunctions.js";
import avlResolvers from "./avlFunctions.js";
import { Resolvers } from "../types/generated.js";
import { DayjsDateResolver } from "./dateScalar.js";
import { DayjsDateTimeResolver } from "./dateTimeScalar.js";
import { DayjsTimeResolver } from "./timeScalar";

export const customScalarResolvers: Resolvers = {
  Date: DayjsDateResolver,
  DateTime: DayjsDateTimeResolver,
  Time: DayjsTimeResolver,
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
];
const resolvers = mergeResolvers(resolversArray);

export default resolvers;
