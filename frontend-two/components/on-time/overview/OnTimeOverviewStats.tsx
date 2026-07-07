import { Duration } from "luxon";
import { Stat } from "@/components/shared/Stat";
import type { PunctualityOverview } from "@/services/on-time/on-time.service";

interface Props {
  overview: PunctualityOverview;
}

const formatPercent = (value: number, total: number): string => {
  if (!total) return "Unavailable";
  return `${((value / total) * 100).toFixed(2)}%`;
};

const formatDelay = (seconds?: number | null): string => {
  if (seconds == null) return "Unavailable";
  const sign = seconds < 0 ? "-" : "+";
  return `${sign}${Duration.fromObject({ seconds: Math.abs(seconds) }).toFormat("mm:ss")}`;
};

const formatCount = (value: number): string => value.toLocaleString();

/**
 * Overview stats component displaying key punctuality metrics.
 * Mirrors the Angular on-time overview-stats and reuses the shared Stat/Tooltip
 * components used across the dashboard.
 */
export const OnTimeOverviewStats = ({ overview }: Props) => {
  const { onTime, early, late, completed, scheduled, averageDelay } = overview;
  // Match the Angular component: percentages are of completed departures.
  const denominator = completed || onTime + early + late;
  const noData = Math.max(0, scheduled - completed);

  return (
    <div className="on-time-overview__stats">
      <Stat
        id="on-time-overview-stat-on-time"
        className="on-time-overview__stat"
        label="On-time"
        value={formatPercent(onTime, denominator)}
        tooltip={
          denominator
            ? `${formatCount(onTime)} of ${formatCount(denominator)} recorded stop departures were between 1 minute early and 5 minutes 59 seconds late.`
            : "There is no real-time data for the selected time period."
        }
      />
      <Stat
        id="on-time-overview-stat-late"
        className="on-time-overview__stat"
        label="Late"
        value={formatPercent(late, denominator)}
        tooltip={
          denominator
            ? `${formatCount(late)} of ${formatCount(denominator)} recorded stop departures were more than 5 minutes 59 seconds late.`
            : "There is no real-time data for the selected time period."
        }
      />
      <Stat
        id="on-time-overview-stat-early"
        className="on-time-overview__stat"
        label="Early"
        value={formatPercent(early, denominator)}
        tooltip={
          denominator
            ? `${formatCount(early)} of ${formatCount(denominator)} recorded stop departures were more than 1 minute early.`
            : "There is no real-time data for the selected time period."
        }
      />
      <Stat
        id="on-time-overview-stat-no-data"
        className="on-time-overview__stat"
        label="Incomplete data"
        value={scheduled ? formatPercent(noData, scheduled) : "Unavailable"}
        tooltip={
          scheduled
            ? `${formatCount(noData)} of ${formatCount(scheduled)} stop departures have limited or missing real-time data so we are unable to calculate an accurate on-time performance figure.`
            : "There is no timetable data for the selected time period."
        }
      />
      <Stat
        id="on-time-overview-stat-average-delay"
        className="on-time-overview__stat"
        label="Average delay"
        value={formatDelay(averageDelay)}
        tooltip="Average delay with data displayed in minutes and second format MM:SS."
      />
    </div>
  );
};
