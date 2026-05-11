export const FeedStatusSummaryStat = ({ title, value }: { title: string, value: string | number }) => {
    const active = value === "Active";
    
    return (
    <div className="bg-white flex flex-col" style={{ borderTop: "2px solid #cecece" }}>
        <span className="govuk-body mt-4" style={{ color: "#484949" }}>{title}</span>
        <div className="flex items-center justify-start" style={{ gap: "12px" }}>
            {active
                ? <img src="/assets/icons/check-in-circle-solid.svg"
                    style={{ width: "36px", height: "36px", filter: "invert(27%) sepia(89%) saturate(1000%) hue-rotate(120deg) brightness(90%)" }} />
                : <img src="/assets/icons/cross-in-circle-solid.svg"
                    style={{ width: "36px", height: "36px", filter: "invert(24%) sepia(82%) saturate(4000%) hue-rotate(350deg) brightness(85%)" }} />
            }
            <span className="font-bold" style={{ fontSize: "36px", color: active ? "green" : "#d9221a" }}>{value}</span>
        </div>
    </div>
);
}