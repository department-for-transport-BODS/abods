import Link from "next/link";
import { ReactNode } from "react";

interface LinkWithArrowProps {
  href: string;
  children: ReactNode;
}

export const LinkWithArrow = ({ href, children }: LinkWithArrowProps) => (
  <Link className="govuk-link link-with-arrow" href={href}>
    {children} <span aria-hidden="true">»</span>
  </Link>
);
