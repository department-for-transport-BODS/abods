import { apolloClient } from "@/services/apolloClient";
import {
  GetAdminAreasDocument,
  GetAdminAreasQuery,
  OperatorLinesDocument,
  OperatorLinesQuery,
  OperatorListDocument,
  OperatorType,
} from "../src/generated/graphql";

export const operatorsService = {
  fetchOperators: async (): Promise<OperatorType[]> => {
    try {
      const result = await apolloClient.query({
        query: OperatorListDocument,
      });

      return result?.data?.operators ?? [];
    } catch (error) {
      console.warn("Failed to fetch operators:", error);
      return [];
    }
  },

  fetchAdminAreaIds: async (): Promise<string[]> => {
    try {
      const operators = await operatorsService.fetchOperators();

      const allAdminAreaIds = operators.flatMap((op) => op.adminAreaIds || []);
      const uniqueAdminAreaIds = Array.from(new Set(allAdminAreaIds));

      return uniqueAdminAreaIds;
    } catch (error) {
      console.warn("Failed to fetch admin area ids:", error);
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
