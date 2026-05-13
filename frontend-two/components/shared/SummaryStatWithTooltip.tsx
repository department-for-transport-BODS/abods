import { useState } from "react";

export const SummaryStat = ({ title, value, tooltip }: { title: string, value: string | number, tooltip?: string }) => {
    const [visible, setVisible] = useState(false);

    return (
        <div className="bg-white flex flex-col" style={{ borderTop: "2px solid #cecece" }}>
            <span className="govuk-body mt-4" style={{ color: "#484949" }}>{title}</span>
            {tooltip ? (
                <span className="font-bold" style={{ fontSize: "36px" }}>
                    <span
                        className="summary-stat"
                        style={{ position: "relative", display: "inline-block" }}
                        onMouseEnter={() => setVisible(true)}
                        onMouseLeave={() => setVisible(false)}
                    >
                        <span style={{ borderBottom: "4px dotted #000000", cursor: "help"}}>
                            {value}
                        </span>
                        {visible && (
                            <span className="govuk-body tooltip">
                                {tooltip}
                                <span className="triangle" />
                            </span>
                        )}
                    </span>
                </span>
            ) : (
                <span className="font-bold" style={{ fontSize: "36px" }}>{value}</span>
            )}
        </div>
    );
}