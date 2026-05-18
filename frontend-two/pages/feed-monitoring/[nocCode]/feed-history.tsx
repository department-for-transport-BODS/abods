import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DateTime } from "luxon";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useConfig } from "@/contexts/ConfigContext";
import { feedMonitoringService } from "@/services/feed-monitoring/feed-monitoring.services";
import { FeedMonitoringOperatorData, EventStat } from "@/types/feed-monitoring";
import { Box } from "@/components/shared/Box";
import { SummaryStatWithTooltip } from "@/components/shared/SummaryStatWithTooltip";
import { OperatorDropdown } from "@/components/feed-monitoring/OperatorDropdown";
import { DateNavigationDayBlocks } from "@/components/shared/DateNavigationDayBlocks";
import { DateNavigationHeatmapItem } from "@/types";

// TODO:NOW Check imports are in consistent order across files

function buildHeatmap(stats: EventStat[]): DateNavigationHeatmapItem[] {
  const max = Math.max(...stats.map(({ count }) => count ?? 0));
  return stats.map(({ count, day }) => ({
    date: DateTime.fromISO(day).startOf("day"),
    heat: count && max > 0 ? Math.ceil((count / max) * 6) : 0,
  }));
}

const FeedHistoryPage = () => {
    const router = useRouter();

    const { nocCode, date } = router.query as { nocCode: string; date?: string };

    const yesterday = DateTime.now().startOf("day").minus({ days: 1 });
    const baseDate = date && DateTime.fromISO(date).isValid
        ? DateTime.fromISO(date).startOf("day")
        : yesterday;
    const formattedDate = baseDate.toFormat("d MMMM yyyy");

    const prevDate = baseDate.minus({ days: 1 });
    const nextDate = baseDate.plus({ days: 1 });
    const isNextDisabled = nextDate > yesterday;

    const { config } = useConfig();
    const [operators, setOperators] = useState<FeedMonitoringOperatorData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [alertStats, setAlertStats] = useState<DateNavigationHeatmapItem[]>([]);
    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
      if (!config?.apiUrl) {
        setIsLoading(false);
        console.error("API URL is not configured");
        return;
      }
      feedMonitoringService.fetchFeedMonitoringList(config.apiUrl).then((data) => {
        setOperators(data);
        setIsLoading(false);
      });
    }, [config]);

    // Fetch alert stats (heatmap) for the last 28 days up to yesterday
    useEffect(() => {
      if (!config?.apiUrl || !nocCode) return;
      const end = yesterday.endOf("day");
      const start = end.minus({ days: 27 }).startOf("day");
      setStatsLoading(true);
      feedMonitoringService
        .fetchEventStats(config.apiUrl, nocCode, start.toISO()!, end.toISO()!)
        .then((stats) => {
          setAlertStats(buildHeatmap(stats));
          setStatsLoading(false);
        });
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
                <div className="flex gap-8">
                    <a
                        href={`/feed-monitoring/${nocCode}/feed-history?date=${prevDate.toISODate()}`}
                        className="govuk-link"
                        style={{ fontWeight: "bold", fontSize: "16px" }}
                    >
                        ‹ Previous
                    </a>
                    {isNextDisabled ? (
                        <span 
                            className="govuk-link govuk-link--disabled" 
                            style={{ fontWeight: "bold", fontSize: "16px", color: "#b1b4b6", pointerEvents: "none", cursor: "not-allowed" }}>
                            Next ›
                        </span>
                    ) : (
                        <a
                            href={`/feed-monitoring/${nocCode}/feed-history?date=${nextDate.toISODate()}`}
                            className="govuk-link"
                            style={{ fontWeight: "bold", fontSize: "16px" }}
                        >
                            Next ›
                        </a>
                    )}
                </div>
            </div>
            {statsLoading ? (
                <div className="datenav__day-blocks mt-4" style={{ height: 57 }} />
            ) : (
                <DateNavigationDayBlocks
                    stats={alertStats}
                    date={baseDate}
                    onDateSelected={(selectedDate) => {
                        router.push(`/feed-monitoring/${nocCode}/feed-history?date=${selectedDate.toISODate()}`);
                    }}
                />
            )}
            <div className="mt-8">
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
