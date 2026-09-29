import { ReactNode } from "react";
import { Tooltip } from "@/components/shared/Tooltip";
import { clsx } from "clsx";
import styles from "./summary-stat-with-tooltip.module.scss";

interface SummaryStatWithTooltipProps {
  title: string;
  value: string | number;
  tooltip?: ReactNode;
}

export const SummaryStatWithTooltip = ({
  title,
  value,
  tooltip,
}: SummaryStatWithTooltipProps) => {
  const displayValue = value === "-" ? "Unavailable" : value;

  return (
    <div className={styles.stat}>
      <span className={clsx("govuk-body", styles.title)}>{title}</span>
      {tooltip ? (
        <div className={styles.figure}>
          <Tooltip message={tooltip}>
            <span className={styles.value}>{displayValue}</span>
          </Tooltip>
        </div>
      ) : (
        <div className={styles.figure}>{displayValue}</div>
      )}
    </div>
  );
};
