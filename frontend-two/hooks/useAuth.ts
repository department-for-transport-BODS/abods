import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

export const useAuth = () => useAuthContext();

export const useRequireAuth = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthContext();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?returnUrl=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
};
