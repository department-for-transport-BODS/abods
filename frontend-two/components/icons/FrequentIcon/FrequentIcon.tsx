import styles from "./frequent-icon.module.scss";
import FrequentSvg from "@/assets/icons/frequent.svg";
import { clsx } from "clsx";

type FrequentIconProps = {
  className?: string;
};

export const FrequentIcon = ({ className }: FrequentIconProps) => (
  <span className={clsx(styles.frequentIcon, className)} aria-hidden="true">
    <FrequentSvg focusable="false" aria-hidden="true" />
  </span>
);
