import { OperatorDashboard } from "@/types/dashboard";
import { Box } from "@/components/shared/Box";
import { Status } from "@/components/shared/Status";
import { Tooltip } from "@/components/shared/Tooltip";
import { LinkWithArrow } from "@/components/shared/LinkWithArrow";

interface FeedStatusSummaryProps {
  operators: OperatorDashboard[];
}

export const FeedStatusSummary = ({ operators }: FeedStatusSummaryProps) => (
  <Box className="app-feed-status-summary">
    <h2 className="govuk-heading-m">Feed status</h2>
    <table className="feed-status-summary">
      <thead>
        <tr>
          <th className="feed-status-summary__heading">
            <span className="govuk-visually-hidden">Status</span>
          </th>
          <th className="feed-status-summary__heading">
            <span className="govuk-visually-hidden">Operators</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {operators.length === 0 ? (
          <tr>
            <td
              className="feed-status-summary__operator feed-status-summary__operator--muted"
              colSpan={2}
            >
              No operators available.
            </td>
          </tr>
        ) : (
          operators.map((operator) => (
            <tr key={operator.operatorId}>
              <td className="feed-status-summary__status">
                <Status
                  active={Boolean(operator.feedMonitoring?.feedStatus)}
                  size="small"
                  label={false}
                />
              </td>
              <td className="feed-status-summary__operator">
                <Tooltip message={operator.operatorId} selectable>
                  <span>{operator.name}</span>
                </Tooltip>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
    <div className="feed-status-summary__footer">
      <LinkWithArrow href="/feed-monitoring">NOC feed monitoring</LinkWithArrow>
    </div>
  </Box>
);
