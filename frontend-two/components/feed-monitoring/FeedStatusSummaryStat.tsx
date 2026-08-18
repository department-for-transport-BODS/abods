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
    <div className={styles.feedStatusSummaryStat}>
      <span className={styles.title}>{title}</span>
      <div className={styles.row}>
        {active ? (
          <Image
            src="/assets/icons/check-in-circle-solid.svg"
            width={36}
            height={36}
            className={styles.check}
            alt="Active Feed"
          />
        ) : (
          <Image
            src="/assets/icons/cross-in-circle-solid.svg"
            width={36}
            height={36}
            className={styles.cross}
            alt="Inactive Feed"
          />
        )}
        <span
          className={clsx(
            styles.value,
            active ? styles.valueActive : styles.valueInactive,
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );
};
