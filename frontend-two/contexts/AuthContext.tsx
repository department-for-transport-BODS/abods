import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { LoginInfo, User } from "@/types";
import { authService } from "@/services/auth.service";
import {
  clearSession,
  clearUser,
  isSessionAlive,
  setSession,
  setUser,
} from "@/utils/storage";
import { useConfig } from "@/contexts/ConfigContext";

interface AuthContextValue {
  user: LoginInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { config } = useConfig();
  const [user, setUserState] = useState<LoginInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!config?.apiUrl) return null;
    try {
      const result = await authService.getUser(config.apiUrl);
      setUserState(result);
      return result;
    } catch {
      setUserState(null);
      return null;
    }
  }, [config?.apiUrl]);

  const logout = useCallback(async () => {
    if (!config?.apiUrl) {
      clearSession();
      clearUser();
      setIsAuthenticated(false);
      setUserState(null);
      return;
    }
    await authService.logout(config.apiUrl).catch(() => undefined);
    clearSession();
    clearUser();
    setIsAuthenticated(false);
    setUserState(null);
  }, [config?.apiUrl]);

  useEffect(() => {
    const init = async () => {
      const alive = isSessionAlive();
      setIsAuthenticated(alive);
      if (alive) {
        await fetchUser();
      }
      setIsLoading(false);
    };
    init();
  }, [fetchUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "session") return;
      const alive = isSessionAlive();
      setIsAuthenticated(alive);
      if (alive) {
        fetchUser().catch(() => undefined);
      } else {
        setUserState(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchUser]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const timeoutDelay = 1000 * 60 * 60 * 12; // 12 hours
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (isSessionAlive()) {
          logout().catch(() => undefined);
        }
      }, timeoutDelay);
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
      if (!config?.apiUrl) {
        throw new Error("API URL not configured");
      }
      const result = await authService.login(config.apiUrl, username, password);
      if (!result.success || !result.expiresAt) {
        throw new Error("Login failed");
      }
      setSession({ expiresAt: result.expiresAt });
      setUser({ username });
      await fetchUser();
      setIsAuthenticated(true);
    },
    [config?.apiUrl, fetchUser],
  );

  const value = useMemo(
    () => ({ user, isAuthenticated, isLoading, login, logout }),
    [user, isAuthenticated, isLoading, login, logout],
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
