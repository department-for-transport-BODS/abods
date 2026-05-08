import { graphqlRequest } from "@/services/api";
import { EmbeddedUrlResponse } from "@/types/data-monitoring";
import { EMBEDDED_URL_QUERY } from "@/services/data-monitoring/data-monitoring.operations";

export const dataMonitoringService = {
  fetchEmbeddedUrl: async (
    apiUrl: string,
  ): Promise<EmbeddedUrlResponse | null> => {
    try {
      const result = await graphqlRequest<{
        embeddedUrl: EmbeddedUrlResponse;
      }>(apiUrl, EMBEDDED_URL_QUERY);
      return result.embeddedUrl ?? null;
    } catch (error) {
      console.warn("Failed to fetch embedded URL:", error);
      return null;
    }
  },
};
