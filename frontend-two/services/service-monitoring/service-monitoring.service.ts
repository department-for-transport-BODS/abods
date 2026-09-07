import { apolloClient } from "@/services/apolloClient";
import { UserDocument, UserQuery } from "../../src/generated/graphql";

export const serviceMonitoringService = {
  // Bypasses the cache so the short-lived Datadog secure embed token is always freshly minted.
  fetchServiceMonitoringUser: async (): Promise<UserQuery["user"]> => {
    const result = await apolloClient.query({
      query: UserDocument,
      fetchPolicy: "no-cache",
    });

    return result.data?.user ?? null;
  },
};
