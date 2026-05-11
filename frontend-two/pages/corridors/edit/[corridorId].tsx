import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useRequireAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";
import { CreateCorridorForm } from "@/components/corridors/create/CreateCorridorForm";
import { corridorsService } from "@/services/corridors/corridors.service";

const NOT_FOUND_HEADING = "Not found";
const NOT_FOUND_MESSAGE =
  "Corridor not found, or you do not have permission to view.";

const parseCorridorId = (
  value: string | string[] | undefined,
): number | null => {
  const corridorId = Array.isArray(value) ? value[0] : value;
  const parsed = Number(corridorId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const CorridorsEditPage = () => {
  useRequireAuth();
  const { config } = useConfig();
  const router = useRouter();

  const corridorId = parseCorridorId(router.query.corridorId);

  const { data: corridor, isLoading } = useSWR(
    config?.apiUrl && corridorId
      ? ["corridor-by-id", config.apiUrl, corridorId]
      : null,
    ([, apiUrl, id]) => corridorsService.fetchCorridorById(apiUrl, id),
  );

  const showNotFound = !isLoading && corridor === null;

  return (
    <BaseLayout title="Edit corridor - Analyse Bus Open Data">
      <Link href="/corridors" className="govuk-back-link">
        All corridors
      </Link>
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
          {isLoading || !config?.apiUrl || !corridor ? (
            <p className="govuk-body">Loading...</p>
          ) : (
            <CreateCorridorForm
              apiUrl={config.apiUrl}
              mode="edit"
              initialCorridor={corridor}
            />
          )}
        </>
      )}
    </BaseLayout>
  );
};

export default CorridorsEditPage;
