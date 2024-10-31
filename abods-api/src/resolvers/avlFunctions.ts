import logger from "../logger.js";
import { QueryResolvers, Resolvers } from "../types/generated";
import { tokenAuthRequiredResolver } from "../lib/apiauth.js";

export const getAVLLineLevelStatus: QueryResolvers["avlLineLevelStatus"] =
  async (_, args, context) => {
    try {
      const avlData =
        await context.db.avl_line_level_monitoring.findMany({
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
        logger.debug(
          "No AVL data found. Filters: " + JSON.stringify(args.filters)
        );
        return [];
      }

      return avlData;
    } catch (error) {
      console.error("Error in getAVLLineLevelStatus: " + JSON.stringify(error));
      return [];
    }
  };

const avlResolvers: Resolvers = {
  Query: {
    avlLineLevelStatus: tokenAuthRequiredResolver(getAVLLineLevelStatus),
  },
};

export default avlResolvers;
