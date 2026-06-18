import { useMemo } from "react";
import { DistancesListQuery } from "../../src/generated/graphql";
import { SortedPaginatedTable } from "../table/SortedPaginatedTable";
import type { SortableTableRow } from "../table/SortableTable";

type DistanceData = DistancesListQuery["distances"][number];

const columns = [
  { key: "operatorName", label: "Operator", sortable: true },
  { key: "nocLineAndServiceCode", label: "Service Code", sortable: true },
  { key: "lineName", label: "Service", sortable: true },
  {
    key: "distance",
    label: "Distance excluding dead runs (km)",
    sortable: true,
  },
  {
    key: "avlDistance",
    label: "Distance of journeys with AVL (km)",
    sortable: true,
  },
  {
    key: "avlDistancePercent",
    label: "Distance of journeys with AVL (%)",
    sortable: true,
  },
];

function getRowValue(row: DistanceData, column: string): string | number {
  switch (column) {
    case "operatorName":
      return row.operatorName ?? "";
    case "nocLineAndServiceCode":
      return row.nocLineAndServiceCode?.split("-").pop() ?? "";
    case "lineName":
      return row.lineName ?? "";
    case "distance":
      return row.distance ?? 0;
    case "avlDistance":
      return row.avlDistance ?? 0;
    case "avlDistancePercent":
      return row.distance && row.avlDistance != null
        ? row.avlDistance / row.distance
        : 0;
    default:
      return "";
  }
}

function renderRow(row: DistanceData): SortableTableRow {
  const distance = row.distance ? row.distance / 1000 : null;
  const avlDistance = row.avlDistance ? row.avlDistance / 1000 : null;
  const avlPercent =
    distance && avlDistance != null
      ? `${((avlDistance / distance) * 100).toFixed(1)}%`
      : "-";

  return {
    key: `${row.operatorId ?? ""}-${row.nocLineAndServiceCode ?? ""}`,
    operatorName: row.operatorId
      ? `${row.operatorName} (${row.operatorId})`
      : row.operatorName ?? "-",
    nocLineAndServiceCode: row.nocLineAndServiceCode?.split("-").pop() ?? "-",
    lineName: row.lineName ? `${row.lineName}-${row.serviceName ?? "NA"}` : "-",
    distance: distance != null ? distance.toFixed(2) : "-",
    avlDistance: avlDistance != null ? avlDistance.toFixed(2) : "-",
    avlDistancePercent: avlPercent,
  };
}

interface DistanceTableProps {
  data: DistanceData[];
}

export const DistanceTable = ({ data }: DistanceTableProps) => {
  const totalsRow = useMemo<SortableTableRow | null>(() => {
    if (!data.length) return null;
    let totalDistance = 0;
    let totalAvlDistance = 0;

    data.forEach((row) => {
      if (row.distance != null) totalDistance += row.distance / 1000;
      if (row.avlDistance != null) totalAvlDistance += row.avlDistance / 1000;
    });

    const avlPercent =
      totalDistance > 0
        ? `${((totalAvlDistance / totalDistance) * 100).toFixed(1)}%`
        : "-";

    return {
      key: "totals",
      operatorName: "",
      nocLineAndServiceCode: "",
      lineName: "",
      distance: <strong>{totalDistance.toFixed(2)}</strong>,
      avlDistance: <strong>{totalAvlDistance.toFixed(2)}</strong>,
      avlDistancePercent: <strong>{avlPercent}</strong>,
    };
  }, [data]);

  return (
    <SortedPaginatedTable
      columns={columns}
      data={data}
      getRowValue={getRowValue}
      renderRow={renderRow}
      pinnedRows={totalsRow ? [totalsRow] : undefined}
      emptyMessage="No operator data found"
      paginationNoun={"operator"}
    />
  );
};
