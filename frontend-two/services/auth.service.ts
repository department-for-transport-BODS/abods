import { apolloClient } from "@/services/apolloClient";
import {
  LoginDocument,
  LoginMutation,
  LogoutDocument,
  LogoutMutation,
  UserDocument,
  UserQuery,
} from "../src/generated/graphql";

export interface LoginResult {
  success: boolean;
  expiresAt?: string | null;
  maxAttempts?: number | null;
  unlockAt?: string | null;
  failedAttempts?: number | null;
  locked?: boolean | null;
}

export const authService = {
  login: async (username: string, password: string): Promise<LoginResult> => {
    const result = await apolloClient.mutate<LoginMutation>({
      mutation: LoginDocument,
      variables: { username, password },
    });

    if (!result.data?.login) {
      throw new Error("Login failed");
    }
    return result.data.login;
  },
  logout: async (): Promise<boolean> => {
    const result = await apolloClient.mutate<LogoutMutation>({
      mutation: LogoutDocument,
    });

    return Boolean(result.data?.logout ?? false);
  },
  getUser: async () => {
    const result = await apolloClient.mutate<UserQuery>({
      mutation: UserDocument,
    });
    return result.data?.user ?? null;
  },
};
