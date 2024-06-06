import userResolvers from './users/userResolvers.js';
import sharedResolvers from "./shared/sharedResolvers.js";
import { mergeResolvers } from '@graphql-tools/merge';
import otpResolvers from './otp/otpResolvers.js';
import { customScalarResolvers } from './shared/customScalarResolvers.js';

const resolversArray = [customScalarResolvers, userResolvers, sharedResolvers, otpResolvers];
const resolvers = mergeResolvers(resolversArray);

export default resolvers;