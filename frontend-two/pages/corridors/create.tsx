import { useEffect } from "react";
import Link from "next/link";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useRequireAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
import { CreateCorridorForm } from "@/components/corridors/create/CreateCorridorForm";

const CorridorsCreatePage = () => {
  useRequireAuth();
  const { config } = useConfig();
  const { loadData } = useHelpdesk();

  useEffect(() => {
    loadData("corridors", "Corridors");
  }, [loadData]);

  return (
    <BaseLayout title="Create new corridor - Analyse Bus Open Data">
      <Link href="/corridors" className="govuk-back-link">
        All corridors
      </Link>
      <span className="govuk-caption-xl">Corridors</span>
      <h1 className="govuk-heading-xl">Create new corridor</h1>
      <CreateCorridorForm
        mode="create"
        mapboxToken={config?.mapboxToken}
        mapboxStyle={config?.mapboxStyle}
        mapboxSatelliteStyle={config?.mapboxSatelliteStyle}
      />
    </BaseLayout>
  );
};

export default CorridorsCreatePage;
