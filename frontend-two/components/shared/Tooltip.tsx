import { ReactNode } from "react";

interface TooltipProps {
  message?: string;
  underline?: boolean;
  selectable?: boolean;
  children: ReactNode;
}

export const Tooltip = ({
  message,
  underline,
  selectable,
  children,
}: TooltipProps) => (
  <span
    className={`tooltip ${underline ? "tooltip--underline" : ""} ${selectable ? "tooltip--selectable" : ""}`}
    title={message}
  >
    {children}
  </span>
);
