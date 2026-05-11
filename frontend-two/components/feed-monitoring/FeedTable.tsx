import { useMemo, useState } from "react";
import { PagingPanel } from "../shared/PagingPanel";
import { FeedMonitoringOperator } from "@/types/feed-monitoring";
import { DateTime } from "luxon";
import dynamic from "next/dynamic";
import { Box } from "../shared/Box";

// TODO:NOW Figure out how to add graph in table and what the graph is 

const SortableTable = dynamic(
    () => import("kainossoftwareltd-govuk-react-kainos").then(mod => mod.SortableTable),
    { ssr: false }
);

type SortOrder = "asc" | "desc" | "none";

const PAGE_SIZE = 10;

function getRowValue(op: FeedMonitoringOperator, key: string): string | number {
    switch (key) {
        case "nocCode": return op.nocCode;
        case "name": return op.name;
        case "availability": return op.feedMonitoring?.availability ?? -1;
        case "updateFrequency": return op.feedMonitoring?.liveStats?.updateFrequency ?? -1;
        case "lastOutage": return op.feedMonitoring?.lastOutage ?? "";
        case "unavailableSince": return op.feedMonitoring?.unavailableSince ?? "";
        default: return "";
    }
}

function translateToRelativeTime(date: string): string {
    if (!date) return "-";
    const relative = DateTime.fromISO(date, { zone: "utc" }).toRelative();
    return relative ?? "-";
}

export const FeedTable = ({ active, operators }: { active: boolean, operators: FeedMonitoringOperator[] }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>("none");

    const sortedOperators = useMemo(() => {
        if (!sortKey || sortOrder === "none") return operators;
        return [...operators].sort((a, b) => {
            const aVal = getRowValue(a, sortKey);
            const bVal = getRowValue(b, sortKey);
            if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
            if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [operators, sortKey, sortOrder]);

    const totalPages = Math.ceil(sortedOperators.length / PAGE_SIZE);
    const pageData = sortedOperators.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    // TODO:NOW Change the name of this function
    const handleSort = (key: string, order: SortOrder) => {
        setSortKey(key);
        setSortOrder(order);
        setCurrentPage(0);
    };

    const columnHeaders = [
        { key: "icon", label: "", sortable: false },
        { key: "nocCode", label: "NOC", sortable: false },
        { key: "name", label: "Operator", sortable: false },
        { key: "availability", label: "Feed availability", sortable: true },
        { key: "updateFrequency", label: "Update frequency", sortable: true },
        { key: active ? "lastOutage" : "unavailableSince", label: active ? "Last outage" : "Unavailable since", sortable: true },
        { key: "graph", label: "", sortable: false }
    ];

    // TODO:NOW Review some the variable names so that the code is more readable 
    const rows = pageData.map((op) => ({
        icon: active 
            ? <img src="/assets/icons/check-in-circle-solid.svg" 
                style={{ width: "24px", height: "24px", filter: "invert(27%) sepia(89%) saturate(1000%) hue-rotate(120deg) brightness(90%)" }} />
            : <img src="/assets/icons/cross-in-circle-solid.svg" 
                style={{ width: "24px", height: "24px", filter: "invert(24%) sepia(82%) saturate(4000%) hue-rotate(350deg) brightness(85%)" }} />,
        nocCode: op.nocCode,
        name: <a className="govuk-link font-bold" href={`/feed-monitoring/${op.nocCode}`}>{op.name}</a>,
        availability: op.feedMonitoring?.availability != null
            ? `${(op.feedMonitoring.availability * 100).toFixed(1)}%`
            : "-",
        updateFrequency: op.feedMonitoring?.liveStats?.updateFrequency
            ? `${op.feedMonitoring.liveStats.updateFrequency}s`
            : "-",
        lastOutage: <span> {translateToRelativeTime(op.feedMonitoring?.lastOutage ?? "")} </span>,
        unavailableSince: <span style={{ color: "#d9221a", fontWeight: "bold" }}> {translateToRelativeTime(op.feedMonitoring?.unavailableSince ?? "")} </span>,
        graph: <Box children={undefined} />
    }));

     return (
        <>
            <SortableTable head={columnHeaders} rows={rows} onSort={handleSort}></SortableTable>
            <div className="flex justify-end">
                <div className="w-2/5">
                    <PagingPanel
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={PAGE_SIZE}
                        rowCount={operators.length}
                        noun="feed"
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </>
    );
}