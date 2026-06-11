import Image from "next/image";
interface FeedStatusSummaryStatProps {
  title: string;
  value: string | number;
}

export const FeedStatusSummaryStat = ({
  title,
  value,
}: FeedStatusSummaryStatProps) => {
  const active = value === "Active";
  return (
    <div className="feed-status-summary-stat">
      <span className="feed-status-summary-stat__title">{title}</span>
      <div className="feed-status-summary-stat__row">
        {active ? (
          <Image
            src="/assets/icons/check-in-circle-solid.svg"
            className="feed-status-summary-stat__check"
            alt="Active Feed"
          />
        ) : (
          <Image
            src="/assets/icons/cross-in-circle-solid.svg"
            className="feed-status-summary-stat__cross"
            alt="Inactive Feed"
          />
        )}
        <span
          className={
            "feed-status-summary-stat__value" +
            (active
              ? " feed-status-summary-stat__value--active"
              : " feed-status-summary-stat__value--inactive")
          }
        >
          {value}
        </span>
      </div>
    </div>
  );
};
