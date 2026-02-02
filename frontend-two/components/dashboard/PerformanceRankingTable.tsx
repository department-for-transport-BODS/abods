import Link from "next/link";
import { DateTime } from "luxon";
import {
  OperatorDashboard,
  RankingOrder,
  ServicePunctuality,
} from "@/types/dashboard";

interface PerformanceRankingTableProps {
  services: ServicePunctuality[];
  loaded: boolean;
  nocCode: string | null;
  operators: OperatorDashboard[];
  order: RankingOrder;
  onChangeOrder: (order: RankingOrder) => void;
  trendFrom?: DateTime;
  trendTo?: DateTime;
  periodLabel: string;
}

const buildServiceName = (service: ServicePunctuality) => {
  const number = service.lineInfo?.serviceNumber ?? "unknown";
  const name = service.lineInfo?.serviceName ?? "unknown";
  return `${number}: ${name}`;
};

const calculateOnTimePct = (service: ServicePunctuality) => {
  const total =
    (service.onTime ?? 0) + (service.early ?? 0) + (service.late ?? 0);
  return total > 0 ? ((service.onTime ?? 0) / total) * 100 : 0;
};

const calculateTrend = (service: ServicePunctuality) => {
  if (!service.trend) return null;
  const total =
    (service.onTime ?? 0) + (service.early ?? 0) + (service.late ?? 0);
  const totalLast =
    (service.trend.onTime ?? 0) +
    (service.trend.early ?? 0) +
    (service.trend.late ?? 0);
  const currentPct = total > 0 ? ((service.onTime ?? 0) / total) * 100 : 0;
  const lastPct =
    totalLast > 0 ? ((service.trend.onTime ?? 0) / totalLast) * 100 : 0;
  const diff = currentPct - lastPct;
  return {
    diff: diff.toFixed(2),
    direction: diff >= 0 ? "increase" : "decrease",
  };
};

const getOperatorName = (
  operators: OperatorDashboard[],
  noc: string | null | undefined,
) => operators.find((op) => op.nocCode === noc)?.name ?? "Unknown";

export const PerformanceRankingTable = ({
  services,
  loaded,
  nocCode,
  operators,
  order,
  onChangeOrder,
  trendFrom,
  trendTo,
  periodLabel,
}: PerformanceRankingTableProps) => {
  const tooltip =
    trendFrom && trendTo
      ? `Change in on-time percentage from ${periodLabel} (${trendFrom.toFormat("d MMMM")} - ${trendTo.toFormat("d MMMM")})`
      : `Change in on-time percentage from ${periodLabel}`;

  return (
    <div>
      <div className="tabs">
        <ul className="tabs__list">
          <li
            className={`tabs__list-item ${order === "descending" ? "tabs__list-item--selected" : ""}`}
            tabIndex={0}
            onClick={() => onChangeOrder("descending")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onChangeOrder("descending");
              }
            }}
          >
            Top 3
          </li>
          <li
            className={`tabs__list-item ${order === "ascending" ? "tabs__list-item--selected" : ""}`}
            tabIndex={0}
            onClick={() => onChangeOrder("ascending")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onChangeOrder("ascending");
              }
            }}
          >
            Bottom 3
          </li>
        </ul>
      </div>

      {!loaded ? (
        <div className="ranking-table__loading">
          <p className="govuk-body">Loading...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="ranking-table__no-data">
          <span className="govuk-body">
            No service data for the selected time period
          </span>
        </div>
      ) : (
        <table className="ranking-table__data">
          <thead>
            <tr>
              <th className="govuk-visually-hidden">Service</th>
              {nocCode === null ? (
                <th className="govuk-visually-hidden">Operator</th>
              ) : null}
              <th className="govuk-visually-hidden">On-time</th>
              <th className="govuk-visually-hidden">Change</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => {
              const pct = calculateOnTimePct(service);
              const trend = calculateTrend(service);
              const lineId = service.lineId ?? "";
              const noc = service.nocCode ?? "";
              return (
                <tr key={`${noc}-${lineId}`}>
                  <td className="ranking-table__service">
                    <Link
                      className="govuk-link"
                      href={noc ? `/on-time/${noc}/${lineId}` : "/on-time"}
                    >
                      {buildServiceName(service)}
                    </Link>
                  </td>
                  {nocCode === null ? (
                    <td className="ranking-table__operator">
                      {getOperatorName(operators, noc)}
                    </td>
                  ) : null}
                  <td className="govuk-!-font-weight-bold ranking-table__stat">
                    {pct.toFixed(2)}%
                  </td>
                  <td className="ranking-table__trend">
                    {trend ? (
                      <span title={tooltip}>
                        {trend.direction === "increase" ? "▲" : "▼"}{" "}
                        {trend.diff}%
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};
