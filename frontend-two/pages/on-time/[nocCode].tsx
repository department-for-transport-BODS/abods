import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
import DayOfWeekChart from "@/components/on-time/DayOfWeekChart";
import { JsonSection } from "@/components/on-time/JsonSection";
import { useConfig } from "@/contexts/ConfigContext";
import { useRequireAuth } from "@/hooks/useAuth";
import { headwayService } from "@/services/on-time/headway.service";
import {
  DayOfWeekData,
  PunctualityOverview,
  ServicePerformance,
  TimeOfDayData,
  TimeSeriesData,
  onTimeService,
} from "@/services/on-time/on-time.service";
import { buildDefaultParams } from "@/services/on-time/params";
import { settle } from "@/utils/settle";
import {
  FrequentServicePerformance,
  performanceService,
} from "@/services/on-time/performance.service";
import {
  DelayFrequencyType,
  HeadwayOverviewType,
  HeadwayTimeSeriesType,
} from "../../src/generated/graphql";

interface OperatorOnTimeData {
  overview: { onTime?: PunctualityOverview; headway?: HeadwayOverviewType };
  delayFrequency: DelayFrequencyType[];
  timeSeries: TimeSeriesData[];
  timeOfDay: TimeOfDayData[];
  dayOfWeek: DayOfWeekData[];
  servicePerformance: FrequentServicePerformance[];
  servicePerformancePlain: ServicePerformance[];
  headwayTimeSeries: HeadwayTimeSeriesType[];
}

const OnTimeOperatorPage = () => {
  useRequireAuth();
  const router = useRouter();
  const { config } = useConfig();
  const nocCode =
    typeof router.query.nocCode === "string" ? router.query.nocCode : null;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Partial<OperatorOnTimeData>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!config?.apiUrl || !nocCode) return;
    const load = async () => {
      setIsLoading(true);
      const params = buildDefaultParams({ nocCode });

      const [
        overview,
        delayFrequency,
        timeSeries,
        timeOfDay,
        dayOfWeek,
        servicePerformancePlain,
        servicePerformance,
        headwayTimeSeries,
      ] = await Promise.all([
        settle(performanceService.fetchOverviewStats(params)),
        settle(onTimeService.fetchOnTimeDelayFrequencyData(params)),
        settle(onTimeService.fetchOnTimeTimeSeriesData(params)),
        settle(onTimeService.fetchOnTimePunctualityTimeOfDayData(params)),
        settle(onTimeService.fetchOnTimePunctualityDayOfWeekData(params)),
        settle(onTimeService.fetchOnTimePerformanceList(params)),
        settle(performanceService.fetchServicePerformance(params)),
        settle(headwayService.fetchTimeSeries(params)),
      ]);

      setData({
        overview: overview.data ?? undefined,
        delayFrequency: delayFrequency.data ?? [],
        timeSeries: timeSeries.data ?? [],
        timeOfDay: timeOfDay.data ?? [],
        dayOfWeek: dayOfWeek.data ?? [],
        servicePerformancePlain: servicePerformancePlain.data ?? [],
        servicePerformance: servicePerformance.data ?? [],
        headwayTimeSeries: headwayTimeSeries.data ?? [],
      });
      setErrors({
        overview: overview.error,
        delayFrequency: delayFrequency.error,
        timeSeries: timeSeries.error,
        timeOfDay: timeOfDay.error,
        dayOfWeek: dayOfWeek.error,
        servicePerformancePlain: servicePerformancePlain.error,
        servicePerformance: servicePerformance.error,
        headwayTimeSeries: headwayTimeSeries.error,
      });
      setIsLoading(false);
    };
    load();
  }, [config, nocCode]);

  if (!nocCode) {
    return (
      <BaseLayout title="On-time performance - Analyse Bus Open Data">
        <p className="govuk-body">Loading...</p>
      </BaseLayout>
    );
  }

  const firstLineId = data.servicePerformancePlain?.[0]?.lineId;

  return (
    <BaseLayout title={`On-time performance: ${nocCode}`}>
      <p className="govuk-body">
        <Link href="/on-time" className="govuk-link">
          &larr; All operators
        </Link>
      </p>
      <h1 className="govuk-heading-xl">On-time performance: {nocCode}</h1>
      <p className="govuk-body">
        Skeleton operator view. Data is fetched via the migrated on-time,
        headway and performance services and shown as JSON for verification.
      </p>
      {firstLineId ? (
        <p className="govuk-body">
          Drill in to a service:{" "}
          <Link
            className="govuk-link"
            href={`/on-time/${encodeURIComponent(nocCode)}/${encodeURIComponent(firstLineId)}`}
          >
            {firstLineId}
          </Link>
        </p>
      ) : null}

      {isLoading ? (
        <p className="govuk-body">Loading on-time data...</p>
      ) : (
        <>
          <JsonSection
            title="performanceService.fetchOverviewStats"
            description="Combined on-time stats + headway overview (headway only when line filters present)."
            data={data.overview}
            error={errors.overview}
          />
          <JsonSection
            title="onTimeService.fetchOnTimeDelayFrequencyData"
            data={data.delayFrequency}
            error={errors.delayFrequency}
          />
          <JsonSection
            title="onTimeService.fetchOnTimeTimeSeriesData"
            data={data.timeSeries}
            error={errors.timeSeries}
          />
          <JsonSection
            title="onTimeService.fetchOnTimePunctualityTimeOfDayData"
            data={data.timeOfDay}
            error={errors.timeOfDay}
          />
          {errors.dayOfWeek ? (
            <p className="govuk-error-message">
              <span className="govuk-visually-hidden">Error:</span>{" "}
              {errors.dayOfWeek}
            </p>
          ) : (
            <DayOfWeekChart data={data.dayOfWeek ?? []} />
          )}
          <JsonSection
            title="onTimeService.fetchOnTimePerformanceList"
            data={data.servicePerformancePlain}
            error={errors.servicePerformancePlain}
          />
          <JsonSection
            title="performanceService.fetchServicePerformance"
            description="onTimePerformanceList merged with headway frequentServices to set `frequent` flag."
            data={data.servicePerformance}
            error={errors.servicePerformance}
          />
          <JsonSection
            title="headwayService.fetchTimeSeries"
            data={data.headwayTimeSeries}
            error={errors.headwayTimeSeries}
          />
        </>
      )}
    </BaseLayout>
  );
};

export default OnTimeOperatorPage;
