import type { ReactNode } from "react";

interface OnTimePageHeaderProps {
  title: string;
  headingClassName?: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}

export const OnTimePageHeader = ({
  title,
  headingClassName = "govuk-heading-xl govuk-!-margin-bottom-4",
  subtitle,
  children,
}: OnTimePageHeaderProps) => (
  <>
    <span className="govuk-caption-xl">On-time performance</span>
    <h1 className={headingClassName}>{title}</h1>
    {subtitle}
    {children}
  </>
);
