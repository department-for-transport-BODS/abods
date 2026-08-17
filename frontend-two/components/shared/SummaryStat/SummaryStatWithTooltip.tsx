import { ReactNode } from "react";
import { Tooltip } from "@/components/shared/Tooltip";
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
    <div
      className="bg-white flex flex-col"
      style={{ borderTop: "2px solid #cecece" }}
    >
      <span className="govuk-body mt-4" style={{ color: "#484949" }}>
        {title}
      </span>
      {tooltip ? (
        <div className="font-bold govuk-!-font-size-36">
          <Tooltip message={tooltip}>
            <span className={styles.value}>{displayValue}</span>
          </Tooltip>
        </div>
      ) : (
        <div className="font-bold govuk-!-font-size-36">{displayValue}</div>
      )}
    </div>
  );
};
