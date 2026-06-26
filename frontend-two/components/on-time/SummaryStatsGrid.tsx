import { Duration } from "luxon";
import { SummaryStatWithTooltip } from "@/components/shared/SummaryStatWithTooltip";

interface SummaryStatsGridProps {
	onTime: string | null;
	onTimeCount: number | null;
	lateCount: number | null;
	earlyCount: number | null;
	incompleteCount: number | null;
	recordedStopDepartures: number | null;
	late: string | null;
	early: string | null;
	incompleteData: string | null;
	incompleteBreakdown: string | null;
	averageDelay: number | null;
}

const formatDelay = (delay: number | null): string => {
	if (delay == null) return "-";

	const roundedDelay = Math.round(delay);
	return (
		(roundedDelay >= 0 ? "+" : "-") +
		Duration.fromObject({ seconds: Math.abs(roundedDelay) }).toFormat("mm:ss")
	);
};

const formatPercentage = (value: string | null): string => {
    if (value == null) return "-";
    return value;
}

const formatCount = (value: number | null): string => {
    if (value == null) return "-";
    return new Intl.NumberFormat("en-GB").format(Math.max(0, Math.round(value)));
};

const parseIncompleteBreakdown = (breakdownStr: string | null): Record<string, number> => {
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
	onTime,
	onTimeCount,
	lateCount,
	earlyCount,
	incompleteCount,
	recordedStopDepartures,
	late,
	early,
	incompleteData,
	incompleteBreakdown,
	averageDelay,
}: SummaryStatsGridProps) => {

	const onTimeTooltip = 
		onTimeCount != null && recordedStopDepartures != null && recordedStopDepartures > 0
			? `${formatCount(onTimeCount)} of ${formatCount(recordedStopDepartures)} recorded stop departures were between 1 minute early and 5 minutes 59 seconds late`
			: undefined;

	const lateTooltip = 
		lateCount != null && recordedStopDepartures != null && recordedStopDepartures > 0
			? `${formatCount(lateCount)} of ${formatCount(recordedStopDepartures)} recorded stop departures were more than 5 minutes 59 seconds late.`
			: undefined;

	const earlyTooltip =
		earlyCount != null && recordedStopDepartures != null && recordedStopDepartures > 0
			? `${formatCount(earlyCount)} of ${formatCount(recordedStopDepartures)} recorded stop departures were more than 1 minute early.`
			: undefined;

	const incompleteTooltip = (() => {
		if (incompleteCount == null || recordedStopDepartures == null || recordedStopDepartures <= 0) {
			return undefined;
		}
		
		const breakdown = parseIncompleteBreakdown(incompleteBreakdown);
		const baseText = `${formatCount(incompleteCount)} of ${formatCount(recordedStopDepartures)} stop departures have incomplete or missing real-time data so we are unable to calculate an accurate on-time performance figure.`;
		
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
				<ul className="summary-stat__tooltip-list">
					{breakdownItems.map((item) => (
						<li key={item.key}> • <b>{item.count}</b> {item.label}</li>
					))}
				</ul>
			</>
		) : baseText;
	})();

	return (
		<div className="summary-stats-grid" role="list" aria-label="Summary stats">
			<div role="listitem" className="summary-stats-grid__item">
				<SummaryStatWithTooltip
					title="On-time"
					value={formatPercentage(onTime)}
					tooltip={onTimeTooltip}
				/>
			</div>
			<div role="listitem" className="summary-stats-grid__item">
				<SummaryStatWithTooltip
					title="Late"
					value={formatPercentage(late)}
					tooltip={lateTooltip}
				/>
			</div>
			<div role="listitem" className="summary-stats-grid__item">
				<SummaryStatWithTooltip title="Early" value={formatPercentage(early)} tooltip={earlyTooltip} />
			</div>
			<div role="listitem" className="summary-stats-grid__item">
				<SummaryStatWithTooltip title="Incomplete Data" value={formatPercentage(incompleteData)} tooltip={incompleteTooltip} />
			</div>
			<div role="listitem" className="summary-stats-grid__item">
				<SummaryStatWithTooltip
					title="Average Delay"
					value={formatDelay(averageDelay)}
                    tooltip="Average delay with data displayed in minutes and second format MM:SS."
                />
			</div>
		</div>
	);
};
