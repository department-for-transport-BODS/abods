import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { sessionStore } from "@/utils/storage";

export const useAuth = () => {
  const auth = useAuthContext();
  return {
    ...auth,
    isAuthenticated: auth.isAuthenticated && sessionStore.isAlive(),
  };
};

export const useRequireAuth = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading, clearUser } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      if (sessionStore.get() && !sessionStore.isAlive()) {
        clearUser();
      }
      router.replace(`/login?returnUrl=${encodeURIComponent(router.asPath)}`);
    }
  }, [clearUser, isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
};
