import { Duration } from "luxon";
import { averageServiceSpeedLabel } from "@/services/corridors/corridors-speed-utils";
import {
  CorridorStatsPerServiceType,
  ServiceLinkType,
} from "../../../src/generated/graphql";

interface Props {
  services: CorridorStatsPerServiceType[];
  serviceLinks: ServiceLinkType[];
  isLoading: boolean;
}

const formatAverageJourneyTime = (
  service: CorridorStatsPerServiceType,
): string => {
  const recorded = service.recordedTransits ?? 0;
  const totalTransitTime = service.totalTransitTime ?? 0;

  if (!recorded || !totalTransitTime) return "0:00";

  return Duration.fromObject({
    seconds: totalTransitTime / recorded,
  }).toFormat("mm:ss");
};

export const CorridorServicesTable = ({
  services,
  serviceLinks,
  isLoading,
}: Props) => {
  if (isLoading) {
    return <p className="govuk-body">Loading...</p>;
  }

  if (!services.length) {
    return (
      <div role="alert" className="govuk-body">
        No services found.
      </div>
    );
  }

  return (
    <table className="govuk-table">
      <thead className="govuk-table__head">
        <tr className="govuk-table__row">
          <th scope="col" className="govuk-table__header">
            Service
          </th>
          <th scope="col" className="govuk-table__header">
            NOC
          </th>
          <th scope="col" className="govuk-table__header">
            Operator
          </th>
          <th scope="col" className="govuk-table__header">
            Scheduled transits
          </th>
          <th scope="col" className="govuk-table__header">
            Recorded transits
          </th>
          <th scope="col" className="govuk-table__header">
            Average journey time
          </th>
          <th scope="col" className="govuk-table__header">
            Average speed
          </th>
        </tr>
      </thead>
      <tbody className="govuk-table__body">
        {services.map((service, index) => (
          <tr
            key={`${service.noc ?? "unknown"}-${service.lineName}-${service.servicePatternName}-${index}`}
            className="govuk-table__row"
          >
            <td className="govuk-table__cell">
              {service.lineName}: {service.servicePatternName}
            </td>
            <td className="govuk-table__cell">{service.noc ?? "-"}</td>
            <td className="govuk-table__cell">{service.operatorName ?? "-"}</td>
            <td className="govuk-table__cell">
              {service.scheduledTransits ?? 0}
            </td>
            <td className="govuk-table__cell">
              {service.recordedTransits ?? 0}
            </td>
            <td className="govuk-table__cell">
              {formatAverageJourneyTime(service)}
            </td>
            <td className="govuk-table__cell">
              {averageServiceSpeedLabel(serviceLinks, service)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
