import {
  CorridorHideOutliers,
  CorridorStats,
  CorridorTransitTimeStat,
} from "@/types/corridors";

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
  data: CorridorTransitTimeStat[];
  label: (row: CorridorTransitTimeStat) => string;
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
      <h2 className="govuk-heading-m">Journey-time analysis</h2>
      <div className="govuk-button-group govuk-!-margin-bottom-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`govuk-button govuk-button--secondary ${tab === item.id ? "govuk-!-font-weight-bold" : ""}`}
            data-module="govuk-button"
            onClick={() => onChangeTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "timeline" ? (
        <>
          <TransitTimeTable
            data={stats.transitTimeStats}
            label={(row) => row.ts ?? "Unknown"}
          />
          <div className="govuk-checkboxes govuk-checkboxes--small">
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
        </>
      ) : null}

      {tab === "timeOfDay" ? (
        <>
          <TransitTimeTable
            data={stats.transitTimeTimeOfDayStats}
            label={(row) => row.binLabel ?? row.category ?? "Unknown"}
          />
          <div className="govuk-checkboxes govuk-checkboxes--small">
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
        </>
      ) : null}

      {tab === "dayOfWeek" ? (
        <>
          <TransitTimeTable
            data={stats.transitTimeDayOfWeekStats}
            label={(row) => row.binLabel ?? row.category ?? "Unknown"}
          />
          <div className="govuk-checkboxes govuk-checkboxes--small">
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
        </>
      ) : null}

      {tab === "distribution" ? (
        <table className="govuk-table govuk-!-margin-bottom-4">
          <thead className="govuk-table__head">
            <tr className="govuk-table__row">
              <th scope="col" className="govuk-table__header">
                Journey time bin
              </th>
              <th scope="col" className="govuk-table__header">
                Number of journeys
              </th>
            </tr>
          </thead>
          <tbody className="govuk-table__body">
            {stats.transitTimeHistogram.map((row, idx) => (
              <tr key={`${row.bin}-${idx}`} className="govuk-table__row">
                <td className="govuk-table__cell">
                  {row.xAxisLabel ?? row.bin ?? "Unknown"}
                </td>
                <td className="govuk-table__cell">{row.freq ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
};
