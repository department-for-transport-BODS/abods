import { useEffect, useMemo, useState } from "react";
import { LinkWithArrow } from "@/components/shared/LinkWithArrow";
import { DateTime } from "luxon";
import { useConfig } from "@/contexts/ConfigContext";
import { dashboardService } from "@/services/dashboard/dashboard.service";
import {
  OperatorDashboard,
  PerformanceFiltersInputType,
  PunctualityOverview,
  RankingOrder,
  ServicePunctuality,
} from "@/types/dashboard";
import { calculatePresetPeriod, Period } from "@/utils/dateRange";
import { PerformanceRankingTable } from "@/components/dashboard/PerformanceRankingTable";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";

interface PerformanceWidgetProps {
  filters: PerformanceFiltersInputType;
  operators: OperatorDashboard[];
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
  const [services, setServices] = useState<ServicePunctuality[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [order, setOrder] = useState<RankingOrder>("descending");

  const window = useMemo(
    () => calculatePresetPeriod(period, DateTime.local()),
    [period],
  );

  useEffect(() => {
    if (!config?.apiUrl) return;
    const load = async () => {
      setLoaded(false);
      setErrored(false);
      try {
        const result = await dashboardService.fetchPunctualityStats(
          config.apiUrl,
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
  }, [config?.apiUrl, filters, window.from, window.to]);

  useEffect(() => {
    if (!config?.apiUrl) return;
    const load = async () => {
      setServicesLoaded(false);
      try {
        const result = await dashboardService.fetchServiceRanking(
          config.apiUrl,
          filters,
          window.from,
          window.to,
          order,
          window.trendFrom,
          window.trendTo,
        );
        setServices(result);
      } finally {
        setServicesLoaded(true);
      }
    };
    load();
  }, [
    config?.apiUrl,
    filters,
    window.from,
    window.to,
    window.trendFrom,
    window.trendTo,
    order,
  ]);

  return (
    <div>
      {!loaded ? (
        <div className="performance__no-data">
          <span className="govuk-body">Loading...</span>
        </div>
      ) : !stats && !errored ? (
        <div className="performance__no-data">
          <span className="govuk-body">
            No punctuality data for the selected time period
          </span>
        </div>
      ) : !stats && errored ? (
        <div className="performance__no-data">
          <span className="govuk-body">
            There was an error fetching the punctuality data
          </span>
        </div>
      ) : (
        <div className="performance__chart">
          <PerformanceChart data={stats ?? { onTime: 0, early: 0, late: 0 }} />
        </div>
      )}

      <PerformanceRankingTable
        services={services}
        loaded={servicesLoaded}
        nocCode={nocCode}
        operators={operators}
        order={order}
        onChangeOrder={setOrder}
        trendFrom={window.trendFrom}
        trendTo={window.trendTo}
        periodLabel={periodLabelMap[period]}
      />

      <div className="performance__footer">
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
        <div className="performance__link">
          <LinkWithArrow href={nocCode ? `/on-time/${nocCode}` : "/on-time"}>
            On-time performance
          </LinkWithArrow>
        </div>
      </div>
    </div>
  );
};
