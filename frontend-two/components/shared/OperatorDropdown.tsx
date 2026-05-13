import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { FeedMonitoringOperator } from "@/types/feed-monitoring";

export const OperatorDropdown = ({ operators, currentNocCode, pageLink }: { operators: FeedMonitoringOperator[], currentNocCode: string, pageLink: string }) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    const current = operators.find(op => op.nocCode === currentNocCode);

    const handleSelect = (op: FeedMonitoringOperator) => {
        setOpen(false);
        router.push(pageLink.replace("[nocCode]", op.nocCode));
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="operator-dropdown">
            <button
                onClick={() => setOpen(o => !o)}
                className="operator-dropdown__button"
            >
                <span className="govuk-body operator-dropdown__label">
                    {current ? `${current.name} (${current.nocCode})` : "Select operator"}
                </span>
                <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    className={`operator-dropdown__chevron${open ? " operator-dropdown__chevron--open" : ""}`}
                >
                    <path d="M2 5l6 6 6-6" stroke="#1d70b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <ul className="operator-dropdown__list">
                    {operators.map(op => (
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