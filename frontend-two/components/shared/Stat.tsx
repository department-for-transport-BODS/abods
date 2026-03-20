import { ReactNode } from "react";
import { Tooltip } from "@/components/shared/Tooltip";

interface StatProps {
  label: string;
  value: ReactNode;
  tooltip?: string;
  id: string;
  className?: string;
}

export const Stat = ({ label, value, tooltip, id, className }: StatProps) => (
  <div className={`stat ${className ?? ""}`.trim()} id={id}>
    <span className="stat__label">{label}</span>
    {tooltip ? (
      <Tooltip message={tooltip} underline>
        <span className="stat__value stat__value--tooltip">{value}</span>
      </Tooltip>
    ) : (
      <span className="stat__value">{value}</span>
    )}
  </div>
);
