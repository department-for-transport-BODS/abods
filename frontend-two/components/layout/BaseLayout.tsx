import Head from "next/head";
import { ReactNode } from "react";
import { useRouter } from "next/router";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Nav } from "@/components/layout/Nav";
import { Panel } from "@/components/layout/Panel";
import { SkipLinks } from "@/components/layout/SkipLinks";
import { useAuth } from "@/hooks/useAuth";
import { ErrorInfo } from "@/types";
import { buildTitle } from "@/utils/errors";
import { normalizePathname } from "@/utils/path";

interface BaseLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  errors?: ErrorInfo[];
}
const PUBLIC_ROUTES = ["/login", "/accessibility", "/cookies", "/privacy-policy"];

export const BaseLayout = ({
  title,
  description,
  children,
  errors,
}: BaseLayoutProps) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const normalizedPath = normalizePathname(router.asPath);
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    normalizedPath === route || normalizedPath.endsWith(route),
  );
  const showAuthenticatedLayout = isAuthenticated && !isPublicRoute;
  const pageTitle = buildTitle(errors, title);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        {description ? <meta name="description" content={description} /> : null}
      </Head>
      <SkipLinks contentId="content" navId="navigation" />
      <CookieBanner />
      <div className="app">
        <Header serviceName="Analyse Bus Open Data" />
        <div className="app__body">
          {showAuthenticatedLayout ? <Nav /> : null}
          <main
            id="content"
            className={
              showAuthenticatedLayout
                ? "app__content"
                : "app__content app__content--narrow"
            }
          >
            {children}
          </main>
          {showAuthenticatedLayout ? <Panel /> : null}
        </div>
        <Footer />
      </div>
    </>
  );
};
