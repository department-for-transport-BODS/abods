import { useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ErrorSummary } from "@/components/form/ErrorSummary";
import { useRequireAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
import { ErrorInfo } from "@/types";
import dynamic from "next/dynamic";
const CorridorsGrid = dynamic(
  () =>
    import("@/components/corridors/CorridorsGrid").then((m) => m.CorridorsGrid),
  { ssr: false },
);
import { corridorsService } from "@/services/corridors/corridors.service";

const getSearchParam = (value: string | string[] | undefined): string => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const CorridorsPage = () => {
  useRequireAuth();
  const { config } = useConfig();
  const router = useRouter();
  const { loadData } = useHelpdesk();

  useEffect(() => {
    loadData("corridors", "Corridors");
  }, [loadData]);

  const filter = getSearchParam(router.query.search);

  const { data, isLoading } = useSWR(
    config?.apiUrl ? ["corridors-list", config.apiUrl] : null,
    ([, apiUrl]) => corridorsService.fetchCorridors(apiUrl),
  );

  const errors: ErrorInfo[] =
    !isLoading && !data
      ? [
          {
            id: "corridors-load-error",
            errorMessage:
              "There was an error loading operator data, please try again.",
          },
        ]
      : [];

  const handleFilterChange = (value: string) => {
    router
      .replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            search: encodeURIComponent(value),
          },
        },
        undefined,
        { shallow: true },
      )
      .catch(() => {
        /* noop */
      });
  };

  return (
    <BaseLayout title="Corridors - Analyse Bus Open Data">
      <h1 className="govuk-heading-xl">Corridors</h1>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds-from-desktop">
          <ErrorSummary errors={errors} />
        </div>
      </div>
      {isLoading ? (
        <p className="govuk-body">Loading...</p>
      ) : data ? (
        <CorridorsGrid
          data={data}
          filter={filter}
          onFilterChange={handleFilterChange}
        />
      ) : null}
    </BaseLayout>
  );
};

export default CorridorsPage;
