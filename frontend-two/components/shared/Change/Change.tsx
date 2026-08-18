import { ReactNode } from "react";
import styles from "./change.module.scss";
import { clsx } from "clsx";

type ChangeDirection = "increase" | "decrease";

interface ChangeProps {
  direction: ChangeDirection;
  small?: boolean;
  children: ReactNode;
}

export const Change = ({ direction, small = true, children }: ChangeProps) => (
  <span
    className={clsx(styles.change, small && styles.small, styles[direction])}
  >
    {children}
  </span>
);

export const ChangeValue = ({ children }: { children: ReactNode }) => (
  <span className={styles.value}>{children}</span>
);
