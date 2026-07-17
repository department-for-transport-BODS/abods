import ArrowRightSvg from "@/assets/icons/arrow-right.svg";

type ArrowRightIconProps = {
  className?: string;
};

export const ArrowRightIcon = ({ className }: ArrowRightIconProps) => (
  <ArrowRightSvg
    className={className}
    aria-hidden="true"
    focusable="false"
  />
);