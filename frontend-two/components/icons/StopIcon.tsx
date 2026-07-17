import StopSvg from "@/assets/icons/stop.svg";

type StopIconProps = {
  className?: string;
};

export const StopIcon = ({ className }: StopIconProps) => (
  <span className={className} aria-hidden="true">
    <StopSvg focusable="false" aria-hidden="true" />
  </span>
);