import { BaseLayout } from "@/components/layout/BaseLayout";
import { ErrorSummary } from "@/components/form/ErrorSummary";
import { useAuth, useRequireAuth } from "@/hooks/useAuth";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
import { ErrorInfo } from "@/types";
import { useEffect } from "react";

const ServiceMonitoringPage = () => {
  useRequireAuth();
  const { user, isLoading } = useAuth();
  const { loadData } = useHelpdesk();

  useEffect(() => {
    loadData("serviceMonitoring", "Service monitoring");
  }, [loadData]);

  const errors: ErrorInfo[] =
    isLoading ||
    (user?.canViewServiceMonitoring && user?.serviceMonitoringEmbedUrl)
      ? []
      : [
          {
            id: "service-monitoring-error",
            errorMessage: "Unable to load dashboard. Please contact admin",
          },
        ];

  return (
    <BaseLayout
      title="Service monitoring - Analyse Bus Open Data"
      errors={errors}
    >
      <div>
        <h1 className="govuk-heading-xl">Service monitoring</h1>

        <div className="govuk-grid-row">
          <div className="govuk-grid-column-two-thirds-from-desktop">
            <ErrorSummary errors={errors} />
          </div>
        </div>

        {isLoading ? (
          <p className="govuk-body">Loading...</p>
        ) : (
          user?.serviceMonitoringEmbedUrl && (
            <div className="service-monitoring__iframe-container">
              <iframe
                src={user.serviceMonitoringEmbedUrl}
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
