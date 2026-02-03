import Link from "next/link";
import { BaseLayout } from "@/components/layout/BaseLayout";

const NotFoundPage = () => (
  <BaseLayout title="Page not found - Analyse Bus Open Data">
    <h1 className="govuk-heading-xl">Page not found</h1>
    <p className="govuk-body">
      If you typed the web address, check it is correct.
    </p>
    <p className="govuk-body">
      If you pasted the web address, check you copied the entire address.
    </p>
    <Link className="govuk-link" href="/dashboard">
      Go to the dashboard
    </Link>
  </BaseLayout>
);

export default NotFoundPage;
