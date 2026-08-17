import { clsx } from "clsx";
import styles from "./performance-widget.module.scss";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { LinkWithArrow } from "@/components/shared/LinkWithArrow";
import { Spinner } from "@/components/shared/Spinner";
import { DateTime } from "luxon";
import { useConfig } from "@/contexts/ConfigContext";
import { dashboardService } from "@/services/dashboard/dashboard.service";
import { PunctualityOverview, ServiceRankingResult } from "@/types/dashboard";
import { calculatePresetPeriod, Period } from "@/utils/date-range";
import { PerformanceRankingTable } from "@/components/dashboard/PerformanceRankingTable";
import {
  DashboardOperatorListQuery,
  PerformanceFiltersInputType,
  RankingOrder,
  ServicePunctualityType,
} from "../../src/generated/graphql";

const PerformanceChart = dynamic(
  () => import("@/components/dashboard/PerformanceChart"),
  { ssr: false },
);

interface PerformanceWidgetProps {
  filters: PerformanceFiltersInputType;
  operators: DashboardOperatorListQuery["operatorsFeedMonitoring"];
  nocCode: string | null;
}

const periodOptions: { value: Period; label: string }[] = [
  { value: "last7", label: "Last 7 days" },
  { value: "last28", label: "Last 28 days" },
  { value: "monthToDate", label: "Month to date" },
  { value: "lastMonth", label: "Last month" },
];

const periodLabelMap: Record<Period, string> = {
  last7: "previous 7 days",
  last28: "previous 28 days",
  lastMonth: "previous month",
  monthToDate: "equivalent period last month",
};

export const PerformanceWidget = ({
  filters,
  operators,
  nocCode,
}: PerformanceWidgetProps) => {
  const { config } = useConfig();
  const [period, setPeriod] = useState<Period>("last7");
  const [stats, setStats] = useState<PunctualityOverview | null>(null);
  const [services, setServices] = useState<ServiceRankingResult>([]);
  const [loaded, setLoaded] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [servicesErrored, setServicesErrored] = useState(false);
  const [errored, setErrored] = useState(false);
  const [order, setOrder] = useState<RankingOrder>(RankingOrder.Descending);

  const window = useMemo(
    () => calculatePresetPeriod(period, DateTime.local()),
    [period],
  );

  useEffect(() => {
    if (!config?.apiUrl) {
      setStats(null);
      setErrored(false);
      setLoaded(true);
      return;
    }
    const load = async () => {
      setLoaded(false);
      setErrored(false);
      try {
        const result = await dashboardService.fetchPunctualityStats(
          filters,
          window.from,
          window.to,
        );
        if (result && !result.early && !result.late && !result.onTime) {
          setStats(null);
        } else {
          setStats(result);
        }
      } catch {
        setErrored(true);
        setStats(null);
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, [config, filters, window.from, window.to]);

  useEffect(() => {
    if (!config?.apiUrl) {
      setServices([]);
      setServicesErrored(false);
      setServicesLoaded(true);
      return;
    }
    const load = async () => {
      setServicesLoaded(false);
      setServicesErrored(false);
      try {
        const result = await dashboardService.fetchServiceRanking(
          filters,
          window.from,
          window.to,
          order,
          window.trendFrom,
          window.trendTo,
        );
        setServices(result);
      } catch {
        setServices([]);
        setServicesErrored(true);
      } finally {
        setServicesLoaded(true);
      }
    };
    load();
  }, [
    config,
    filters,
    window.from,
    window.to,
    window.trendFrom,
    window.trendTo,
    order,
  ]);

  return (
    <div className="performance app-performance">
      {!loaded ? (
        <div className={clsx(styles["performance__no-data"], styles["performance__no-data--loading"])}>
          <Spinner size="default" message="Loading..." />
        </div>
      ) : !stats && !errored ? (
        <div className={styles["performance__no-data"]}>
          <span className="govuk-body">
            No punctuality data for the selected time period
          </span>
        </div>
      ) : !stats && errored ? (
        <div className={styles["performance__no-data"]}>
          <span className="govuk-body">
            There was an error fetching the punctuality data
          </span>
        </div>
      ) : (
        <div className={styles.performance__chart}>
          <PerformanceChart
            data={stats ?? { onTime: 0, early: 0, late: 0 }}
            chartId="performance-chart"
          />
        </div>
      )}

      <PerformanceRankingTable
        services={services}
        loaded={servicesLoaded}
        errored={servicesErrored}
        nocCode={nocCode}
        operators={operators}
        order={order}
        onChangeOrder={setOrder}
        trendFrom={window.trendFrom}
        trendTo={window.trendTo}
        periodLabel={periodLabelMap[period]}
      />

      <div className={styles.performance__footer}>
        <select
          value={period}
          className="govuk-select"
          id="period"
          name="period"
          onChange={(event) => setPeriod(event.target.value as Period)}
          aria-label="period"
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className={styles.performance__link}>
          <LinkWithArrow href={nocCode ? `/on-time/${nocCode}` : "/on-time"}>
            On-time performance
          </LinkWithArrow>
        </div>
      </div>
    </div>
  );
};
