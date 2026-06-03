import { useEffect, useMemo, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { FeedTable } from "@/components/feed-monitoring/FeedTable";
import { feedMonitoringService } from "@/services/feed-monitoring/feed-monitoring.services";
import { FeedMonitoringOperatorData, VehicleCountData } from "@/types/feed-monitoring";
import { useRequireAuth } from "@/hooks/useAuth";

const FeedMonitoringPage = () => {
  useRequireAuth();
  const [operatorData, setOperatorData] = useState<FeedMonitoringOperatorData[]>([]);
  const [vehicleCountData, setVehicleCountData] = useState<VehicleCountData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [operatorSearch, setOperatorSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await feedMonitoringService.fetchFeedMonitoringList();
        const vehicleData = await feedMonitoringService.fetchOperatorSparklines(data.map(d => d.operatorId));
        setOperatorData(data);
        setVehicleCountData(vehicleData);
      } catch (err) {
        console.error("Failed to load feed monitoring data:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Check if operator search has been used and filter data here
  // Can search either by operator name or NOC code
  const filteredOperators = useMemo(() => {
    if (!operatorSearch) return operatorData;
    return operatorData.filter(
      (op) => 
        op.name.toLowerCase().includes(operatorSearch.toLowerCase()) ||
        op.nocCode.toLowerCase().includes(operatorSearch.toLowerCase())
    );
  }, [operatorData, operatorSearch]);

  // Data for inactive and active feeds
  const inactiveOperators = filteredOperators.filter(o => !o.feedMonitoring?.feedStatus);
  const activeOperators = filteredOperators.filter(o => o.feedMonitoring?.feedStatus);

  return (
    <BaseLayout title="Dashboard - Analyse Bus Open Data">
      <div className="app-page feed-monitoring-page">
        <h1 className="govuk-heading-xl app-page-header">NOC feed monitoring</h1>
        {error && (
          <div className="govuk-error-summary" role="alert" aria-labelledby="error-summary-title">
            <h2 className="govuk-error-summary__title" id="error-summary-title">There is a problem</h2>
            <div className="govuk-error-summary__body">
              <p className="govuk-body">There was a problem loading the feed monitoring data. Please try refreshing the page.</p>
            </div>
          </div>
        )}
        <div className="govuk-form-group">
          <label className="govuk-label" htmlFor="operator-search">
            Search for an operator
          </label>
          <input
            className="govuk-input govuk-input--width-20"
            id="operator-search"
            data-testid="operator-search-input"
            type="text"
            value={operatorSearch}
            onChange={(e) => setOperatorSearch(e.target.value)}
          />
        </div>
        {isLoading ? (
          <p className="govuk-body">Loading...</p>
        ) : (
          <>
            <div data-testid="inactive-feeds-section">
              <FeedTable title="Inactive feeds" active={false} data={inactiveOperators} vehicleCountData={vehicleCountData} />
            </div>
            <div data-testid="active-feeds-section">
              <FeedTable title="Active feeds" active={true} data={activeOperators} vehicleCountData={vehicleCountData} />
            </div>
          </>
        )}
      </div>
    </BaseLayout>
  );
}
export default FeedMonitoringPage;
