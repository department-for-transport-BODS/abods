import { useEffect, useMemo, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { FeedSummaryGrid } from "@/components/feed-monitoring/FeedSummaryGrid";
import { useConfig } from "@/contexts/ConfigContext";
import { feedMonitoringService } from "@/services/feed-monitoring/feed-monitoring.services";
import { FeedMonitoringOperator } from "@/types/feed-monitoring";

const FeedMonitoringPage = () => {
  const { config } = useConfig();
  const [operators, setOperators] = useState<FeedMonitoringOperator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [operatorSearch, setOperatorSearch] = useState("");

  useEffect(() => {
    if (!config?.apiUrl) {
      setOperators([]);
      setIsLoading(false);
      console.error("API URL is not configured");
      return;
    }
    const load = async () => {
      setIsLoading(true);
      const data = await feedMonitoringService.fetchFeedMonitoringList(config.apiUrl);
      setOperators(data);
      setIsLoading(false);
    };

    load();
  }, [config]);

  // Check if operator search has been used and filter data here
  // Can search either by operator name or NOC code
  const filteredOperators = useMemo(() => {
    if (!operatorSearch) return operators;
    return operators.filter(
      (op) => 
        op.name.toLowerCase().includes(operatorSearch.toLowerCase()) ||
        op.nocCode.toLowerCase().includes(operatorSearch.toLowerCase())
    );
  }, [operators, operatorSearch]);

  // Data for inactive and active feeds
  const inactiveOperators = filteredOperators.filter(o => !o.feedMonitoring?.feedStatus);
  const activeOperators = filteredOperators.filter(o => o.feedMonitoring?.feedStatus);

  return (
    <BaseLayout title="Dashboard - Analyse Bus Open Data">
      <div className="app-page feed-monitoring-page">
        <h1 className="govuk-heading-xl app-page-header">NOC feed monitoring</h1>
        <div className="govuk-form-group">
          <label className="govuk-label">
            Search for an operator
          </label>
          <input
            className="govuk-input govuk-input--width-20"
            id="operator-search"
            type="text"
            value={operatorSearch}
            onChange={(e) => setOperatorSearch(e.target.value)}
          />
        </div>
        {isLoading ? (
          // TODO:NOW Make a loading page that looks nicer than this and is reusable across the app
          <p className="govuk-body">Loading...</p>
          
        ) : (
          <>
            <FeedSummaryGrid title="Inactive feeds" active={false} operators={inactiveOperators} />
            <FeedSummaryGrid title="Active feeds" active={true} operators={activeOperators} />
          </>
        )}
      </div>
    </BaseLayout>
  );
}
export default FeedMonitoringPage;
