import { graphqlRequest } from "@/services/api";
import {
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  USER_QUERY,
} from "@/services/auth/auth.operations";

export interface LoginResult {
  success: boolean;
  expiresAt?: string | null;
  maxAttempts?: number | null;
  unlockAt?: string | null;
  failedAttempts?: number | null;
  locked?: boolean | null;
}

export const authService = {
  login: async (apiUrl: string, username: string, password: string): Promise<LoginResult> => {
    const result = await graphqlRequest<{ login: LoginResult }>(apiUrl, LOGIN_MUTATION, {
      username,
      password,
    });
    if (!result.login) {
      throw new Error("Login failed");
    }
    return result.login;
  },
  logout: async (apiUrl: string): Promise<boolean> => {
    const result = await graphqlRequest<{ logout: boolean }>(apiUrl, LOGOUT_MUTATION);
    return Boolean(result.logout);
  },
  getUser: async (apiUrl: string) => {
    const result = await graphqlRequest<{ user: import("@/types").LoginInfo | null }>(
      apiUrl,
      USER_QUERY,
    );
    return result.user ?? null;
  },
};
