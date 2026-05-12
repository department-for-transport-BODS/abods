import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useConfig } from "@/contexts/ConfigContext";
import { feedMonitoringService } from "@/services/feed-monitoring/feed-monitoring.services";
import { FeedMonitoringOperator, OperatorLiveStatus } from "@/types/feed-monitoring";
import { Box } from "@/components/shared/Box";
import { SummaryStat } from "@/components/shared/SummaryStat";
import { FeedStatusSummaryStat } from "@/components/feed-monitoring/FeedStatusSummaryStat";
import { OperatorDropdown } from "@/components/feed-monitoring/OperatorDropdown";

const NocFeedPage = () => {
    const router = useRouter();
    const { nocCode } = router.query as { nocCode: string};

    const { config } = useConfig();
    const [operator, setOperator] = useState<OperatorLiveStatus | null>(null);
    const [operators, setOperators] = useState<FeedMonitoringOperator[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!config?.apiUrl) {
        setIsLoading(false);
        console.error("API URL is not configured");
        return;
      }
      feedMonitoringService.fetchFeedMonitoringList(config.apiUrl).then(setOperators);
    }, [config]);

    useEffect(() => {
      if (!config?.apiUrl) return;
      if (!nocCode) return;
      const load = async () => {
        setIsLoading(true);
        const data = await feedMonitoringService.fetchOperatorLiveStatus(config.apiUrl, nocCode);
        setOperator(data);
        setIsLoading(false);
      };
  
      load();
    }, [config, nocCode]);
  
    if (isLoading) {
        return (
        <BaseLayout title="Dashboard - Analyse Bus Open Data">
            <div className="app-page feed-monitoring-page">
            <p className="govuk-body">Loading...</p>
            </div>
        </BaseLayout>
        );
    }

    return (
        <BaseLayout title="Dashboard - Analyse Bus Open Data">
        <div className="app-page feed-monitoring-page">
            <div>
                <a href="/feed-monitoring" className="govuk-back-link">All operators</a>
                <span className="govuk-caption-xl">NOC feed monitoring</span>
                <h1 className="app-page-header font-bold" style={{fontSize: "48px"}}>Live status</h1>
                <div className="flex items-baseline gap-4">
                    <span className="govuk-body" style={{ color: "#484949", fontSize: "24px" }}>{`Operator`}</span>
                    <OperatorDropdown operators={operators} currentNocCode={nocCode} pageLink="/feed-monitoring/[nocCode]" />
                </div>
            </div>
            <div className="flex items-center justify-between mt-8">
                <span style={{fontSize: "24px"}}>{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                <a href={`/feed-monitoring/${nocCode}/feed-history?date=${new Date(Date.now() - 86400000).toISOString().split("T")[0]}`} className="govuk-link" style={{fontSize: "20px"}}>View feed history</a>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-6">
                <FeedStatusSummaryStat title="Feed status" value={operator?.feedMonitoring?.feedStatus != null ? (operator.feedMonitoring.feedStatus ? "Active" : "Inactive") : "-"} />
                <SummaryStat title="Current vehicles" value={operator?.feedMonitoring?.liveStats?.currentVehicles ?? "-"} tooltip="Current number of vehicles running that we can match to the timetables uploaded to BODS" />
                <SummaryStat title="Expected vehicles" value={operator?.feedMonitoring?.liveStats?.expectedVehicles ?? "-"} tooltip="The number of vehicles based that should be running now according to the timetables uploaded to BODS" />
                <SummaryStat title="Update frequency" value={operator?.feedMonitoring?.liveStats?.updateFrequency ? `${operator.feedMonitoring.liveStats.updateFrequency}s` : "-"} tooltip="Average update frequency is calculated over the last 24 hour period" />
            </div>
            {/* TODO:NOW: Add graph */}
            <div className="mt-8">
                <Box children={undefined} />
            </div>
        </div>
        </BaseLayout>
    );
}
export default NocFeedPage;
