import { apolloClient } from "@/services/apolloClient";
import {
  AwsQuicksightUser,
  DashboadEmbeddedUrlDocument,
  DashboadEmbeddedUrlQuery,
} from "../../src/generated/graphql";

export const dataMonitoringService = {
  fetchEmbeddedUrl: async (): Promise<AwsQuicksightUser | null> => {
    try {
      const result = await apolloClient.query({
        query: DashboadEmbeddedUrlDocument,
        fetchPolicy: "no-cache",
      });

      return result.data?.embeddedUrl ?? null;
    } catch (error) {
      console.warn("Failed to fetch embedded URL:", error);
      return null;
    }
  },
};
