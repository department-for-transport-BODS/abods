import TimingSvg from "@/assets/icons/timing.svg";

type TimingIconProps = {
  className?: string;
};

export const TimingIcon = ({ className }: TimingIconProps) => (
  <span className={className} aria-hidden="true">
    <TimingSvg focusable="false" aria-hidden="true" />
  </span>
);
