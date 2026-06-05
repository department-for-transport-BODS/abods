import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { DateTime } from "luxon";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { useConfig } from "@/contexts/ConfigContext";
import { feedMonitoringService } from "@/services/feed-monitoring/feed-monitoring.services";
import {
  FeedMonitoringListQuery,
  OperatorHistoricStatsQuery,
} from "../../../src/generated/graphql";
import { Box } from "@/components/shared/Box";
import { SummaryStatWithTooltip } from "@/components/shared/SummaryStatWithTooltip";
import { OperatorDropdown } from "@/components/feed-monitoring/OperatorDropdown";
import { DateNavigationDayBlocks } from "@/components/shared/DateNavigationDayBlocks";
import { useRequireAuth } from "@/hooks/useAuth";

const HistoricVehicleStats = dynamic(
  () => import("@/components/feed-monitoring/HistoricVehicleStats"),
  { ssr: false },
);

type FeedMonitoringOperatorData =
  FeedMonitoringListQuery["operatorsFeedMonitoring"][number];
type OperatorFeedHistory = OperatorHistoricStatsQuery["operatorFeedMonitoring"];

function buildDateList(): { date: DateTime }[] {
  const yesterday = DateTime.now().startOf("day").minus({ days: 1 });
  const startDate = yesterday.minus({ months: 3 }).plus({ days: 1 });
  const days = Math.floor(yesterday.diff(startDate, "days").days) + 1;
  return Array.from({ length: days }, (_, i) => ({
    date: startDate.plus({ days: i }),
  }));
}

function formatAvailability(f?: number | null): string {
  if (f === undefined || f === null) return "0.00%";
  return `${(f * 100).toFixed(2)}%`;
}

function formatUpdateFrequency(f?: number | null): string {
  return f ? `${f}s` : "-";
}

