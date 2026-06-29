import Link from "next/link";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useRequireAuth } from "@/hooks/useAuth";

const OnTimeOperatorNotFoundPage = () => {
  useRequireAuth();

  return (
    <BaseLayout title="Not found: Analyse Bus Open Data">
      <Link href="/on-time" className="govuk-back-link">
        On-time performance
      </Link>
      <span className="govuk-caption-xl">On-time performance</span>
      <h1 className="govuk-heading-xl">Not found</h1>
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
