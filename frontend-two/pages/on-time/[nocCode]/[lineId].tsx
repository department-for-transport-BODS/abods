import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { JsonSection } from "@/components/on-time/JsonSection";
import { useConfig } from "@/contexts/ConfigContext";
import { useRequireAuth } from "@/hooks/useAuth";
import { headwayService } from "@/services/on-time/headway.service";
import {
  StopPerformance,
  onTimeService,
} from "@/services/on-time/on-time.service";
import { buildDefaultParams } from "@/services/on-time/params";
import {
  NormalizedStop,
  stopPerformanceService,
} from "@/services/on-time/stop-performance.service";
import {
  ServicePattern,
  transitModelService,
} from "@/services/on-time/transit-model.service";
import { settle } from "@/utils/settle";
import {
  FrequentServiceInfoType,
  ServiceInfoType,
} from "../../../src/generated/graphql";

interface ServiceLevelData {
  serviceInfo: ServiceInfoType | null;
  stopPerformance: StopPerformance[];
  servicePatterns: ServicePattern[];
  mergedStops: NormalizedStop[];
  frequentServiceInfo: FrequentServiceInfoType | null;
}

const OnTimeServicePage = () => {
  useRequireAuth();
  const router = useRouter();
  const { config } = useConfig();
  const nocCode =
    typeof router.query.nocCode === "string" ? router.query.nocCode : null;
  const lineId =
    typeof router.query.lineId === "string" ? router.query.lineId : null;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Partial<ServiceLevelData>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!config?.apiUrl || !nocCode || !lineId) return;
    const load = async () => {
      setIsLoading(true);
      const params = buildDefaultParams({ nocCode, lineId });

      const [serviceInfo, stopPerformance, servicePatterns] = await Promise.all(
        [
          settle(onTimeService.fetchServiceInfo(lineId)),
          settle(onTimeService.fetchStopPerformanceList(params)),
          settle(transitModelService.fetchServicePatternStops(nocCode, lineId)),
        ],
      );

      const frequentServiceInfo = await settle(
        headwayService.fetchFrequentServiceInfo(params),
      );

      const mergedStops =
        stopPerformance.data && servicePatterns.data
          ? stopPerformanceService.mergeStops(
              stopPerformance.data,
              servicePatterns.data,
            )
          : [];

      setData({
        serviceInfo: serviceInfo.data,
        stopPerformance: stopPerformance.data ?? [],
        servicePatterns: servicePatterns.data ?? [],
        mergedStops,
        frequentServiceInfo: frequentServiceInfo.data,
      });
      setErrors({
        serviceInfo: serviceInfo.error,
        stopPerformance: stopPerformance.error,
        servicePatterns: servicePatterns.error,
        frequentServiceInfo: frequentServiceInfo.error,
      });
      setIsLoading(false);
    };
    load();
  }, [config, nocCode, lineId]);

  if (!nocCode || !lineId) {
    return (
      <BaseLayout title="On-time performance - Analyse Bus Open Data">
        <p className="govuk-body">Loading...</p>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout title={`On-time performance: ${nocCode} / ${lineId}`}>
      <p className="govuk-body">
        <Link
          href={`/on-time/${encodeURIComponent(nocCode)}`}
          className="govuk-link"
        >
          &larr; Back to {nocCode}
        </Link>
      </p>
      <h1 className="govuk-heading-xl">
        On-time performance: {nocCode} / {lineId}
      </h1>
      <p className="govuk-body">
        Skeleton service view. Data is fetched via the migrated on-time,
        headway, transit-model and stop-performance services and shown as JSON
        for verification.
      </p>

      {isLoading ? (
        <p className="govuk-body">Loading service data...</p>
      ) : (
        <>
          <JsonSection
            title="onTimeService.fetchServiceInfo"
            data={data.serviceInfo}
            error={errors.serviceInfo}
          />
          <JsonSection
            title="onTimeService.fetchStopPerformanceList"
            data={data.stopPerformance}
            error={errors.stopPerformance}
          />
          <JsonSection
            title="transitModelService.fetchServicePatternStops"
            data={data.servicePatterns}
            error={errors.servicePatterns}
          />
          <JsonSection
            title="stopPerformanceService.mergeStops"
            description="Merges transit model stops with normalized on-time stop performance."
            data={data.mergedStops}
          />
          <JsonSection
            title="headwayService.fetchFrequentServiceInfo"
            data={data.frequentServiceInfo}
            error={errors.frequentServiceInfo}
          />
        </>
      )}
    </BaseLayout>
  );
};

export default OnTimeServicePage;
