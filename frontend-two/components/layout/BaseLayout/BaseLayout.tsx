import Head from "next/head";
import { ReactNode } from "react";
import { useRouter } from "next/router";
import styles from "./base-layout.module.scss";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Nav } from "@/components/layout/Nav";
import { Page } from "@/components/layout/Page";
import { Panel } from "@/components/layout/Panel";
import { SkipLinks } from "@/components/layout/SkipLinks";
import { useAuth } from "@/hooks/useAuth";
import { ErrorInfo } from "@/types";
import { buildTitle } from "@/utils/errors";
import { isPublicRoute } from "@/utils/routes";
import { clsx } from "clsx";

interface BaseLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  errors?: ErrorInfo[];
  mainClassName?: "contentPage";
  backLink?: ReactNode;
}

export const BaseLayout = ({
  title,
  description,
  children,
  errors,
  mainClassName,
  backLink,
}: BaseLayoutProps) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const showAuthenticatedLayout =
    isAuthenticated && !isPublicRoute(router.asPath);
  const pageTitle = buildTitle(errors, title);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        {description ? <meta name="description" content={description} /> : null}
      </Head>
      <SkipLinks contentId="content" navId="navigation" />
      <CookieBanner />
      <div className={styles.app}>
        <Header serviceName="Analyse Bus Open Data" />
        <div className={styles.body}>
          {showAuthenticatedLayout ? <Nav /> : null}
          <div
            className={clsx(
              styles.content,
              !showAuthenticatedLayout && styles.contentNarrow,
              mainClassName && styles[mainClassName],
            )}
          >
            <Page backLink={backLink}>{children}</Page>
          </div>
          {showAuthenticatedLayout ? <Panel /> : null}
        </div>
        <Footer />
      </div>
    </>
  );
};
