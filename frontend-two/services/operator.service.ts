import { apolloClient } from "@/services/apolloClient";
import {
  GetAdminAreasDocument,
  GetAdminAreasQuery,
  OperatorLinesDocument,
  OperatorLinesQuery,
  OperatorListDocument,
  OperatorType,
} from "../src/generated/graphql";

export type { OperatorType };

const isNonGeographicalAdminAreaId = (adminAreaId: string) =>
  adminAreaId === "AA0" || /AA9\d{2}/.test(adminAreaId);

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

  fetchOperator: async (nocCode: string): Promise<OperatorType | null> => {
    try {
      const operators = await operatorsService.fetchOperators();
      return operators.find((operator) => operator.nocCode === nocCode) ?? null;
    } catch (error) {
      console.warn("Failed to fetch operator:", error);
      return null;
    }
  },

  fetchAdminAreaIds: async (): Promise<string[]> => {
    try {
      const adminAreas = await operatorsService.fetchAdminAreas();
      return adminAreas.map((adminArea) => adminArea.id);
    } catch (error) {
      console.warn("Failed to fetch admin area ids:", error);
      return [];
    }
  },

  fetchAdminAreas: async (): Promise<
    NonNullable<GetAdminAreasQuery["adminAreas"]>
  > => {
    try {
      const [adminAreasResult, operators] = await Promise.all([
        apolloClient.query({
          query: GetAdminAreasDocument,
        }),
        operatorsService.fetchOperators(),
      ]);

      const allowedAdminAreaIds = new Set(
        operators
          .flatMap((operator) => operator.adminAreaIds ?? [])
          .filter((adminAreaId) => !isNonGeographicalAdminAreaId(adminAreaId)),
      );

      return (adminAreasResult.data?.adminAreas ?? [])
        .filter(
          (adminArea) =>
            !isNonGeographicalAdminAreaId(adminArea.id) &&
            allowedAdminAreaIds.has(adminArea.id),
        )
        .sort((left, right) => left.name.localeCompare(right.name));
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
