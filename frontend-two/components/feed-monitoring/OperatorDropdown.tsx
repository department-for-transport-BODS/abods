import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { FeedMonitoringOperatorData } from "@/types/feed-monitoring";

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
    <div ref={ref} className="operator-dropdown">
      <button
        onClick={() => setOpenDropdown((o) => !o)}
        className="operator-dropdown__button"
      >
        <span className="govuk-body operator-dropdown__label">
          {current ? `${current.name} (${current.nocCode})` : "Select operator"}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`operator-dropdown__chevron${openDropdown ? " operator-dropdown__chevron--open" : ""}`}
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
        <ul className="operator-dropdown__list">
          {operators.map((op) => (
            <li
              key={op.nocCode}
              onClick={() => handleSelect(op)}
              onMouseEnter={() => setHovered(op.nocCode)}
              onMouseLeave={() => setHovered(null)}
              className={`operator-dropdown__item${hovered === op.nocCode ? " operator-dropdown__item--hovered" : ""}`}
            >
              <span className="govuk-body operator-dropdown__item-text">
                {op.name} ({op.nocCode})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
