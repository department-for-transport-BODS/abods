import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelpdeskProvider } from "@/contexts/HelpdeskContext";
import { NavProvider } from "@/contexts/NavContext";
import { PanelProvider } from "@/contexts/PanelContext";
import HelpdeskPanel from "@/components/shared/HelpdeskPanel";
import "@/styles/globals.scss";
import "@/styles/tailwind.css";

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
              <Component {...pageProps} />
              <HelpdeskPanel />
            </PanelProvider>
          </NavProvider>
        </HelpdeskProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default MyApp;
