import CalendarSvg from "@/assets/icons/calendar.svg";

type CalendarIconProps = {
  className?: string;
};

export const CalendarIcon = ({ className }: CalendarIconProps) => (
  <CalendarSvg className={className} aria-hidden="true" focusable="false" />
);
