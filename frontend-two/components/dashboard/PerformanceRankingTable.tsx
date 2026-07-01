import Link from "next/link";
import { DateTime } from "luxon";
import {
  DashboardOperatorListQuery,
  RankingOrder,
  ServicePunctualityType,
} from "../../src/generated/graphql";
import { Tooltip } from "@/components/shared/SummaryStat/Tooltip";
import { ServiceRankingItem, ServiceRankingResult } from "@/types/dashboard";

interface PerformanceRankingTableProps {
  services: ServiceRankingResult;
  loaded: boolean;
  errored: boolean;
  nocCode: string | null;
  operators: DashboardOperatorListQuery["operatorsFeedMonitoring"];
  order: RankingOrder;
  onChangeOrder: (order: RankingOrder) => void;
  trendFrom?: DateTime;
  trendTo?: DateTime;
  periodLabel: string;
}

type TrendDirection = "increase" | "decrease";

const buildServiceName = (service: ServiceRankingItem) => {
  const number = service.lineInfo?.serviceNumber ?? "unknown";
  const name = service.lineInfo?.serviceName ?? "unknown";
  return `${number}: ${name}`;
};

const calculateOnTimePct = (service: ServiceRankingItem) => {
  const total =
    (service.onTime ?? 0) + (service.early ?? 0) + (service.late ?? 0);
  return total > 0 ? ((service.onTime ?? 0) / total) * 100 : 0;
};

const calculateTrend = (
  service: ServiceRankingItem,
): { diff: string; direction: TrendDirection } | null => {
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
    direction: diff <= 0 ? "decrease" : "increase",
  };
};

const buildTrendClassName = (direction: TrendDirection) =>
  `change change--small change--${direction}`;

const getOperatorName = (
  operators: DashboardOperatorListQuery["operatorsFeedMonitoring"],
  noc: string | null | undefined,
) => operators.find((op) => op.nocCode === noc)?.name ?? "Unknown";

export const PerformanceRankingTable = ({
  services,
  loaded,
  errored,
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

  const stateMessage = !loaded
    ? "Loading..."
    : errored
      ? "There was an error fetching the service data"
      : services.length === 0
        ? "No service data for the selected time period"
        : null;

  return (
    <div className="app-performance-ranking">
      <div className="tabs">
        <ul className="tabs__list">
          <li
            className={`tabs__list-item ${order === "descending" ? "tabs__list-item--selected" : ""}`}
            tabIndex={0}
            onClick={() => onChangeOrder(RankingOrder.Descending)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onChangeOrder(RankingOrder.Descending);
              }
            }}
          >
            Top 3
          </li>
          <li
            className={`tabs__list-item ${order === "ascending" ? "tabs__list-item--selected" : ""}`}
            tabIndex={0}
            onClick={() => onChangeOrder(RankingOrder.Descending)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onChangeOrder(RankingOrder.Ascending);
              }
            }}
          >
            Bottom 3
          </li>
        </ul>
      </div>

      <div
        className={`ranking-table__content ${!loaded ? "ranking-table__content--loading" : ""}`}
        aria-busy={!loaded}
      >
        <table className="ranking-table__data">
          <colgroup>
            <col className="ranking-table__col-service" />
            {nocCode === null ? (
              <col className="ranking-table__col-operator" />
            ) : null}
            <col className="ranking-table__col-stat" />
            <col className="ranking-table__col-trend" />
          </colgroup>
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
                      className="govuk-link ranking-table__link"
                      href={noc ? `/on-time/${noc}/${lineId}` : "/on-time"}
                    >
                      {buildServiceName(service)}
                    </Link>
                  </td>
                  {nocCode === null ? (
                    <td className="ranking-table__operator">
                      <Tooltip message={noc} selectable>
                        <span className="ranking-table__operator-text">
                          {getOperatorName(operators, noc)}
                        </span>
                      </Tooltip>
                    </td>
                  ) : null}
                  <td className="govuk-!-font-weight-bold ranking-table__stat">
                    {pct.toFixed(2)}%
                  </td>
                  <td className="ranking-table__trend">
                    {trend ? (
                      <span className={buildTrendClassName(trend.direction)}>
                        <Tooltip message={tooltip} underline>
                          <span className="change__value">{trend.diff}%</span>
                        </Tooltip>
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {stateMessage ? (
          !loaded ? (
            <div
              className="ranking-table__loading"
              role="status"
              aria-live="polite"
            >
              <span className="govuk-visually-hidden">Loading...</span>
              <span className="ranking-table__loading-dots" aria-hidden="true">
                <span className="ranking-table__loading-dot" />
                <span className="ranking-table__loading-dot" />
                <span className="ranking-table__loading-dot" />
              </span>
            </div>
          ) : (
            <div className="ranking-table__no-data">
              <span className="govuk-body">{stateMessage}</span>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};
