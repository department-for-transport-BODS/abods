import Link from "next/link";
import { BaseLayout } from "@/components/layout/BaseLayout";

const NotAuthorisedPage = () => (
  <BaseLayout title="Not authorised - Analyse Bus Open Data">
    <h1 className="govuk-heading-xl">You are not authorised to view this page</h1>
    <p className="govuk-body">
      If you think you should have access, contact your administrator or the service team.
    </p>
    <Link className="govuk-link" href="/dashboard">
      Return to dashboard
    </Link>
  </BaseLayout>
);

export default NotAuthorisedPage;
