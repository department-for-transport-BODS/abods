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
        <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: 0,
                }}
            >
                <span className="govuk-body" style={{ color: "#1d70b8", fontWeight: "bold", fontSize: "24px", margin: 0 }}>
                    {current ? `${current.name} (${current.nocCode})` : "Select operator"}
                </span>
                <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                >
                    <path d="M2 5l6 6 6-6" stroke="#1d70b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <ul style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    backgroundColor: "#fff",
                    border: "1px solid #b1b4b6",
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    zIndex: 100,
                    maxHeight: "300px",
                    overflowY: "auto",
                    minWidth: "320px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}>
                    {operators.map(op => (
                        <li
                            key={op.nocCode}
                            onClick={() => handleSelect(op)}
                            onMouseEnter={() => setHovered(op.nocCode)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                backgroundColor: hovered === op.nocCode ? "#1d70b8" : "#fff",
                                color: hovered === op.nocCode ? "#fff" : "#0b0c0c",
                            }}
                        >
                            <span className="govuk-body" style={{ margin: 0, color: "inherit" }}>
                                {op.name} ({op.nocCode})
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};