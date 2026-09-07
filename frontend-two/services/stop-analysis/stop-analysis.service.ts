import { apolloClient } from "@/services/apolloClient";
import {
  StopAnalysisDocument,
  StopAnalysisQuery,
  StopAnalysisQueryVariables,
} from "@/src/generated/graphql";

export const stopAnalysisService = {
  fetchStopAnalysis: async (
    filters: StopAnalysisQueryVariables,
  ): Promise<StopAnalysisQuery["stopAnalysis"]> => {
    try {
      const result = await apolloClient.query({
        query: StopAnalysisDocument,
        variables: filters,
        fetchPolicy: "no-cache",
      });
      const data = result.data?.stopAnalysis ?? [];
      return data;
    } catch (error) {
      console.error("Failed to fetch stop analysis:", error);
      throw new Error("Failed to fetch stop analysis");
    }
  },
};
