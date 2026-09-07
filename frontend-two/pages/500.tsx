import Link from "next/link";
import { BaseLayout } from "@/components/layout/BaseLayout";

const InternalServerError = () => {
  return (
    <BaseLayout title="Internal Server Error - Analyse Bus Open Data">
      <h1 className="govuk-heading-xl">
        Sorry, there is a problem with the service
      </h1>
      <p className="govuk-body">Try again later.</p>
      <p className="govuk-body">
        We have been notified of the problem and are working to fix it.
      </p>
      <Link href="/" className="govuk-link">
        Go to the homepage
      </Link>
    </BaseLayout>
  );
};

export default InternalServerError;
