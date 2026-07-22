import FrequentSvg from "@/assets/icons/frequent.svg";

type FrequentIconProps = {
  className?: string;
};

export const FrequentIcon = ({ className }: FrequentIconProps) => (
  <span
    className={`frequent-icon${className ? ` ${className}` : ""}`}
    aria-hidden="true"
  >
    <FrequentSvg focusable="false" aria-hidden="true" />
  </span>
);
