import { clsx } from "clsx";
import styles from "./feed-status-summary.module.scss";
import { Box } from "@/components/shared/Box";
import { Status } from "@/components/shared/Status";
import { Tooltip } from "@/components/shared/Tooltip";
import { LinkWithArrow } from "@/components/shared/LinkWithArrow";
import { DashboardOperatorListQuery } from "../../src/generated/graphql";

interface FeedStatusSummaryProps {
  operators: DashboardOperatorListQuery["operatorsFeedMonitoring"];
}

export const FeedStatusSummary = ({ operators }: FeedStatusSummaryProps) => (
  <Box className="app-feed-status-summary">
    <h2 className="govuk-heading-m">Feed status</h2>
    <table className={styles.feedStatusSummary}>
      <thead>
        <tr>
          <th className={styles.heading}>
            <span className="govuk-visually-hidden">Status</span>
          </th>
          <th className={styles.heading}>
            <span className="govuk-visually-hidden">Operators</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {operators.length === 0 ? (
          <tr>
            <td className={styles.operatorMuted} colSpan={2}>
              No operators available.
            </td>
          </tr>
        ) : (
          operators.map((operator) => (
            <tr key={operator.operatorId}>
              <td className={styles.status}>
                <Status
                  active={Boolean(operator.feedMonitoring?.feedStatus)}
                  size="small"
                  label={false}
                />
              </td>
              <td>
                <Tooltip message={operator.operatorId} selectable>
                  <span>{operator.name}</span>
                </Tooltip>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
    <div className={styles.footer}>
      <LinkWithArrow href="/feed-monitoring">NOC feed monitoring</LinkWithArrow>
    </div>
  </Box>
);
