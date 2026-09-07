import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { LoginInfo } from "@/types";
import { authService, LoginResult } from "@/services/auth.service";
import { sessionStore, userStore } from "@/utils/storage";
import { clearUserScopedStorage } from "@/utils/authReset";
import { apolloClient } from "@/services/apolloClient";
import { useConfig } from "@/contexts/ConfigContext";

const IDLE_TIMEOUT = 1000 * 60 * 60 * 12; // 12 hours

interface AuthContextValue {
  user: LoginInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  clearUser: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<LoginInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const result = await authService.getUser();
      setUserState(result);
      return result;
    } catch {
      setUserState(null);
      return null;
    }
  }, []);

  const resetState = useCallback(() => {
    clearUserScopedStorage();
    apolloClient.clearStore().catch(() => undefined);
    setIsAuthenticated(false);
    setUserState(null);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout().catch(() => undefined);

    resetState();
  }, [resetState]);

  useEffect(() => {
    const init = async () => {
      const alive = sessionStore.isAlive();
      setIsAuthenticated(alive);
      if (alive) await fetchUser();
      setIsLoading(false);
    };
    init();
  }, [fetchUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "session") return;
      if (sessionStore.isAlive()) {
        setIsAuthenticated(true);
        fetchUser();
      } else {
        resetState();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchUser, resetState]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (sessionStore.isAlive()) logout().catch(() => undefined);
      }, IDLE_TIMEOUT);
    };

    const events = ["keypress", "click", "wheel", "mousemove", "touchstart"];
    events.forEach((event) => document.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) =>
        document.removeEventListener(event, resetTimer),
      );
    };
  }, [logout]);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await authService.login(username, password);
      if (result.success && result.expiresAt) {
        sessionStore.set({ expiresAt: result.expiresAt });
        userStore.set({ username });
        await fetchUser();
        setIsAuthenticated(true);
      }
      return result;
    },
    [fetchUser],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      clearUser: resetState,
    }),
    [user, isAuthenticated, isLoading, login, logout, resetState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};
