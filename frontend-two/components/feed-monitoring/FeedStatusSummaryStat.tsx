import { clsx } from "clsx";
import styles from "./feed-status-summary-stat.module.scss";
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
    <div className={styles["feed-status-summary-stat"]}>
      <span className={styles["feed-status-summary-stat__title"]}>{title}</span>
      <div className={styles["feed-status-summary-stat__row"]}>
        {active ? (
          <Image
            src="/assets/icons/check-in-circle-solid.svg"
            width={36}
            height={36}
            className={styles["feed-status-summary-stat__check"]}
            alt="Active Feed"
          />
        ) : (
          <Image
            src="/assets/icons/cross-in-circle-solid.svg"
            width={36}
            height={36}
            className={styles["feed-status-summary-stat__cross"]}
            alt="Inactive Feed"
          />
        )}
        <span
          className={clsx(
            styles["feed-status-summary-stat__value"],
            active
              ? styles["feed-status-summary-stat__value--active"]
              : styles["feed-status-summary-stat__value--inactive"],
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );
};
