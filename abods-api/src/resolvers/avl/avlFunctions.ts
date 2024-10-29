import { Context } from "../../context";
import logger from "../../logger.js";
import { AvlFiltersInput } from "../../types/generated";

export const getAVLLineLevelStatus = async (
  filters: AvlFiltersInput,
  db: Context
) => {
  try {
    const avlData = await db.prisma.avl_line_level_monitoring.findMany({
      where: {
        ...(filters.operatorNoc ? { operatorNoc: filters.operatorNoc } : {}),
        ...(filters.lineName ? { lineName: filters.lineName } : {}),
      },
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
