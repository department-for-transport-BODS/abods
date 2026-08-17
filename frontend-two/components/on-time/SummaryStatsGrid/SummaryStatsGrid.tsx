import styles from "./summary-stats-grid.module.scss";
import tooltipListStyles from "@/components/shared/SummaryStat/summary-stat-with-tooltip.module.scss";

import { Duration } from "luxon";
import { SummaryStatWithTooltip } from "@/components/shared/SummaryStat/SummaryStatWithTooltip";
import { clsx } from "clsx";

interface SummaryStatsGridProps {
  onTimeCount: number | null;
  lateCount: number | null;
  earlyCount: number | null;
  incompleteCount: number | null;
  recordedStopDepartures: number | null;
  totalStopDepartures: number | null;
  incompleteBreakdown: string | null;
  averageDelay: number | null;
  className?: string;
  compact?: boolean;
}

const formatDelay = (delay: number | null): string => {
  if (delay == null) return "-";

  const wholeSeconds = delay >= 0 ? Math.floor(delay) : Math.ceil(delay);
  return (
    (wholeSeconds >= 0 ? "+" : "-") +
    Duration.fromObject({ seconds: Math.abs(wholeSeconds) }).toFormat("mm:ss")
  );
};

const formatPercentage = (value: number | null, total: number): string => {
  if (value == null || total <= 0) return "-";
  return `${((value / total) * 100).toFixed(2)}%`;
};

const formatIncompletePercentage = (
  value: number | null,
  totalStopDepartures: number | null,
): string => {
  if (
    value == null ||
    totalStopDepartures == null ||
    totalStopDepartures <= 0
  ) {
    return "-";
  }

  return `${((value / totalStopDepartures) * 100).toFixed(2)}%`;
};

const formatCount = (value: number | null): string => {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-GB").format(Math.max(0, Math.round(value)));
};

const parseIncompleteBreakdown = (
  breakdownStr: string | null,
): Record<string, number> => {
  if (!breakdownStr) return {};
  try {
    return JSON.parse(breakdownStr);
  } catch {
    return {};
  }
};

const incompleteReasonLabels: Record<string, string> = {
  "0": "stops with an unspecified matching issue",
  "1": "stops with missing NOC from real-time data",
  "2": "stops with missing service from real-time data",
  "3": "stops with missing journey code from real-time data",
  "4": "stops with missing real-time data within the zone of a stop",
  "5": "stops with GPS location in the zone of a stop that is deemed invalid",
};

export const SummaryStatsGrid = ({
  onTimeCount,
  lateCount,
  earlyCount,
  incompleteCount,
  recordedStopDepartures,
  totalStopDepartures,
  incompleteBreakdown,
  averageDelay,
  className,
  compact = false,
}: SummaryStatsGridProps) => {
  const summaryTotal =
    (onTimeCount ?? 0) + (lateCount ?? 0) + (earlyCount ?? 0);

  const onTimeTooltip =
    onTimeCount != null &&
    recordedStopDepartures != null &&
    recordedStopDepartures > 0
      ? `${formatCount(onTimeCount)} of ${formatCount(recordedStopDepartures)} recorded stop departures were between 1 minute early and 5 minutes 59 seconds late`
      : undefined;

  const lateTooltip =
    lateCount != null &&
    recordedStopDepartures != null &&
    recordedStopDepartures > 0
      ? `${formatCount(lateCount)} of ${formatCount(recordedStopDepartures)} recorded stop departures were more than 5 minutes 59 seconds late.`
      : undefined;

  const earlyTooltip =
    earlyCount != null &&
    recordedStopDepartures != null &&
    recordedStopDepartures > 0
      ? `${formatCount(earlyCount)} of ${formatCount(recordedStopDepartures)} recorded stop departures were more than 1 minute early.`
      : undefined;

  const incompleteTooltip = (() => {
    if (
      incompleteCount == null ||
      totalStopDepartures == null ||
      totalStopDepartures <= 0
    ) {
      return undefined;
    }

    const breakdown = parseIncompleteBreakdown(incompleteBreakdown);
    const baseText = `${formatCount(incompleteCount)} of ${formatCount(totalStopDepartures)} stop departures have incomplete or missing real-time data so we are unable to calculate an accurate on-time performance figure.`;

    if (Object.keys(breakdown).length === 0) {
      return baseText;
    }

    const breakdownItems = Object.entries(breakdown)
      .filter(([_, count]) => count > 0)
      .map(([key, count]) => {
        const label = incompleteReasonLabels[key] || key;
        return {
          key,
          count: formatCount(count),
          label,
        };
      });

    return breakdownItems.length > 0 ? (
      <>
        <p>{baseText}</p>
        <p>Of these, there are:</p>
        <ul className={tooltipListStyles.tooltipList}>
          {breakdownItems.map((item) => (
            <li key={item.key}>
              {" "}
              <b>{item.count}</b> {item.label}
            </li>
          ))}
        </ul>
      </>
    ) : (
      baseText
    );
  })();

  return (
    <div
      className={clsx(styles.grid, compact && styles.gridCompact, className)}
      role="list"
      aria-label="Summary stats"
    >
      <div role="listitem" className={styles.item}>
        <SummaryStatWithTooltip
          title="On-time"
          value={formatPercentage(onTimeCount, summaryTotal)}
          tooltip={onTimeTooltip}
        />
      </div>
      <div role="listitem" className={styles.item}>
        <SummaryStatWithTooltip
          title="Late"
          value={formatPercentage(lateCount, summaryTotal)}
          tooltip={lateTooltip}
        />
      </div>
      <div role="listitem" className={styles.item}>
        <SummaryStatWithTooltip
          title="Early"
          value={formatPercentage(earlyCount, summaryTotal)}
          tooltip={earlyTooltip}
        />
      </div>
      <div role="listitem" className={styles.item}>
        <SummaryStatWithTooltip
          title="Incomplete Data"
          value={formatIncompletePercentage(
            incompleteCount,
            totalStopDepartures,
          )}
          tooltip={incompleteTooltip}
        />
      </div>
      <div role="listitem" className={styles.item}>
        <SummaryStatWithTooltip
          title="Average Delay"
          value={formatDelay(averageDelay)}
          tooltip="Average delay with data displayed in minutes and second format MM:SS."
        />
      </div>
    </div>
  );
};
