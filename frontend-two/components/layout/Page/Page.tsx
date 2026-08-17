import type { ReactNode } from "react";
import styles from "./page.module.scss";
import { clsx } from "clsx";

interface PageProps {
  backLink?: ReactNode;
  children: ReactNode;
}

export const Page = ({ backLink, children }: PageProps) => (
  <div className={styles.page}>
    {backLink ? (
      <div className={styles.backLink}>{backLink}</div>
    ) : null}
    <main
      id="content"
      className={clsx(styles.mainWrapper, "govuk-main-wrapper")}
    >
      {children}
    </main>
  </div>
);
