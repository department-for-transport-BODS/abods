import Link from "next/link";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useRequireAuth } from "@/hooks/useAuth";

const OnTimeOperatorNotFoundPage = () => {
  useRequireAuth();

  return (
    <BaseLayout
      title="Not found: Analyse Bus Open Data"
      mainClassName="app__content--page"
    >
      <div className="page__back-link">
        <Link
          href="/on-time"
          className="govuk-back-link back-link govuk-!-margin-bottom-0"
        >
          On-time performance
        </Link>
      </div>
      <div className="govuk-main-wrapper page__main-wrapper">
        <header className="govuk-!-margin-bottom-8">
          <span className="govuk-caption-xl">On-time performance</span>
          <h1 className="govuk-heading-xl page-header__title">Not found</h1>
        </header>
        <p className="govuk-body">
          Operator not found, or you do not have permission to view. Go back to{" "}
          <Link className="govuk-link" href="/on-time">
            On-time performance
          </Link>
          ?
        </p>
      </div>
    </BaseLayout>
  );
};

export default OnTimeOperatorNotFoundPage;
