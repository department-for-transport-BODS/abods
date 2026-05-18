import { useMemo, useState } from "react";
import { PagingPanel } from "../shared/PagingPanel";
import { FeedMonitoringOperatorData, VehicleCountData } from "@/types/feed-monitoring";
import { DateTime } from "luxon";
import dynamic from "next/dynamic";

const SortableTable = dynamic(
    () => import("kainossoftwareltd-govuk-react-kainos").then(mod => mod.SortableTable),
    { ssr: false }
);

const VehicleSparkline = dynamic(
    () => import("./VehicleSparkline").then(mod => mod.VehicleSparkline),
    { ssr: false }
);

type SortOrder = "asc" | "desc" | "none";

const PAGE_SIZE = 10;

function getRowValue(data: FeedMonitoringOperatorData, column: string): string | number {
    switch (column) {
        case "nocCode": return data.nocCode;
        case "name": return data.name;
        case "availability": return data.feedMonitoring?.availability ?? -1;
        case "updateFrequency": return data.feedMonitoring?.liveStats?.updateFrequency ?? -1;
        case "lastOutage": return data.feedMonitoring?.lastOutage ?? "";
        case "unavailableSince": return data.feedMonitoring?.unavailableSince ?? "";
        default: return "";
    }
}

// Translate ISO date string to relative time (e.g. "2 hours ago")
function translateToRelativeTime(date: string): string {
    if (!date) return "-";
    const relative = DateTime.fromISO(date, { zone: "utc" }).toRelative();
    return relative ?? "-";
}

export const FeedTable = ({ title, active, data, vehicleCountData }: { title: string, active: boolean, data: FeedMonitoringOperatorData[], vehicleCountData: VehicleCountData[] }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>("none");

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

    const totalPages = Math.ceil(sortedData.length / PAGE_SIZE);
    const pageData = sortedData.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    const handleTableSorting = (column: string, order: SortOrder) => {
        setSortColumn(column);
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
        // TODO:NOW Do we want to add a column name for the graph - Not very clear what the data is
        { key: "vehicleCount", label: "Actual vehicle counts within the last 24 hours", sortable: false }
    ];

    const rows = pageData.map((op) => {
        const sparklineStats = vehicleCountData.find(v => v.operatorId === op.operatorId)?.last24Hours ?? [];
        return {
            icon: active 
                ? <img src="/assets/icons/check-in-circle-solid.svg" className="feed-table__check" />
                : <img src="/assets/icons/cross-in-circle-solid.svg" className="feed-table__cross" />,
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
            vehicleCount: <VehicleSparkline data={sparklineStats}/>
        };
    });
    return (
        <>
            <h2 className="govuk-heading-m">{title}</h2>
            <SortableTable head={columnHeaders} rows={rows} onSort={handleTableSorting}></SortableTable>
            <div className="flex justify-end">
                <div className="w-2/5">
                    <PagingPanel
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={PAGE_SIZE}
                        rowCount={data.length}
                        noun="feed"
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </>
    );
}