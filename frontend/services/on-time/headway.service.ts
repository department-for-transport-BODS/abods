import { apolloClient } from "@/services/apolloClient";
import { nonNullishArray } from "@/utils/array-operators";
import {
  FrequentServiceInfoType,
  HeadwayFrequentServiceInfoDocument,
  HeadwayFrequentServiceInfoQuery,
  HeadwayFrequentServicesDocument,
  HeadwayFrequentServicesQuery,
  HeadwayInputType,
  HeadwayOverviewDocument,
  HeadwayOverviewQuery,
  HeadwayOverviewType,
  HeadwayTimeSeriesDocument,
  HeadwayTimeSeriesQuery,
  HeadwayTimeSeriesType,
} from "../../src/generated/graphql";
import { PerformanceParams } from "./on-time.service";

export interface FrequentService {
  serviceId: string;
}

export type HeadwayParams = Omit<HeadwayInputType, "sortBy">;

const assertHasOneElement: (
  arr: (string | null | undefined)[] | null | undefined,
) => asserts arr is [string] = (arr) => {
  if (!arr?.length || arr[0] === null || arr[0] === undefined) {
    throw new Error("Array must have one element");
  }
};

const pickHeadwayFilters = ({
  filters,
  ...params
}: PerformanceParams | HeadwayParams): HeadwayParams => {
  const {
    dayOfWeekFlags,
    endTime,
    granularity,
    lineIds,
    matchType,
    operatorIds,
    startTime,
  } = filters ?? {};
  return {
    ...params,
    filters: {
      dayOfWeekFlags,
      endTime,
      granularity,
      lineIds,
      matchType,
      operatorIds,
      startTime,
    },
  };
};

export const headwayService = {
  fetchTimeSeries: async (
    params: HeadwayParams,
  ): Promise<HeadwayTimeSeriesType[]> => {
    const result = await apolloClient.query({
      query: HeadwayTimeSeriesDocument,
      variables: { params: pickHeadwayFilters(params) },
      fetchPolicy: "no-cache",
    });
    return nonNullishArray(result.data?.headwayMetrics?.headwayTimeSeries);
  },

  fetchOverview: async (
    params: HeadwayParams,
  ): Promise<HeadwayOverviewType> => {
    const result = await apolloClient.query({
      query: HeadwayOverviewDocument,
      variables: { params: pickHeadwayFilters(params) },
      fetchPolicy: "no-cache",
    });
    const overview = result.data?.headwayMetrics?.headwayOverview;
    if (!overview) throw new Error("headwayOverview returned no data");
    return overview;
  },

  fetchFrequentServices: async ({
    filters,
    fromTimestamp,
    toTimestamp,
  }: HeadwayParams): Promise<FrequentService[]> => {
    assertHasOneElement(filters?.operatorIds);
    const [operatorId] = filters?.operatorIds ?? [""];

    const result = await apolloClient.query({
      query: HeadwayFrequentServicesDocument,
      variables: { operatorId, fromTimestamp, toTimestamp },
      fetchPolicy: "no-cache",
    });
    return nonNullishArray(result.data?.headwayMetrics?.frequentServices);
  },

  fetchFrequentServiceInfo: async ({
    filters,
    fromTimestamp,
    toTimestamp,
  }: HeadwayParams): Promise<FrequentServiceInfoType> => {
    assertHasOneElement(filters?.operatorIds);
    assertHasOneElement(filters?.lineIds);
    const [operatorId] = filters?.operatorIds ?? [""];
    const [lineId] = filters?.lineIds ?? [""];

    const result = await apolloClient.query({
      query: HeadwayFrequentServiceInfoDocument,
      variables: {
        inputs: {
          filters: {
            operatorId,
            lineId,
            dayOfWeekFlags: filters?.dayOfWeekFlags,
            startTime: filters?.startTime,
            endTime: filters?.endTime,
          },
          fromTimestamp,
          toTimestamp,
        },
      },
      fetchPolicy: "no-cache",
    });
    const info = result.data?.headwayMetrics?.frequentServiceInfo;
    if (!info) throw new Error("frequentServiceInfo returned no data");
    return info;
  },
};
