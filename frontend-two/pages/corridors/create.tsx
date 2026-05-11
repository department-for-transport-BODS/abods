import Link from "next/link";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useRequireAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";
import { CreateCorridorForm } from "@/components/corridors/create/CreateCorridorForm";

const CorridorsCreatePage = () => {
  useRequireAuth();
  const { config } = useConfig();

  return (
    <BaseLayout title="Create new corridor - Analyse Bus Open Data">
      <Link href="/corridors" className="govuk-back-link">
        All corridors
      </Link>
      <span className="govuk-caption-xl">Corridors</span>
      <h1 className="govuk-heading-xl">Create new corridor</h1>
      {config?.apiUrl ? (
        <CreateCorridorForm apiUrl={config.apiUrl} mode="create" />
      ) : (
        <p className="govuk-body">Loading...</p>
      )}
    </BaseLayout>
  );
};

export default CorridorsCreatePage;
