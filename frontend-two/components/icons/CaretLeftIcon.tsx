import CaretLeftSvg from "@/assets/icons/caret-left.svg";

type CaretLeftIconProps = {
  className?: string;
};

export const CaretLeftIcon = ({ className }: CaretLeftIconProps) => (
  <CaretLeftSvg
    className={className}
    aria-hidden="true"
    focusable="false"
  />
);