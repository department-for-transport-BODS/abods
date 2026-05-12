import { useMemo, useState } from "react";
import { PagingPanel } from "../shared/PagingPanel";
import dynamic from "next/dynamic";
import { Distance } from "@/types/distances";

const SortableTable = dynamic(
    () => import("kainossoftwareltd-govuk-react-kainos").then(mod => mod.SortableTable),
    { ssr: false }
);

const PAGE_SIZE = 10;

export const DistanceTable = ({ data }: { data: Distance[] }) => {
    const [currentPage, setCurrentPage] = useState(0);

    const paged = useMemo(() => {
        const start = currentPage * PAGE_SIZE;
        return data.slice(start, start + PAGE_SIZE);
    }, [data, currentPage]);

    const columnHeaders = [
        { key: "operatorName", label: "Operator", sortable: true },
        { key: "nocLineAndServiceCode", label: "Service Code", sortable: true },
        { key: "lineName", label: "Service", sortable: true },
        { key: "distance", label: "Distance excluding dead runs (km)", sortable: true },
        { key: "avlDistance", label: "Distance of journeys with AVL (km)", sortable: true },
        { key: "avlDistancePercent", label: "Distance of journeys with AVL (%)", sortable: true },
    ];

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
            operatorName: "-",
            nocLineAndServiceCode: "-",
            lineName: "-",
            distance: totalDistance.toFixed(2),
            avlDistance: totalAvlDistance.toFixed(2),
            avlDistancePercent: avlPercent,
        };
    }, [data]);

    // Data from db
    const rows = useMemo(() => {
        const mapped = paged.map((row) => {
            const distance = row.distance != null ? row.distance / 1000 : null;
            const avlDistance = row.avlDistance != null ? row.avlDistance / 1000 : null;
            const avlPercent = distance && avlDistance != null
                ? `${((avlDistance / distance) * 100).toFixed(2)}%`
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

        // Only show totals row if there is data
        return totals ? [totals, ...mapped] : mapped;
    }, [paged, totals]);

    return(
        <>
            <SortableTable head={columnHeaders} rows={rows}></SortableTable>
            {data.length === 0 && (
                <div className="govuk-body govuk-!-margin-top-4 govuk-!-margin-bottom-4 text-center">
                    No operator data found
                </div>
            )}
            <div className="flex justify-end">
                <div className="w-2/5">
                    <PagingPanel
                        currentPage={currentPage}
                        totalPages={Math.ceil(data.length / PAGE_SIZE)}
                        pageSize={PAGE_SIZE}
                        rowCount={data.length}
                        noun="result"
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </>
    );
};