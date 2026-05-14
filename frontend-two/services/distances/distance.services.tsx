import { graphqlRequest } from "@/services/api";

import {
  AdminOrgMap,
  DistanceData,
  DistancesDropdowns,
  DistancesFilterInput,
  UserOrg,
} from "@/types/distances";

import {
  USER_ORGANISATIONS_QUERY,
  ORG_OPERATOR_LIST_QUERY,
  DISTANCE_LIST_QUERY,
  DISTANCES_DROPDOWNS_INPUT_QUERY,
  ADMIN_ORG_LIST_QUERY,
} from "@/services/distances/distance.operations";

export const distanceService = {
  fetchUserOrganisations: async (apiUrl: string): Promise<UserOrg[]> => {
    try {
      const result = await graphqlRequest<{ userOrgs: UserOrg[] }>(
        apiUrl,
        USER_ORGANISATIONS_QUERY,
      );
      return result.userOrgs ?? [];
    } catch (error) {
      console.error("Failed to fetch user organisations:", error);
      return [];
    }
  },

  fetchOrgOperators: async (apiUrl: string, orgId: number): Promise<{ name: string; nocCode: string }[]> => {
    try {
      const result = await graphqlRequest<{ operators: { name: string; nocCode: string }[] }>(
        apiUrl,
        ORG_OPERATOR_LIST_QUERY,
        { orgId },
      );
      return result.operators ?? [];
    } catch (error) {
      console.error("Failed to fetch organisation operators:", error);
      return [];
    }
  },

  fetchDistances: async (apiUrl: string, filterBy: DistancesFilterInput): Promise<DistanceData[]> => {
    try {
      const result = await graphqlRequest<{ distances: DistanceData[] }>(
        apiUrl,
        DISTANCE_LIST_QUERY,
        { filterBy },
      );
      return result.distances ?? [];
    } catch (error) {
      console.error("Failed to fetch distances:", error);
      return [];
    }
  },

  fetchDropdownInputs: async (apiUrl: string): Promise<DistancesDropdowns> => {
    try {
      const result = await graphqlRequest<{ distancesDropdowns: DistancesDropdowns }>(
        apiUrl,
        DISTANCES_DROPDOWNS_INPUT_QUERY,
      );
      return result.distancesDropdowns ?? { operators: [] };
    } catch (error) {
      console.error("Failed to fetch dropdown inputs:", error);
      return { operators: [] };
    }
  },

  fetchAdminOrg: async (apiUrl: string): Promise<AdminOrgMap[]> => {
    try {
      const result = await graphqlRequest<{ adminOrgMap: AdminOrgMap[] }>(
        apiUrl,
        ADMIN_ORG_LIST_QUERY,
      );
      return result.adminOrgMap ?? [];
    } catch (error) {
      console.error("Failed to fetch admin organisation list:", error);
      return [];
    }
  },
};

  