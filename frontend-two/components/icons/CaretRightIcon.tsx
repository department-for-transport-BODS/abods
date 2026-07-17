import CaretRightSvg from "@/assets/icons/caret-right.svg";

type CaretRightIconProps = {
  className?: string;
};

export const CaretRightIcon = ({ className }: CaretRightIconProps) => (
  <CaretRightSvg
    className={className}
    aria-hidden="true"
    focusable="false"
  />
);