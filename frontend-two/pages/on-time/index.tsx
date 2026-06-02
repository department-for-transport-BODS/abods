import Link from "next/link";
import { useEffect, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { JsonSection } from "@/components/on-time/JsonSection";
import { useConfig } from "@/contexts/ConfigContext";
import { useRequireAuth } from "@/hooks/useAuth";
import {
  OperatorPerformance,
  onTimeService,
} from "@/services/on-time/on-time.service";
import { buildDefaultParams } from "@/services/on-time/params";

const OnTimeIndexPage = () => {
  useRequireAuth();
  const { config } = useConfig();
  const [isLoading, setIsLoading] = useState(true);
  const [operatorPerformance, setOperatorPerformance] = useState<
    OperatorPerformance[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config?.apiUrl) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = buildDefaultParams();
        const data = await onTimeService.fetchOperatorPerformanceList(params);
        setOperatorPerformance(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [config]);

  return (
    <BaseLayout title="On-time performance - Analyse Bus Open Data">
      <h1 className="govuk-heading-xl">On-time performance</h1>
      <p className="govuk-body">
        Skeleton page for the on-time performance migration. Data shown is
        fetched from the same GraphQL operations used by the existing Angular
        app and displayed as JSON for verification.
      </p>
      <p className="govuk-body">
        Drill in to an operator to view its detailed on-time data, or to a
        specific service for stop-level data:
      </p>
      <ul className="govuk-list govuk-list--bullet">
        {operatorPerformance
          .filter((op): op is OperatorPerformance & { nocCode: string } =>
            Boolean(op.nocCode),
          )
          .slice(0, 10)
          .map((op) => (
            <li key={op.nocCode}>
              <Link
                href={`/on-time/${encodeURIComponent(op.nocCode)}`}
                className="govuk-link"
              >
                {op.name} ({op.nocCode})
              </Link>
            </li>
          ))}
      </ul>

      {isLoading ? (
        <p className="govuk-body">Loading on-time data...</p>
      ) : (
        <JsonSection
          title="onTimeOperatorPerformanceList"
          description="Operator-level on-time performance, last 7 days."
          data={operatorPerformance}
          error={error}
        />
      )}
    </BaseLayout>
  );
};

export default OnTimeIndexPage;
