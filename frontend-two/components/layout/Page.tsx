import type { ReactNode } from "react";

interface PageProps {
  backLink?: ReactNode;
  children: ReactNode;
}

export const Page = ({ backLink, children }: PageProps) => (
  <div className="page">
    {backLink ? <div className="page__back-link">{backLink}</div> : null}
    <main id="content" className="govuk-main-wrapper page__main-wrapper">
      {children}
    </main>
  </div>
);