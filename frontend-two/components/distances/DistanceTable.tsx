import { useMemo, useState } from "react";
import { PagingPanel } from "../shared/PagingPanel";
import dynamic from "next/dynamic";

const SortableTable = dynamic(
    () => import("kainossoftwareltd-govuk-react-kainos").then(mod => mod.SortableTable),
    { ssr: false }
);

const PAGE_SIZE = 10;

export const DistanceTable = ({}: {}) => {
    const [currentPage, setCurrentPage] = useState(0);

    const head = [
        { key: "operator", label: "Operator", sortable: true },
        { key: "serviceCode", label: "Service Code", sortable: true },
        { key: "service", label: "Service", sortable: true },
        { key: "distanceExcludingDeadRuns", label: "Distance excluding dead runs (km)", sortable: true },
        { key: "distanceWithAVL", label: "Distance of journeys with AVL (km)", sortable: true },
        { key: "distanceAVLPercentage", label: "Distance of journeys with AVL (%)", sortable: true },
    ]

    return(
        <>
            <SortableTable head={head} rows={[]}></SortableTable>
            <div className="flex justify-end">
                <div className="w-2/5">
                    <PagingPanel
                        currentPage={currentPage}
                        totalPages={2}
                        pageSize={PAGE_SIZE}
                        rowCount={20}
                        noun="feed"
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </>
    );
};