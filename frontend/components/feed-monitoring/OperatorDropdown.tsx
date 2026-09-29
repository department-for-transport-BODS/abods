import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { FeedMonitoringListQuery } from "../../src/generated/graphql";
import { clsx } from "clsx";
import styles from "./operator-dropdown.module.scss";

type FeedMonitoringOperatorData =
  FeedMonitoringListQuery["operatorsFeedMonitoring"][number];

interface OperatorDropdownProps {
  operators: FeedMonitoringOperatorData[];
  currentNocCode: string;
  pageLink: string;
}

export const OperatorDropdown = ({
  operators,
  currentNocCode,
  pageLink,
}: OperatorDropdownProps) => {
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const current = operators.find((op) => op.nocCode === currentNocCode);

  const handleSelect = (op: FeedMonitoringOperatorData) => {
    setOpenDropdown(false);
    router.push(pageLink.replace("[nocCode]", op.nocCode));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={styles.operatorDropdown}>
      <button
        onClick={() => setOpenDropdown((o) => !o)}
        className={styles.button}
        aria-label="Select operator"
      >
        <span className={clsx("govuk-body", styles.label)}>
          {current ? `${current.name} (${current.nocCode})` : "Select operator"}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={clsx(styles.chevron, openDropdown && styles.chevronOpen)}
        >
          <path
            d="M2 5l6 6 6-6"
            stroke="#1d70b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {openDropdown && (
        <ul className={styles.list}>
          {operators.map((op) => (
            <li
              key={op.nocCode}
              onClick={() => handleSelect(op)}
              onMouseEnter={() => setHovered(op.nocCode)}
              onMouseLeave={() => setHovered(null)}
              className={clsx(
                styles.item,
                hovered === op.nocCode && styles.itemHovered,
              )}
            >
              <span className={clsx("govuk-body", styles.itemText)}>
                {op.name} ({op.nocCode})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
