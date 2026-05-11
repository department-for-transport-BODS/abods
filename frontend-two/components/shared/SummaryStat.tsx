import { useState } from "react";


export const SummaryStat = ({ title, value, tooltip }: { title: string, value: string | number, tooltip?: string }) => {
    const [visible, setVisible] = useState(false);

    return (
        <div className="bg-white flex flex-col" style={{ borderTop: "2px solid #cecece" }}>
            <span className="govuk-body mt-4" style={{ color: "#484949" }}>{title}</span>
            {tooltip ? (
                <span className="font-bold" style={{ fontSize: "36px" }}>
                    <span
                        style={{ position: "relative", display: "inline-block" }}
                        onMouseEnter={() => setVisible(true)}
                        onMouseLeave={() => setVisible(false)}
                    >
                        <span style={{ borderBottom: "4px dotted #000000", cursor: "help"}}>
                            {value}
                        </span>
                        {visible && (
                            <span className="govuk-body" style={{
                                position: "absolute",
                                bottom: "calc(100% + 12px)",
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: "300px",
                                backgroundColor: "#000000",
                                color: "#ffffff",
                                fontSize: "16px",
                                padding: "8px 12px",
                            }}>
                                {tooltip}
                                <span style={{
                                    position: "absolute",
                                    bottom: "-10px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    borderLeft: "12px solid transparent",
                                    borderRight: "12px solid transparent",
                                    borderTop: "12px solid #000000",
                                }} />
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