import { apolloClient } from "@/services/apolloClient";

import {
  AdminOrgListDocument,
  AdminOrgListQuery,
  DistancesDropdownInputDocument,
  DistancesDropdownInputQuery,
  DistancesFilterInput,
  DistancesListDocument,
  DistancesListQuery,
  OrgOperatorListDocument,
  UserOrganisationsDocument,
  UserOrganisationsQuery,
} from "../../src/generated/graphql";

type DistanceData = DistancesListQuery["distances"][number];
type DistancesDropdowns = DistancesDropdownInputQuery["distancesDropdowns"];
type AdminOrgMap = AdminOrgListQuery["adminOrgMap"][number];
type UserOrg = UserOrganisationsQuery["userOrgs"][number];

export const distanceService = {
  fetchOrgOperators: async (
    orgId: number,
  ): Promise<{ name: string; nocCode: string }[]> => {
    try {
      const result = await apolloClient.query({
        query: OrgOperatorListDocument,
        variables: { orgId },
      });
      return result.data?.operators ?? [];
    } catch (error) {
      console.error("Failed to fetch organisation operators:", error);
      return [];
    }
  },

  fetchDistances: async (
    filterBy: DistancesFilterInput,
  ): Promise<DistanceData[]> => {
    try {
      const result = await apolloClient.query({
        query: DistancesListDocument,
        variables: { filterBy },
      });
      return result.data?.distances ?? [];
    } catch (error) {
      console.error("Failed to fetch distances:", error);
      return [];
    }
  },

  fetchDropdownInputs: async (): Promise<DistancesDropdowns> => {
    try {
      const result = await apolloClient.query({
        query: DistancesDropdownInputDocument,
      });
      return result.data?.distancesDropdowns ?? { operators: [] };
    } catch (error) {
      console.error("Failed to fetch dropdown inputs:", error);
      return { operators: [] };
    }
  },

  fetchAdminOrg: async (): Promise<AdminOrgMap[]> => {
    try {
      const result = await apolloClient.query({
        query: AdminOrgListDocument,
      });
      return result.data?.adminOrgMap ?? [];
    } catch (error) {
      console.error("Failed to fetch admin organisation list:", error);
      return [];
    }
  },
};
