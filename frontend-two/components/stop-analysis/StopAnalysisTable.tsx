import { useMemo, useState } from "react";
import { Direction, StopPerformanceRow } from "@/types/stop-analysis";
import { MultiselectCheckbox } from "./MultiselectCheckbox";
import SortableTable, { SortOrder, type SortableTableHeadCell, type SortableTableRow } from "./SortableTable";

interface StopAnalysisTableProps {
  data: StopPerformanceRow[];
  loading: boolean;
  errored: boolean;
  directions: Direction[];
  onDirectionsChange: (directions: Direction[]) => void;
  onStopNameClick: (stop: StopPerformanceRow) => void;
}

const formatPercent = (value: number | undefined | null): string => {
  if (value == null || isNaN(value) || !isFinite(value)) return "-";
  return `${(value * 100).toFixed(1)}%`;
};

const formatSeconds = (value: number | undefined | null): string => {
  if (value == null || isNaN(value)) return "-";
  const mins = Math.floor(Math.abs(value) / 60);
  const secs = Math.round(Math.abs(value) % 60);
  const sign = value < 0 ? "-" : "";
  return `${sign}${mins}:${secs.toString().padStart(2, "0")}`;
};

type SortKey =
  | "stopId"
  | "timingPoint"
  | "stopName"
  | "direction"
  | "scheduledDepartures"
  | "actualDepartures"
  | "averageScheduled"
  | "averageActual"
  | "averageDelay"
  | "onTime"
  | "early"
  | "late";

const SORT_ASC = SortOrder.ASC;

const compareValue = (a: string | number, b: string | number): number => {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
};

const getSortValue = (row: StopPerformanceRow, key: SortKey): string | number => {
  switch (key) {
    case "timingPoint":
      return row.timingPoint ? 1 : 0;
    case "direction":
      return row.direction ?? "";
    case "averageScheduled":
      return row.averageScheduled ?? Number.NEGATIVE_INFINITY;
    case "averageActual":
      return row.averageActual ?? Number.NEGATIVE_INFINITY;
    case "averageDelay":
      return row.averageDelay ?? Number.NEGATIVE_INFINITY;
    case "onTime":
      return row.onTime;
    case "early":
      return row.early;
    case "late":
      return row.late;
    case "scheduledDepartures":
      return row.scheduledDepartures;
    case "actualDepartures":
      return row.actualDepartures;
    case "stopName":
      return row.stopName;
    case "stopId":
    default:
      return row.stopId;
  }
};

