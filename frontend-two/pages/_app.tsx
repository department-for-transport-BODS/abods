import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelpdeskProvider } from "@/contexts/HelpdeskContext";
import { NavProvider } from "@/contexts/NavContext";
import { PanelProvider } from "@/contexts/PanelContext";
import HelpdeskPanel from "@/components/shared/HelpdeskPanel";
import { Spinner } from "@/components/shared/Spinner";
import { useRequireAuth } from "@/hooks/useAuth";
import { isPublicRoute } from "@/utils/routes";
import "@/styles/globals.scss";
import "@/styles/tailwind.css";

const ProtectedPage = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useRequireAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="auth-gate-loading">
        <Spinner size="default" message="Loading..." />
      </div>
    );
  }
  return <>{children}</>;
};

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  if (isPublicRoute(router.asPath)) return <>{children}</>;
  return <ProtectedPage>{children}</ProtectedPage>;
};

const MyApp = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();

  useEffect(() => {
    import("govuk-frontend").then((govuk) => {
      if (govuk?.initAll) {
        govuk.initAll();
      }
    });

    // Global error handler for unhandled promise rejections
    const handleError = (event: PromiseRejectionEvent) => {
      console.error("Unhandled error:", event.reason);

      // Check if it's a 500-level error
      if (
        event.reason?.message?.includes("(500)") ||
        event.reason?.message?.includes("(502)") ||
        event.reason?.message?.includes("(503)") ||
        event.reason?.message?.includes("(504)")
      ) {
        router.push("/500");
      }
    };

    window.addEventListener("unhandledrejection", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleError);
    };
  }, [router]);

  return (
    <ConfigProvider>
      <AuthProvider>
        <HelpdeskProvider>
          <NavProvider>
            <PanelProvider>
              <AuthGate>
                <Component {...pageProps} />
              </AuthGate>
              <HelpdeskPanel />
            </PanelProvider>
          </NavProvider>
        </HelpdeskProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default MyApp;
