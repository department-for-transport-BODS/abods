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
      const avlData = await context.db.avl_line_level_monitoring.findMany({
        where: {
          ...(args.filters?.operatorNoc
            ? { operatorNoc: args.filters.operatorNoc }
            : {}),
          ...(args.filters?.lineName
            ? { lineName: args.filters.lineName }
            : {}),
        },
        select: {
          operatorNoc: true,
          lineName: true,
          lastRecordedAtTime: true,
        },
      });
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
