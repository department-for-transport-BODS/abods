import CrossSvg from "@/assets/icons/cross.svg";

type CrossIconProps = {
  className?: string;
};

export const CrossIcon = ({ className }: CrossIconProps) => (
  <span className={className} aria-hidden="true">
    <CrossSvg focusable="false" aria-hidden="true" />
  </span>
);