const FeedHistoryPage = () => {
  useRequireAuth();

  const router = useRouter();

  const { nocCode, date } = (router.query ?? {}) as {
    nocCode?: string;
    date?: string;
  };

  const yesterday = DateTime.now().startOf("day").minus({ days: 1 });
  const baseDate =
    date && DateTime.fromISO(date).isValid
      ? DateTime.fromISO(date).startOf("day")
      : yesterday;
  const formattedDate = baseDate.toFormat("d MMMM yyyy");

  const prevDate = baseDate.minus({ days: 1 });
  const nextDate = baseDate.plus({ days: 1 });
  const isNextDisabled = nextDate > yesterday;

  const { config } = useConfig();
  const [operators, setOperators] = useState<FeedMonitoringOperatorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateList, setDateList] = useState<{ date: DateTime }[]>([]);
  const [operatorHistory, setOperatorHistory] =
    useState<OperatorFeedHistory | null>(null);
  const [historicalDataLoading, setHistoricalDataLoading] = useState(false);
  const [chartErrored, setChartErrored] = useState(false);
  const [noData, setNoData] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const feedMonitoringData =
          await feedMonitoringService.fetchFeedMonitoringList();
        setOperators(feedMonitoringData);
      } catch (err) {
        console.error("Failed to load feed monitoring list data:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Fetch historical operator stats for selected date
  useEffect(() => {
    // Create date array for DateNavigation component
    setDateList(buildDateList());

    if (!nocCode || !baseDate.isValid) return;
    setHistoricalDataLoading(true);
    setChartErrored(false);
    setNoData(false);

    const start = baseDate.startOf("day").toISO()!;
    const end = baseDate.endOf("day").toISO()!;

    const load = async () => {
      try {
        const operatorHistoryData =
          await feedMonitoringService.fetchOperatorHistory(
            nocCode,
            baseDate.toISODate()!,
            start,
            end,
          );
        setHistoricalDataLoading(false);
        if (!operatorHistoryData) {
          setChartErrored(true);
        } else if (
          (operatorHistoryData.feedMonitoring?.vehicleStats?.length ?? 0) === 0
        ) {
          setNoData(true);
        }
        setOperatorHistory(operatorHistoryData);
      } catch (err) {
        console.error("Failed to load operator history data:", err);
        setHistoricalDataLoading(false);
        setChartErrored(true);
      }
    };
    load();
  }, [nocCode, date]);

  if (isLoading) {
    return (
      <BaseLayout title="Dashboard - Analyse Bus Open Data">
        <div className="app-page feed-monitoring-page">
          <p className="govuk-body">Loading...</p>
        </div>
      </BaseLayout>
    );
  }

  const vehicleStats = operatorHistory?.feedMonitoring?.vehicleStats ?? [];
  const availability =
    operatorHistory?.feedMonitoring?.historicalStats?.availability;
  const updateFrequency =
    operatorHistory?.feedMonitoring?.historicalStats?.updateFrequency;

  return (
    <BaseLayout title="Dashboard - Analyse Bus Open Data">
      <div className="app-page feed-monitoring-page">
        <div>
          <a href={`/feed-monitoring/${nocCode}`} className="govuk-back-link">
            Live status
          </a>
          {error && (
            <div
              className="govuk-error-summary"
              role="alert"
              aria-labelledby="error-summary-title"
            >
              <h2
                className="govuk-error-summary__title"
                id="error-summary-title"
              >
                There is a problem
              </h2>
              <div className="govuk-error-summary__body">
                <p className="govuk-body">
                  There was a problem loading the feed history data. Please try
                  refreshing the page.
                </p>
              </div>
            </div>
          )}
          <span className="govuk-caption-xl">NOC feed monitoring</span>
          <h1
            className="app-page-header font-bold"
            style={{ fontSize: "48px" }}
          >
            Feed history
          </h1>
          <div className="flex items-baseline gap-4">
            <span
              className="govuk-body"
              style={{ color: "#484949", fontSize: "24px" }}
            >{`Operator`}</span>
            <OperatorDropdown
              operators={operators}
              currentNocCode={nocCode ?? ""}
              pageLink={`/feed-monitoring/[nocCode]/feed-history?date=${date ?? ""}`}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-8">
          <span className="font-bold" style={{ fontSize: "24px" }}>
            {formattedDate}
          </span>
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
                style={{
                  fontWeight: "bold",
                  fontSize: "16px",
                  color: "#b1b4b6",
                  pointerEvents: "none",
                  cursor: "not-allowed",
                }}
              >
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
        <DateNavigationDayBlocks
          dateArray={dateList}
          selectedDate={baseDate}
          onDateSelected={(selectedDate) => {
            router.push(
              `/feed-monitoring/${nocCode}/feed-history?date=${selectedDate.toISODate()}`,
            );
          }}
        />
        <div className="mt-4">
          {historicalDataLoading && (
            <Box minHeight="385px">
              <p className="govuk-body">Loading...</p>
            </Box>
          )}
          {!historicalDataLoading && chartErrored && (
            <Box minHeight="385px">
              <p className="govuk-body">
                There was an error loading the chart data, please try again.
              </p>
            </Box>
          )}
          {!historicalDataLoading && noData && (
            <Box minHeight="385px">
              <p className="govuk-body">No data found for the date selected.</p>
            </Box>
          )}
          {!historicalDataLoading &&
            !chartErrored &&
            !noData &&
            vehicleStats.length > 0 && (
              <Box>
                <HistoricVehicleStats data={vehicleStats} date={baseDate} />
              </Box>
            )}
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6">
          <SummaryStatWithTooltip
            title="Feed availability"
            value={
              historicalDataLoading ? "-" : formatAvailability(availability)
            }
            tooltip="The percentage of the day the feed was active when vehicles were expected to be running"
          />
          <SummaryStatWithTooltip
            title="Average update frequency"
            value={
              historicalDataLoading
                ? "-"
                : formatUpdateFrequency(updateFrequency)
            }
          />
        </div>
      </div>
    </BaseLayout>
  );
};
export default FeedHistoryPage;
