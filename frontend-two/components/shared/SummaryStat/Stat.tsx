import { ReactNode } from "react";
import { Tooltip } from "@/components/shared/Tooltip";

interface StatProps {
  label: string;
  value: ReactNode;
  tooltip?: string;
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
  <div className={`stat ${className ?? ""}`.trim()} id={id}>
    <span className="stat__label">{label}</span>
    {tooltip && !loading ? (
      <Tooltip message={tooltip}>
        <span className="stat__value stat__value--tooltip">{value}</span>
      </Tooltip>
    ) : (
      <span
        className={`stat__value ${loading ? "stat__value--loading" : ""}`.trim()}
      >
        {value}
      </span>
    )}
  </div>
);
