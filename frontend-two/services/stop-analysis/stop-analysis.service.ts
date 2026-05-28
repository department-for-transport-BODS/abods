import { apolloClient } from "@/services/apolloClient";
import {
  GetAdminAreasDocument,
  GetAdminAreasQuery,
  OperatorLinesDocument,
  OperatorLinesQuery,
  OperatorLinesQueryVariables,
  OperatorListDocument,
  OperatorListQuery,
  StopAnalysisDocument,
  StopAnalysisQuery,
  StopAnalysisQueryVariables,
} from "../../src/generated/graphql";

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
      return result.data?.stopAnalysis ?? [];
    } catch (error) {
      console.warn("Failed to fetch stop analysis:", error);
      return [];
    }
  },

  fetchOperators: async (): Promise<OperatorListQuery["operators"]> => {
    try {
      const result = await apolloClient.query({
        query: OperatorListDocument,
      });
      return result.data?.operators ?? [];
    } catch (error) {
      console.warn("Failed to fetch operators:", error);
      return [];
    }
  },

  fetchAdminAreas: async (): Promise<
    NonNullable<GetAdminAreasQuery["adminAreas"]>
  > => {
    try {
      const result = await apolloClient.query({
        query: GetAdminAreasDocument,
      });
      return result.data?.adminAreas ?? [];
    } catch (error) {
      console.warn("Failed to fetch admin areas:", error);
      return [];
    }
  },

  fetchLines: async (
    operatorIds: string[],
    inputDate: string,
    endDate?: string,
  ): Promise<OperatorLinesQuery["lines"]> => {
    try {
      const result = await apolloClient.query({
        query: OperatorLinesDocument,
        variables: { operatorIds, inputDate, endDate },
      });
      return result.data?.lines ?? [];
    } catch (error) {
      console.warn("Failed to fetch lines:", error);
      return [];
    }
  },
};
