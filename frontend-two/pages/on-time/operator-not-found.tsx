import Link from "next/link";
import { useEffect } from "react";
import pageStyles from "@/components/layout/Page/page.module.scss";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
import { useRequireAuth } from "@/hooks/useAuth";
import { clsx } from "clsx";

const OnTimeOperatorNotFoundPage = () => {
  useRequireAuth();
  const { loadData } = useHelpdesk();

  useEffect(() => {
    loadData("otp", "On-time performance");
  }, [loadData]);

  return (
    <BaseLayout
      title="Not found: Analyse Bus Open Data"
      mainClassName="contentPage"
      backLink={
        <Link
          href="/on-time"
          className="govuk-back-link back-link govuk-!-margin-bottom-0"
        >
          On-time performance
        </Link>
      }
    >
      <header className="govuk-!-margin-bottom-8">
        <span className="govuk-caption-xl">On-time performance</span>
        <h1 className={clsx(pageStyles.headerTitle, "govuk-heading-xl")}>
          Not found
        </h1>
      </header>
      <p className="govuk-body">
        Operator not found, or you do not have permission to view. Go back to{" "}
        <Link className="govuk-link" href="/on-time">
          On-time performance
        </Link>
        ?
      </p>
    </BaseLayout>
  );
};

export default OnTimeOperatorNotFoundPage;
