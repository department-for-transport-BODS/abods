import userResolvers from './userFunctions.js';
import sharedResolvers from './sharedFunctions.js';
import { mergeResolvers } from '@graphql-tools/merge';
import otpResolvers from './otpFunctions.js';
import vehicleJourneyResolvers from './vehicleJourneyFunctions.js';
import corridorResolvers from './corridorFunctions.js';
import avlResolvers from './avlFunctions.js';
import { Resolvers } from '../types/generated.js';
import { DateResolver, DateTimeResolver, TimeResolver } from 'graphql-scalars';

export const customScalarResolvers: Resolvers = {
  Date: DateResolver,
  DateTime: DateTimeResolver,
  Time: TimeResolver
};

const resolversArray = [
  customScalarResolvers,
  userResolvers,
  sharedResolvers,
  otpResolvers,
  vehicleJourneyResolvers,
  corridorResolvers,
  avlResolvers,
];
const resolvers = mergeResolvers(resolversArray);

export default resolvers;