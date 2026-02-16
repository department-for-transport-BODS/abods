import { graphqlRequest } from "@/services/api";

const LOGIN_MUTATION = `mutation login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    success
    expiresAt
    maxAttempts
    unlockAt
    failedAttempts
    locked
  }
}`;

const LOGOUT_MUTATION = `mutation logout {
  logout
}`;

const USER_QUERY = `query user {
  user {
    currentUserId
    canViewServiceMonitoring
    canEditAllAlerts
    canViewDistances
    serviceMonitoringEmbedUrl
    flags
  }
}`;

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
      console.log(result)
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
