import { apolloClient } from "@/services/apolloClient";
import {
  ServicePatternType,
  TransitModelServicePatternStopsDocument,
  TransitModelServicePatternStopsQuery,
} from "../../src/generated/graphql";

export type ServicePattern = Omit<
  ServicePatternType,
  "__typename" | "direction" | "direction_id"
>;

export const transitModelService = {
  fetchServicePatternStops: async (
    operatorId: string | null,
    lineId: string | null,
  ): Promise<ServicePattern[]> => {
    const result = await apolloClient.query({
      query: TransitModelServicePatternStopsDocument,
      variables: {
        operatorId: operatorId ?? "",
        lineId: lineId ?? "",
      },
      fetchPolicy: "no-cache",
    });
    return (result.data?.servicePatterns ?? []) as ServicePattern[];
  },
};
