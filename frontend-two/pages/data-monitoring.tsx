import { useEffect, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ErrorSummary } from "@/components/form/ErrorSummary";
import { QuickSightEmbed } from "@/components/data-monitoring/QuickSightEmbed";
import { dataMonitoringService } from "@/services/data-monitoring/data-monitoring.service";
import { useRequireAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
import { ErrorInfo } from "@/types";

const DataMonitoringPage = () => {
  useRequireAuth();
  const { config } = useConfig();
  const { loadData } = useHelpdesk();
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData("dataMonitoring", "Data monitoring");
  }, [loadData]);

  useEffect(() => {
    if (!config?.apiUrl) return;

    const load = async () => {
      setIsLoading(true);
      const result = await dataMonitoringService.fetchEmbeddedUrl();

      if (!result || !result.enabled || !result.url) {
        setErrors([
          {
            id: "enable-dashboard",
            errorMessage: "Unable to load dashboard. Please contact admin",
          },
        ]);
        setEmbedUrl(null);
      } else {
        setErrors([]);
        setEmbedUrl(result.url);
      }

      setIsLoading(false);
    };

    load();
  }, [config]);

  return (
    <BaseLayout title="Data monitoring - Analyse Bus Open Data">
      <h1 className="govuk-heading-xl">Data monitoring</h1>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds-from-desktop">
          <ErrorSummary errors={errors} />
        </div>
      </div>
      {isLoading ? (
        <p className="govuk-body">Loading...</p>
      ) : (
        embedUrl && <QuickSightEmbed url={embedUrl} />
      )}
    </BaseLayout>
  );
};

export default DataMonitoringPage;
