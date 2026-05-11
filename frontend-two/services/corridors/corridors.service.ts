import { graphqlRequest } from "@/services/api";
import { CorridorListItem, CorridorSummary } from "@/types/corridors";
import { CORRIDORS_LIST_QUERY } from "@/services/corridors/corridors.operations";

export const corridorsService = {
  fetchCorridors: async (apiUrl: string): Promise<CorridorSummary[] | null> => {
    try {
      const result = await graphqlRequest<{
        corridor: { corridorList: Array<CorridorListItem | null> | null };
      }>(apiUrl, CORRIDORS_LIST_QUERY);
      const list = result.corridor?.corridorList ?? [];
      return list
        .filter((c): c is CorridorListItem => c !== null)
        .map(({ id, name, stops }) => ({
          id,
          name,
          numStops: (stops ?? []).filter((s) => s !== null).length,
        }));
    } catch (error) {
      console.warn("Failed to fetch corridors:", error);
      return null;
    }
  },
};
