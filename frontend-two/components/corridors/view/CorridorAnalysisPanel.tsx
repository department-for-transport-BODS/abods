import { clsx } from "clsx";
import styles from "./corridor-analysis-panel.module.scss";
import tabStyles from "@/components/shared/analysis-tabs.module.scss";
import dynamic from "next/dynamic";
import {
  BoxPlotChartDataItem,
  CorridorHideOutliers,
  CorridorStats,
  CorridorTimeStats,
} from "@/types/corridors";

const CorridorBoxPlotChart = dynamic(
  () =>
    import("./CorridorBoxPlotChart").then((m) => ({
      default: m.CorridorBoxPlotChart,
    })),
  { ssr: false },
);

const CorridorHistogramChart = dynamic(
  () =>
    import("./CorridorHistogramChart").then((m) => ({
      default: m.CorridorHistogramChart,
    })),
  { ssr: false },
);

// Colours matching the Angular frontend
const JOURNEY_TIME_WHISKER = "#4c2c92"; // govuk purple
const JOURNEY_TIME_BOX = "#6f72af"; // light purple

type AnalysisTab = "timeline" | "timeOfDay" | "dayOfWeek" | "distribution";

interface Props {
  stats: CorridorStats;
  tab: AnalysisTab;
  onChangeTab: (tab: AnalysisTab) => void;
  hideOutliers: CorridorHideOutliers;
  onChangeHideOutliers: {
    setJourneyTime: (value: boolean) => void;
    setTimeOfDay: (value: boolean) => void;
    setDayOfWeek: (value: boolean) => void;
  };
}

const toDisplayValue = (value: number | null | undefined): string =>
  typeof value === "number" ? value.toFixed(2) : "Unavailable";

const TransitTimeTable = ({
  data,
  label,
}: {
  data: (CorridorTimeStats & BoxPlotChartDataItem)[];
  label: (row: CorridorTimeStats & BoxPlotChartDataItem) => string;
}) => (
  <table className="govuk-table govuk-!-margin-bottom-4">
    <thead className="govuk-table__head">
      <tr className="govuk-table__row">
        <th scope="col" className="govuk-table__header">
          Bucket
        </th>
        <th scope="col" className="govuk-table__header">
          Min
        </th>
        <th scope="col" className="govuk-table__header">
          Average
        </th>
        <th scope="col" className="govuk-table__header">
          Max
        </th>
      </tr>
    </thead>
    <tbody className="govuk-table__body">
      {data.map((row, idx) => (
        <tr key={`${label(row)}-${idx}`} className="govuk-table__row">
          <td className="govuk-table__cell">{label(row)}</td>
          <td className="govuk-table__cell">
            {toDisplayValue(row.minTransitTime)}
          </td>
          <td className="govuk-table__cell">
            {toDisplayValue(row.avgTransitTime)}
          </td>
          <td className="govuk-table__cell">
            {toDisplayValue(row.maxTransitTime)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const CorridorAnalysisPanel = ({
  stats,
  tab,
  onChangeTab,
  hideOutliers,
  onChangeHideOutliers,
}: Props) => {
  const tabs: Array<{ id: AnalysisTab; label: string }> = [
    { id: "timeline", label: "Timeline" },
    { id: "timeOfDay", label: "Time of day" },
    { id: "dayOfWeek", label: "Day of week" },
    { id: "distribution", label: "Distribution" },
  ];

  return (
    <div className="govuk-!-margin-bottom-6">
      <div className={clsx(tabStyles["analysis-tabs"], "govuk-!-margin-bottom-4")}>
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={clsx(tabStyles["analysis-tabs__tab"], tab === item.id && tabStyles["analysis-tabs__tab--active"])}
            onClick={() => onChangeTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "timeline" ? (
        <div className={styles["corridor__chart-wrapper"]}>
          <CorridorBoxPlotChart
            data={stats.transitTimeStats}
            xAxisType="date"
            xAxisTitle="Date"
            yAxisType="time"
            yAxisTitle="Journey time"
            hideOutliers={hideOutliers.journeyTime}
            whiskerColor={JOURNEY_TIME_WHISKER}
            boxColor={JOURNEY_TIME_BOX}
          />
          <div className={clsx("govuk-checkboxes", "govuk-checkboxes--small", styles["corridor__hide-outliers"])}>
            <div className="govuk-checkboxes__item">
              <input
                className="govuk-checkboxes__input"
                id="hide-outliers-journey-time"
                type="checkbox"
                checked={hideOutliers.journeyTime}
                onChange={(event) =>
                  onChangeHideOutliers.setJourneyTime(event.target.checked)
                }
              />
              <label
                className="govuk-label govuk-checkboxes__label"
                htmlFor="hide-outliers-journey-time"
              >
                Hide outliers
              </label>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "timeOfDay" ? (
        <div className={styles["corridor__chart-wrapper"]}>
          <CorridorBoxPlotChart
            data={stats.transitTimeTimeOfDayStats}
            xAxisType="category"
            xAxisTitle="Time of day"
            yAxisType="time"
            yAxisTitle="Journey time"
            hideOutliers={hideOutliers.timeOfDay}
            whiskerColor={JOURNEY_TIME_WHISKER}
            boxColor={JOURNEY_TIME_BOX}
          />
          <div className={clsx("govuk-checkboxes", "govuk-checkboxes--small", styles["corridor__hide-outliers"])}>
            <div className="govuk-checkboxes__item">
              <input
                className="govuk-checkboxes__input"
                id="hide-outliers-time-of-day"
                type="checkbox"
                checked={hideOutliers.timeOfDay}
                onChange={(event) =>
                  onChangeHideOutliers.setTimeOfDay(event.target.checked)
                }
              />
              <label
                className="govuk-label govuk-checkboxes__label"
                htmlFor="hide-outliers-time-of-day"
              >
                Hide outliers
              </label>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "dayOfWeek" ? (
        <div className={styles["corridor__chart-wrapper"]}>
          <CorridorBoxPlotChart
            data={stats.transitTimeDayOfWeekStats}
            xAxisType="category"
            xAxisTitle="Day of week"
            yAxisType="time"
            yAxisTitle="Journey time"
            hideOutliers={hideOutliers.dayOfWeek}
            whiskerColor={JOURNEY_TIME_WHISKER}
            boxColor={JOURNEY_TIME_BOX}
          />
          <div className={clsx("govuk-checkboxes", "govuk-checkboxes--small", styles["corridor__hide-outliers"])}>
            <div className="govuk-checkboxes__item">
              <input
                className="govuk-checkboxes__input"
                id="hide-outliers-day-of-week"
                type="checkbox"
                checked={hideOutliers.dayOfWeek}
                onChange={(event) =>
                  onChangeHideOutliers.setDayOfWeek(event.target.checked)
                }
              />
              <label
                className="govuk-label govuk-checkboxes__label"
                htmlFor="hide-outliers-day-of-week"
              >
                Hide outliers
              </label>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "distribution" ? (
        <CorridorHistogramChart data={stats.transitTimeHistogram} />
      ) : null}
    </div>
  );
};
