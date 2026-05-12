import { graphqlRequest } from "@/services/api";
import {
  ADMIN_ORG_LIST_QUERY,
  DISTANCES_DROPDOWNS_QUERY,
  DISTANCES_LIST_QUERY,
  USER_ORGANISATIONS_QUERY,
} from "@/services/distances/distance.operations";
import {
  AdminOrgMap,
  Distance,
  DistancesDropdowns,
  DistancesFilterInput,
  UserOrg,
} from "@/types/distances";

export const distanceService = {
  fetchDropdowns: async (apiUrl: string): Promise<DistancesDropdowns> => {
    try {
      const result = await graphqlRequest<{ distancesDropdowns: DistancesDropdowns }>(
        apiUrl,
        DISTANCES_DROPDOWNS_QUERY,
      );
      return result.distancesDropdowns;
    } catch (error) {
      console.error("Failed to fetch distances dropdowns:", error);
      return { operators: [] };
    }
  },

  fetchAdminOrgList: async (apiUrl: string): Promise<AdminOrgMap[]> => {
    try {
      const result = await graphqlRequest<{ adminOrgMap: AdminOrgMap[] }>(
        apiUrl,
        ADMIN_ORG_LIST_QUERY,
      );
      return result.adminOrgMap ?? [];
    } catch (error) {
      console.error("Failed to fetch admin org list:", error);
      return [];
    }
  },

  fetchUserOrgs: async (apiUrl: string): Promise<UserOrg[]> => {
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

  fetchDistances: async (
    apiUrl: string,
    filterBy: DistancesFilterInput,
  ): Promise<Distance[]> => {
    try {
      const result = await graphqlRequest<{ distances: Distance[] }>(
        apiUrl,
        DISTANCES_LIST_QUERY,
        { filterBy },
      );
      return result.distances ?? [];
    } catch (error) {
      console.error("Failed to fetch distances:", error);
      return [];
    }
  },
};
