import { apolloClient } from "@/services/apolloClient";
import {
  OperatorListDocument,
  OperatorListQuery,
  OperatorType,
} from "../src/generated/graphql";

export const operatorsService = {
  fetchOperators: async (): Promise<OperatorType[]> => {
    try {
      const result = await apolloClient.query<OperatorListQuery>({
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
};
