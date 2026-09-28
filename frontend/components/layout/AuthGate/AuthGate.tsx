import type { ReactNode } from "react";
import { useRouter } from "next/router";
import { Spinner } from "@/components/shared/Spinner";
import { useRequireAuth } from "@/hooks/useAuth";
import { isPublicRoute } from "@/utils/routes";
import styles from "./auth-gate.module.scss";

const ProtectedPage = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useRequireAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <div className={styles.loading}>
        <Spinner size="default" message="Loading..." />
      </div>
    );
  }
  return <>{children}</>;
};

export const AuthGate = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  if (isPublicRoute(router.asPath)) return <>{children}</>;
  return <ProtectedPage>{children}</ProtectedPage>;
};
