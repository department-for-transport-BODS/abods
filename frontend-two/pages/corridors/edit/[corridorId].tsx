import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useRequireAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
import { CreateCorridorForm } from "@/components/corridors/create/CreateCorridorForm";
import { corridorsService } from "@/services/corridors/corridors.service";
import { parseCorridorId } from "@/utils/query";

const NOT_FOUND_HEADING = "Not found";
const NOT_FOUND_MESSAGE =
  "Corridor not found, or you do not have permission to view.";

const CorridorsEditPage = () => {
  useRequireAuth();
  const { config } = useConfig();
  const router = useRouter();
  const { loadData } = useHelpdesk();

  useEffect(() => {
    loadData("corridors", "Corridors");
  }, [loadData]);

  const corridorId = parseCorridorId(router.query.corridorId);

  const { data: corridor, isLoading } = useSWR(
    corridorId ? ["corridor-by-id", corridorId] : null,
    ([, id]) => corridorsService.fetchCorridorById(id),
  );

  const showNotFound = !isLoading && corridor === null;

  return (
    <BaseLayout
      title="Edit corridor - Analyse Bus Open Data"
      backLink={
        <Link href="/corridors" className="govuk-back-link">
          All corridors
        </Link>
      }
    >
      {showNotFound || corridorId === null ? (
        <>
          <span className="govuk-caption-xl">Corridors</span>
          <h1 className="govuk-heading-xl">{NOT_FOUND_HEADING}</h1>
          <p className="govuk-body">
            {NOT_FOUND_MESSAGE} Go back to{" "}
            <Link href="/corridors">All corridors</Link>?
          </p>
        </>
      ) : (
        <>
          <span className="govuk-caption-xl">Corridors</span>
          <h1 className="govuk-heading-xl">Edit corridor</h1>
          {isLoading || !corridor ? (
            <p className="govuk-body">Loading...</p>
          ) : (
            <CreateCorridorForm
              mode="edit"
              initialCorridor={corridor}
              mapboxToken={config?.mapboxToken}
              mapboxStyle={config?.mapboxStyle}
              mapboxSatelliteStyle={config?.mapboxSatelliteStyle}
            />
          )}
        </>
      )}
    </BaseLayout>
  );
};

export default CorridorsEditPage;
