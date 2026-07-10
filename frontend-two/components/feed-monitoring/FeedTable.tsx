import dynamic from "next/dynamic";
import Link from "next/link";
import {
  FeedMonitoringListQuery,
  VehicleStatFragment,
} from "../../src/generated/graphql";
import { formatISODateStringToRelativeTime } from "@/utils/date-formatter";
import { SortedPaginatedTable } from "../table/SortedPaginatedTable";
import type { SortableTableRow } from "../table/SortableTable";
import Image from "next/image";

type FeedMonitoringOperatorData =
  FeedMonitoringListQuery["operatorsFeedMonitoring"][number];
type VehicleCountData = {
  operatorId: string;
  last24Hours: VehicleStatFragment[];
};

const VehicleSparkline = dynamic(
  () => import("./VehicleSparkline").then((mod) => mod.VehicleSparkline),
  { ssr: false },
);

function getRowValue(
  data: FeedMonitoringOperatorData,
  column: string,
): string | number {
  switch (column) {
    case "nocCode":
      return data.nocCode;
    case "name":
      return data.name;
    case "availability":
      return data.feedMonitoring?.availability ?? -1;
    case "updateFrequency":
      return data.feedMonitoring?.liveStats?.updateFrequency ?? -1;
    case "lastOutage":
      return data.feedMonitoring?.lastOutage ?? "";
    case "unavailableSince":
      return data.feedMonitoring?.unavailableSince ?? "";
    default:
      return "";
  }
}

interface FeedTableProps {
  title: string;
  active: boolean;
  data: FeedMonitoringOperatorData[];
  vehicleCountData: VehicleCountData[];
}

export const FeedTable = ({
  title,
  active,
  data,
  vehicleCountData,
}: FeedTableProps) => {
  const columns = [
    { key: "icon", label: "", sortable: false },
    { key: "nocCode", label: "NOC", sortable: false },
    { key: "name", label: "Operator", sortable: false },
    { key: "availability", label: "Feed availability", sortable: true },
    { key: "updateFrequency", label: "Update frequency", sortable: true },
    {
      key: active ? "lastOutage" : "unavailableSince",
      label: active ? "Last outage" : "Unavailable since",
      sortable: true,
    },
    { key: "vehicleCount", label: "\u200B", sortable: false },
  ];

  const renderRow = (op: FeedMonitoringOperatorData): SortableTableRow => {
    const sparklineStats =
      vehicleCountData.find((v) => v.operatorId === op.operatorId)
        ?.last24Hours ?? [];
    return {
      key: op.operatorId ?? op.nocCode,
      icon: active ? (
        <Image
          src="/assets/icons/check-in-circle-solid.svg"
          className="feed-table__check"
          alt="Active Feed"
          width={36}
          height={36}
        />
      ) : (
        <Image
          src="/assets/icons/cross-in-circle-solid.svg"
          className="feed-table__cross"
          alt="Inactive Feed"
          width={36}
          height={36}
        />
      ),
      nocCode: op.nocCode,
      name: (
        <Link
          className="govuk-link font-bold"
          href={`/feed-monitoring/${op.nocCode}`}
        >
          {op.name}
        </Link>
      ),
      availability:
        op.feedMonitoring?.availability != null
          ? `${(op.feedMonitoring.availability * 100).toFixed(1)}%`
          : "-",
      updateFrequency: op.feedMonitoring?.liveStats?.updateFrequency
        ? `${op.feedMonitoring.liveStats.updateFrequency}s`
        : "-",
      lastOutage: (
        <span>
          {" "}
          {formatISODateStringToRelativeTime(
            op.feedMonitoring?.lastOutage ?? "",
          )}{" "}
        </span>
      ),
      unavailableSince: (
        <span style={{ color: "#d9221a", fontWeight: "bold" }}>
          {" "}
          {formatISODateStringToRelativeTime(
            op.feedMonitoring?.unavailableSince ?? "",
          )}{" "}
        </span>
      ),
      vehicleCount: <VehicleSparkline data={sparklineStats} />,
    };
  };

  return (
    <SortedPaginatedTable
      columns={columns}
      data={data}
      getRowValue={getRowValue}
      renderRow={renderRow}
      title={title}
      paginationNoun={"feed"}
    />
  );
};
