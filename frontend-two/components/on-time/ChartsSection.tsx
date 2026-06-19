import { useState } from "react";
import dynamic from "next/dynamic";
import { Box } from "@/components/shared/Box";
import {
  DayOfWeekData,
  TimeOfDayData,
} from "@/services/on-time/on-time.service";
import { DelayFrequencyType } from "../../src/generated/graphql";

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

type ChartTab = "distribution" | "timeOfDay" | "dayOfWeek";

const TABS: Array<{ id: ChartTab; label: string }> = [
  { id: "distribution", label: "Distribution" },
  { id: "timeOfDay", label: "Time of day" },
  { id: "dayOfWeek", label: "Day of week" },
];

interface ChartsSectionProps {
  delayFrequency: DelayFrequencyType[];
  timeOfDay: TimeOfDayData[];
  dayOfWeek: DayOfWeekData[];
  errors: {
    delayFrequency?: string | null;
    timeOfDay?: string | null;
    dayOfWeek?: string | null;
  };
}

export const ChartsSection = ({
  delayFrequency,
  timeOfDay,
  dayOfWeek,
  errors,
}: ChartsSectionProps) => {
  const [activeTab, setActiveTab] = useState<ChartTab>("distribution");

  const renderContent = () => {
    switch (activeTab) {
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
