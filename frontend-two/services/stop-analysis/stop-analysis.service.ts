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
      console.log("[Stop Analysis] Fetching with filters:", filters);
      const result = await apolloClient.query({
        query: StopAnalysisDocument,
        variables: filters,
        fetchPolicy: "no-cache",
      });
      const data = result.data?.stopAnalysis ?? [];
      console.log("[Stop Analysis] Fetched data:", {
        stopCount: data.length,
        filters,
        data,
      });
      return data;
    } catch (error) {
      console.error("Failed to fetch stop analysis:", error);
      throw new Error("Failed to fetch stop analysis");
    }
  },
};
