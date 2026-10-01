import { ReactNode } from "react";
import styles from "./box.module.scss";
import { clsx } from "clsx";

interface BoxProps {
  children: ReactNode;
  minHeight?: string;
  className?: string;
}

export const Box = ({ children, minHeight, className }: BoxProps) => (
  <div
    className={clsx(styles.box, "app-box", className)}
    style={minHeight ? { minHeight } : undefined}
  >
    {children}
  </div>
);
