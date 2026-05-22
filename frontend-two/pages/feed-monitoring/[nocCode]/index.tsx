import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useConfig } from "@/contexts/ConfigContext";
import { feedMonitoringService } from "@/services/feed-monitoring/feed-monitoring.services";
import { FeedMonitoringOperatorData, OperatorLiveStatus } from "@/types/feed-monitoring";
import { Box } from "@/components/shared/Box";
import { SummaryStatWithTooltip } from "@/components/shared/SummaryStatWithTooltip";
import { FeedStatusSummaryStat } from "@/components/feed-monitoring/FeedStatusSummaryStat";
import { OperatorDropdown } from "@/components/feed-monitoring/OperatorDropdown";
import dynamic from "next/dynamic";
const LiveVehicleStats = dynamic(() => import("@/components/feed-monitoring/LiveVehicleStats"), { ssr: false });

const LiveStatusPage = () => {
    const router = useRouter();
    const { nocCode } = router.query as { nocCode: string};
    const { config } = useConfig();
    
    const [operator, setOperator] = useState<OperatorLiveStatus | null>(null);
    const [operators, setOperators] = useState<FeedMonitoringOperatorData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!config?.apiUrl) {
        setOperators([]);
        setOperator(null);
        setIsLoading(false);
        return;
      }
      const load = async () => {
        setIsLoading(true);
        try {
          const feedMonitoringData = await feedMonitoringService.fetchFeedMonitoringList(config.apiUrl);
          const operatorLiveStatusData = await feedMonitoringService.fetchOperatorLiveStatus(config.apiUrl, nocCode);
          setOperators(feedMonitoringData);
          setOperator(operatorLiveStatusData);
        } catch (err) {
          console.error("Failed to load live status data:", err);
        } finally {
          setIsLoading(false);
        }
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
                <div className="min-w-0">
                    <FeedStatusSummaryStat
                    title="Feed status"
                    value={operator?.feedMonitoring?.feedStatus != null
                        ? (operator.feedMonitoring.feedStatus ? "Active" : "Inactive")
                        : "-"}
                    />
                </div>
                <div className="min-w-0">
                    <SummaryStatWithTooltip
                    title="Current vehicles"
                    value={operator?.feedMonitoring?.liveStats?.currentVehicles ?? "-"}
                    tooltip="Current number of vehicles running that we can match to the timetables uploaded to BODS"
                    />
                </div>
                <div className="min-w-0">
                    <SummaryStatWithTooltip
                    title="Expected vehicles"
                    value={operator?.feedMonitoring?.liveStats?.expectedVehicles ?? "-"}
                    tooltip="The number of vehicles based that should be running now according to the timetables uploaded to BODS"
                    />
                </div>
                <div className="min-w-0">
                    <SummaryStatWithTooltip
                    title="Update frequency"
                    value={operator?.feedMonitoring?.liveStats?.updateFrequency
                        ? `${operator.feedMonitoring.liveStats.updateFrequency}s`
                        : "-"}
                    tooltip="Average update frequency is calculated over the last 24 hour period"
                    />
                </div>
            </div>
            {operator?.feedMonitoring?.feedStatus === false && (
                <div className="govuk-inset-text">
                    If the number of expected vehicles is zero and you were expecting vehicles, please check your BODS timetables are up to date <a href="https://www.bus-data.service.gov.uk/timetables" className="govuk-link">here</a>.
                </div>
            )}
            <div className="mt-8">
                <Box>
                    <div className="live-vehicle-stats__container">
                        <div className="live-vehicle-stats__item">
                            <LiveVehicleStats
                                data={operator?.feedMonitoring?.liveStats?.last24Hours ?? []}
                                granularity="hour"
                                label="Last 24 hours"
                                xAxisMin={(() => {
                                    const now = new Date();
                                    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
                                })()}
                                xAxisMax={new Date()}
                            />
                        </div>
                        <div className="live-vehicle-stats__item mt-8">
                            <LiveVehicleStats
                                data={operator?.feedMonitoring?.liveStats?.last20Minutes ?? []}
                                granularity="minute"
                                label="Last 20 minutes"
                                xAxisMin={(() => {
                                    const now = new Date();
                                    return new Date(now.getTime() - 20 * 60 * 1000);
                                })()}
                                xAxisMax={new Date()}
                            />
                        </div>
                    </div>
                </Box>
            </div>
        </div>
        </BaseLayout>
    );
}
export default LiveStatusPage;
