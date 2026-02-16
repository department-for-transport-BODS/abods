import { Session, User } from "@/types";

const SESSION_KEY = "session";
const USER_KEY = "user";

export const getSession = (): Session | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
};

export const setSession = (session: Session): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
};

export const getUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

export const setUser = (user: User): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearUser = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
};

export const isSessionAlive = (): boolean => {
  const session = getSession();
  if (!session?.expiresAt) return false;
  const now = new Date().toISOString();
  return now <= session.expiresAt;
};
