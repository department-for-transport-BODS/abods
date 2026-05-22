// TODO:NOW: Check old code and change 0s to dashes
import { useMemo, useEffect, useState } from "react";
import { PagingPanel } from "../shared/PagingPanel";
import dynamic from "next/dynamic";
import { DistanceData } from "@/types/distances";

const SortableTable = dynamic(
    () => import("kainossoftwareltd-govuk-react-kainos").then(mod => mod.SortableTable),
    { ssr: false }
);

type SortOrder = "asc" | "desc" | "none";

const PAGE_SIZE = 10;

function getRowValue(row: DistanceData, column: string): string | number {
    switch (column) {
        case "operatorName": return row.operatorName ?? "";
        case "nocLineAndServiceCode": return row.nocLineAndServiceCode?.split("-").pop() ?? "";
        case "lineName": return row.lineName ?? "";
        case "distance": return row.distance ?? 0;
        case "avlDistance": return row.avlDistance ?? 0;
        case "avlDistancePercent": return (row.distance && row.avlDistance != null)
            ? row.avlDistance / row.distance
            : 0;
        default: return "";
    }
}

interface DistanceTableProps {
    data: DistanceData[];
}

export const DistanceTable = ({ data }: DistanceTableProps) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>("none");

    const columnHeaders = [
        { key: "operatorName", label: "Operator", sortable: true },
        { key: "nocLineAndServiceCode", label: "Service Code", sortable: true },
        { key: "lineName", label: "Service", sortable: true },
        { key: "distance", label: "Distance excluding dead runs (km)", sortable: true },
        { key: "avlDistance", label: "Distance of journeys with AVL (km)", sortable: true },
        { key: "avlDistancePercent", label: "Distance of journeys with AVL (%)", sortable: true },
    ];

    // Set to page 0 if data changes
    useEffect(() => {
        setCurrentPage(0);
    }, [data]);

    // Sort the full dataset before paging
    const sortedData = useMemo(() => {
        if (!sortColumn || sortOrder === "none") return data;
        return [...data].sort((a, b) => {
            const aVal = getRowValue(a, sortColumn);
            const bVal = getRowValue(b, sortColumn);
            if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
            if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortColumn, sortOrder]);

    const handleTableSorting = (column: string, order: SortOrder) => {
        setSortColumn(column);
        setSortOrder(order);
        setCurrentPage(0);
    };

    // Calculate totals for the full data set
    const totals = useMemo(() => {
        if (!data.length) return null;
        let totalDistance = 0;
        let totalAvlDistance = 0;

        data.forEach(row => {
            if (row.distance != null) totalDistance += row.distance / 1000;
            if (row.avlDistance != null) totalAvlDistance += row.avlDistance / 1000;
        });

        const avlPercent = totalDistance > 0
            ? `${((totalAvlDistance / totalDistance) * 100).toFixed(1)}%`
            : "-";

        return {
            operatorName: "",
            nocLineAndServiceCode: "",
            lineName: "",
            distance: <strong>{totalDistance.toFixed(2)}</strong>,
            avlDistance: <strong>{totalAvlDistance.toFixed(2)}</strong>,
            avlDistancePercent: <strong>{avlPercent}</strong>,
        };
    }, [data]);

    // Page the sorted data
    const paged = useMemo(() => {
        const start = currentPage * PAGE_SIZE;
        return sortedData.slice(start, start + PAGE_SIZE);
    }, [sortedData, currentPage]);

    // Map paged data to display rows
    const rows = useMemo(() => {
        const mapped = paged.map((row) => {
            const distance = row.distance ? row.distance / 1000 : null;
            const avlDistance = row.avlDistance ? row.avlDistance / 1000 : null;
            const avlPercent = distance && avlDistance != null
                ? `${((avlDistance / distance) * 100).toFixed(1)}%`
                : "-";

            return {
                operatorName: row.operatorId ? `${row.operatorName} (${row.operatorId})` : row.operatorName ?? "-",
                nocLineAndServiceCode: row.nocLineAndServiceCode?.split("-").pop() ?? "-",
                lineName: row.lineName ? `${row.lineName}-${row.serviceName ?? "NA"}` : "-",
                distance: distance != null ? distance.toFixed(2) : "-",
                avlDistance: avlDistance != null ? avlDistance.toFixed(2) : "-",
                avlDistancePercent: avlPercent,
            };
        });

        // Totals row is always pinned to the top, outside of sort/page
        return totals ? [totals, ...mapped] : mapped;
    }, [paged, totals]);

    return(
        <>
            <SortableTable head={columnHeaders} rows={rows} onSort={handleTableSorting}></SortableTable>
            {data.length === 0 && (
                <div className="govuk-body govuk-!-margin-top-4 govuk-!-margin-bottom-4 text-center">
                    No operator data found
                </div>
            )}
            <div className="flex justify-end">
                <div className="w-1/2">
                    <PagingPanel
                        currentPage={currentPage}
                        totalPages={Math.ceil(data.length / PAGE_SIZE)}
                        pageSize={PAGE_SIZE}
                        rowCount={data.length}
                        noun="operator"
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </>
    );
};