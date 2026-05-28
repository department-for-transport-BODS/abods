import { graphqlRequest } from "@/services/api";
import {
  StopStatistics,
  StopAnalysisFilters,
  AdminArea,
  Operator,
  Line,
} from "@/types/stop-analysis";
import {
  STOP_ANALYSIS_QUERY,
  OPERATORS_QUERY,
  ADMIN_AREAS_QUERY,
  LINES_QUERY,
} from "@/services/stop-analysis/stop-analysis.operations";

export const stopAnalysisService = {
  fetchStopAnalysis: async (
    apiUrl: string,
    filters: StopAnalysisFilters,
  ): Promise<StopStatistics[]> => {
    try {
      const result = await graphqlRequest<{
        stopAnalysis: StopStatistics[];
      }>(apiUrl, STOP_ANALYSIS_QUERY, filters as unknown as Record<string, unknown>);
      return result.stopAnalysis ?? [];
    } catch (error) {
      console.warn("Failed to fetch stop analysis:", error);
      return [];
    }
  },

  fetchOperators: async (apiUrl: string): Promise<Operator[]> => {
    try {
      const result = await graphqlRequest<{
        operators: Operator[];
      }>(apiUrl, OPERATORS_QUERY);
      return result.operators ?? [];
    } catch (error) {
      console.warn("Failed to fetch operators:", error);
      return [];
    }
  },

  fetchAdminAreas: async (apiUrl: string): Promise<AdminArea[]> => {
    try {
      const result = await graphqlRequest<{
        adminAreas: AdminArea[];
      }>(apiUrl, ADMIN_AREAS_QUERY);
      return result.adminAreas ?? [];
    } catch (error) {
      console.warn("Failed to fetch admin areas:", error);
      return [];
    }
  },

  fetchLines: async (
    apiUrl: string,
    operatorIds: string[],
    inputDate: string,
    endDate?: string,
  ): Promise<Line[]> => {
    try {
      const result = await graphqlRequest<{
        lines: Line[];
      }>(apiUrl, LINES_QUERY, { operatorIds, inputDate, endDate });
      return result.lines ?? [];
    } catch (error) {
      console.warn("Failed to fetch lines:", error);
      return [];
    }
  },
};
