import { ReactNode } from "react";

interface BoxProps {
  children: ReactNode;
  minHeight?: string;
  className?: string;
}

export const Box = ({ children, minHeight, className }: BoxProps) => (
  <div
    className={`box app-box ${className ?? ""}`}
    style={minHeight ? { minHeight } : undefined}
  >
    {children}
  </div>
);
