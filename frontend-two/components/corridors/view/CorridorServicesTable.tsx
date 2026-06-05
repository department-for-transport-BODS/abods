import { Duration } from "luxon";
import { SortedPaginatedTable } from "@/components/table/SortedPaginatedTable";
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

const COLUMNS = [
  { key: "service", label: "Service", sortable: true },
  { key: "noc", label: "NOC", sortable: true },
  { key: "operator", label: "Operator", sortable: true },
  { key: "scheduledTransits", label: "Scheduled transits", sortable: true },
  { key: "recordedTransits", label: "Recorded transits", sortable: true },
  { key: "averageJourneyTime", label: "Average journey time", sortable: true },
  { key: "averageSpeed", label: "Average speed", sortable: true },
];

const formatAverageJourneyTime = (service: CorridorStatsPerServiceType): string => {
  const recorded = service.recordedTransits ?? 0;
  const totalTransitTime = service.totalTransitTime ?? 0;
  if (!recorded || !totalTransitTime) return "0:00";
  return Duration.fromObject({ seconds: totalTransitTime / recorded }).toFormat("mm:ss");
};

export const CorridorServicesTable = ({ services, serviceLinks, isLoading }: Props) => {
  if (isLoading) {
    return <p className="govuk-body">Loading...</p>;
  }

  return (
    <SortedPaginatedTable
      columns={COLUMNS}
      data={services}
      initialSortKey="service"
      initialSortOrder="asc"
      emptyMessage="No services found."
      getRowValue={(service, column) => {
        switch (column) {
          case "service":
            return `${service.lineName ?? ""}: ${service.servicePatternName ?? ""}`;
          case "noc":
            return service.noc ?? "-";
          case "operator":
            return service.operatorName ?? "-";
          case "scheduledTransits":
            return service.scheduledTransits ?? 0;
          case "recordedTransits":
            return service.recordedTransits ?? 0;
          case "averageJourneyTime":
            return service.recordedTransits && service.totalTransitTime
              ? service.totalTransitTime / service.recordedTransits
              : 0;
          case "averageSpeed":
            return averageServiceSpeedLabel(serviceLinks, service);
          default:
            return "";
        }
      }}
      renderRow={(service) => ({
        key: `${service.noc ?? "unknown"}-${service.lineName}-${service.servicePatternName}`,
        service: `${service.lineName}: ${service.servicePatternName}`,
        noc: service.noc ?? "-",
        operator: service.operatorName ?? "-",
        scheduledTransits: service.scheduledTransits ?? 0,
        recordedTransits: service.recordedTransits ?? 0,
        averageJourneyTime: formatAverageJourneyTime(service),
        averageSpeed: averageServiceSpeedLabel(serviceLinks, service),
      })}
    />
  );
};
