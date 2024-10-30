import logger from '../logger.js';
import { QueryResolvers, Resolvers } from '../types/generated.js';
import { requireApiToken } from './helpers.js';

export const getAVLLineLevelStatus: QueryResolvers['avlLineLevelStatus'] = async (_, args, context) => {
  requireApiToken(context)
  try {
    const avlData = await context.db.prisma.avl_line_level_monitoring.findMany({
      where: {
        ...(args.filters?.operatorNoc ? { operatorNoc: args.filters.operatorNoc } : {}),
        ...(args.filters?.lineName ? { lineName: args.filters.lineName } : {})
      },
      select: {
        operatorNoc: true,
        lineName: true,
        lastRecordedAtTime: true
      }
    });
    if (!avlData || avlData.length === 0) {
      logger.debug('No AVL data found. Filters: ', JSON.stringify(args.filters));
      return [];
    }

    return avlData;
  } catch (error) {
    console.error('Error in getAVLLineLevelStatus: ' + JSON.stringify(error));
    return [];
  }
};

const otpResolvers: Resolvers = {
  Query: {
    avlLineLevelStatus: getAVLLineLevelStatus
  }
};

export default otpResolvers;