export const StopAnalysisTable = ({
  data,
  loading,
  errored,
  directions,
  onDirectionsChange,
  onStopNameClick,
}: StopAnalysisTableProps) => {
  const [quickFilter, setQuickFilter] = useState("");
  const [sortState, setSortState] = useState<{ key: SortKey; order: SortOrder }>({
    key: "stopName",
    order: SORT_ASC,
  });

  const directionOptions = useMemo(
    () => [
      { label: "Inbound", value: "Inbound" },
      { label: "Outbound", value: "Outbound" },
    ],
    [],
  );

  const filteredData = useMemo(
    () =>
      data.filter(
        (row) =>
          directions.length === 0 ||
          directions.length === 2 ||
          (row.direction &&
            directions.includes(row.direction as Direction)),
      ),
    [data, directions],
  );

  const searchFilteredData = useMemo(() => {
    if (!quickFilter) return filteredData;
    const lower = quickFilter.toLowerCase();
    return filteredData.filter(
      (row) =>
        row.stopId.toLowerCase().includes(lower) ||
        row.stopName.toLowerCase().includes(lower) ||
        row.localityName.toLowerCase().includes(lower),
    );
  }, [filteredData, quickFilter]);

  const sortedRows = useMemo(() => {
    const rows = [...searchFilteredData];
    rows.sort((left, right) => {
      const leftValue = getSortValue(left, sortState.key);
      const rightValue = getSortValue(right, sortState.key);
      const result = compareValue(leftValue, rightValue);
      return sortState.order === SORT_ASC ? result : -result;
    });
    return rows;
  }, [searchFilteredData, sortState]);

  const tableHead = useMemo<Array<SortableTableHeadCell<SortableTableRow & { stopName: string }>>>(
    () => [
      { key: "stopId", label: "NAPTAN", sortable: true, sortOrder: sortState.key === "stopId" ? sortState.order : undefined },
      { key: "timingPoint", label: "TP", sortable: true, sortOrder: sortState.key === "timingPoint" ? sortState.order : undefined },
      {
        key: "stopName",
        label: "Name",
        sortable: true,
        sortOrder: sortState.key === "stopName" ? sortState.order : undefined,
        render: (row) => (
          <button
            type="button"
            className="govuk-link stop-analysis-table__stop-link"
            onClick={() => onStopNameClick(row as StopPerformanceRow)}
            title={`${(row as StopPerformanceRow).localityName}, ${(row as StopPerformanceRow).adminAreaName}`}
          >
            {row.stopName}
          </button>
        ),
      },
      { key: "direction", label: "Direction", sortable: true, sortOrder: sortState.key === "direction" ? sortState.order : undefined },
      { key: "scheduledDepartures", label: "Scheduled", sortable: true, sortOrder: sortState.key === "scheduledDepartures" ? sortState.order : undefined },
      { key: "actualDepartures", label: "Recorded", sortable: true, sortOrder: sortState.key === "actualDepartures" ? sortState.order : undefined },
      { key: "averageScheduled", label: "Av. Sched.", sortable: true, sortOrder: sortState.key === "averageScheduled" ? sortState.order : undefined },
      { key: "averageActual", label: "Av. Actual", sortable: true, sortOrder: sortState.key === "averageActual" ? sortState.order : undefined },
      { key: "averageDelay", label: "Av. Delay", sortable: true, sortOrder: sortState.key === "averageDelay" ? sortState.order : undefined },
      { key: "onTime", label: "On Time", sortable: true, sortOrder: sortState.key === "onTime" ? sortState.order : undefined },
      { key: "early", label: "Early", sortable: true, sortOrder: sortState.key === "early" ? sortState.order : undefined },
      { key: "late", label: "Late", sortable: true, sortOrder: sortState.key === "late" ? sortState.order : undefined },
    ],
    [onStopNameClick, sortState],
  );

  const tableRows = useMemo<Array<SortableTableRow & {
    stopName: string;
    localityName: string;
    adminAreaName: string;
  }>>(
    () => sortedRows.map((row) => ({
      key: `${row.stopId}-${row.direction}`,
      stopId: row.stopId,
      timingPoint: row.timingPoint ? "⏱" : "",
      stopName: row.stopName,
      localityName: row.localityName,
      adminAreaName: row.adminAreaName,
      direction: row.direction ?? "-",
      scheduledDepartures: row.scheduledDepartures,
      actualDepartures: `${row.actualDepartures} (${formatPercent(row.completedRatio)})`,
      averageScheduled: row.averageScheduled != null ? formatSeconds(row.averageScheduled) : "-",
      averageActual: row.averageActual != null ? formatSeconds(row.averageActual) : "-",
      averageDelay: row.averageDelay != null ? formatSeconds(row.averageDelay) : "-",
      onTime: `${row.onTime} (${formatPercent(row.onTimeRatio)})`,
      early: `${row.early} (${formatPercent(row.earlyRatio)})`,
      late: `${row.late} (${formatPercent(row.lateRatio)})`,
    })),
    [sortedRows],
  );

  const handleSort = (key: string, order: SortOrder) => {
    setSortState({ key: key as SortKey, order });
  };

  if (errored) {
    return (
      <div className="govuk-!-margin-top-6">
        <p className="govuk-body govuk-error-message">
          There was a problem loading the data. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="stop-analysis-table govuk-!-margin-top-6">
      <div className="stop-analysis-table__controls">
        <div className="stop-analysis-table__direction-filters">
          <MultiselectCheckbox
            id="sa-directions"
            label="Directions"
            options={directionOptions}
            selectedValues={
              directions.length === 2 ? [] : directions.map((direction) => direction)
            }
            onChange={(values) =>
              onDirectionsChange(
                values.length === 0 || values.length === 2
                  ? ["Inbound", "Outbound"]
                  : (values as Direction[]),
              )
            }
            showAllLabel="All Directions"
            placeholder="Directions"
          />
        </div>

        <div className="stop-analysis-table__search">
          <input
            className="govuk-input govuk-input--width-20"
            type="text"
            placeholder="Search stops..."
            value={quickFilter}
            onChange={(e) => setQuickFilter(e.target.value)}
            aria-label="Search stops"
          />
        </div>
      </div>

      {loading ? (
        <p className="govuk-body">Loading...</p>
      ) : tableRows.length === 0 ? (
        <p className="govuk-body govuk-!-margin-top-6">No data available</p>
      ) : (
        <div className="stop-analysis-table__grid">
          <SortableTable head={tableHead} rows={tableRows} onSort={handleSort} />
        </div>
      )}
    </div>
  );
};
