import ReCentreSvg from "@/assets/icons/re-centre.svg";

type ReCentreIconProps = {
  className?: string;
};

export const ReCentreIcon = ({ className }: ReCentreIconProps) => (
  <ReCentreSvg
    className={className}
    aria-hidden="true"
    focusable="false"
  />
);