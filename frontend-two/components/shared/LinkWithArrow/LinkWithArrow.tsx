import Link from "next/link";
import { ReactNode } from "react";
import styles from "./link-with-arrow.module.scss";
import { clsx } from "clsx";

interface LinkWithArrowProps {
  href: string;
  children: ReactNode;
}

export const LinkWithArrow = ({ href, children }: LinkWithArrowProps) => (
  <Link className={clsx("govuk-link", styles.linkWithArrow)} href={href}>
    {children} <span aria-hidden="true">»</span>
  </Link>
);
