import { ReactNode } from "react";
import styles from "./stat.module.scss";
import { Tooltip } from "@/components/shared/Tooltip";
import { clsx } from "clsx";

interface StatProps {
  label: string;
  value: ReactNode;
  tooltip?: ReactNode;
  id: string;
  className?: string;
  loading?: boolean;
}

export const Stat = ({
  label,
  value,
  tooltip,
  id,
  className,
  loading = false,
}: StatProps) => (
  <div className={clsx(styles.stat, className)} id={id}>
    <span className={styles.label}>{label}</span>
    {tooltip && !loading ? (
      <Tooltip message={tooltip}>
        <span className={clsx(styles.value, styles.valueTooltip)}>{value}</span>
      </Tooltip>
    ) : (
      <span className={clsx(styles.value, loading && styles.valueLoading)}>
        {value}
      </span>
    )}
  </div>
);
