import { ReactNode, useState } from "react";
import dynamic from "next/dynamic";
import { Box } from "@/components/shared/Box";
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
} from "../../src/generated/graphql";

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
  // Optional EWT props — only passed from the service page
  headwayTimeSeries?: HeadwayTimeSeriesType[];
  frequentServiceInfo?: FrequentServiceInfoType | null;
  errorHeadwayTimeSeries?: string | null;
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
            {/* Mode selector shown inside Timeline only when EWT data is available */}
            {headwayTimeSeries !== undefined && hasEwt && (
              <div className="on-time__chart-footer govuk-!-margin-top-4">
                {overviewMode === "excess-wait-time" && (
                  <p className="govuk-body-s">
                    {frequentServiceInfo?.numHours} hours out of a total{" "}
                    {frequentServiceInfo?.totalHours} service hours during the
                    selected period operated on a frequent service basis. Excess
                    Waiting Time is averaged over the period in which the
                    service is running on a frequent basis.
                  </p>
                )}
                <div className="on-time__mode-select">
                  <label
                    className="govuk-label on-time__mode-label"
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
    }
  };

  return (
    <div className="govuk-!-margin-bottom-8">
      <div className="analysis-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`analysis-tabs__tab${activeTab === tab.id ? " analysis-tabs__tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <Box minHeight="440px">{renderContent()}</Box>
    </div>
  );
};
