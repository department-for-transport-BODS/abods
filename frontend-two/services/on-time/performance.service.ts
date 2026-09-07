import { HeadwayOverviewType } from "../../src/generated/graphql";
import { headwayService } from "./headway.service";
import {
  onTimeService,
  PerformanceParams,
  PunctualityOverview,
  ServicePerformance,
} from "./on-time.service";

export interface FrequentServicePerformance extends ServicePerformance {
  frequent: boolean;
}

const swallow = async <T>(promise: Promise<T>): Promise<T | undefined> => {
  try {
    return await promise;
  } catch {
    return undefined;
  }
};

export const performanceService = {
  fetchServicePerformance: async (
    params: PerformanceParams,
  ): Promise<FrequentServicePerformance[]> => {
    const [onTime, headway] = await Promise.all([
      onTimeService.fetchOnTimePerformanceList(params),
      headwayService.fetchFrequentServices(params),
    ]);
    const frequentServiceIds = new Set(headway.map((h) => h.serviceId));
    return onTime.map((item) => ({
      ...item,
      frequent: frequentServiceIds.has(item.lineInfo.serviceId),
    }));
  },

  fetchOverviewStats: async (
    params: PerformanceParams,
  ): Promise<{
    onTime?: PunctualityOverview;
    headway?: HeadwayOverviewType;
  }> => {
    const hasLineIds = (params.filters?.lineIds?.length ?? 0) > 0;
    const [onTime, headway] = await Promise.all([
      swallow(onTimeService.fetchOnTimeStats(params)),
      hasLineIds
        ? swallow(headwayService.fetchOverview(params))
        : Promise.resolve(undefined),
    ]);
    return { onTime, headway };
  },

  fetchOnTimeOverviewStats: (
    params: PerformanceParams,
  ): Promise<PunctualityOverview | undefined> =>
    swallow(onTimeService.fetchOnTimeStats(params)),

  fetchHeadwayOverviewStats: (
    params: PerformanceParams,
  ): Promise<HeadwayOverviewType | undefined> =>
    swallow(headwayService.fetchOverview(params)),
};
