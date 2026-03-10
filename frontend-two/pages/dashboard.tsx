import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { Box } from "@/components/shared/Box";
import { OperatorSelector } from "@/components/dashboard/OperatorSelector";
import { StopTypeToggle } from "@/components/dashboard/StopTypeToggle";
import { PerformanceWidget } from "@/components/dashboard/PerformanceWidget";
import { VehiclesStatus } from "@/components/dashboard/VehiclesStatus";
import { FeedStatusSummary } from "@/components/dashboard/FeedStatusSummary";
import { dashboardService } from "@/services/dashboard/dashboard.service";
import { useConfig } from "@/contexts/ConfigContext";
import { useRequireAuth } from "@/hooks/useAuth";
import { DashboardVehicles, OperatorDashboard, PerformanceFiltersInputType, StopTypeOption } from "@/types/dashboard";

const DashboardPage = () => {
  useRequireAuth();
  const router = useRouter();
  const { config } = useConfig();
  const [operators, setOperators] = useState<OperatorDashboard[]>([]);
  const [vehicleCounts, setVehicleCounts] = useState<DashboardVehicles[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const nocCode = typeof router.query.nocCode === "string" ? router.query.nocCode : null;
  const stopType: StopTypeOption = router.query.stopType === "AllStops" ? "AllStops" : "TimingPoints";

  const performanceFilters: PerformanceFiltersInputType = useMemo(
    () => ({
      timingPointsOnly: stopType === "TimingPoints" ? true : undefined,
      operatorIds: nocCode ? [nocCode] : undefined,
    }),
    [nocCode, stopType],
  );

  useEffect(() => {
    if (!config?.apiUrl) {
      setOperators([]);
      setVehicleCounts([]);
      setIsLoading(false);
      return;
    }
    const load = async () => {
      setIsLoading(true);
      try {
        const [ops, counts] = await Promise.all([
          dashboardService.fetchOperators(config.apiUrl),
          dashboardService.fetchVehicleCounts(config.apiUrl, nocCode),
        ]);
        setOperators(ops);
        setVehicleCounts(counts);
      } catch {
        setOperators([]);
        setVehicleCounts([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [config, nocCode]);

  const currentVehicles = useMemo(
    () => vehicleCounts.reduce((total, item) => total + item.actual, 0),
    [vehicleCounts],
  );

  const expectedVehicles = useMemo(
    () => vehicleCounts.reduce((total, item) => total + item.expected, 0),
    [vehicleCounts],
  );

  const feedStatusOperators = useMemo(() => {
    return [...operators]
      .sort((a, b) => {
        const statusA = String(a.feedMonitoring?.feedStatus ?? "");
        const statusB = String(b.feedMonitoring?.feedStatus ?? "");
        if (statusA !== statusB) return statusA.localeCompare(statusB);
        const errorsA = a.feedMonitoring?.liveStats?.feedErrors ?? 0;
        const errorsB = b.feedMonitoring?.liveStats?.feedErrors ?? 0;
        if (errorsA !== errorsB) return errorsB - errorsA;
        const alertsA = a.feedMonitoring?.liveStats?.feedAlerts ?? 0;
        const alertsB = b.feedMonitoring?.liveStats?.feedAlerts ?? 0;
        return alertsB - alertsA;
      })
      .slice(0, 5);
  }, [operators]);

  const handleOperatorChange = (operatorId: string | null) => {
    router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, nocCode: operatorId ?? undefined },
      },
      undefined,
      { shallow: true },
    );
  };

  const handleStopTypeChange = (value: StopTypeOption) => {
    router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, stopType: value === "TimingPoints" ? undefined : value },
      },
      undefined,
      { shallow: true },
    );
  };

  return (
    <BaseLayout title="Dashboard - Analyse Bus Open Data">
      <div className="app-page dashboard-page">
        <h1 className="govuk-heading-xl app-page-header">Dashboard</h1>
        <div className="dashboard__controls">
          <OperatorSelector operators={operators} selectedOperatorId={nocCode} onChange={handleOperatorChange} />
          <StopTypeToggle stopType={stopType} onChange={handleStopTypeChange} />
        </div>
        {isLoading ? (
          <p className="govuk-body">Loading dashboard data...</p>
        ) : (
          <div className="dashboard__layout">
            <div className="dashboard__performance">
              <Box>
                <h2 className="govuk-heading-m">On-time performance</h2>
                <PerformanceWidget filters={performanceFilters} operators={operators} nocCode={nocCode} />
              </Box>
            </div>
            <div className="dashboard__feeds">
              <div className="dashboard__vehicles-status">
                <VehiclesStatus actual={currentVehicles} expected={expectedVehicles} nocCode={nocCode} />
              </div>
              <div className="dashboard__feed-alerts">
                <FeedStatusSummary operators={feedStatusOperators} />
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};

export default DashboardPage;
