import Link from "next/link";
import { ReactNode } from "react";
import styles from "./link-with-arrow.module.scss";
import { clsx } from "clsx";

interface LinkWithArrowProps {
  href: string;
  children: ReactNode;
}

export const LinkWithArrow = ({ href, children }: LinkWithArrowProps) => (
  <Link
    className={clsx("govuk-link", styles.noUnderline, styles.linkWithArrow)}
    href={href}
  >
    <span className={styles.text}>{children}</span>
    <span aria-hidden="true" className={styles.arrow}>
      »
    </span>
  </Link>
);
