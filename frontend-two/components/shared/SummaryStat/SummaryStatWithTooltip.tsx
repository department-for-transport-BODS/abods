import { ReactNode, useState } from "react";

interface SummaryStatWithTooltipProps {
  title: string;
  value: string | number;
  tooltip?: ReactNode;
}

export const SummaryStatWithTooltip = ({
  title,
  value,
  tooltip,
}: SummaryStatWithTooltipProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="bg-white flex flex-col"
      style={{ borderTop: "2px solid #cecece" }}
    >
      <span className="govuk-body mt-4" style={{ color: "#484949" }}>
        {title}
      </span>
      {tooltip ? (
        <div className="font-bold" style={{ fontSize: "36px" }}>
          <div
            className="summary-stat"
            style={{ position: "relative", display: "inline-block" }}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
          >
            <span
              style={{ borderBottom: "4px dotted #000000", cursor: "help" }}
            >
              {value}
            </span>
            {visible && (
              <div className="govuk-body tooltip">
                {tooltip}
                <span className="triangle" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="font-bold" style={{ fontSize: "36px" }}>
          {value}
        </div>
      )}
    </div>
  );
};
