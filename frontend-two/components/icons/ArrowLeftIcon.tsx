import ArrowLeftSvg from "@/assets/icons/arrow-left.svg";

type ArrowLeftIconProps = {
  className?: string;
};

export const ArrowLeftIcon = ({ className }: ArrowLeftIconProps) => (
  <ArrowLeftSvg className={className} aria-hidden="true" focusable="false" />
);
