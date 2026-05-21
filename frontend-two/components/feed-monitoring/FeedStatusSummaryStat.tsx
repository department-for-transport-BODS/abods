interface FeedStatusSummaryStatProps {
    title: string;
    value: string | number;
}

export const FeedStatusSummaryStat = ({ title, value }: FeedStatusSummaryStatProps) => {
    const active = value === "Active";
    return (
        <div className="feed-status-summary-stat">
            <span className="feed-status-summary-stat__title">
                {title}
            </span>
            <div className="feed-status-summary-stat__row">
                {active
                    ? <img src="/assets/icons/check-in-circle-solid.svg"
                        className="feed-status-summary-stat__check" />
                    : <img src="/assets/icons/cross-in-circle-solid.svg"
                        className="feed-status-summary-stat__cross" />
                }
                <span className={"feed-status-summary-stat__value" + (active ? " feed-status-summary-stat__value--active" : " feed-status-summary-stat__value--inactive")}>
                    {value}
                </span>
            </div>
        </div>
    );
}