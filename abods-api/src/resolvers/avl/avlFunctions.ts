import { Context } from "../../context";
import logger from "../../logger.js";
interface AvlFilters {
  operatorNoc?: string;
  lineName?: string;
}

export const buildWhereClause = (filters: AvlFilters) => {
  const whereClause = {};

  if (filters.operatorNoc) {
    Object.assign(whereClause, {
      operatorNoc: {
        equals: filters.operatorNoc,
      },
    });
  }

  if (filters.lineName) {
    Object.assign(whereClause, {
      lineName: {
        equals: filters.lineName,
      },
    });
  }
  return whereClause;
};

export const getAVLLineLevelStatus = async (
  filters: AvlFilters,
  db: Context
) => {
  try {
    const where = buildWhereClause(filters);
    const avlData = await db.prisma.avl_line_level_monitoring.findMany({
      where: where,
      select: {
        operatorNoc: true,
        lineName: true,
        lastRecordedAtTime: true,
      },
    });
    if (!avlData || avlData.length === 0) {
      logger.debug("No AVL data found. Filters: ", JSON.stringify(filters));
      return [];
    }

    return avlData;
  } catch (error) {
    console.error("Error in getAVLLineLevelStatus: " + JSON.stringify(error));
    return [];
  }
};
