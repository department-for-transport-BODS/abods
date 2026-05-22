import { useEffect, useMemo, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { FeedTable } from "@/components/feed-monitoring/FeedTable";
import { useConfig } from "@/contexts/ConfigContext";
import { feedMonitoringService } from "@/services/feed-monitoring/feed-monitoring.services";
import { FeedMonitoringOperatorData, VehicleCountData } from "@/types/feed-monitoring";

const FeedMonitoringPage = () => {
  const { config } = useConfig();
  const [operatorData, setOperatorData] = useState<FeedMonitoringOperatorData[]>([]);
  const [vehicleCountData, setVehicleCountData] = useState<VehicleCountData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [operatorSearch, setOperatorSearch] = useState("");

  useEffect(() => {
    if (!config?.apiUrl) {
      setOperatorData([]);
      setIsLoading(false);
      return;
    }
    // TODO:NOW: Add try catch and error handling
    const load = async () => {
      setIsLoading(true);
      const data = await feedMonitoringService.fetchFeedMonitoringList(config.apiUrl);
      const vehicleData = await feedMonitoringService.fetchOperatorSparklines(config.apiUrl, data.map(d => d.operatorId));
      setOperatorData(data);
      setVehicleCountData(vehicleData);
      setIsLoading(false);
    };
    load();
  }, [config]);

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
          <p className="govuk-body">Loading...</p>
          
        ) : (
          <>
            <FeedTable title="Inactive feeds" active={false} data={inactiveOperators} vehicleCountData={vehicleCountData} />
            <FeedTable title="Active feeds" active={true} data={activeOperators} vehicleCountData={vehicleCountData} />
          </>
        )}
      </div>
    </BaseLayout>
  );
}
export default FeedMonitoringPage;
