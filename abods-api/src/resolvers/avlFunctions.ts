import logger from "../logger.js";
import {
  AvlLineLevelStatus,
  QueryResolvers,
  Resolvers,
} from "../types/generated";
import { tokenAuthRequiredResolver } from "../lib/apiauth.js";

export const getAVLLineLevelStatus: QueryResolvers["avlLineLevelStatus"] =
  async (_, args, context): Promise<AvlLineLevelStatus[]> => {
    try {
      let query = context.db.selectFrom("avl_line_level_monitoring");
      if (args.filters?.operatorNoc) {
        query = query.where("operator_noc", "=", args.filters.operatorNoc);
      }
      if (args.filters?.lineName) {
        query = query.where("line_name", "=", args.filters.lineName);
      }
      const avlData = await query
        .select([
          "operator_noc as operatorNoc",
          "line_name as lineName",
          "last_recorded_at_time as lastRecordedAtTime",
        ])
        .execute();
      if (!avlData || avlData.length === 0) {
        logger.debug({ filters: args.filters }, "No AVL data found");
        return [];
      }

      return avlData;
    } catch (error) {
      logger.error(error, "An error occurred in the avlLineLevelStatus query");
      return [];
    }
  };

const avlResolvers: Resolvers = {
  Query: {
    avlLineLevelStatus: tokenAuthRequiredResolver(getAVLLineLevelStatus),
  },
};

export default avlResolvers;
