import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useConfig } from "@/contexts/ConfigContext";
import { feedMonitoringService } from "@/services/feed-monitoring/feed-monitoring.services";
import { FeedMonitoringOperatorData } from "@/types/feed-monitoring";
import { Box } from "@/components/shared/Box";
import { SummaryStatWithTooltip } from "@/components/shared/SummaryStatWithTooltip";
import { OperatorDropdown } from "@/components/shared/OperatorDropdown";

// TODO:NOW Check imports are in consistent order across files

const FeedHistoryPage = () => {
    const router = useRouter();
    const { nocCode, date } = router.query as { nocCode: string; date?: string };
    const formattedDate = date ? new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

    const { config } = useConfig();
    const [operators, setOperators] = useState<FeedMonitoringOperatorData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!config?.apiUrl) {
        setIsLoading(false);
        console.error("API URL is not configured");
        return;
      }
      feedMonitoringService.fetchFeedMonitoringList(config.apiUrl).then(setOperators);
    }, [config]);

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
            <a href={`/feed-monitoring/${nocCode}`} className="govuk-back-link">Live status</a>
            <span className="govuk-caption-xl">NOC feed monitoring</span>
            <h1 className="app-page-header font-bold" style={{fontSize: "48px"}}>Feed history</h1>
            <div className="flex items-baseline gap-4">
                <span className="govuk-body" style={{ color: "#484949", fontSize: "24px" }}>{`Operator`}</span>
                <OperatorDropdown operators={operators} currentNocCode={nocCode} pageLink={`/feed-monitoring/[nocCode]/feed-history?date=${date ?? ""}`} />
            </div>
            </div>
            <div className="flex items-center justify-between mt-8">
            <span className ="font-bold" style={{fontSize: "24px"}}>{formattedDate}</span>
            {/* TODO:NOW: Add prev and next buttons */}
            </div>
            {/* TODO:NOW: Add graph */}
            <div className="mt-8">
            <Box children={undefined} />
            <Box children={undefined} />
            </div>
            <div className="grid grid-cols-4 gap-4 mt-6">
                <SummaryStatWithTooltip title="Feed availability" value="-" tooltip="The percentage of the day the feed was active when vehicles were expected to be running" />
                <SummaryStatWithTooltip title="Average update frequency" value="-" />
            </div>
        </div>
        </BaseLayout>
    );
}
export default FeedHistoryPage;
