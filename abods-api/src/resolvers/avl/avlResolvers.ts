import { Resolvers } from "../../types/generated";
import { getAVLLineLevelStatus } from "./avlFunctions.js";

const avlResolvers: Resolvers = {
  Query: {
    avlLineLevelStatus: (_, { filters }, { db }) =>
      getAVLLineLevelStatus(filters || {}, db),
  },
};
export default avlResolvers;
