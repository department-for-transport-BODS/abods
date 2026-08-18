import styles from "./charts-section.module.scss";
import tabStyles from "@/components/shared/analysis-tabs.module.scss";
import { clsx } from "clsx";

import { ReactNode, useState } from "react";
import dynamic from "next/dynamic";
import { Box } from "@/components/shared/Box";
import { ChartNoDataMessage } from "@/components/on-time/ChartNoDataWrapper/ChartNoDataWrapper";
import {
  DayOfWeekData,
  TimeOfDayData,
  TimeSeriesData,
} from "@/services/on-time/on-time.service";
import {
  DelayFrequencyType,
  FrequentServiceInfoType,
  Granularity,
  HeadwayTimeSeriesType,
} from "@/src/generated/graphql";

const DelayFrequencyChart = dynamic(
  () => import("@/components/on-time/DelayFrequencyChart"),
  { ssr: false },
);

const DayOfWeekChart = dynamic(
  () => import("@/components/on-time/DayOfWeekChart"),
  { ssr: false },
);

const TimeOfDayChart = dynamic(
  () => import("@/components/on-time/TimeOfDayChart"),
  { ssr: false },
);

const TimeSeriesLineChart = dynamic(
  () => import("@/components/on-time/TimeSeriesLineChart"),
  { ssr: false },
);

const ExcessWaitTimeChart = dynamic(
  () => import("@/components/on-time/ExcessWaitTimeChart"),
  { ssr: false },
);

type ChartTab = "map" | "timeline" | "distribution" | "timeOfDay" | "dayOfWeek";

interface ChartsSectionProps {
  mapContent?: ReactNode;
  delayFrequency: DelayFrequencyType[];
  timeOfDay: TimeOfDayData[];
  dayOfWeek: DayOfWeekData[];
  timeSeries: TimeSeriesData[];
  fromTimestamp: string;
  toTimestamp: string;
  granularity?: Granularity;
  errors: {
    delayFrequency?: string | null;
    timeOfDay?: string | null;
    dayOfWeek?: string | null;
    timeSeries?: string | null;
  };
  headwayTimeSeries?: HeadwayTimeSeriesType[];
  frequentServiceInfo?: FrequentServiceInfoType | null;
  errorHeadwayTimeSeries?: string | null;
  noData?: boolean;
  dataExpected?: boolean;
  timingPointsNotSupported?: boolean;
  minMaxDelayNotSupported?: boolean;
}

export const ChartsSection = ({
  mapContent,
  delayFrequency,
  timeOfDay,
  dayOfWeek,
  timeSeries,
  fromTimestamp,
  toTimestamp,
  granularity = Granularity.Day,
  errors,
  headwayTimeSeries,
  frequentServiceInfo,
  errorHeadwayTimeSeries,
  noData = false,
  dataExpected = false,
  timingPointsNotSupported = false,
  minMaxDelayNotSupported = false,
}: ChartsSectionProps) => {
  const hasMapTab = mapContent !== undefined && mapContent !== null;
  const [activeTab, setActiveTab] = useState<ChartTab>(
    hasMapTab ? "map" : "timeline",
  );
  const [overviewMode, setOverviewMode] = useState<
    "on-time-performance" | "excess-wait-time"
  >("on-time-performance");

  const hasEwt = (frequentServiceInfo?.numHours ?? 0) > 0;

  const TABS: Array<{ id: ChartTab; label: string }> = [
    ...(hasMapTab ? [{ id: "map" as const, label: "Map" }] : []),
    { id: "timeline", label: "Timeline" },
    { id: "distribution", label: "Distribution" },
    { id: "timeOfDay", label: "Time of day" },
    { id: "dayOfWeek", label: "Day of week" },
  ];

  const renderTimelineContent = () => {
    if (overviewMode === "excess-wait-time") {
      if (errorHeadwayTimeSeries) {
        return (
          <p className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>{" "}
            {errorHeadwayTimeSeries}
          </p>
        );
      }
      if (!hasEwt) {
        return (
          <p className="govuk-body">
            Excess waiting time is unavailable for this service in the selected
            period because no frequent service hours were found.
          </p>
        );
      }
      return (
        <ExcessWaitTimeChart
          data={headwayTimeSeries ?? []}
          fromTimestamp={fromTimestamp}
          toTimestamp={toTimestamp}
        />
      );
    }

    if (errors.timeSeries) {
      return (
        <p className="govuk-error-message">
          <span className="govuk-visually-hidden">Error:</span>{" "}
          {errors.timeSeries}
        </p>
      );
    }
    return (
      <TimeSeriesLineChart
        data={timeSeries}
        fromTimestamp={fromTimestamp}
        toTimestamp={toTimestamp}
        granularity={granularity}
      />
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "map":
        return mapContent ?? null;
      case "timeline":
        return (
          <>
            {renderTimelineContent()}
            {headwayTimeSeries !== undefined && hasEwt && (
              <div className={`${styles.footer} govuk-!-margin-top-4`}>
                {overviewMode === "excess-wait-time" && (
                  <p className="govuk-body-s">
                    {frequentServiceInfo?.numHours} hours out of a total{" "}
                    {frequentServiceInfo?.totalHours} service hours during the
                    selected period operated on a frequent service basis. Excess
                    Waiting Time is averaged over the period in which the
                    service is running on a frequent basis.
                  </p>
                )}
                <div className={styles.modeSelect}>
                  <label
                    className={`govuk-label ${styles.modeLabel}`}
                    htmlFor="overviewMode"
                  >
                    Show:
                  </label>
                  <select
                    className="govuk-select"
                    id="overviewMode"
                    name="overviewMode"
                    value={overviewMode}
                    onChange={(e) =>
                      setOverviewMode(
                        e.target.value as
                          | "on-time-performance"
                          | "excess-wait-time",
                      )
                    }
                  >
                    <option value="on-time-performance">
                      On-time performance
                    </option>
                    <option value="excess-wait-time">
                      Excess waiting time
                    </option>
                  </select>
                </div>
              </div>
            )}
          </>
        );
      case "distribution":
        return errors.delayFrequency ? (
          <p className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>{" "}
            {errors.delayFrequency}
          </p>
        ) : (
          <DelayFrequencyChart data={delayFrequency} />
        );
      case "timeOfDay":
        return errors.timeOfDay ? (
          <p className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>{" "}
            {errors.timeOfDay}
          </p>
        ) : (
          <TimeOfDayChart data={timeOfDay} />
        );
      case "dayOfWeek":
        return errors.dayOfWeek ? (
          <p className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>{" "}
            {errors.dayOfWeek}
          </p>
        ) : (
          <DayOfWeekChart data={dayOfWeek} />
        );
      default: {
        const _exhaustive: never = activeTab;
        return _exhaustive;
      }
    }
  };

  return (
    <div className="govuk-!-margin-bottom-8">
      <Box minHeight="440px">
        <div
          className={clsx(
            tabStyles.analysisTabs,
            tabStyles.panel,
            "govuk-!-margin-bottom-4",
          )}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={clsx(
                tabStyles.tab,
                activeTab === tab.id && tabStyles.tabActive,
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {noData && activeTab !== "map" ? (
          <div className={styles.noData}>
            <ChartNoDataMessage
              dataExpected={dataExpected}
              timingPointsNotSupported={timingPointsNotSupported}
              minMaxDelayNotSupported={minMaxDelayNotSupported}
            />
          </div>
        ) : (
          renderContent()
        )}
      </Box>
    </div>
  );
};
