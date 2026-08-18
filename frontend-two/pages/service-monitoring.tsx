import styles from "./service-monitoring.module.scss";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ErrorSummary } from "@/components/form/ErrorSummary";
import { Spinner } from "@/components/shared/Spinner";
import { useRequireAuth } from "@/hooks/useAuth";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
import { serviceMonitoringService } from "@/services/service-monitoring/service-monitoring.service";
import { ErrorInfo } from "@/types";
import { useEffect, useState } from "react";

const ServiceMonitoringPage = () => {
  useRequireAuth();
  const { loadData } = useHelpdesk();
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData("serviceMonitoring", "Service monitoring");
  }, [loadData]);

  useEffect(() => {
    const load = async () => {
      try {
        const user =
          await serviceMonitoringService.fetchServiceMonitoringUser();

        if (
          !user?.canViewServiceMonitoring ||
          !user?.serviceMonitoringEmbedUrl
        ) {
          setEmbedUrl(null);
          setErrors([
            {
              id: "enable-service-monitoring",
              errorMessage: "Unable to load dashboard. Please contact admin",
            },
          ]);
          return;
        }

        setEmbedUrl(user.serviceMonitoringEmbedUrl);
        setErrors([]);
      } catch {
        setEmbedUrl(null);
        setErrors([
          {
            id: "dashboard-load-error",
            errorMessage: "Failed to load dashboard. Please try again",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <BaseLayout
      title="Service monitoring - Analyse Bus Open Data"
      errors={errors}
    >
      <div>
        <header className="govuk-!-margin-bottom-2 govuk-!-margin-top-2">
          <h1 className="govuk-heading-xl govuk-!-margin-bottom-0">
            Service monitoring
          </h1>
        </header>
        <br />

        <div className="govuk-grid-row">
          <div className="govuk-grid-column-two-thirds-from-desktop">
            <ErrorSummary errors={errors} />
          </div>
        </div>

        {isLoading ? (
          <Spinner size="default" message="Loading..." vCentre />
        ) : (
          embedUrl && (
            <div className={styles.iframeContainer}>
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            </div>
          )
        )}
      </div>
    </BaseLayout>
  );
};

export default ServiceMonitoringPage;
