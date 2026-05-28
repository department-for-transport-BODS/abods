import { useRouter } from "next/router";
import useSWR from "swr";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useRequireAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";
import { CorridorsGrid } from "@/components/corridors/CorridorsGrid";
import { corridorsService } from "@/services/corridors/corridors.service";
import { getSearchParam } from "@/utils/query";

const CorridorsPage = () => {
  useRequireAuth();
  const { config } = useConfig();
  const router = useRouter();

  const filter = getSearchParam(router.query.search);

  const { data, isLoading } = useSWR(
    config?.apiUrl ? ["corridors-list", config.apiUrl] : null,
    ([, apiUrl]) => corridorsService.fetchCorridors(apiUrl),
  );
  const corridors = data ?? [];

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
      {isLoading ? (
        <p className="govuk-body">Loading...</p>
      ) : (
        <CorridorsGrid
          data={corridors}
          filter={filter}
          onFilterChange={handleFilterChange}
        />
      )}
    </BaseLayout>
  );
};

export default CorridorsPage;
