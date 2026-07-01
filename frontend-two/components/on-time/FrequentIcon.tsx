import FrequentSvg from "@/assets/icons/frequent.svg";

type FrequentIconProps = {
  className?: string;
};

export const FrequentIcon = ({ className }: FrequentIconProps) => (
  <span className={className} aria-hidden="true" style={{ display: "inline-flex", minWidth: "20px" }}>
    <FrequentSvg focusable="false" aria-hidden="true" />
  </span>
);
